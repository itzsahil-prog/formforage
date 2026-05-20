// Temporary type shim for environments where dependencies
// are not installed/available to the TS server.
//
// For actual runtime/build, install deps via `npm install`.

declare module 'motion/react' {
  export const motion: any;
  export const AnimatePresence: any;
}

