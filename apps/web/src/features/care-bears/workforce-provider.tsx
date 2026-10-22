import * as React from "react";
import { bears as initialBears, missions as initialMissions } from "./data";
import {
  WorkforceContext,
  type WorkforceContextValue,
} from "./workforce-context";

/** Holds the mock roster in memory so assignments update every view. */
export const WorkforceProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [bears, setBears] = React.useState(initialBears);
  const [missions, setMissions] = React.useState(initialMissions);

  const value = React.useMemo<WorkforceContextValue>(() => {
    const missionsFor = (bearId: string) =>
      missions.filter((mission) => mission.bearIds.includes(bearId));
    return {
      bears,
      missions,
      bearById: (id) => bears.find((bear) => bear.id === id),
      missionsFor,
      currentMissionFor: (bearId) => {
        const own = missionsFor(bearId);
        return (
          own.find((m) => m.status === "in-progress") ??
          own.find((m) => m.status === "scheduled")
        );
      },
      assign: (missionId, bearId) => {
        setMissions((all) =>
          all.map((mission) =>
            mission.id !== missionId || mission.bearIds.includes(bearId)
              ? mission
              : {
                  ...mission,
                  bearIds: [...mission.bearIds, bearId],
                  status:
                    mission.status === "unassigned"
                      ? "scheduled"
                      : mission.status,
                },
          ),
        );
        setBears((all) =>
          all.map((bear) =>
            bear.id === bearId ? { ...bear, status: "deployed" } : bear,
          ),
        );
      },
      setStatus: (bearId, status) =>
        setBears((all) =>
          all.map((bear) => (bear.id === bearId ? { ...bear, status } : bear)),
        ),
    };
  }, [bears, missions]);

  return (
    <WorkforceContext.Provider value={value}>
      {children}
    </WorkforceContext.Provider>
  );
};
