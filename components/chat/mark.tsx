export function FirmMark({ className = "h-[22px] w-[22px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 20V9.5L12 4l8 5.5V20" strokeLinejoin="round" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}
