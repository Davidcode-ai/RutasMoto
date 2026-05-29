import Link from "next/link"
import { ChevronLeft, Share2, Plus, User } from "lucide-react"

export function RouteHeader() {
  return (
    <header className="flex items-center justify-between px-4 pt-4">
      <button
        aria-label="Volver"
        className="flex size-11 items-center justify-center rounded-full bg-card/80 text-foreground ring-1 ring-border backdrop-blur"
      >
        <ChevronLeft className="size-6" />
      </button>
      <div className="flex items-center gap-2">
        <Link
          href="/crear"
          aria-label="Crear nueva ruta"
          className="flex size-11 items-center justify-center rounded-full bg-card/80 text-foreground ring-1 ring-border backdrop-blur"
        >
          <Plus className="size-5" />
        </Link>
        <Link
          href="/perfil"
          aria-label="Mi perfil"
          className="flex size-11 items-center justify-center rounded-full bg-card/80 text-foreground ring-1 ring-border backdrop-blur"
        >
          <User className="size-5" />
        </Link>
        <button
          aria-label="Compartir ruta"
          className="flex size-11 items-center justify-center rounded-full bg-card/80 text-foreground ring-1 ring-border backdrop-blur"
        >
          <Share2 className="size-5" />
        </button>
      </div>
    </header>
  )
}
