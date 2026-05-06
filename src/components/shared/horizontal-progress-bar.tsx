type HorizontalProgressBarProps = {
  value: number;
  color?: string;
  className?: string;
  trackClassName?: string;
};

function clampPercentage(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, value));
}

export function HorizontalProgressBar({
  value,
  color = "#5f5e5e",
  className = "",
  trackClassName = "",
}: HorizontalProgressBarProps) {
  const clamped = clampPercentage(value);

  return (
    <div
      aria-hidden="true"
      className={`relative h-2 overflow-hidden rounded-full bg-[#e2e3d9] ${trackClassName}`.trim()}
    >
      <svg
        className={`absolute inset-0 h-full w-full ${className}`.trim()}
        preserveAspectRatio="none"
        viewBox="0 0 100 8"
      >
        <rect fill={color} height="8" rx="4" width={clamped} x="0" y="0" />
      </svg>
    </div>
  );
}
