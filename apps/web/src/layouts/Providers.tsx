"use client";

import { HeroUIProvider } from "@heroui/system";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LazyMotion, domAnimation } from "motion/react";
import type { ReactNode } from "react";
import { useState } from "react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <HeroUIProvider>
      <QueryClientProvider client={queryClient}>
        <LazyMotion features={domAnimation}>{children}</LazyMotion>
        <Toaster
          theme="dark"
          position="top-center"
          toastOptions={{
            style: {
              background: "#1a1a1a",
              border: "1px solid #27272a",
              color: "#fff",
            },
          }}
        />
      </QueryClientProvider>
    </HeroUIProvider>
  );
}
