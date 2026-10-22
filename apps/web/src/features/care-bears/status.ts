import type { BearStatus, MissionPriority, MissionStatus } from "./data";

export type Tone =
  | "neutral"
  | "primary"
  | "info"
  | "positive"
  | "cautionary"
  | "negative";

type Meta = { label: string; tone: Tone };

// Maps, not records: lookups by a variable key on a plain object trip
// eslint-plugin-security's detect-object-injection.
export const bearStatusMeta = new Map<BearStatus, Meta>([
  ["deployed", { label: "Deployed", tone: "info" }],
  ["available", { label: "Available", tone: "positive" }],
  ["recharging", { label: "Recharging", tone: "cautionary" }],
  ["off-duty", { label: "Off duty", tone: "neutral" }],
]);

export const missionStatusMeta = new Map<MissionStatus, Meta>([
  ["in-progress", { label: "In progress", tone: "primary" }],
  ["scheduled", { label: "Scheduled", tone: "info" }],
  ["unassigned", { label: "Needs a bear", tone: "cautionary" }],
  ["completed", { label: "Completed", tone: "positive" }],
]);

export const priorityMeta = new Map<MissionPriority, Meta>([
  ["critical", { label: "Critical", tone: "negative" }],
  ["high", { label: "High", tone: "cautionary" }],
  ["normal", { label: "Normal", tone: "neutral" }],
  ["low", { label: "Low", tone: "neutral" }],
]);

export const priorityRank = new Map<MissionPriority, number>([
  ["critical", 0],
  ["high", 1],
  ["normal", 2],
  ["low", 3],
]);

export const bearStatuses = [...bearStatusMeta.keys()];
