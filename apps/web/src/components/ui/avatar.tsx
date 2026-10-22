// design-system-kit 0.28.21 · profile shadcn · kit extension (replaces the stock file)
/**
 * Stock base-nova (shadcn 4.21.1, 2026-10-07), no baseline changes.
 * + TTT kit extensions:
 * - tone neutral | primary | secondary | accent (Semantic colour): sets --t-solid/--t-on on the root (data-tone); AvatarFallback reads them. No tone keeps stock's muted fallback.
 * - initialsOf() (Initials): "Ada Lovelace" -> "AL".
 * - Layer and icon tokens: icon sizes `size-3`/`3.5`/`4`/`5` -> `size-(--icon-xs|sm|md|lg)`, so stacking and icon size are token changes (variable forms keep tailwind-merge overrides working).
 */
"use client";

import * as React from "react";
import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

const avatarVariants = cva(
  "group/avatar relative flex size-8 shrink-0 rounded-full select-none after:absolute after:inset-0 after:rounded-full after:border after:border-border after:mix-blend-darken data-[size=lg]:size-10 data-[size=sm]:size-6 dark:after:mix-blend-lighten",
  {
    variants: {
      tone: {
        neutral: "[--t-solid:var(--fill-normal)] [--t-on:var(--label-normal)]",
        primary: "[--t-solid:var(--primary-normal)] [--t-on:var(--on-primary)]",
        secondary:
          "[--t-solid:var(--secondary-normal)] [--t-on:var(--on-secondary)]",
        accent: "[--t-solid:var(--accent-normal)] [--t-on:var(--on-accent)]",
      },
    },
  },
);

function Avatar({
  className,
  size = "default",
  tone,
  ...props
}: AvatarPrimitive.Root.Props & {
  size?: "default" | "sm" | "lg";
} & VariantProps<typeof avatarVariants>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      data-tone={tone ?? undefined}
      className={cn(avatarVariants({ tone }), className)}
      {...props}
    />
  );
}

function AvatarImage({ className, ...props }: AvatarPrimitive.Image.Props) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn(
        "aspect-square size-full rounded-full object-cover",
        className,
      )}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  ...props
}: AvatarPrimitive.Fallback.Props) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center rounded-full bg-muted text-sm text-muted-foreground group-data-[size=sm]/avatar:text-xs group-data-tone/avatar:bg-[var(--t-solid)] group-data-tone/avatar:text-[var(--t-on)]",
        className,
      )}
      {...props}
    />
  );
}

function AvatarBadge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="avatar-badge"
      className={cn(
        "absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground bg-blend-color ring-2 ring-background select-none",
        "group-data-[size=sm]/avatar:size-2 group-data-[size=sm]/avatar:[&>svg]:hidden",
        "group-data-[size=default]/avatar:size-2.5 group-data-[size=default]/avatar:[&>svg]:size-2",
        "group-data-[size=lg]/avatar:size-3 group-data-[size=lg]/avatar:[&>svg]:size-2",
        className,
      )}
      {...props}
    />
  );
}

function AvatarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group"
      className={cn(
        "group/avatar-group flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background",
        className,
      )}
      {...props}
    />
  );
}

function AvatarGroupCount({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group-count"
      className={cn(
        "relative flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm text-muted-foreground ring-2 ring-background group-has-data-[size=lg]/avatar-group:size-10 group-has-data-[size=sm]/avatar-group:size-6 [&>svg]:size-(--icon-md) group-has-data-[size=lg]/avatar-group:[&>svg]:size-(--icon-lg) group-has-data-[size=sm]/avatar-group:[&>svg]:size-(--icon-xs)",
        className,
      )}
      {...props}
    />
  );
}

/** "Ada Lovelace" -> "AL": first letter of the first two words, uppercased. */
function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarBadge,
  avatarVariants,
  initialsOf,
};
