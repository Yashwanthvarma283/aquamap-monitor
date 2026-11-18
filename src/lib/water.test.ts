import { describe, expect, it } from "vitest";
import { computeWQI, gradeWQI, exceeds, PARAMS, STATIONS } from "./water";

describe("water quality index", () => {
  it("bases every sample station in the Chennai region", () => {
    expect(STATIONS).toHaveLength(8);
    for (const station of STATIONS) {
      expect(station.lat).toBeGreaterThanOrEqual(12.9);
      expect(station.lat).toBeLessThanOrEqual(13.3);
      expect(station.lng).toBeGreaterThanOrEqual(80.1);
      expect(station.lng).toBeLessThanOrEqual(80.35);
    }
    expect(STATIONS[0]?.name).toBe("Adyar River – Kotturpuram");
  });
  it("ideal water scores near zero (Excellent)", () => {
    const w = computeWQI({ ph: 7, do: 14.6, bod: 0, tds: 0, turbidity: 0, nitrate: 0 });
    expect(w).toBe(0);
    expect(gradeWQI(w)).toBe("Excellent");
  });
  it("water exactly at every limit scores 100", () => {
    expect(computeWQI({ ph: 8.5, do: 5, bod: 3, tds: 500, turbidity: 5, nitrate: 45 })).toBe(100);
  });
  it("grade bands follow 25/50/75/100 cutoffs", () => {
    expect(gradeWQI(50)).toBe("Good");
    expect(gradeWQI(75.1)).toBe("Very Poor");
    expect(gradeWQI(101)).toBe("Unsuitable");
  });
  it("DO below 5 mg/L and pH outside 6.5–8.5 are flagged", () => {
    const p = (k: string) => PARAMS.find((x) => x.key === k)!;
    expect(exceeds(p("do"), 4.9)).toBe(true);
    expect(exceeds(p("ph"), 6.4)).toBe(true);
    expect(exceeds(p("ph"), 7.5)).toBe(false);
  });
});
