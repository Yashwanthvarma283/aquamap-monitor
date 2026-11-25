import { describe, expect, it } from "vitest";
import { summarize, monthlyAverages, stationChange, breachRows, contributions } from "./analytics";
import { computeWQI, STATIONS, type Station } from "./water";
const station: Station = {
  id: "test",
  name: "Test station",
  type: "Lake",
  lat: 13,
  lng: 80.2,
  history: [
    { month: "Jun", reading: { ph: 8.5, do: 5, bod: 3, tds: 500, turbidity: 5, nitrate: 45 } },
    { month: "Nov", reading: { ph: 7, do: 14.6, bod: 0, tds: 0, turbidity: 0, nitrate: 0 } },
  ],
};
describe("sample analytics", () => {
  it("counts the expanded network and all observations", () => {
    expect(summarize(STATIONS).stations).toBe(16);
    expect(summarize(STATIONS).samples).toBe(96);
    expect(summarize(STATIONS).readings).toBe(576);
  });
  it("counts improvement as a lower WQI than the first sample", () => {
    expect(stationChange(station)).toBe(-100);
    expect(summarize([station]).improving).toBe(1);
  });
  it("averages the requested monthly readings", () => {
    expect(monthlyAverages([station])).toEqual([
      { month: "Jun", value: 100 },
      { month: "Nov", value: 0 },
    ]);
    expect(monthlyAverages([station], "bod")).toEqual([
      { month: "Jun", value: 3 },
      { month: "Nov", value: 0 },
    ]);
  });
  it("reports each latest breach separately including low DO", () => {
    const bad: Station = {
      ...station,
      history: [
        { month: "Nov", reading: { ph: 7, do: 4, bod: 4, tds: 500, turbidity: 5, nitrate: 45 } },
      ],
    };
    expect(breachRows([bad]).map((r) => r.parameter.key)).toEqual(["do", "bod"]);
  });
  it("weighted parameter contributions sum to the index", () => {
    const first = STATIONS[0];
    if (!first) throw new Error("Missing station");
    const sample = first.history.at(-1);
    if (!sample) throw new Error("Missing reading");
    expect(contributions(first).reduce((n, c) => n + c.value, 0)).toBeCloseTo(
      computeWQI(sample.reading),
      0,
    );
  });
  it("handles an empty filter without invalid averages", () => {
    expect(summarize([]).average).toBe(0);
    expect(monthlyAverages([])).toEqual([]);
  });
});
