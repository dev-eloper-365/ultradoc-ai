import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface GridSmallBackgroundDemoProps {
  children?: ReactNode;
  className?: string;
}

export default function GridSmallBackgroundDemo({
  children,
  className,
}: GridSmallBackgroundDemoProps) {
  return (
    <div className={cn("relative w-full overflow-hidden bg-background", className)}>
      <div
        className={cn(
          "absolute inset-0 opacity-35",
          "[background-size:20px_20px]",
          "[background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]",
          "dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]",
        )}
      />
      <div className="pointer-events-none absolute inset-0 bg-background [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
