// Temporary type shim for environments where dependencies
// are not installed/available to the TS server.
//
// This keeps the editor usable. For actual runtime, install deps via `npm install`.

declare module 'react-router-dom' {
  export const BrowserRouter: any;
  export const Routes: any;
  export const Route: any;

  export const Link: any;
  export function useNavigate(): (...args: any[]) => any;
  export function useParams<T extends Record<string, string | undefined> = Record<string, string | undefined>>(): T;
  export function Navigate(props: any): any;
  export function Outlet(props: any): any;
  export function RouterProvider(props: any): any;
  export function createBrowserRouter(...args: any[]): any;
}

