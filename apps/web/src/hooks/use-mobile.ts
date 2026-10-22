// design-system-kit 0.28.21 · profile shadcn · stock component (base-nova + baseline only)
/**
 * TTT baseline:
 * - Breakpoint token: the mobile breakpoint is the design system's `--breakpoint-md` (read from the token file at runtime), 768px without one.
 */
import * as React from "react";

const MOBILE_BREAKPOINT = 768;

/** The design system's md breakpoint (`--breakpoint-md`, in rem or px), in px; 768 without a token file. */
function mobileBreakpoint() {
  const root = document.documentElement;
  const raw = getComputedStyle(root).getPropertyValue("--breakpoint-md").trim();
  const n = parseFloat(raw);
  if (!Number.isFinite(n)) return MOBILE_BREAKPOINT;
  return raw.endsWith("rem")
    ? n * parseFloat(getComputedStyle(root).fontSize)
    : n;
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    const MOBILE_BREAKPOINT = mobileBreakpoint();
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
