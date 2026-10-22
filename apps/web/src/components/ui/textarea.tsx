// design-system-kit 0.28.21 · profile shadcn · stock component (base-nova + baseline only)
/**
 * Stock base-nova (shadcn 4.21.1, 2026-10-07) + TTT baseline:
 * - Radius role (D1): `rounded-lg` -> `rounded-sm` (text field).
 * - Label role (D2): `placeholder:text-muted-foreground` -> `placeholder:text-label-assistive`.
 * - Keeps stock's border + ring focus treatment.
 * - Control tokens: padding `px-2.5` -> `control-padding-x`, `md:text-sm` -> `control-label-md` from md (below it stock's `text-base` stays, so phones don't zoom on focus), so the control set's density and text are token changes. Variable forms (`h-(--control-height-md)`, `text-(length:--control-label-md-size)`), so tailwind-merge still lets a call site's `h-10` or `text-lg` replace them.
 */
import * as React from "react";
import { cn } from "cn";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-sm border border-input bg-transparent px-(--control-padding-x) py-2 text-base transition-colors outline-none placeholder:text-label-assistive focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-(length:--control-label-md-size) md:leading-(--control-label-md-leading) md:tracking-(--control-label-md-tracking) dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
