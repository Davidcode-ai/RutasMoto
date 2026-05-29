"use client"

import Image from "next/image"
import Link from "next/link"
import {
  ChevronLeft,
  Settings,
  Pencil,
  Gauge,
  Zap,
  Flame,
  Leaf,
  Trophy,
  Route as RouteIcon,
  Bike,
  BadgeCheck,
  ChevronRight,
} from "lucide-react"
import { profile, paceStyles, type Pace } from "@/lib/route-data"

const paceMeta: Record<Pace, { icon: typeof Leaf; label: string }> = {
  Tranquilo: { icon: Leaf, label: "Tranquilo / Paseo" },
  Alegre: { icon: Zap, label: "Alegre / Sport" },
  Rápido: { icon: Flame, label: "Rápido" },
}

export function ProfileScreen() {
  const PaceIcon = paceMeta[profile.basePace].icon

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col bg-background pb-10">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 pt-4">
        <Link
          href="/"
          aria-label="Volver"
          className="flex size-11 items-center justify-center rounded-full bg-card/80 text-foreground ring-1 ring-border backdrop-blur"
        >
          <ChevronLeft className="size-6" />
        </Link>
        <h1 className="text-sm font-semibold text-muted-foreground">Mi Perfil</h1>
        <button
          aria-label="Ajustes"
          className="flex size-11 items-center justify-center rounded-full bg-card/80 text-foreground ring-1 ring-border backdrop-blur"
        >
          <Settings className="size-5" />
        </button>
      </header>

      {/* Profile identity */}
      <section className="flex flex-col items-center px-4 pt-6 text-center">
        <div className="relative">
          <Image
            src={profile.avatar || "/placeholder.svg"}
            alt={profile.name}
            width={104}
            height={104}
            className="size-24 rounded-full object-cover ring-4 ring-primary/40"
          />
          <span className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground ring-4 ring-background">
            <BadgeCheck className="size-5" />
          </span>
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight">{profile.name}</h2>
        <p className="text-sm text-muted-foreground">{profile.username}</p>
        <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-sm font-semibold text-accent ring-1 ring-accent/30">
          <Trophy className="size-4" />
          {profile.level}
        </span>
      </section>

      {/* Garage - main bike */}
      <section className="px-4 pt-7">
        <div className="mb-2 flex items-center gap-2">
          <Bike className="size-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Mi Garaje
          </h3>
        </div>

        <div className="overflow-hidden rounded-3xl border border-border bg-card">
          <div className="relative aspect-[16/10] w-full bg-gradient-to-b from-secondary/40 to-card">
            <Image
              src={profile.bike.image || "/placeholder.svg"}
              alt={profile.bike.model}
              fill
              className="object-contain p-3"
            />
            {profile.bike.isReal && (
              <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/80 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 ring-1 ring-emerald-500/30 backdrop-blur">
                <BadgeCheck className="size-3.5" />
                Foto real
              </span>
            )}
            <button
              aria-label="Editar moto"
              className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-background/80 text-foreground ring-1 ring-border backdrop-blur active:scale-95"
            >
              <Pencil className="size-4" />
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border p-4">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Moto principal
              </p>
              <p className="truncate text-lg font-bold">{profile.bike.model}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <div className="rounded-xl bg-secondary px-3 py-1.5 text-center">
                <p className="text-sm font-bold text-primary">{profile.bike.power}</p>
                <p className="text-[10px] text-muted-foreground">Potencia</p>
              </div>
              <div className="rounded-xl bg-secondary px-3 py-1.5 text-center">
                <p className="text-sm font-bold">{profile.bike.displacement}</p>
                <p className="text-[10px] text-muted-foreground">Cilindrada</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Base pace */}
      <section className="px-4 pt-5">
        <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-secondary text-primary">
              <Gauge className="size-5" />
            </span>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Ritmo base
              </p>
              <p className="text-base font-semibold">{paceMeta[profile.basePace].label}</p>
            </div>
          </div>
          <span
            className={`flex size-10 items-center justify-center rounded-full ring-1 ${paceStyles[profile.basePace]}`}
          >
            <PaceIcon className="size-5" />
          </span>
        </div>
      </section>

      {/* Stats / history */}
      <section className="px-4 pt-5">
        <div className="mb-2 flex items-center gap-2">
          <RouteIcon className="size-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Historial
          </h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-primary">{profile.stats.completed}</p>
            <p className="mt-1 text-[11px] leading-tight text-muted-foreground">
              Rutas completadas
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-accent">{profile.stats.created}</p>
            <p className="mt-1 text-[11px] leading-tight text-muted-foreground">
              Rutas creadas
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold">{profile.stats.kilometers}</p>
            <p className="mt-1 text-[11px] leading-tight text-muted-foreground">
              km recorridos
            </p>
          </div>
        </div>
      </section>

      {/* Action buttons */}
      <section className="mt-auto flex flex-col gap-3 px-4 pt-8">
        <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 active:scale-[0.98]">
          <Pencil className="size-5" />
          Editar Perfil
        </button>
        <button className="flex w-full items-center justify-between gap-2 rounded-2xl border border-border bg-card px-4 py-4 text-base font-semibold active:scale-[0.98]">
          <span className="flex items-center gap-2">
            <Settings className="size-5 text-muted-foreground" />
            Ajustes
          </span>
          <ChevronRight className="size-5 text-muted-foreground" />
        </button>
      </section>
    </main>
  )
}
