// design-system-kit 0.28.21 · profile shadcn · kit extension (replaces the stock file)
/**
 * Stock base-nova (shadcn 4.21.1, 2026-10-07) + TTT baseline:
 * - Card: hairline ring-1 ring-foreground/10 -> border border-border.
 * - Card radius role (cards = radius-lg): rounded-xl -> rounded-lg on Card, CardHeader, edge images and CardFooter.
 * - CardDescription label role: text-muted-foreground -> text-label-neutral.
 * + TTT kit extensions:
 * - variant flat | raised (Raised / flat): cva + data-variant. flat (default) is the stock look; raised adds shadow-sm (cards at rest).
 * - interactive (Hover lift): cursor-pointer, hover shadow-lg, motion-safe: lift on hover and settle on press (duration-normal, ease-standard); data-interactive.
 */
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

const cardVariants = cva(
  "group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-lg border border-border bg-card py-(--card-spacing) text-sm text-card-foreground [--card-spacing:--spacing(4)] has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(3)] data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-lg *:[img:last-child]:rounded-b-lg",
  {
    variants: {
      variant: {
        flat: "",
        raised: "shadow-sm",
      },
      interactive: {
        true: "cursor-pointer hover:shadow-lg active:shadow-sm motion-safe:transition-[translate,box-shadow] motion-safe:duration-normal motion-safe:ease-standard motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0",
        false: "",
      },
    },
    defaultVariants: {
      variant: "flat",
      interactive: false,
    },
  },
);

function Card({
  className,
  size = "default",
  variant = "flat",
  interactive = false,
  ...props
}: React.ComponentProps<"div"> & {
  size?: "default" | "sm";
} & VariantProps<typeof cardVariants>) {
  return (
    <div
      data-slot="card"
      data-size={size}
      data-variant={variant}
      data-interactive={interactive || undefined}
      className={cn(cardVariants({ variant, interactive }), className)}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-lg px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing)",
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-heading text-base leading-snug font-medium group-data-[size=sm]/card:text-sm",
        className,
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-label-neutral", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className,
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-(--card-spacing)", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center rounded-b-lg border-t bg-muted/50 p-(--card-spacing)",
        className,
      )}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  cardVariants,
};
