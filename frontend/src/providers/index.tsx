"use client";

import { QueryProvider } from "./query-provider";
import { NuqsProvider } from "./nuqs-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <NuqsProvider>{children}</NuqsProvider>
    </QueryProvider>
  );
}

