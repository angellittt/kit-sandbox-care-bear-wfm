// design-system-kit 0.28.21 · profile shadcn · stock component (base-nova + baseline only)
/**
 * Stock base-nova (shadcn 4.21.1, 2026-10-08) + TTT baseline:
 * - Focus: removed `outline-none` and `focus-visible:border-ring/ring-*` in favour of the global `:focus-visible` outline.
 * - Radius roles (D1): base `rounded-lg` -> `rounded-md` (a button); sm `rounded-[min(var(--radius-md),12px)]` -> `rounded-sm`.
 * - Control tokens: heights and min widths `8`/`7`/`9` -> `control-height-md`/`-sm`/`-lg`, padding `px-2.5` -> `control-padding-x`, text `text-sm` / `text-[0.8rem]` -> `control-label-md` / `-sm`, so the control set's density and text are token changes. Variable forms (`h-(--control-height-md)`, `text-(length:--control-label-md-size)`), so tailwind-merge still lets a call site's `h-10` or `text-lg` replace them.
 * - Layer and icon tokens: icon sizes `size-3`/`3.5`/`4`/`5` -> `size-(--icon-xs|sm|md|lg)`, so stacking and icon size are token changes (variable forms keep tailwind-merge overrides working).
 */
"use client";

import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

const toggleVariants = cva(
  "group/toggle inline-flex items-center justify-center gap-1 rounded-md font-medium whitespace-nowrap transition-all hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 aria-pressed:bg-muted data-[state=on]:bg-muted dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-(--icon-md)",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline: "border border-input bg-transparent hover:bg-muted",
      },
      size: {
        default:
          "h-(--control-height-md) min-w-(--control-height-md) px-(--control-padding-x) text-(length:--control-label-md-size) leading-(--control-label-md-leading) tracking-(--control-label-md-tracking) has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        sm: "h-(--control-height-sm) min-w-(--control-height-sm) rounded-sm px-(--control-padding-x) text-(length:--control-label-sm-size) leading-(--control-label-sm-leading) tracking-(--control-label-sm-tracking) has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-(--icon-sm)",
        lg: "h-(--control-height-lg) min-w-(--control-height-lg) px-(--control-padding-x) text-(length:--control-label-md-size) leading-(--control-label-md-leading) tracking-(--control-label-md-tracking) has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Toggle({
  className,
  variant = "default",
  size = "default",
  ...props
}: TogglePrimitive.Props & VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Toggle, toggleVariants };
