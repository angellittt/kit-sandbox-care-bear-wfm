import { describe, expect, it } from "vitest";
import { parseRoute } from "../routes";

describe("parseRoute", () => {
  it.each([
    ["", { name: "dashboard" }],
    ["#/", { name: "dashboard" }],
    ["#/unknown", { name: "dashboard" }],
    ["#/bears", { name: "bears" }],
    ["#/bears/", { name: "bears" }],
    ["#/bears/cheer", { name: "bear", id: "cheer" }],
    ["#/missions", { name: "missions" }],
  ])("parses %j", (hash, route) => {
    expect(parseRoute(hash)).toEqual(route);
  });
});
