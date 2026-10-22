// design-system-kit 0.28.21 · profile shadcn · stock component (base-nova + baseline only)
/**
 * Stock base-nova (shadcn 4.21.1, 2026-10-07) + TTT baseline:
 * - Focus: removed `outline-none` and `focus-visible:border-ring/ring-*` (base and destructive) in favour of the global `:focus-visible` outline.
 * - Radius roles (D1): base `rounded-lg` -> `rounded-md`; xs/sm/icon-xs/icon-sm `rounded-[min(var(--radius-md),…)]` -> `rounded-sm`; button-group override `rounded-lg` -> `rounded-md`.
 * - `link` variant `text-primary` -> `text-primary-text` (text-safe primary).
 * - Destructive dark hover `dark:hover:bg-destructive/30` -> `/25`: status-negative text keeps 4.5:1 on its own tint (contrast-pairs.json checks 20% and 25% in dark).
 * - Hovers wired to their tokens: default `hover:bg-primary/80` -> `hover:bg-primary-strong` (the hover Setup picks so on-primary keeps contrast); secondary `hover:bg-[color-mix(…secondary…foreground_5%)]` -> `hover:bg-fill-strong` (the hover for fill-normal).
 * - Control tokens: default, sm and lg heights `h-8`/`h-7`/`h-9` (and the icon sizes' `size-8`/`size-7`/`size-9`) -> `control-height-md`/`-sm`/`-lg`, padding `px-2.5` -> `control-padding-x`, text `text-sm` (base) / `text-[0.8rem]` (sm) -> `control-label-md` on default and lg, `control-label-sm` on sm (xs keeps `text-xs`), so the control set's density and text are token changes. Variable forms (`h-(--control-height-md)`, `text-(length:--control-label-md-size)`), so tailwind-merge still lets a call site's `h-10` or `text-lg` replace them.
 * - Layer and icon tokens: icon sizes `size-3`/`3.5`/`4`/`5` -> `size-(--icon-xs|sm|md|lg)`, so stacking and icon size are token changes (variable forms keep tailwind-merge overrides working).
 */
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding font-medium whitespace-nowrap transition-all select-none active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-(--icon-md)",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-strong",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-fill-strong aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/25",
        link: "text-primary-text underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-(--control-height-md) gap-1.5 px-(--control-padding-x) text-(length:--control-label-md-size) leading-(--control-label-md-leading) tracking-(--control-label-md-tracking) has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-sm px-2 text-xs in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-(--icon-xs)",
        sm: "h-(--control-height-sm) gap-1 rounded-sm px-(--control-padding-x) text-(length:--control-label-sm-size) leading-(--control-label-sm-leading) tracking-(--control-label-sm-tracking) in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-(--icon-sm)",
        lg: "h-(--control-height-lg) gap-1.5 px-(--control-padding-x) text-(length:--control-label-md-size) leading-(--control-label-md-leading) tracking-(--control-label-md-tracking) has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-(--control-height-md)",
        "icon-xs":
          "size-6 rounded-sm in-data-[slot=button-group]:rounded-md [&_svg:not([class*='size-'])]:size-(--icon-xs)",
        "icon-sm":
          "size-(--control-height-sm) rounded-sm in-data-[slot=button-group]:rounded-md",
        "icon-lg": "size-(--control-height-lg)",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
