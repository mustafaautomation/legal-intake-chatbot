import * as React from "react";
import { cn } from "@/lib/cn";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-sm border border-line bg-sheet px-3 text-sm text-ink outline-none placeholder:text-muted focus-visible:border-brass",
        className,
      )}
      {...props}
    />
  );
}
