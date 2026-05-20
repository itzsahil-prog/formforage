// Temporary type shim for environments where dependencies
// are not installed/available to the TS server.
//
// For actual runtime/build, install deps via `npm install`.

declare module 'react-hook-form' {
  export function useForm<TFieldValues = any>(...args: any[]): any;
  export const Controller: any;
}

