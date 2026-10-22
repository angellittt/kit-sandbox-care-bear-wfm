// design-system-kit 0.28.21 · profile shadcn · kit extension (replaces the stock file)
/**
 * Stock base-nova (shadcn 4.21.1, 2026-10-07) + TTT baseline:
 * - AlertDescription: `group-has-[>svg]/alert:col-start-2` pins the description to the text column when an icon is present.
 *
 * Kit extensions:
 * - Semantic colour (profile capability "Semantic colour"): `tone` prop
 *   (neutral / info / positive / cautionary / negative) alongside stock's
 *   `variant`, exposed as `data-tone`. Status is never carried by tint alone:
 *   every tone expects an icon and wording. `info` is the status-info pair
 *   (its own ramp since kit 0.28.14), so info and neutral read apart.
 * - Urgent-only interruption (candidate): `urgent` prop; only an urgent alert
 *   takes `role="alert"`. Everything else is read in reading order.
 * - Dismiss button (candidate): `AlertDismiss` emits `onDismiss` and never
 *   hides itself; remembering a dismissal is the application's job.
 * - Layer and icon tokens: icon sizes `size-3`/`3.5`/`4`/`5` -> `size-(--icon-xs|sm|md|lg)`, so stacking and icon size are token changes (variable forms keep tailwind-merge overrides working).
 */
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

const alertVariants = cva(
  "group/alert relative grid w-full gap-0.5 rounded-lg border px-2.5 py-2 text-left text-sm has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-18 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-(--icon-md)",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive:
          "bg-card text-destructive *:data-[slot=alert-description]:text-destructive/90 *:[svg]:text-current",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

// A tone replaces the variant's ground and text colour; the description
// inherits the tone's colour rather than switching to a neutral grey.
const alertToneVariants = cva("*:data-[slot=alert-description]:text-current", {
  variants: {
    tone: {
      neutral: "bg-fill-alternative text-label-normal",
      info: "bg-status-info-soft text-status-info",
      positive: "bg-status-positive-soft text-status-positive",
      cautionary: "bg-status-cautionary-soft text-status-cautionary",
      negative: "bg-status-negative-soft text-status-negative",
    },
  },
});

/**
 * `urgent` is the only thing that sets role="alert". A non-urgent alert that
 * interrupts a screen reader mid-task is worse than one it reaches in
 * reading order.
 */
function Alert({
  className,
  variant,
  tone,
  urgent = false,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof alertVariants> &
  VariantProps<typeof alertToneVariants> & { urgent?: boolean }) {
  return (
    <div
      data-slot="alert"
      data-tone={tone ?? undefined}
      role={urgent ? "alert" : undefined}
      className={cn(
        alertVariants({ variant }),
        tone && alertToneVariants({ tone }),
        className,
      )}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "font-medium group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-sm text-balance text-muted-foreground group-has-[>svg]/alert:col-start-2 md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4",
        className,
      )}
      {...props}
    />
  );
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn("absolute top-2 right-2", className)}
      {...props}
    />
  );
}

/**
 * Dismissible alerts. Emits `onDismiss` and nothing else; the component never
 * hides itself, because only the application knows what the message is tied
 * to. Escape does not dismiss: an alert is not a dialog. The caller moves
 * focus somewhere sensible afterwards.
 */
function AlertDismiss({
  className,
  label = "Dismiss",
  onDismiss,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "onClick"> & {
  label?: string;
  onDismiss: () => void;
}) {
  return (
    <AlertAction>
      <Button
        data-slot="alert-dismiss"
        variant="ghost"
        size="icon-sm"
        aria-label={label}
        className={cn(
          "text-current hover:bg-fill-normal hover:text-current dark:hover:bg-fill-normal",
          className,
        )}
        onClick={onDismiss}
        {...props}
      >
        <XIcon />
      </Button>
    </AlertAction>
  );
}

export { Alert, AlertTitle, AlertDescription, AlertAction, AlertDismiss };
