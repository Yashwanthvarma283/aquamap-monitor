import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, useMemo, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine, CartesianGrid } from "recharts";
import { Droplets, MapPin, AlertTriangle, Activity, FlaskConical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  STATIONS, PARAMS, computeWQI, gradeWQI, GRADE_VAR, latest, exceeds, type ParamKey, type Reading, type Grade,
} from "@/lib/water";

const WaterMap = lazy(() => import("@/components/WaterMap"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AquaMap – GIS Water Quality Mapping & Monitoring" },
      { name: "description", content: "Map sampling stations, compute the Water Quality Index and track pH, DO, BOD, TDS, turbidity and nitrate trends." },
      { property: "og:title", content: "AquaMap – GIS Water Quality Monitoring" },
      { property: "og:description", content: "Interactive GIS dashboard for water quality mapping and WQI monitoring." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const GRADES: Grade[] = ["Excellent", "Good", "Poor", "Very Poor", "Unsuitable"];

function GradeBadge({ grade }: { grade: Grade }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: GRADE_VAR[grade] }} />
      {grade}
    </span>
  );
}

function Index() {
  const [selectedId, setSelectedId] = useState(STATIONS[0]!.id);
  const [colorBy, setColorBy] = useState<"wqi" | ParamKey>("wqi");
  const [trendParam, setTrendParam] = useState<ParamKey>("bod");
  const station = STATIONS.find((s) => s.id === selectedId)!;
  const r = latest(station);
  const wqi = computeWQI(r);

  const stats = useMemo(() => {
    const w = STATIONS.map((s) => computeWQI(latest(s)));
    const alerts = STATIONS.reduce((n, s) => n + PARAMS.filter((p) => exceeds(p, latest(s)[p.key])).length, 0);
    return { avg: Math.round((w.reduce((a, b) => a + b, 0) / w.length) * 10) / 10, alerts, unsafe: w.filter((x) => x > 75).length };
  }, []);

  const trendP = PARAMS.find((p) => p.key === trendParam)!;
  const trend = station.history.map((h) => ({ month: h.month, value: h.reading[trendParam], wqi: computeWQI(h.reading) }));

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-hero text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 py-10 md:py-14">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest opacity-80">
            <Droplets className="h-4 w-4" /> AquaMap
          </div>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold md:text-5xl">GIS-Based Water Quality Mapping &amp; Monitoring</h1>
          <p className="mt-3 max-w-2xl text-sm opacity-85 md:text-base">
            Spatial view of sampling stations across Kolkata's water bodies, scored with the Weighted Arithmetic Water Quality Index.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { icon: MapPin, label: "Stations", value: STATIONS.length },
              { icon: Activity, label: "Average WQI", value: stats.avg },
              { icon: AlertTriangle, label: "Limit breaches", value: stats.alerts },
              { icon: FlaskConical, label: "Unsafe sites", value: stats.unsafe },
            ].map((k) => (
              <div key={k.label} className="rounded-xl bg-primary-foreground/10 p-4 backdrop-blur">
                <k.icon className="h-4 w-4 opacity-80" />
                <div className="mt-2 font-display text-2xl font-bold">{k.value}</div>
                <div className="text-xs opacity-80">{k.label}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8">
        <p className="rounded-lg border border-dashed bg-muted px-4 py-2 text-xs text-muted-foreground">
          Note: station readings are illustrative sample data for demonstration — replace with your field measurements.
        </p>

        <section className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <Card className="overflow-hidden shadow-soft">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
              <CardTitle>Station map</CardTitle>
              <Select value={colorBy} onValueChange={(v) => setColorBy(v as typeof colorBy)}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="wqi">Colour by WQI</SelectItem>
                  {PARAMS.map((p) => <SelectItem key={p.key} value={p.key}>Colour by {p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[420px] md:h-[520px]">
                <ClientOnly fallback={<div className="h-full animate-pulse bg-muted" />}>
                  <Suspense fallback={<div className="h-full animate-pulse bg-muted" />}>
                    <WaterMap stations={STATIONS} selectedId={selectedId} colorBy={colorBy} onSelect={setSelectedId} />
                  </Suspense>
                </ClientOnly>
              </div>
              <div className="flex flex-wrap gap-2 border-t p-3">
                {colorBy === "wqi"
                  ? GRADES.map((g) => <GradeBadge key={g} grade={g} />)
                  : (<><GradeBadge grade="Excellent" /><span className="text-xs self-center">within limit</span><GradeBadge grade="Unsuitable" /><span className="text-xs self-center">exceeds limit</span></>)}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="space-y-2">
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATIONS.map((s) => <SelectItem key={s.id} value={s.id}>{s.id} · {s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex items-end justify-between pt-2">
                <div>
                  <Badge variant="secondary">{station.type}</Badge>
                  <div className="mt-1 text-xs text-muted-foreground">{station.lat.toFixed(4)}°N, {station.lng.toFixed(4)}°E</div>
                </div>
                <div className="text-right">
                  <div className="font-display text-4xl font-bold" style={{ color: GRADE_VAR[gradeWQI(wqi)] }}>{wqi}</div>
                  <GradeBadge grade={gradeWQI(wqi)} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {PARAMS.map((p) => {
                const v = r[p.key];
                const bad = exceeds(p, v);
                const pct = Math.min(100, (v / (p.standard * (p.higherIsBetter ? 2 : 1.5))) * 100);
                return (
                  <div key={p.key}>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{p.label}</span>
                      <span className={bad ? "font-semibold text-destructive" : "text-muted-foreground"}>
                        {v} {p.unit} <span className="text-xs">/ {p.key === "ph" ? "6.5–8.5" : `${p.higherIsBetter ? "≥" : "≤"}${p.standard}`}</span>
                      </span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: bad ? "var(--wq-unsuitable)" : "var(--wq-excellent)" }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
              <CardTitle>Monthly trend · {station.id}</CardTitle>
              <Select value={trendParam} onValueChange={(v) => setTrendParam(v as ParamKey)}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>{PARAMS.map((p) => <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>)}</SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ left: -16, right: 8 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <ReferenceLine y={trendP.standard} stroke="var(--destructive)" strokeDasharray="4 4" label={{ value: "Limit", fontSize: 11, fill: "var(--destructive)" }} />
                  <Line type="monotone" dataKey="value" name={trendP.label} stroke="var(--chart-1)" strokeWidth={3} dot />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Calculator />
        </section>

        <Card className="shadow-soft">
          <CardHeader><CardTitle>All stations</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr><th className="py-2 pr-3">Station</th>{PARAMS.map((p) => <th key={p.key} className="px-2">{p.label}</th>)}<th className="px-2">WQI</th></tr>
              </thead>
              <tbody>
                {STATIONS.map((s) => {
                  const lr = latest(s); const w = computeWQI(lr);
                  return (
                    <tr key={s.id} onClick={() => setSelectedId(s.id)} className="cursor-pointer border-t hover:bg-muted">
                      <td className="py-2 pr-3 font-medium whitespace-nowrap">{s.name}</td>
                      {PARAMS.map((p) => <td key={p.key} className={`px-2 ${exceeds(p, lr[p.key]) ? "font-semibold text-destructive" : ""}`}>{lr[p.key]}</td>)}
                      <td className="px-2 whitespace-nowrap"><span className="font-bold">{w}</span> <GradeBadge grade={gradeWQI(w)} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader><CardTitle>Methodology</CardTitle></CardHeader>
          <CardContent className="grid gap-4 text-sm text-muted-foreground md:grid-cols-3">
            <div><h3 className="mb-1 font-semibold text-foreground">1 · Sub-index</h3>Qᵢ = 100 × (Vᵢ − V₀) / (Sᵢ − V₀), where Vᵢ is measured value, Sᵢ the BIS/WHO limit and V₀ the ideal (7 for pH, 14.6 mg/L for DO, 0 otherwise).</div>
            <div><h3 className="mb-1 font-semibold text-foreground">2 · Weighting</h3>Unit weight Wᵢ = 1 / Sᵢ, so stricter parameters carry more influence. WQI = Σ(WᵢQᵢ) / ΣWᵢ.</div>
            <div><h3 className="mb-1 font-semibold text-foreground">3 · Classification</h3>0–25 Excellent · 26–50 Good · 51–75 Poor · 76–100 Very Poor · &gt;100 Unsuitable for drinking.</div>
          </CardContent>
        </Card>
      </main>
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">AquaMap · Biology Capstone Project · Map data © OpenStreetMap contributors</footer>
    </div>
  );
}

function Calculator() {
  const [v, setV] = useState<Reading>({ ph: 7.4, do: 6, bod: 2.5, tds: 300, turbidity: 4, nitrate: 10 });
  const w = computeWQI(v);
  return (
    <Card className="shadow-soft">
      <CardHeader><CardTitle>WQI calculator — enter a new sample</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {PARAMS.map((p) => (
            <div key={p.key} className="space-y-1">
              <Label htmlFor={p.key} className="text-xs">{p.label} {p.unit && `(${p.unit})`}</Label>
              <Input id={p.key} type="number" step="0.1" value={v[p.key]}
                onChange={(e) => setV({ ...v, [p.key]: Number(e.target.value) })} />
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between rounded-xl bg-muted p-4">
          <span className="text-sm font-medium">Computed WQI</span>
          <div className="flex items-center gap-3">
            <span className="font-display text-3xl font-bold" style={{ color: GRADE_VAR[gradeWQI(w)] }}>{w}</span>
            <GradeBadge grade={gradeWQI(w)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
