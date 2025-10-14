// hooks/useActionAccessors.ts
import { useCallback, useRef } from 'react';

/** Stable getter that always returns the latest value (stored in a ref). */
export function useGetter<T>(value: T) {
  const ref = useRef(value);
  ref.current = value; // keep it fresh each render
  // stable function identity across renders
  return useCallback(() => ref.current, []);
}

/** Stable setter wrapper (useful if set fn can change or to keep a consistent API). */
export function useSetter<T>(setFn: (v: T) => void) {
  const ref = useRef(setFn);
  ref.current = setFn;
  return useCallback((v: T) => ref.current(v), []);
}
