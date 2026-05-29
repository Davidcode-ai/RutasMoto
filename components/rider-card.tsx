import Image from "next/image"
import { MapPin, BadgeCheck, ImageOff } from "lucide-react"
import { type Rider, paceStyles } from "@/lib/route-data"

export function RiderCard({ rider }: { rider: Rider }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
      <Image
        src={rider.avatar || "/placeholder.svg"}
        alt={rider.name}
        width={48}
        height={48}
        className="size-12 shrink-0 rounded-full object-cover ring-2 ring-border"
      />

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold leading-tight">{rider.name}</p>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="size-3.5" />
          {rider.origin}
        </p>
        <span
          className={`mt-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${paceStyles[rider.pace]}`}
        >
          Ritmo: {rider.pace}
        </span>
      </div>

      <div className="flex w-24 shrink-0 flex-col items-center">
        <div className="relative h-14 w-24 overflow-hidden rounded-lg bg-secondary">
          <Image
            src={rider.bikeImage || "/placeholder.svg"}
            alt={rider.bikeModel}
            fill
            className="object-contain p-1"
          />
        </div>
        <p className="mt-1 w-full truncate text-center text-[11px] font-medium">{rider.bikeModel}</p>
        {rider.bikePhotoIsReal ? (
          <span className="mt-0.5 flex items-center gap-0.5 text-[9px] font-medium text-emerald-400">
            <BadgeCheck className="size-3" />
            Moto real
          </span>
        ) : (
          <span className="mt-0.5 flex items-center gap-0.5 text-[9px] font-medium text-muted-foreground">
            <ImageOff className="size-3" />
            Foto genérica
          </span>
        )}
      </div>
    </div>
  )
}
