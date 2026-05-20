// Temporary type shims for environments where dependencies
// (node_modules) are not installed/available to the TS server.
//
// This keeps the editor usable. For actual runtime, install deps via `npm install`.

declare module 'react' {
  export type ReactNode = any;
  export type FC<P = {}> = (props: P) => any;
  export type FormEvent = any;
  export const StrictMode: any;

  export const Fragment: any;

  export function useState<T>(initial: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  export function useMemo<T>(factory: () => T, deps: any[]): T;

  const React: {
    createElement: (...args: any[]) => any;
    Fragment: any;
    useMemo: <T>(factory: () => T, deps: any[]) => T;
  };

  export default React;
}

declare namespace JSX {
  // Accept any intrinsic elements so JSX doesn't error.
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

