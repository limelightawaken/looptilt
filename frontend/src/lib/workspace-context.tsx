"use client";

import { createContext, useContext } from "react";
import type { NewsletterDetail, DataSource } from "@/lib/types/looptilt";

interface WorkspaceContextValue {
  newsletter: NewsletterDetail;
  dataSource: DataSource | null;
  refresh: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({
  value,
  children,
}: {
  value: WorkspaceContextValue;
  children: React.ReactNode;
}) {
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return ctx;
}
