// Temporary type shim for environments where dependencies
// are not installed/available to the TS server.
//
// For actual runtime/build, install deps via `npm install`.

declare module '@hello-pangea/dnd' {
  export const DragDropContext: any;
  export const Droppable: any;
  export const Draggable: any;

  export type DropResult = {
    draggableId: string;
    type: string;
    source: { droppableId: string; index: number };
    destination?: { droppableId: string; index: number } | null;
    reason: 'DROP' | 'CANCEL';
    mode?: 'FLUID' | 'SNAP';
    combine?: any;
  };
}

