import { useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, MessageCircle, Send, Users } from 'lucide-react';
import { useStore } from '@nanostores/react';
import { api, isLoggedIn, wsUrl } from '@/lib/api';
import { $user } from '@/stores/auth';

type Message = {
  id: string;
  content: string;
  type: string;
  created_at: string;
  user: { id: string; username: string };
};

type Props = {
  rutaId: string;
  routeTitle?: string;
  participantCount?: number;
  activeCount?: number;
  /** Dentro del detalle de ruta (sin márgenes negativos) */
  embedded?: boolean;
};

const SYSTEM_TYPES = new Set(['sistema', 'sos', 'parada', 'gasolinera']);

function isSystemMessage(m: Message) {
  return SYSTEM_TYPES.has(m.type);
}

function formatSystemText(m: Message): string {
  const name = m.user.username.split('_')[0] || m.user.username;
  if (m.type === 'gasolinera') return `⚠️ ${name} ha solicitado una parada para gasolina`;
  if (m.type === 'parada') return `☕ ${name} ha solicitado una parada para café o descanso`;
  if (m.type === 'sos') return `🚨 ${name} — SOS / parada de emergencia`;
  if (m.type === 'sistema') return m.content;
  if (m.content.startsWith('🚨') || m.content.startsWith('⚠️')) return m.content;
  return `📢 ${m.content}`;
}

function formatTime(iso: string) {
  try {
    return new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
  } catch {
    return '';
  }
}

const DEMO_SYSTEM: Message = {
  id: 'demo-system',
  content: '⚠️ Ramón ha solicitado una parada para gasolina',
  type: 'gasolinera',
  created_at: new Date().toISOString(),
  user: { id: 'demo', username: 'ramon' },
};

export default function ChatPanel({
  rutaId,
  routeTitle = 'Chat de la ruta',
  participantCount = 0,
  activeCount,
  embedded = false,
}: Props) {
  const user = useStore($user);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sharingLocation, setSharingLocation] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const active = activeCount ?? participantCount;

  const displayMessages = useMemo(() => {
    const hasSystem = messages.some(isSystemMessage);
    if (hasSystem) return messages;
    if (messages.length === 0) return [DEMO_SYSTEM];
    return messages;
  }, [messages]);

  const showDemoHint = useMemo(
    () => !messages.some(isSystemMessage) && messages.length > 0,
    [messages],
  );

  useEffect(() => {
    api<Message[]>(`/rutas/${rutaId}/mensajes`)
      .then(setMessages)
      .catch(() => setMessages([]));
  }, [rutaId]);

  useEffect(() => {
    if (!isLoggedIn()) return;
    const ws = new WebSocket(wsUrl(`/ws/chat/${rutaId}`));
    wsRef.current = ws;
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        const incoming: Message = {
          id: data.id,
          content: data.content,
          type: data.type ?? 'texto',
          created_at: data.created_at,
          user: { id: data.user_id, username: data.username },
        };
        setMessages((prev) => {
          if (prev.some((m) => m.id === incoming.id)) return prev;
          return [...prev, incoming];
        });
      } catch {
        /* ignore */
      }
    };
    return () => ws.close();
  }, [rutaId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages]);

  async function postMessage(content: string, type: string = 'texto') {
    const created = await api<Message>(`/rutas/${rutaId}/mensajes`, {
      method: 'POST',
      body: JSON.stringify({ content, type }),
    });
    setMessages((prev) => {
      if (prev.some((m) => m.id === created.id)) return prev;
      return [
        ...prev,
        {
          id: created.id,
          content: created.content,
          type: created.type,
          created_at: created.created_at,
          user: { id: created.user.id, username: created.user.username },
        },
      ];
    });
  }

  async function sendText() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setText('');
    try {
      await postMessage(trimmed, 'texto');
    } catch {
      setText(trimmed);
    }
  }

  async function shareLocation() {
    if (!navigator.geolocation || sharingLocation) return;
    setSharingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const link = `https://maps.google.com/?q=${latitude},${longitude}`;
        const content = `📍 Comparto mi ubicación: ${link}`;
        try {
          await postMessage(content, 'texto');
        } catch {
          alert('No se pudo compartir la ubicación');
        } finally {
          setSharingLocation(false);
        }
      },
      () => {
        alert('Activa la ubicación para compartirla con el grupo');
        setSharingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  return (
    <div
      className={`flex flex-1 flex-col ${embedded ? 'min-h-0' : 'min-h-[min(520px,60dvh)]'} ${embedded ? '' : '-mx-4'}`}
    >
      {/* Cabecera */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/30">
            <MessageCircle className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-bold leading-tight">{routeTitle}</h2>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="size-3.5 text-accent" />
              <span>
                <span className="font-semibold text-accent">{active}</span> participantes activos
                {participantCount > 0 && active !== participantCount && (
                  <span className="text-muted-foreground"> · {participantCount} en la salida</span>
                )}
              </span>
            </p>
          </div>
        </div>
      </header>

      {/* Mensajes */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4 pb-2">
        {showDemoHint && (
          <div className="mx-auto max-w-[95%] rounded-xl border border-dashed border-accent/40 bg-accent/5 px-3 py-2 text-center">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Ejemplo · aviso automático
            </p>
            <p className="mt-1 text-xs font-semibold text-accent">{formatSystemText(DEMO_SYSTEM)}</p>
          </div>
        )}

        {displayMessages.map((m) => {
          if (m.id === 'demo-system' && messages.some((x) => x.id !== 'demo-system')) {
            return null;
          }

          if (isSystemMessage(m) || m.id === 'demo-system') {
            return (
              <div key={m.id} className="flex justify-center px-1">
                <div
                  className={`max-w-[92%] rounded-2xl border px-4 py-2.5 text-center text-xs font-semibold leading-snug ${
                    m.type === 'sos'
                      ? 'border-red-500/50 bg-red-500/15 text-red-300'
                      : 'border-accent/40 bg-accent/10 text-accent'
                  }`}
                >
                  {m.id === 'demo-system' ? m.content : formatSystemText(m)}
                  {m.id !== 'demo-system' && (
                    <span className="mt-1 block text-[10px] font-normal text-muted-foreground">
                      {formatTime(m.created_at)}
                    </span>
                  )}
                </div>
              </div>
            );
          }

          const isMe = m.user.id === user?.id;
          return (
            <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[82%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                {!isMe && (
                  <span className="px-1 text-[11px] font-semibold text-primary">
                    {m.user.username.replace(/_/g, ' ')}
                  </span>
                )}
                <div
                  className={`relative px-3.5 py-2 text-sm leading-snug shadow-sm ${
                    isMe
                      ? 'rounded-2xl rounded-br-md bg-primary text-primary-foreground'
                      : 'rounded-2xl rounded-bl-md border border-border bg-card text-foreground'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  <span
                    className={`mt-1 block text-[10px] ${
                      isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}
                  >
                    {formatTime(m.created_at)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input inferior */}
      <div className="shrink-0 border-t border-border bg-background px-3 py-3">
        {!isLoggedIn() && (
          <a
            href="/auth/login"
            className="mb-3 block rounded-xl bg-primary/15 py-2 text-center text-sm font-semibold text-primary ring-1 ring-primary/30"
          >
            Inicia sesión para escribir en el chat
          </a>
        )}
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={shareLocation}
            disabled={sharingLocation || !isLoggedIn()}
            aria-label="Compartir mi ubicación actual"
            title="Compartir ubicación"
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-primary ring-1 ring-border transition active:scale-95 disabled:opacity-50"
          >
            <MapPin className={`size-5 ${sharingLocation ? 'animate-pulse' : ''}`} />
          </button>
          <div className="flex min-h-11 flex-1 items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 focus-within:ring-2 focus-within:ring-primary/40">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendText();
                }
              }}
              disabled={!isLoggedIn()}
              placeholder={isLoggedIn() ? 'Escribe al grupo...' : 'Inicia sesión para escribir'}
              aria-label="Mensaje para el chat de la ruta"
              className="max-h-24 min-w-0 flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
            />
            <button
              type="button"
              onClick={sendText}
              disabled={!text.trim() || !isLoggedIn()}
              aria-label="Enviar mensaje"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40 active:scale-95"
            >
              <Send className="size-4" />
            </button>
          </div>
        </div>
        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          Solo visible para miembros de esta salida
        </p>
      </div>
    </div>
  );
}
