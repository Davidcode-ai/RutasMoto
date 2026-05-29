"use client"

import { useState } from "react"
import { FloatingActions } from "@/components/route-panel"
import { JoinRouteSheet } from "@/components/join-route-sheet"

export function RouteActions() {
  const [joinOpen, setJoinOpen] = useState(false)

  return (
    <>
      <FloatingActions onJoin={() => setJoinOpen(true)} />
      <JoinRouteSheet open={joinOpen} onClose={() => setJoinOpen(false)} />
    </>
  )
}
