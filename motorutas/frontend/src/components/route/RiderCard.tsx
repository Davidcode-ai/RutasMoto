import { paceFromApi, paceStyles, type Pace } from '@/lib/route-data';

type Rider = {
  id: string;
  user?: { username: string; avatar_url: string | null };
  pace_override?: string | null;
  origin?: string | null;
};

export function RiderCard({ rider }: { rider: Rider }) {
  const pace: Pace = paceFromApi(rider.pace_override);
  const name = rider.user?.username ?? 'Motero';
  const avatar = rider.user?.avatar_url || '/placeholder.svg';

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
      <img src={avatar} alt="" className="size-11 rounded-full object-cover ring-2 ring-primary/30" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{name}</p>
        {rider.origin && <p className="text-xs text-muted-foreground">Sale de · {rider.origin}</p>}
      </div>
      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${paceStyles[pace]}`}>
        {pace}
      </span>
    </div>
  );
}
