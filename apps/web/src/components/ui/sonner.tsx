// design-system-kit 0.28.21 · profile shadcn · stock component (base-nova + baseline only)
"use client";

/**
 * Stock base-nova (shadcn 4.21.1, 2026-10-07) + TTT baseline:
 * - `--border-radius: var(--radius)` -> `var(--radius-lg)`: the generated token file defines radius tokens only, no bare `--radius` (toasts take the popover radius role).
 * - Layer and icon tokens: icon sizes `size-3`/`3.5`/`4`/`5` -> `size-(--icon-xs|sm|md|lg)`, so stacking and icon size are token changes (variable forms keep tailwind-merge overrides working).
 */

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-(--icon-md)" />,
        info: <InfoIcon className="size-(--icon-md)" />,
        warning: <TriangleAlertIcon className="size-(--icon-md)" />,
        error: <OctagonXIcon className="size-(--icon-md)" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius-lg)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
