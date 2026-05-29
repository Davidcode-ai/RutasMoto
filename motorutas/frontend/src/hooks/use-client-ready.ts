import { useEffect, useState } from 'react';

/** Evita leer window/localStorage antes del montaje en islas React. */
export function useClientReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  return ready;
}
