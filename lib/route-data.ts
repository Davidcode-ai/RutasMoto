export type Pace = "Tranquilo" | "Alegre" | "Rápido"

export type Rider = {
  id: string
  name: string
  avatar: string
  bikeModel: string
  bikeImage: string
  bikePhotoIsReal: boolean
  pace: Pace
  origin: string
}

export const organizer = {
  name: "Carlos Vega",
  avatar: "/rider-carlos.png",
}

export const route = {
  title: "Ruta Sierra de Cádiz",
  visibility: "Pública" as "Pública" | "Privada",
  date: "Sáb · 8:30",
  distance: "187 km",
  duration: "4h 20m",
  waypoints: ["San Fernando", "Medina-Sidonia", "Grazalema"],
}

export const riders: Rider[] = [
  {
    id: "luis",
    name: "Luis Romero",
    avatar: "/rider-luis.png",
    bikeModel: "Kawasaki Z1000",
    bikeImage: "/bike-z1000.png",
    bikePhotoIsReal: true,
    pace: "Alegre",
    origin: "San Fernando",
  },
  {
    id: "ramon",
    name: "Ramón Gil",
    avatar: "/rider-ramon.png",
    bikeModel: "BMW S1000RR",
    bikeImage: "/bike-s1000rr.png",
    bikePhotoIsReal: false,
    pace: "Rápido",
    origin: "San Fernando",
  },
  {
    id: "marta",
    name: "Marta Ortiz",
    avatar: "/rider-marta.png",
    bikeModel: "KTM 390 Duke",
    bikeImage: "/bike-ktm.png",
    bikePhotoIsReal: true,
    pace: "Tranquilo",
    origin: "Medina-Sidonia",
  },
  {
    id: "javi",
    name: "Javi Núñez",
    avatar: "/rider-javi.png",
    bikeModel: "Honda CB650R",
    bikeImage: "/bike-generic.png",
    bikePhotoIsReal: false,
    pace: "Alegre",
    origin: "San Fernando",
  },
]

export const profile = {
  name: "Diego Salas",
  username: "@diegosalas_moto",
  avatar: "/rider-carlos.png",
  level: "Rider Habitual",
  basePace: "Alegre" as Pace,
  bike: {
    model: "Kawasaki Z900",
    image: "/bike-z900.png",
    power: "95 cv",
    displacement: "948 cc",
    isReal: true,
  },
  stats: {
    completed: 42,
    created: 7,
    kilometers: "6.480",
  },
}

export const paceStyles: Record<Pace, string> = {
  Tranquilo: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30",
  Alegre: "bg-accent/15 text-accent ring-accent/30",
  Rápido: "bg-primary/15 text-primary ring-primary/30",
}
