import { useEffect, useState } from 'react';

export type ToastVariant = 'default' | 'destructive';

export type ToastItem = {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
};

type State = { toasts: ToastItem[] };

const TOAST_LIMIT = 3;
const TOAST_DURATION_MS = 5000;

let count = 0;
const listeners: Array<(state: State) => void> = [];
let memoryState: State = { toasts: [] };

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

function dispatch(next: State) {
  memoryState = next;
  listeners.forEach((l) => l(memoryState));
}

function dismissToast(id: string) {
  dispatch({
    toasts: memoryState.toasts.filter((t) => t.id !== id),
  });
}

export function toast(props: Omit<ToastItem, 'id'>) {
  const id = genId();
  const item: ToastItem = { id, variant: 'default', ...props };

  dispatch({
    toasts: [item, ...memoryState.toasts].slice(0, TOAST_LIMIT),
  });

  window.setTimeout(() => dismissToast(id), TOAST_DURATION_MS);

  return { id, dismiss: () => dismissToast(id) };
}

export function useToast() {
  const [state, setState] = useState<State>(memoryState);

  useEffect(() => {
    listeners.push(setState);
    return () => {
      const i = listeners.indexOf(setState);
      if (i > -1) listeners.splice(i, 1);
    };
  }, []);

  return {
    toasts: state.toasts,
    toast,
    dismiss: dismissToast,
  };
}
