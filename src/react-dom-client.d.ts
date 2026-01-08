declare module 'react-dom/client' {
  import { Root } from 'react-dom/client';
  import { ReactNode } from 'react';
  
  export function createRoot(container: Element | DocumentFragment): Root;
  export interface Root {
    render(children: ReactNode): void;
    unmount(): void;
  }
}
