import { X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Toaster() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[200] mx-auto flex max-w-md flex-col gap-2 p-4 pt-safe"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur ${
            t.variant === 'destructive'
              ? 'border-destructive/50 bg-destructive text-destructive-foreground'
              : 'border-border bg-card/95 text-foreground'
          }`}
        >
          <div className="min-w-0 flex-1">
            {t.title && <p className="text-sm font-bold leading-tight">{t.title}</p>}
            {t.description && (
              <p
                className={`text-sm leading-snug ${t.title ? 'mt-0.5' : ''} ${
                  t.variant === 'destructive' ? 'text-destructive-foreground/90' : 'text-muted-foreground'
                }`}
              >
                {t.description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            aria-label="Cerrar aviso"
            className="shrink-0 rounded-full p-1 opacity-70 transition hover:opacity-100"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
