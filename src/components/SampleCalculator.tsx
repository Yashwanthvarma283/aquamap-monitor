import { useState } from "react";
import { RotateCcw, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GradeBadge, GRADE_CLASS } from "@/components/GradeBadge";
import { PARAMS, computeWQI, gradeWQI, type ParamKey, type Reading } from "@/lib/water";

const INITIAL: Reading = { ph: 7.4, do: 6, bod: 2.5, tds: 300, turbidity: 4, nitrate: 10 };

export function SampleCalculator() {
  const [values, setValues] = useState<Record<ParamKey, string>>(() => Object.fromEntries(Object.entries(INITIAL).map(([key, value]) => [key, String(value)])) as Record<ParamKey, string>);
  const valid = PARAMS.every((p) => values[p.key].trim() !== "" && Number.isFinite(Number(values[p.key])) && Number(values[p.key]) >= 0 && (p.key !== "ph" || Number(values[p.key]) <= 14));
  const reading = Object.fromEntries(PARAMS.map((p) => [p.key, Number(values[p.key])])) as Reading;
  const wqi = valid ? computeWQI(reading) : undefined;

  return <section className="analysis-panel" aria-labelledby="calculator-title">
    <div className="section-heading"><h2 id="calculator-title"><Calculator />Sample calculator</h2><Button variant="ghost" size="icon" aria-label="Reset sample" title="Reset sample" onClick={() => setValues(Object.fromEntries(Object.entries(INITIAL).map(([key, value]) => [key, String(value)])) as Record<ParamKey, string>)}><RotateCcw /></Button></div>
    <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
      {PARAMS.map((p) => <div key={p.key} className="space-y-2"><Label htmlFor={`sample-${p.key}`} className="text-xs">{p.label}<span className="ml-1 text-muted-foreground">{p.unit}</span></Label><Input id={`sample-${p.key}`} type="number" min="0" max={p.key === "ph" ? 14 : undefined} step="0.1" value={values[p.key]} aria-invalid={values[p.key] === "" || Number(values[p.key]) < 0 || (p.key === "ph" && Number(values[p.key]) > 14)} onChange={(e) => setValues({ ...values, [p.key]: e.target.value })} /></div>)}
    </div>
    <div className="calculator-result" aria-live="polite"><div><div className="text-xs text-muted-foreground">Weighted arithmetic index</div><div className="mt-1 text-sm font-semibold">Sample WQI</div></div>{wqi !== undefined ? <div className="flex flex-wrap items-center justify-end gap-3"><strong className={`quality-value text-3xl ${GRADE_CLASS[gradeWQI(wqi)]}`}>{wqi}</strong><GradeBadge grade={gradeWQI(wqi)} /></div> : <span className="max-w-48 text-right text-xs text-destructive">Enter valid values; pH must be 0–14.</span>}</div>
  </section>;
}