// Temporary type shim for environments where dependencies
// are not installed/available to the TS server.
//
// For actual runtime/build, install deps via `npm install`.

declare module 'react-dom/client' {
  export function createRoot(container: any, options?: any): {
    render: (element: any) => void;
    unmount: () => void;
  };
}

