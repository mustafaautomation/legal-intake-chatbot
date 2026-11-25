import { cn } from "@/lib/cn";

export function Badge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border border-line bg-brass-soft px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-ink",
        className,
      )}
      {...props}
    />
  );
}
