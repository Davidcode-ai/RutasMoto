"use client"

import Image from "next/image"
import { useState } from "react"
import { MapPin, Navigation, Plus, Minus, Layers, X } from "lucide-react"
import { riders } from "@/lib/route-data"

const waypoints = [
  { name: "San Fernando", top: "30%", left: "18%" },
  { name: "Medina", top: "55%", left: "47%" },
  { name: "Grazalema", top: "26%", left: "78%" },
]

export function MapArea() {
  const [showCluster, setShowCluster] = useState(true)

  return (
    <div className="relative h-full w-full overflow-hidden">
      <Image
        src="/map-dark.png"
        alt="Mapa de la ruta por la Sierra de Cádiz"
        fill
        priority
        className="object-cover"
      />
      {/* gradient fades for legibility */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-background/90 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />

      {/* Waypoint markers */}
      {waypoints.map((wp, i) => (
        <div
          key={wp.name}
          className="absolute -translate-x-1/2 -translate-y-full"
          style={{ top: wp.top, left: wp.left }}
        >
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 rounded-full bg-card/90 px-2 py-0.5 text-[10px] font-semibold ring-1 ring-border backdrop-blur">
              <span className="text-primary">{i + 1}</span>
              {wp.name}
            </div>
            <MapPin className="size-5 fill-primary text-primary drop-shadow" />
          </div>
        </div>
      ))}

      {/* User cluster marker with "4" */}
      <div className="absolute left-[34%] top-[46%] -translate-x-1/2 -translate-y-1/2">
        <button
          onClick={() => setShowCluster((v) => !v)}
          aria-label="Ver los 4 moteros agrupados aquí"
          aria-expanded={showCluster}
          className="relative flex size-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground shadow-lg shadow-primary/40 ring-4 ring-primary/25"
        >
          4
          <span className="absolute -inset-1 -z-10 animate-ping rounded-full bg-primary/30" />
        </button>

        {/* Floating cluster popup */}
        {showCluster && (
          <div className="absolute top-[calc(100%+12px)] left-1/2 w-52 -translate-x-1/2 rounded-2xl border border-border bg-popover/95 p-1.5 shadow-2xl backdrop-blur">
            <div className="mb-1 flex items-center justify-between px-1">
              <p className="text-[10px] font-semibold text-muted-foreground">
                4 moteros · San Fernando
              </p>
              <button
                onClick={() => setShowCluster(false)}
                aria-label="Cerrar"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </div>
            <ul className="space-y-px">
              {riders.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center gap-2 rounded-lg px-1 py-0.5 text-xs"
                >
                  <Image
                    src={r.avatar || "/placeholder.svg"}
                    alt=""
                    width={20}
                    height={20}
                    className="size-5 rounded-full object-cover"
                  />
                  <span className="font-medium">{r.name.split(" ")[0]}</span>
                  <span className="ml-auto rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {r.bikeModel.split(" ").slice(-1)[0]}
                  </span>
                </li>
              ))}
            </ul>
            <div className="absolute -top-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 border-l border-t border-border bg-popover/95" />
          </div>
        )}
      </div>

      {/* Map controls */}
      <div className="absolute right-3 top-1/2 flex -translate-y-1/2 flex-col gap-2">
        <div className="flex flex-col overflow-hidden rounded-full bg-card/90 ring-1 ring-border backdrop-blur">
          <button aria-label="Acercar" className="flex size-10 items-center justify-center text-foreground">
            <Plus className="size-5" />
          </button>
          <div className="h-px bg-border" />
          <button aria-label="Alejar" className="flex size-10 items-center justify-center text-foreground">
            <Minus className="size-5" />
          </button>
        </div>
        <button aria-label="Centrar mapa" className="flex size-10 items-center justify-center rounded-full bg-card/90 text-primary ring-1 ring-border backdrop-blur">
          <Navigation className="size-5" />
        </button>
        <button aria-label="Capas del mapa" className="flex size-10 items-center justify-center rounded-full bg-card/90 text-foreground ring-1 ring-border backdrop-blur">
          <Layers className="size-5" />
        </button>
      </div>
    </div>
  )
}
