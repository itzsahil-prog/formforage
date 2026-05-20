// Temporary type shim for environments where dependencies
// are not installed/available to the TS server.
//
// For actual runtime/build, install deps via `npm install`.

declare module 'lucide-react' {
  // Provide named exports for the icons used in this codebase.
  // Using `any` keeps the editor unblocked without pulling real types.
  export const ChevronLeft: any;
  export const ChevronRight: any;
  export const BarChart3: any;
  export const List: any;
  export const Download: any;
  export const Share: any;
  export const Copy: any;

  export const GripVertical: any;
  export const Plus: any;
  export const Settings: any;
  export const Trash2: any;
  export const Eye: any;
  export const LayoutTemplate: any;
  export const MessageSquare: any;
  export const Save: any;
  export const Sparkles: any;
  export const GitBranch: any;

  export const CheckCircle2: any;
  export const Loader2: any;

  export const LayoutDashboard: any;
  export const FileText: any;
  export const Activity: any;
  export const ArrowRight: any;
  export const Table: any;
  export const Mail: any;
  export const HardDrive: any;
  export const Presentation: any;
  export const FileCode2: any;
  export const Search: any;

  export const KeyRound: any;
  export const User: any;
}

