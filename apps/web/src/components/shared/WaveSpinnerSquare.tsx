"use client";

export function WaveSpinnerSquare({ size = 16 }: { size?: number }) {
  return (
    <div className="flex items-center gap-0.5" style={{ height: size }}>
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="inline-block w-1 rounded-full bg-primary animate-bounce"
          style={{
            height: size * 0.6,
            animationDelay: `${index * 0.12}s`,
            animationDuration: "0.8s",
          }}
        />
      ))}
    </div>
  );
}
