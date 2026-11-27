// Browser-safe parser for the Sample lab editor. Calculations stay in water.ts.
import { PARAMS, computeWQI, gradeWQI, exceeds, type ParamKey, type Reading } from "@/lib/water";

export const KEYS = PARAMS.map((p) => p.key) as ParamKey[];
export const PRINTABLE = ["wqi", "grade", "breaches", ...KEYS] as const;

export interface LiveTemplate { abbr: string; description: string; body: string }
/** IntelliJ-style live templates: type the abbreviation, then press Tab. `$0` marks the caret. */
export const LIVE_TEMPLATES: LiveTemplate[] = [
  { abbr: "psvm", description: "Full sample block with all six parameters", body: "// Sample — $0\nph = 7.0\ndo = 6.0\nbod = 2.0\ntds = 300\nturbidity = 3\nnitrate = 10\nprint wqi, grade" },
  { abbr: "sout", description: "Print the water quality index", body: "print wqi$0" },
  { abbr: "soutv", description: "Print every parameter value", body: `print ${KEYS.join(", ")}$0` },
  { abbr: "souf", description: "Print WQI with its classification", body: "print wqi, grade$0" },
  { abbr: "serr", description: "Print parameters that exceed limits", body: "print breaches$0" },
  { abbr: "ideal", description: "Insert ideal reference values", body: PARAMS.map((p) => `${p.key} = ${p.ideal}`).join("\n") + "$0" },
  { abbr: "limits", description: "Insert permissible limit values", body: PARAMS.map((p) => `${p.key} = ${p.standard}`).join("\n") + "$0" },
  { abbr: "todo", description: "TODO comment", body: "// TODO: $0" },
  { abbr: "fixme", description: "FIXME comment", body: "// FIXME: $0" },
];

export interface ScriptResult {
  reading: Partial<Reading>;
  errors: { line: number; message: string }[];
  output: { line: number; text: string }[];
  wqi?: number;
}

export function runScript(text: string): ScriptResult {
  const reading: Partial<Reading> = {};
  const errors: ScriptResult["errors"] = [];
  const prints: { line: number; items: string[] }[] = [];
  text.split("\n").forEach((raw, i) => {
    const line = raw.replace(/\/\/.*$/, "").trim();
    if (!line) return;
    const assign = /^([a-z_]+)\s*=\s*(-?\d*\.?\d+)$/i.exec(line);
    if (assign) {
      const key = assign[1]!.toLowerCase() as ParamKey;
      const value = Number(assign[2]);
      if (!KEYS.includes(key)) return void errors.push({ line: i + 1, message: `Unknown parameter "${assign[1]}"` });
      if (value < 0 || (key === "ph" && value > 14)) return void errors.push({ line: i + 1, message: key === "ph" ? "pH must be 0–14" : `${key} cannot be negative` });
      reading[key] = value;
      return;
    }
    const print = /^print\s+(.+)$/i.exec(line);
    if (print) {
      const items = print[1]!.split(",").map((s) => s.trim().toLowerCase());
      const bad = items.find((it) => !(PRINTABLE as readonly string[]).includes(it));
      if (bad) return void errors.push({ line: i + 1, message: `Cannot print "${bad}"` });
      prints.push({ line: i + 1, items });
      return;
    }
    errors.push({ line: i + 1, message: "Expected `parameter = value` or `print …`" });
  });
  const complete = KEYS.every((k) => reading[k] !== undefined);
  const wqi = complete ? computeWQI(reading as Reading) : undefined;
  const output = prints.map(({ line, items }) => ({
    line,
    text: items.map((it) => {
      if (it === "wqi") return `wqi = ${wqi ?? "incomplete"}`;
      if (it === "grade") return `grade = ${wqi !== undefined ? gradeWQI(wqi) : "incomplete"}`;
      if (it === "breaches") {
        const b = PARAMS.filter((p) => reading[p.key] !== undefined && exceeds(p, reading[p.key]!)).map((p) => p.key);
        return `breaches = [${b.join(", ")}]`;
      }
      return `${it} = ${reading[it as ParamKey] ?? "unset"}`;
    }).join("  "),
  }));
  return { reading, errors, output, ...(wqi !== undefined ? { wqi } : {}) };
}

export function suggestionsFor(prefix: string, withTemplates: boolean) {
  const p = prefix.toLowerCase();
  if (!p) return [];
  const words = [
    ...PARAMS.map((x) => ({ label: x.key, detail: x.label + (x.unit ? ` · ${x.unit}` : ""), kind: "param" as const })),
    { label: "print", detail: "Output values", kind: "keyword" as const },
    { label: "wqi", detail: "Water quality index", kind: "value" as const },
    { label: "grade", detail: "WQI classification", kind: "value" as const },
    { label: "breaches", detail: "Limit exceedances", kind: "value" as const },
    ...(withTemplates ? LIVE_TEMPLATES.map((t) => ({ label: t.abbr, detail: t.description, kind: "template" as const })) : []),
  ];
  return words.filter((w) => w.label.startsWith(p) && w.label !== p);
}
