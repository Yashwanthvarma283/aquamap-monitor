import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, useMemo, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine, CartesianGrid } from "recharts";
import { Droplets, MapPin, AlertTriangle, Activity, FlaskConical, Search, ArrowUpRight, Waves, ChartNoAxesCombined, BookOpen, ChevronDown, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GradeBadge, GRADE_CLASS } from "@/components/GradeBadge";
import { SampleCalculator } from "@/components/SampleCalculator";
import { STATIONS, PARAMS, computeWQI, gradeWQI, latest, exceeds, type ParamKey, type Grade } from "@/lib/water";

const WaterMap = lazy(() => import("@/components/WaterMap"));
export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "AquaMap | Chennai Water Quality Observatory" },
    { name: "description", content: "Explore Chennai sampling stations, compare water quality readings, inspect monthly trends and calculate the Weighted Arithmetic Water Quality Index." },
    { property: "og:title", content: "AquaMap | Chennai Water Quality Observatory" },
    { property: "og:description", content: "An interactive water quality observatory for Chennai's rivers, lakes, ponds and groundwater." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Index,
});
const GRADES: Grade[] = ["Excellent", "Good", "Poor", "Very Poor", "Unsuitable"];

function Index() {
  const [selectedId, setSelectedId] = useState("S1");
  const [colorBy, setColorBy] = useState<"wqi" | ParamKey>("wqi");
  const [trendParam, setTrendParam] = useState<ParamKey>("bod");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [methodOpen, setMethodOpen] = useState(false);
  const station = STATIONS.find((s) => s.id === selectedId);
  const trendP = PARAMS.find((p) => p.key === trendParam);
  const stats = useMemo(() => {
    const scores = STATIONS.map((s) => computeWQI(latest(s)));
    return { avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10, alerts: STATIONS.reduce((n, s) => n + PARAMS.filter((p) => exceeds(p, latest(s)[p.key])).length, 0), unsafe: scores.filter((w) => w > 75).length };
  }, []);
  if (!station || !trendP) return null;
  const r = latest(station);
  const wqi = computeWQI(r);
  const grade = gradeWQI(wqi);
  const breaches = PARAMS.filter((p) => exceeds(p, r[p.key])).length;
  const trend = station.history.map((h) => ({ month: h.month, value: h.reading[trendParam] }));
  const filtered = STATIONS.filter((s) => (type === "all" || s.type === type) && `${s.name} ${s.id}`.toLowerCase().includes(search.toLowerCase()));
  const selectStation = (id: string, scroll = false) => {
    setSelectedId(id);
    if (scroll) document.getElementById("observatory")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
  };
  return <div className="min-h-screen bg-background">
    <header className="app-header">
      <div className="page-container flex flex-wrap items-center justify-between gap-4 py-4">
        <a href="#" className="brand" aria-label="AquaMap home"><span className="brand-symbol"><Droplets /></span><span>AquaMap<span className="brand-subtitle">WATER QUALITY OBSERVATORY</span></span></a>
        <nav className="flex items-center gap-1" aria-label="Dashboard navigation"><Button asChild variant="ghost" size="sm"><a href="#observatory"><MapPin />Overview</a></Button><Button asChild variant="ghost" size="sm"><a href="#stations"><Waves />Stations</a></Button><Button asChild variant="ghost" size="sm"><a href="#analysis"><ChartNoAxesCombined />Analysis</a></Button></nav>
      </div>
    </header>
    <main className="page-container pb-10">
      <div className="page-intro"><div><div className="eyebrow"><span className="status-dot" />CHENNAI · TAMIL NADU</div><h1>Water quality, in perspective.</h1><p className="mt-2 text-sm text-muted-foreground">GIS-based mapping &amp; monitoring of Chennai’s water bodies</p></div><div className="sample-stamp"><FlaskConical className="size-4" /><span>Capstone study<span className="block text-xs text-muted-foreground">June – November · Sample dataset</span></span></div></div>
      <div className="stats-strip">
        {[{ icon: MapPin, label: "Sampling stations", value: STATIONS.length, note: "Across 4 water body types", tone: "primary" }, { icon: Activity, label: "Average WQI", value: stats.avg, note: "Weighted arithmetic index", tone: "primary" }, { icon: AlertTriangle, label: "Parameter breaches", value: stats.alerts, note: "Across all latest samples", tone: "warning" }, { icon: FlaskConical, label: "Sites with WQI > 75", value: stats.unsafe, note: "Very poor or unsuitable", tone: "danger" }].map((item) => <div className="stat-item" key={item.label}><div className="flex items-center justify-between gap-3"><span className="text-xs font-medium text-muted-foreground">{item.label}</span><item.icon className={`stat-icon ${item.tone}`} /></div><div className="stat-value">{item.value}</div><div className="text-xs text-muted-foreground">{item.note}</div></div>)}
      </div>
      <div className="sample-notice"><FlaskConical className="size-4 shrink-0" /><span>Illustrative readings & approximate Chennai locations — not field measurements or a drinking-water safety assessment.</span></div>
      <section id="observatory" className="observatory-section">
        <div className="map-panel">
          <div className="section-heading"><div><h2><MapPin />Station map</h2><p className="section-subtitle">Chennai &amp; surrounding water bodies</p></div><Select value={colorBy} onValueChange={(v) => setColorBy(v as typeof colorBy)}><SelectTrigger aria-label="Map colour parameter" className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="wqi">Water quality index</SelectItem>{PARAMS.map((p) => <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="map-canvas"><ClientOnly fallback={<div className="map-loading"><Waves className="size-8 animate-pulse" /><span>Loading station map…</span></div>}><Suspense fallback={<div className="map-loading"><Waves className="size-8 animate-pulse" /><span>Loading station map…</span></div>}><WaterMap stations={STATIONS} selectedId={selectedId} colorBy={colorBy} onSelect={setSelectedId} /></Suspense></ClientOnly></div>
          <div className="map-legend">{colorBy === "wqi" ? GRADES.map((g) => <span key={g} className={`legend-item ${GRADE_CLASS[g]}`}><span className="quality-dot" />{g}</span>) : <><span className="legend-item quality-excellent"><span className="quality-dot" />Within limit</span><span className="legend-item quality-unsuitable"><span className="quality-dot" />Exceeds limit</span></>}<span className="ml-auto text-xs text-muted-foreground">{STATIONS.length} stations</span></div>
        </div>
        <aside className="station-detail" aria-label="Selected station details">
          <div className="flex items-center justify-between gap-2"><span className="eyebrow">STATION DETAILS</span><span className="station-id">{station.id}</span></div>
          <Select value={selectedId} onValueChange={setSelectedId}><SelectTrigger aria-label="Selected station" className="mt-4 w-full"><SelectValue /></SelectTrigger><SelectContent>{STATIONS.map((s) => <SelectItem key={s.id} value={s.id}>{s.id} · {s.name}</SelectItem>)}</SelectContent></Select>
          <h2 className="mt-4 text-lg font-semibold leading-snug">{station.name}</h2><div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span className="water-type">{station.type}</span><span>{station.lat.toFixed(4)}°N, {station.lng.toFixed(4)}°E</span></div>
          <div className="station-score"><div><span className="text-xs text-muted-foreground">Water quality index</span><div className={`quality-value score-number ${GRADE_CLASS[grade]}`}>{wqi}</div></div><div className="text-right"><GradeBadge grade={grade} /><div className="mt-2 text-xs text-muted-foreground">Latest sample · November</div></div></div>
          <div className="mb-4 flex items-center justify-between"><h3 className="text-xs font-semibold uppercase">Parameters</h3><span className={breaches ? "text-xs text-destructive" : "text-xs text-primary"}>{breaches} limit {breaches === 1 ? "breach" : "breaches"}</span></div>
          <div className="space-y-4">{PARAMS.map((p) => { const value = r[p.key]; const bad = exceeds(p, value); const pct = Math.min(100, value / (p.standard * (p.higherIsBetter ? 2 : 1.5)) * 100); return <div key={p.key}><div className="flex items-center justify-between gap-2 text-xs"><span className="font-medium">{p.label}</span><span className={`flex items-center gap-1 ${bad ? "font-semibold text-destructive" : "text-foreground"}`}>{value}<span className="font-normal text-muted-foreground">{p.unit}</span>{bad ? <AlertTriangle className="size-3" /> : <Check className="size-3 text-primary" />}</span></div><div className="parameter-track"><div className={bad ? "parameter-fill breached" : "parameter-fill"} style={{ width: `${pct}%` }} /></div><div className="mt-1 text-[10px] text-muted-foreground">Limit: {p.key === "ph" ? "6.5–8.5" : `${p.higherIsBetter ? "≥" : "≤"} ${p.standard} ${p.unit}`}</div></div>; })}</div>
        </aside>
      </section>
      <section id="analysis" className="analysis-grid">
        <div className="analysis-panel"><div className="section-heading"><div><h2><ChartNoAxesCombined />Monthly trend</h2><p className="section-subtitle">{station.name}</p></div><Select value={trendParam} onValueChange={(v) => setTrendParam(v as ParamKey)}><SelectTrigger aria-label="Trend parameter" className="w-36"><SelectValue /></SelectTrigger><SelectContent>{PARAMS.map((p) => <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>)}</SelectContent></Select></div><div className="mb-2 flex flex-wrap gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-2"><span className="chart-key" />{trendP.label} {trendP.unit && `(${trendP.unit})`}</span><span className="flex items-center gap-2"><span className="limit-key" />{trendP.key === "ph" ? "Permissible range: 6.5–8.5" : `Limit: ${trendP.higherIsBetter ? "≥" : "≤"} ${trendP.standard} ${trendP.unit}`}</span></div><div className="h-56"><ResponsiveContainer width="100%" height="100%"><LineChart data={trend} margin={{ top: 20, left: -18, right: 18, bottom: 0 }}><CartesianGrid stroke="var(--border)" strokeDasharray="3 5" vertical={false} /><XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickMargin={12} /><YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} domain={trendParam === "ph" ? [6, 9] : [0, (max: number) => Math.ceil(Math.max(max, trendP.standard) * 1.15)]} /><Tooltip contentStyle={{ background: "var(--popover)", color: "var(--popover-foreground)", border: "1px solid var(--border)", borderRadius: 6 }} formatter={(value: number) => [`${value} ${trendP.unit}`, trendP.label]} /><ReferenceLine y={trendP.standard} stroke="var(--destructive)" strokeDasharray="4 4" />{trendParam === "ph" && <ReferenceLine y={6.5} stroke="var(--destructive)" strokeDasharray="4 4" />}<Line type="monotone" dataKey="value" name={trendP.label} stroke="var(--chart-1)" strokeWidth={2.5} dot={{ r: 4, fill: "var(--card)", strokeWidth: 2 }} activeDot={{ r: 6 }} isAnimationActive={false} /></LineChart></ResponsiveContainer></div></div>
        <SampleCalculator />
      </section>
      <section id="stations" className="station-table-section"><div className="section-heading"><div><h2><Waves />All stations<span className="count-label">{filtered.length}</span></h2><p className="section-subtitle">Latest sample readings · November</p></div><div className="flex w-full flex-wrap gap-2 sm:w-auto"><div className="search-field"><Search className="size-4" /><Input aria-label="Search stations" placeholder="Search stations…" value={search} onChange={(e) => setSearch(e.target.value)} />{search && <Button aria-label="Clear station search" title="Clear search" size="icon" variant="ghost" className="absolute right-1 top-0 h-9 w-7" onClick={() => setSearch("")}><X /></Button>}</div><Select value={type} onValueChange={setType}><SelectTrigger aria-label="Water body type" className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All water bodies</SelectItem>{["River", "Lake", "Pond", "Groundwater"].map((t) => <SelectItem value={t} key={t}>{t}</SelectItem>)}</SelectContent></Select></div></div><div className="overflow-x-auto"><table className="station-table"><thead><tr><th>Station / water body</th>{PARAMS.map((p) => <th key={p.key}>{p.label}<span className="block font-normal text-muted-foreground">{p.unit || "—"}</span></th>)}<th>WQI / classification</th><th><span className="sr-only">View station</span></th></tr></thead><tbody>{filtered.map((s) => { const reading = latest(s); const score = computeWQI(reading); return <tr key={s.id} className={s.id === selectedId ? "selected-row" : ""}><td><Button variant="link" className="h-auto max-w-72 justify-start whitespace-normal p-0 text-left font-semibold text-foreground" onClick={() => selectStation(s.id, true)}>{s.name}</Button><div className="mt-1 text-xs text-muted-foreground">{s.id} · {s.type}</div></td>{PARAMS.map((p) => <td key={p.key} className={exceeds(p, reading[p.key]) ? "font-semibold text-destructive" : ""}>{reading[p.key]}</td>)}<td><div className="flex items-center gap-3 whitespace-nowrap"><strong>{score}</strong><GradeBadge grade={gradeWQI(score)} /></div></td><td><Button variant="ghost" size="icon" aria-label={`View ${s.name}`} title={`View ${s.name}`} onClick={() => selectStation(s.id, true)}><ArrowUpRight /></Button></td></tr>; })}</tbody></table>{filtered.length === 0 && <div className="empty-state"><Search className="mx-auto mb-3 size-6" /><p className="font-semibold">No matching stations</p><Button variant="link" onClick={() => { setSearch(""); setType("all"); }}>Clear filters</Button></div>}</div></section>
      <section className="methodology"><Button variant="ghost" className="flex h-auto w-full justify-between whitespace-normal px-0 py-5 text-left" aria-expanded={methodOpen} aria-controls="method-details" onClick={() => setMethodOpen(!methodOpen)}><span className="flex items-center gap-2 font-semibold"><BookOpen className="size-4" />Methodology &amp; classification</span><ChevronDown className={methodOpen ? "rotate-180" : ""} /></Button>{methodOpen && <div id="method-details" className="grid gap-6 pb-6 text-sm leading-relaxed text-muted-foreground md:grid-cols-3"><div><h3 className="mb-2 font-semibold text-foreground">01 · Sub-index</h3>Qᵢ = 100 × |(Vᵢ − V₀) / (Sᵢ − V₀)|. Vᵢ is the measurement; Sᵢ the parameter limit; V₀ the ideal (7 for pH, 14.6 mg/L for DO, 0 otherwise).</div><div><h3 className="mb-2 font-semibold text-foreground">02 · Weighting</h3>Unit weight Wᵢ = 1 / Sᵢ. WQI = Σ(WᵢQᵢ) / ΣWᵢ. Parameters with stricter limits carry greater influence.</div><div><h3 className="mb-2 font-semibold text-foreground">03 · Classification</h3>≤25 Excellent · &gt;25–50 Good · &gt;50–75 Poor · &gt;75–100 Very Poor · &gt;100 Unsuitable. This index is not a substitute for a full safety assessment.</div></div>}</section>
    </main><footer className="app-footer"><div className="page-container flex flex-wrap items-center justify-between gap-3 py-5"><span className="flex items-center gap-2 font-semibold"><Droplets className="size-4" />AquaMap<span className="font-normal">· Biology Capstone Project</span></span><span>Map data © OpenStreetMap contributors</span></div></footer>
  </div>;
}
