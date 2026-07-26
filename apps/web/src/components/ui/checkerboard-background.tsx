import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface CheckerboardBackgroundProps {
  children?: ReactNode;
  className?: string;
}

export default function CheckerboardBackground({
  children,
  className,
}: CheckerboardBackgroundProps) {
  return (
    <div className={cn("relative w-full overflow-hidden bg-black", className)}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-80 [background-color:#0a0a0a] [background-image:linear-gradient(#171717_1px,transparent_1px),linear-gradient(90deg,#171717_1px,transparent_1px),conic-gradient(from_90deg_at_1px_1px,#0a0a0a_90deg,#000_0_180deg,#0a0a0a_0_270deg,#000_0)] [background-size:40px_40px,40px_40px,80px_80px] [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_82%)]"
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
