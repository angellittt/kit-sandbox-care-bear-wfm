import * as React from "react";

// Hash routing keeps the app router-free until it needs more than four views:
// "#/", "#/bears", "#/bears/:id", "#/missions".

export type Route =
  | { name: "dashboard" }
  | { name: "bears" }
  | { name: "bear"; id: string }
  | { name: "missions" };

export const href = {
  dashboard: "#/",
  bears: "#/bears",
  bear: (id: string) => `#/bears/${id}`,
  missions: "#/missions",
};

export const parseRoute = (hash: string): Route => {
  const [first, second] = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  if (first === "bears" && second) {
    return { name: "bear", id: decodeURIComponent(second) };
  }
  if (first === "bears") return { name: "bears" };
  if (first === "missions") return { name: "missions" };
  return { name: "dashboard" };
};

const subscribe = (onChange: () => void) => {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
};

export const useRoute = (): Route => {
  const hash = React.useSyncExternalStore(
    subscribe,
    () => window.location.hash,
  );
  return React.useMemo(() => parseRoute(hash), [hash]);
};
