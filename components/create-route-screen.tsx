"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ChevronLeft,
  MapPin,
  Plus,
  X,
  Sparkles,
  Link2,
  Radio,
  Route as RouteIcon,
  GripVertical,
  Globe,
  Lock,
} from "lucide-react"

type Toggle = {
  on: boolean
  onChange: () => void
  label: string
}

function Switch({ on, onChange, ariaLabel }: { on: boolean; onChange: () => void; ariaLabel: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={ariaLabel}
      onClick={onChange}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
        on ? "bg-primary" : "bg-secondary ring-1 ring-border"
      }`}
    >
      <span
        className={`absolute top-1 size-5 rounded-full bg-background shadow transition-transform ${
          on ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  )
}

const startWaypoints = ["San Fernando", "Medina-Sidonia", "Grazalema"]

export function CreateRouteScreen() {
  const [title, setTitle] = useState("")
  const [isPublic, setIsPublic] = useState(true)
  const [waypoints, setWaypoints] = useState<string[]>(startWaypoints)
  const [mapsLink, setMapsLink] = useState("")
  const [liveTracking, setLiveTracking] = useState(true)
  const [aiReturnAdded, setAiReturnAdded] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)

  function updateWaypoint(i: number, value: string) {
    setWaypoints((prev) => prev.map((w, idx) => (idx === i ? value : w)))
  }

  function addWaypoint() {
    setWaypoints((prev) => [...prev, ""])
  }

  function removeWaypoint(i: number) {
    setWaypoints((prev) => prev.filter((_, idx) => idx !== i))
  }

  function handleAiReturn() {
    if (aiReturnAdded) return
    setAiLoading(true)
    setTimeout(() => {
      setWaypoints((prev) => [...prev, "Puerto de las Palomas (IA)", "El Bosque (IA)", "Vuelta · San Fernando (IA)"])
      setAiLoading(false)
      setAiReturnAdded(true)
    }, 1200)
  }

  const canCreate = title.trim().length > 0 && waypoints.filter((w) => w.trim()).length >= 2

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
        <Link
          href="/"
          aria-label="Volver"
          className="flex size-10 items-center justify-center rounded-full bg-card text-foreground ring-1 ring-border active:scale-95"
        >
          <ChevronLeft className="size-6" />
        </Link>
        <div>
          <p className="text-[11px] font-semibold text-primary">Road Leader</p>
          <h1 className="text-lg font-bold leading-tight">Crear Nueva Ruta</h1>
        </div>
      </header>

      {/* Scrollable content */}
      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5 pb-32">
        {/* 1. Datos básicos */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              1
            </span>
            <h2 className="text-sm font-bold">Datos básicos</h2>
          </div>

          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Título de la ruta</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Ruta Sierra de Cádiz"
            aria-label="Título de la ruta"
            className="w-full rounded-xl border border-border bg-background px-3 py-3 text-base font-semibold outline-none ring-primary/40 placeholder:font-normal placeholder:text-muted-foreground focus:ring-2"
          />

          {/* Visibility toggle */}
          <div className="mt-4 flex items-center justify-between rounded-xl bg-background p-3 ring-1 ring-border">
            <div className="flex items-center gap-2.5">
              <span
                className={`flex size-9 items-center justify-center rounded-full ${
                  isPublic ? "bg-accent/15 text-accent" : "bg-secondary text-muted-foreground"
                }`}
              >
                {isPublic ? <Globe className="size-5" /> : <Lock className="size-5" />}
              </span>
              <div>
                <p className="text-sm font-semibold">{isPublic ? "Pública" : "Privada"}</p>
                <p className="text-[11px] text-muted-foreground">
                  {isPublic ? "Cualquier motero puede unirse" : "Solo con invitación"}
                </p>
              </div>
            </div>
            <Switch on={isPublic} onChange={() => setIsPublic((v) => !v)} ariaLabel="Ruta pública o privada" />
          </div>
        </section>

        {/* 2. Waypoints */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              2
            </span>
            <h2 className="text-sm font-bold">Itinerario · Waypoints</h2>
          </div>

          <ul className="space-y-2">
            {waypoints.map((wp, i) => {
              const isAi = wp.includes("(IA)")
              return (
                <li
                  key={i}
                  className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 ${
                    isAi ? "border-accent/40 bg-accent/10" : "border-border bg-background"
                  }`}
                >
                  <GripVertical className="size-4 shrink-0 text-muted-foreground" />
                  <span
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                      isAi ? "bg-accent text-accent-foreground" : "bg-secondary text-foreground"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <input
                    value={wp}
                    onChange={(e) => updateWaypoint(i, e.target.value)}
                    placeholder={`Punto ${i + 1}`}
                    aria-label={`Waypoint ${i + 1}`}
                    className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
                  />
                  <button
                    onClick={() => removeWaypoint(i)}
                    aria-label={`Eliminar waypoint ${i + 1}`}
                    className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                </li>
              )
            })}
          </ul>

          <button
            onClick={addWaypoint}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm font-semibold text-muted-foreground active:scale-[0.98]"
          >
            <Plus className="size-4" />
            Añadir waypoint
          </button>
        </section>

        {/* 3. IA - Vuelta por decidir */}
        <section className="overflow-hidden rounded-2xl border border-accent/40 bg-accent/5 p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
              3
            </span>
            <h2 className="text-sm font-bold">Vuelta por decidir</h2>
          </div>

          <button
            onClick={handleAiReturn}
            disabled={aiLoading || aiReturnAdded}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3.5 text-sm font-bold text-accent-foreground shadow-lg shadow-accent/20 transition active:scale-[0.98] disabled:opacity-70"
          >
            <Sparkles className={`size-5 ${aiLoading ? "animate-pulse" : ""}`} />
            {aiLoading ? "Buscando curvas…" : aiReturnAdded ? "Vuelta añadida con IA" : "Autocompletar ruta de vuelta con IA"}
          </button>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Buscaremos las mejores curvas para volver.
          </p>
        </section>

        {/* 4. Google Maps link */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              4
            </span>
            <h2 className="text-sm font-bold">
              Enlace de Google Maps <span className="font-normal text-muted-foreground">· opcional</span>
            </h2>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 focus-within:ring-2 focus-within:ring-primary/40">
            <Link2 className="size-4 shrink-0 text-muted-foreground" />
            <input
              value={mapsLink}
              onChange={(e) => setMapsLink(e.target.value)}
              placeholder="Pega tu enlace de Maps aquí"
              aria-label="Enlace de Google Maps"
              inputMode="url"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        </section>

        {/* 5. Live tracking */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span
                className={`flex size-9 items-center justify-center rounded-full ${
                  liveTracking ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
                }`}
              >
                <Radio className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">Tracking en vivo</p>
                <p className="text-[11px] text-muted-foreground">Localización para rezagados</p>
              </div>
            </div>
            <Switch on={liveTracking} onChange={() => setLiveTracking((v) => !v)} ariaLabel="Activar tracking en vivo" />
          </div>
        </section>
      </div>

      {/* Fixed bottom CTA */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md">
        <div className="pointer-events-auto bg-gradient-to-t from-background via-background to-transparent px-4 pb-6 pt-8">
          <button
            disabled={!canCreate}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-[0.98] disabled:opacity-40"
          >
            <RouteIcon className="size-5" />
            Crear Ruta
          </button>
        </div>
      </div>
    </main>
  )
}
