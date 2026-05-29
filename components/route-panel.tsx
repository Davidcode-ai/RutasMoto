"use client"

import Image from "next/image"
import { useState } from "react"
import { Users, MessageCircle, Plus, Zap, Send, Globe, Lock, Clock, Route as RouteIcon } from "lucide-react"
import { riders, route, organizer } from "@/lib/route-data"
import { RiderCard } from "@/components/rider-card"

export function RoutePanel() {
  const [tab, setTab] = useState<"asistentes" | "chat">("asistentes")
  const isPublic = route.visibility === "Pública"

  return (
    <section className="relative z-10 -mt-6 flex flex-1 flex-col rounded-t-3xl border-t border-border bg-background pt-2">
      {/* grabber */}
      <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border" />

      {/* Route header info */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
              isPublic
                ? "bg-accent/15 text-accent ring-accent/30"
                : "bg-secondary text-secondary-foreground ring-border"
            }`}
          >
            {isPublic ? <Globe className="size-3.5" /> : <Lock className="size-3.5" />}
            {route.visibility}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <RouteIcon className="size-4 text-primary" />
            {route.distance}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-4 text-primary" />
            {route.duration}
          </span>
        </div>

        <h1 className="mt-2 text-balance text-2xl font-bold leading-tight tracking-tight">
          {route.title}
        </h1>

        <div className="mt-3 flex items-center gap-2 rounded-2xl border border-border bg-card p-2">
          <Image
            src={organizer.avatar || "/placeholder.svg"}
            alt={organizer.name}
            width={36}
            height={36}
            className="size-9 rounded-full object-cover ring-2 ring-primary/40"
          />
          <div className="leading-tight">
            <p className="text-[11px] text-muted-foreground">Road Leader · Organizador</p>
            <p className="text-sm font-semibold">{organizer.name}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4">
        <div className="grid grid-cols-2 gap-1 rounded-full bg-secondary p-1">
          <button
            onClick={() => setTab("asistentes")}
            className={`flex items-center justify-center gap-2 rounded-full py-2 text-sm font-semibold transition-colors ${
              tab === "asistentes" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            <Users className="size-4" />
            Asistentes
            <span
              className={`rounded-full px-1.5 text-xs ${
                tab === "asistentes" ? "bg-primary-foreground/20" : "bg-card"
              }`}
            >
              {riders.length}
            </span>
          </button>
          <button
            onClick={() => setTab("chat")}
            className={`flex items-center justify-center gap-2 rounded-full py-2 text-sm font-semibold transition-colors ${
              tab === "chat" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            <MessageCircle className="size-4" />
            Chat de la ruta
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 pb-44 pt-4">
        {tab === "asistentes" ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-muted-foreground">
                Saliendo · {route.date}
              </p>
            </div>
            {riders.map((rider) => (
              <RiderCard key={rider.id} rider={rider} />
            ))}
          </div>
        ) : (
          <ChatPreview />
        )}
      </div>
    </section>
  )
}

function ChatPreview() {
  const messages = [
    { id: 1, name: "Carlos", text: "Buenas! Salimos puntuales a las 8:30 de la gasolinera.", me: false },
    { id: 2, name: "Luis", text: "Perfecto, llevo el depósito lleno 🏍️", me: false },
    { id: 3, name: "Tú", text: "Voy un pelín justo, ¿me esperáis 5 min?", me: true },
    { id: 4, name: "Marta", text: "Tranqui, café mientras tanto ☕", me: false },
  ]
  return (
    <div className="space-y-3">
      {messages.map((m) => (
        <div key={m.id} className={`flex ${m.me ? "justify-end" : "justify-start"}`}>
          <div
            className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
              m.me
                ? "rounded-br-sm bg-primary text-primary-foreground"
                : "rounded-bl-sm border border-border bg-card"
            }`}
          >
            {!m.me && <p className="mb-0.5 text-[11px] font-semibold text-primary">{m.name}</p>}
            <p className="leading-snug">{m.text}</p>
          </div>
        </div>
      ))}
      <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2">
        <input
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          placeholder="Escribe al grupo..."
          aria-label="Mensaje para el chat de la ruta"
        />
        <button aria-label="Enviar" className="text-primary">
          <Send className="size-5" />
        </button>
      </div>
    </div>
  )
}

export function FloatingActions({ onJoin }: { onJoin?: () => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md">
      <div className="pointer-events-auto bg-gradient-to-t from-background via-background to-transparent px-4 pb-5 pt-8">
        <button
          onClick={onJoin}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 active:scale-[0.98]"
        >
          <Plus className="size-5" />
          Unirse a la Ruta
        </button>
        <button className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-accent/40 bg-accent/10 py-3 text-sm font-semibold text-accent active:scale-[0.98]">
          <Zap className="size-4" />
          Activar Modo En Ruta
        </button>
      </div>
    </div>
  )
}
