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
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              boxShadow: "0 12px 40px rgba(0, 0, 0, 0.35)",
              color: "#fff",
            },
          }}
        />
      </QueryClientProvider>
    </HeroUIProvider>
  );
}
