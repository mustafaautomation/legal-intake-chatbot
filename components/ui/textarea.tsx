import * as React from "react";
import { cn } from "@/lib/cn";

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "flex min-h-24 w-full rounded-sm border border-line bg-sheet px-3 py-2 text-sm text-ink outline-none placeholder:text-muted focus-visible:border-brass",
        className,
      )}
      {...props}
    />
  );
}
