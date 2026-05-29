"use client"

import { useState } from "react"
import Image from "next/image"
import { X, MapPin, Bike, Pencil, Check, Leaf, Gauge, Flame, CheckCircle2 } from "lucide-react"
import { route, riders } from "@/lib/route-data"

type PaceOption = {
  id: string
  label: string
  sub: string
  icon: typeof Leaf
  ring: string
  activeBg: string
  activeText: string
  iconColor: string
}

const paceOptions: PaceOption[] = [
  {
    id: "tranquilo",
    label: "Tranquilo",
    sub: "Paseo · disfrutar",
    icon: Leaf,
    ring: "ring-emerald-500/30",
    activeBg: "bg-emerald-500/15 ring-emerald-500/60",
    activeText: "text-emerald-400",
    iconColor: "text-emerald-400",
  },
  {
    id: "intermedio",
    label: "Intermedio",
    sub: "Ritmo fluido",
    icon: Gauge,
    ring: "ring-accent/30",
    activeBg: "bg-accent/15 ring-accent/60",
    activeText: "text-accent",
    iconColor: "text-accent",
  },
  {
    id: "alegre",
    label: "Alegre",
    sub: "Sport · curvas",
    icon: Flame,
    ring: "ring-primary/30",
    activeBg: "bg-primary/15 ring-primary/60",
    activeText: "text-primary",
    iconColor: "text-primary",
  },
]

// Origin options: official start plus other waypoints / common spots
const originOptions = ["San Fernando", "Jerez", "Paterna", "Medina-Sidonia"]

// Default bike comes from the user's profile (first rider used as "me")
const profileBike = riders[0].bikeModel

export function JoinRouteSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [origin, setOrigin] = useState(originOptions[0])
  const [pace, setPace] = useState("intermedio")
  const [overrideBike, setOverrideBike] = useState(false)
  const [customBike, setCustomBike] = useState("")
  const [confirmed, setConfirmed] = useState(false)

  if (!open) return null

  function handleConfirm() {
    setConfirmed(true)
    setTimeout(() => {
      setConfirmed(false)
      onClose()
    }, 1400)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label="Unirse a la ruta">
      {/* Backdrop */}
      <button
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
      />

      {/* Sheet */}
      <div className="relative z-10 flex max-h-[92dvh] w-full max-w-md flex-col rounded-t-3xl border-t border-border bg-card shadow-2xl animate-in slide-in-from-bottom duration-300">
        {confirmed ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <div className="flex size-20 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/40">
              <CheckCircle2 className="size-12 text-primary" />
            </div>
            <p className="text-xl font-bold">¡Asistencia confirmada!</p>
            <p className="text-sm text-muted-foreground">
              Nos vemos en {origin}. Prepara la moto.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="shrink-0 px-4 pt-3">
              <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-primary">{route.date}</p>
                  <h2 className="text-balance text-xl font-bold leading-tight">Unirse a {route.title}</h2>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Cerrar"
                  className="flex size-9 items-center justify-center rounded-full bg-secondary text-muted-foreground active:scale-95"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* Scrollable form */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {/* 1. Punto de salida */}
              <section className="mb-6">
                <div className="mb-2 flex items-center gap-2">
                  <MapPin className="size-4 text-primary" />
                  <h3 className="text-sm font-bold">Punto de salida</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {originOptions.map((opt, i) => {
                    const active = origin === opt
                    return (
                      <button
                        key={opt}
                        onClick={() => setOrigin(opt)}
                        className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold ring-1 transition-colors ${
                          active
                            ? "bg-primary text-primary-foreground ring-primary"
                            : "bg-secondary text-secondary-foreground ring-border"
                        }`}
                      >
                        {i === 0 && (
                          <span className={`text-[10px] font-bold ${active ? "text-primary-foreground/80" : "text-primary"}`}>
                            OFICIAL
                          </span>
                        )}
                        {opt}
                      </button>
                    )
                  })}
                </div>
              </section>

              {/* 2. Moto */}
              <section className="mb-6">
                <div className="mb-2 flex items-center gap-2">
                  <Bike className="size-4 text-primary" />
                  <h3 className="text-sm font-bold">Tu moto para esta ruta</h3>
                </div>
                <div className="rounded-2xl border border-border bg-background p-3">
                  <div className="flex items-center gap-3">
                    <Image
                      src={riders[0].bikeImage || "/placeholder.svg"}
                      alt={profileBike}
                      width={64}
                      height={40}
                      className="h-10 w-16 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] text-muted-foreground">
                        {overrideBike ? "Moto para esta ruta" : "Desde tu perfil"}
                      </p>
                      <p className="truncate text-sm font-semibold">
                        {overrideBike ? customBike || "Escribe el modelo…" : profileBike}
                      </p>
                    </div>
                    <button
                      onClick={() => setOverrideBike((v) => !v)}
                      className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition-colors ${
                        overrideBike
                          ? "bg-primary text-primary-foreground ring-primary"
                          : "bg-secondary text-secondary-foreground ring-border"
                      }`}
                    >
                      {overrideBike ? <Check className="size-3.5" /> : <Pencil className="size-3.5" />}
                      {overrideBike ? "Usando otra" : "Cambiar moto"}
                    </button>
                  </div>

                  {overrideBike && (
                    <input
                      autoFocus
                      value={customBike}
                      onChange={(e) => setCustomBike(e.target.value)}
                      placeholder="Ej: Yamaha MT-07, Ducati Monster…"
                      aria-label="Modelo de moto para esta ruta"
                      className="mt-3 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none ring-primary/40 placeholder:text-muted-foreground focus:ring-2"
                    />
                  )}
                </div>
              </section>

              {/* 3. Ritmo */}
              <section>
                <div className="mb-2 flex items-center gap-2">
                  <Gauge className="size-4 text-primary" />
                  <h3 className="text-sm font-bold">Ritmo de hoy</h3>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {paceOptions.map((opt) => {
                    const Icon = opt.icon
                    const active = pace === opt.id
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setPace(opt.id)}
                        className={`flex flex-col items-center gap-1.5 rounded-2xl px-2 py-4 text-center ring-1 transition-colors ${
                          active ? opt.activeBg : "bg-secondary ring-border"
                        }`}
                      >
                        <Icon className={`size-7 ${active ? opt.iconColor : "text-muted-foreground"}`} />
                        <span className={`text-sm font-bold ${active ? opt.activeText : "text-foreground"}`}>
                          {opt.label}
                        </span>
                        <span className="text-[10px] leading-tight text-muted-foreground">{opt.sub}</span>
                      </button>
                    )
                  })}
                </div>
              </section>
            </div>

            {/* Confirm button */}
            <div className="shrink-0 border-t border-border bg-card px-4 pb-6 pt-3">
              <button
                onClick={handleConfirm}
                disabled={overrideBike && !customBike.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-[0.98] disabled:opacity-40"
              >
                <Check className="size-5" />
                Confirmar Asistencia
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
