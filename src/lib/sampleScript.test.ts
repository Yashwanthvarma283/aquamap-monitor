import { describe, it, expect } from "vitest";
import { runScript, suggestionsFor, LIVE_TEMPLATES } from "./sampleScript";

describe("sample script", () => {
  it("computes WQI for ideal values", () => {
    const body = LIVE_TEMPLATES.find((t) => t.abbr === "ideal")!.body.replace("$0", "");
    expect(runScript(body).wqi).toBe(0);
  });
  it("rejects pH above 14", () => {
    expect(runScript("ph = 15").errors[0]?.message).toBe("pH must be 0–14");
  });
  it("sout expands to print wqi", () => {
    expect(LIVE_TEMPLATES.find((t) => t.abbr === "sout")?.body).toBe("print wqi$0");
  });
  it("hides templates from suggestions when turned off", () => {
    expect(suggestionsFor("so", false)).toHaveLength(0);
    expect(suggestionsFor("so", true).map((s) => s.label)).toContain("sout");
  });
});
