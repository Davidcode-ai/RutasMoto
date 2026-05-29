import { RouteHeader } from "@/components/route-header"
import { MapArea } from "@/components/map-area"
import { RoutePanel } from "@/components/route-panel"
import { RouteActions } from "@/components/route-actions"

export default function Page() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col bg-background">
      {/* Map fills the upper half; header overlays the top */}
      <div className="relative h-[45vh] min-h-[320px] shrink-0">
        <MapArea />
        <div className="absolute inset-x-0 top-0">
          <RouteHeader />
        </div>
      </div>

      <RoutePanel />
      <RouteActions />
    </main>
  )
}
