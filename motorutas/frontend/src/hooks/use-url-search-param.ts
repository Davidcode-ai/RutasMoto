import { useEffect, useState } from 'react';

/** Lee un query param en el cliente sin parpadeo post-hidratación. */
export function useUrlSearchParam(key: string): string {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get(key) || '';
  });

  useEffect(() => {
    const read = () => {
      setValue(new URLSearchParams(window.location.search).get(key) || '');
    };
    read();
    window.addEventListener('popstate', read);
    return () => window.removeEventListener('popstate', read);
  }, [key]);

  return value;
}
