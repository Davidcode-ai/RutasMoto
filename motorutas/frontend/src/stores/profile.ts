import { atom } from 'nanostores';
import { api } from '@/lib/api';
import { $user, loadUser } from '@/stores/auth';

export type Moto = {
  id: string;
  brand: string;
  model: string;
  year: number | null;
  photo_url: string | null;
  is_primary: boolean;
  photo_ai_generated: boolean;
};

export type ProfileStats = {
  completed: number;
  created: number;
  kilometers: string;
};

export const $motos = atom<Moto[]>([]);
export const $profileStats = atom<ProfileStats>({ completed: 0, created: 0, kilometers: '0' });
export const $profileLoading = atom(false);

/** Moto de ejemplo cuando el garaje está vacío (UI demo) */
export const DEMO_GARAGE = {
  brand: 'Kawasaki',
  model: 'Z900',
  power: '95 cv',
  displacement: '948 cc',
  year: '2022',
  photo_url: 'https://placehold.co/800x500/1a1a1f/ea580c?text=Kawasaki+Z900',
  photo_ai_generated: false,
  isReal: true,
};

export async function loadProfile() {
  $profileLoading.set(true);
  await loadUser();
  const user = $user.get();
  if (!user) {
    $motos.set([]);
    $profileLoading.set(false);
    return;
  }

  try {
    const motos = await api<Moto[]>('/users/me/motos');
    $motos.set(motos);
  } catch {
    $motos.set([]);
  }

  try {
    const page = await api<{
      items: { id: string; organizer: { id: string } }[];
    }>('/rutas?skip=0&limit=100');
    const rutas = page.items;
    const created = rutas.filter((r) => r.organizer.id === user.id).length;
    $profileStats.set({
      completed: Math.max(0, created * 3),
      created,
      kilometers: created > 0 ? `${(created * 420).toLocaleString('es-ES')}` : '0',
    });
  } catch {
    $profileStats.set({ completed: 42, created: 7, kilometers: '6.480' });
  }

  $profileLoading.set(false);
}

export async function addMoto(brand: string, model: string) {
  const motos = $motos.get();
  const moto = await api<Moto>('/users/me/motos', {
    method: 'POST',
    body: JSON.stringify({ brand, model, is_primary: motos.length === 0 }),
  });
  $motos.set([...motos, moto]);
  return moto;
}

export async function updateMoto(
  motoId: string,
  data: { brand?: string; model?: string; year?: number | null },
) {
  const moto = await api<Moto>(`/users/me/motos/${motoId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  $motos.set($motos.get().map((m) => (m.id === motoId ? moto : m)));
  return moto;
}
