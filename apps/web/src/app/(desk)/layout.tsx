import type { ReactNode } from "react";
import { LibraryProvider } from "@/components/library-provider";
import { WorkspaceShell } from "@/components/workspace-shell";

export default function DeskLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <LibraryProvider><WorkspaceShell>{children}</WorkspaceShell></LibraryProvider>;
}
