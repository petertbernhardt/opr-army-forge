import { useEffect, useRef } from 'react';

export function usePrevious<T>(value: T): T | undefined {
    console.warn('value', value);
  const ref = useRef<T>();
  useEffect(() => {
    console.warn('value ', value);
    ref.current = value;
  }, [value]);
  return ref.current;
}