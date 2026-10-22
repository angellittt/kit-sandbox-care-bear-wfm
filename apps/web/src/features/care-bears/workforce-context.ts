import * as React from "react";
import type { Bear, BearStatus, Mission } from "./data";

export type WorkforceContextValue = {
  bears: Bear[];
  missions: Mission[];
  bearById: (id: string) => Bear | undefined;
  /** The bear's in-progress mission, else their next scheduled one. */
  currentMissionFor: (bearId: string) => Mission | undefined;
  missionsFor: (bearId: string) => Mission[];
  assign: (missionId: string, bearId: string) => void;
  setStatus: (bearId: string, status: BearStatus) => void;
};

export const WorkforceContext =
  React.createContext<WorkforceContextValue | null>(null);

export const useWorkforce = () => {
  const context = React.useContext(WorkforceContext);
  if (!context) {
    throw new Error("useWorkforce must be used within a WorkforceProvider.");
  }
  return context;
};
