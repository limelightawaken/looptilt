"use client";

import { QueryProvider } from "./query-provider";
import { NuqsProvider } from "./nuqs-provider";
import { ThemeProvider } from "@/components/theme-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryProvider>
        <NuqsProvider>{children}</NuqsProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}

