// Temporary type shim for environments where dependencies
// are not installed/available to the TS server.
//
// TypeScript's `jsx: react-jsx` transform imports from `react/jsx-runtime`.
// This shim prevents editor errors when `node_modules` isn't available.

declare module 'react/jsx-runtime' {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}

