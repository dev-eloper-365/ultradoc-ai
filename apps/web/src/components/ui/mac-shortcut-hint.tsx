import { cn } from "@/lib/utils";

export function MacShortcutHint({
  keys,
  label,
  className,
  compact = false,
}: {
  keys: string[];
  label: string;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "hidden shrink-0 items-center gap-1.5 text-xs text-zinc-500 sm:flex",
        compact && "gap-1",
        className,
      )}
      aria-label={label}
    >
      {keys.map((key, index) => (
        <span key={key} className="contents">
          {index > 0 && <span aria-hidden>+</span>}
          <kbd
            className={cn(
              "flex size-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 font-sans text-xs text-zinc-400 shadow-sm backdrop-blur-xl",
              compact && "size-5 rounded-md text-[10px]",
            )}
          >
            {key}
          </kbd>
        </span>
      ))}
    </div>
  );
}
