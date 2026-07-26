import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface DotBackgroundDemoProps {
  children?: ReactNode;
  className?: string;
}

export default function DotBackgroundDemo({ children, className }: DotBackgroundDemoProps) {
  return (
    <div className={cn("relative w-full overflow-hidden bg-background", className)}>
      <div
        className={cn(
          "absolute inset-0",
          "[background-size:20px_20px]",
          "[background-image:radial-gradient(#d4d4d4_1px,transparent_1px)]",
          "dark:[background-image:radial-gradient(#404040_1px,transparent_1px)]",
        )}
      />
      <div className="pointer-events-none absolute inset-0 bg-background [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
