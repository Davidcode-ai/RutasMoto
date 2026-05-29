import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import WelcomeScreen from '@/components/auth/WelcomeScreen';
import RouteListApp from '@/components/route/RouteListApp';
import { $authLoading, $user, isGuestMode, loadUser } from '@/stores/auth';

/**
 * Pantalla de inicio unificada: evita montar la lista detrás del welcome
 * y dobles llamadas a loadUser que provocaban parpadeos.
 */
export default function HomeApp() {
  const user = useStore($user);
  const authLoading = useStore($authLoading);
  const [isGuest, setIsGuest] = useState(() =>
    typeof window !== 'undefined' ? isGuestMode() : false,
  );

  useEffect(() => {
    loadUser();
    setIsGuest(isGuestMode());
  }, []);

  const showWelcome = !authLoading && !user && !isGuest;

  if (showWelcome) {
    return <WelcomeScreen onGuest={() => setIsGuest(true)} />;
  }

  if (authLoading) {
    return (
      <main
        className="flex min-h-app w-full items-center justify-center overflow-x-hidden"
        aria-busy="true"
        aria-label="Cargando"
      >
        <p className="text-muted-foreground">Cargando rutas…</p>
      </main>
    );
  }

  return <RouteListApp />;
}
