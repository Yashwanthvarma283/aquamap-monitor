import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  Activity,
  ChartNoAxesCombined,
  AlertTriangle,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GradeBadge, GRADE_CLASS } from "@/components/GradeBadge";
import { STATIONS, PARAMS, computeWQI, gradeWQI, latest, type ParamKey } from "@/lib/water";
import {
  SUMMARY,
  TYPES,
  monthlyAverages,
  summarize,
  stationChange,
  breachRows,
  contributions,
} from "@/lib/analytics";
import { ParameterSelect, StationSelect } from "./Controls";
const tooltipStyle = {
  background: "var(--popover)",
  color: "var(--popover-foreground)",
  border: "1px solid var(--border)",
  borderRadius: 6,
};
export function Metric({
  label,
  value,
  note,
  icon: Icon = Activity,
}: {
  label: string;
  value: string | number;
  note: string;
  icon?: typeof Activity;
}) {
  return (
    <div className="analytics-metric">
      <div>
        <span>{label}</span>
        <Icon />
      </div>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}
export function AnalyticsOverview() {
  const best = [...STATIONS].sort((a, b) => computeWQI(latest(a)) - computeWQI(latest(b)))[0];
  const ranked = [...STATIONS]
    .sort((a, b) => computeWQI(latest(b)) - computeWQI(latest(a)))
    .slice(0, 5);
  return (
    <>
      <div className="analytics-metrics">
        <Metric
          label="Network average WQI"
          value={SUMMARY.average}
          note="November · all 16 stations"
        />
        <Metric
          label="Improving stations"
          value={`${SUMMARY.improving} / ${SUMMARY.stations}`}
          note="Lower WQI than June"
          icon={ArrowDownRight}
        />
        <Metric
          label="Parameter breaches"
          value={SUMMARY.breaches}
          note="Of 96 latest parameter readings"
          icon={AlertTriangle}
        />
        <Metric
          label="Sample coverage"
          value={SUMMARY.samples}
          note="6 monthly samples per station"
          icon={ChartNoAxesCombined}
        />
      </div>
      <div className="analytics-two-col">
        <section className="chart-section">
          <div className="section-heading">
            <div>
              <h2>Quality distribution</h2>
              <p className="section-subtitle">Latest station classifications</p>
            </div>
            <span className="quiet-label">NOVEMBER</span>
          </div>
          <div className="distribution-total">
            <strong>{SUMMARY.stations}</strong>
            <span>stations assessed</span>
          </div>
          <div className="distribution-bar">
            {SUMMARY.distribution
              .filter((d) => d.count)
              .map((d) => (
                <div
                  key={d.grade}
                  className={GRADE_CLASS[d.grade]}
                  style={{ flex: d.count }}
                  title={`${d.grade}: ${d.count}`}
                />
              ))}
          </div>
          <div className="distribution-list">
            {SUMMARY.distribution.map((d) => (
              <div key={d.grade}>
                <span className={`legend-item ${GRADE_CLASS[d.grade]}`}>
                  <span className="quality-dot" />
                  {d.grade}
                </span>
                <strong>
                  {d.count}
                  <small>{Math.round((d.count / SUMMARY.stations) * 100)}%</small>
                </strong>
              </div>
            ))}
          </div>
        </section>
        <section className="chart-section">
          <div className="section-heading">
            <div>
              <h2>Network trajectory</h2>
              <p className="section-subtitle">Monthly mean WQI · all stations</p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/analytics/trends">
                Explore
                <ArrowUpRight />
              </Link>
            </Button>
          </div>
          <div className="chart-height">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monthlyAverages(STATIONS)}
                margin={{ top: 15, right: 20, left: -15, bottom: 5 }}
              >
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 5" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Area
                  dataKey="value"
                  name="Average WQI"
                  type="monotone"
                  stroke="var(--chart-1)"
                  fill="var(--secondary)"
                  strokeWidth={3}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
      <section className="priority-section">
        <div className="section-heading">
          <div>
            <h2>Priority watchlist</h2>
            <p className="section-subtitle">Highest WQI stations in the sample network</p>
          </div>
          <span className="quiet-label">RANKED BY WQI</span>
        </div>
        <div className="priority-list">
          {ranked.map((s, i) => (
            <div className="priority-item" key={s.id}>
              <span className="rank-number">0{i + 1}</span>
              <div>
                <strong>{s.name}</strong>
                <small>
                  {s.id} · {s.type}
                </small>
              </div>
              <GradeBadge grade={gradeWQI(computeWQI(latest(s)))} />
              <strong>{computeWQI(latest(s))}</strong>
            </div>
          ))}
        </div>
        {best && (
          <div className="insight-line">
            <span className="quality-dot quality-excellent" />
            <strong>Lowest network WQI</strong>
            <span>
              {best.name} · {computeWQI(latest(best))}
            </span>
          </div>
        )}
      </section>
    </>
  );
}
export function TrendsView() {
  const [id, setId] = useState("S1"),
    [parameter, setParameter] = useState<"wqi" | ParamKey>("wqi");
  const station = STATIONS.find((s) => s.id === id);
  if (!station) return null;
  const p = PARAMS.find((p) => p.key === parameter);
  const data = station.history.map((h) => ({
    month: h.month,
    value: parameter === "wqi" ? computeWQI(h.reading) : h.reading[parameter],
  }));
  const last = data.at(-1)?.value ?? 0,
    first = data[0]?.value ?? 0;
  return (
    <>
      <div className="view-controls">
        <StationSelect value={id} onChange={setId} />
        <ParameterSelect value={parameter} onChange={setParameter} wqi />
      </div>
      <div className="analytics-metrics three">
        <Metric
          label="Latest reading"
          value={last}
          note={`${p?.unit || "WQI points"} · November`}
        />
        <Metric label="June baseline" value={first} note="First sample in the study" />
        <Metric
          label="Net change"
          value={`${last - first > 0 ? "+" : ""}${Math.round((last - first) * 100) / 100}`}
          note={
            parameter === "wqi"
              ? last < first
                ? "Improved from June"
                : "Higher index than June"
              : "November minus June"
          }
        />
      </div>
      <section className="chart-section full-chart">
        <div className="section-heading">
          <div>
            <h2>{station.name}</h2>
            <p className="section-subtitle">
              {p?.label ?? "Water quality index"}
              {p?.unit ? ` (${p.unit})` : ""} · June–November
            </p>
          </div>
          <GradeBadge grade={gradeWQI(computeWQI(latest(station)))} />
        </div>
        <div className="chart-height large">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 25, left: 0, bottom: 10 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 5" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                domain={parameter === "ph" ? [6, 9] : [0, "auto"]}
              />
              <Tooltip contentStyle={tooltipStyle} />
              {p && (
                <ReferenceLine
                  y={p.standard}
                  stroke="var(--destructive)"
                  strokeDasharray="4 4"
                  label={{ value: "Limit", fill: "var(--destructive)", fontSize: 11 }}
                />
              )}
              {parameter === "ph" && (
                <ReferenceLine y={6.5} stroke="var(--destructive)" strokeDasharray="4 4" />
              )}
              <Line
                dataKey="value"
                name={p?.label ?? "WQI"}
                type="monotone"
                stroke="var(--chart-1)"
                strokeWidth={3}
                dot={{ r: 5, fill: "var(--card)", strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="sample-history">
        <h2>Sample history</h2>
        <div className="history-grid">
          {data.map((h) => (
            <div key={h.month}>
              <small>{h.month}</small>
              <strong>{h.value}</strong>
              <span>{p?.unit || "WQI"}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
export function ComparisonView() {
  const [parameter, setParameter] = useState<"wqi" | ParamKey>("wqi");
  const p = PARAMS.find((p) => p.key === parameter);
  const groups = TYPES.map((type) => {
    const stations = STATIONS.filter((s) => s.type === type);
    return {
      type,
      count: stations.length,
      value:
        parameter === "wqi"
          ? summarize(stations).average
          : Math.round(
              (stations.reduce((n, s) => n + latest(s)[parameter], 0) / stations.length) * 100,
            ) / 100,
    };
  });
  const [id, setId] = useState("S1");
  const station = STATIONS.find((s) => s.id === id);
  return (
    <>
      <div className="view-controls">
        <span className="text-sm text-muted-foreground">Compare water body types</span>
        <ParameterSelect value={parameter} onChange={setParameter} wqi />
      </div>
      <section className="chart-section full-chart">
        <div className="section-heading">
          <div>
            <h2>Water body comparison</h2>
            <p className="section-subtitle">
              Mean {p?.label ?? "WQI"} · November{p?.unit ? ` · ${p.unit}` : ""}
            </p>
          </div>
        </div>
        <div className="chart-height large">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={groups} margin={{ top: 15, left: -10, right: 15 }}>
              <CartesianGrid stroke="var(--border)" vertical={false} strokeDasharray="3 5" />
              <XAxis
                dataKey="type"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              />
              <Tooltip contentStyle={tooltipStyle} />
              {p && (
                <ReferenceLine y={p.standard} stroke="var(--destructive)" strokeDasharray="4 4" />
              )}
              <Bar
                dataKey="value"
                name={p?.label ?? "Mean WQI"}
                radius={[5, 5, 0, 0]}
                maxBarSize={100}
                isAnimationActive={false}
              >
                {groups.map((g, i) => (
                  <Cell key={g.type} fill={`var(--chart-${i + 1})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="group-totals">
          {groups.map((g) => (
            <div key={g.type}>
              <strong>{g.type}</strong>
              <span>
                {g.count} stations · {g.value} {p?.unit ?? "WQI"}
              </span>
            </div>
          ))}
        </div>
      </section>
      <section className="contribution-section">
        <div className="section-heading">
          <div>
            <h2>What drives the index?</h2>
            <p className="section-subtitle">Weighted contribution to latest WQI · points</p>
          </div>
          <StationSelect value={id} onChange={setId} />
        </div>
        {station && (
          <div className="contribution-grid">
            {contributions(station).map((c) => (
              <div key={c.label}>
                <span>{c.label}</span>
                <strong>{c.value}</strong>
                <div className="parameter-track">
                  <div
                    className="parameter-fill"
                    style={{
                      width: `${Math.min(100, (c.value / computeWQI(latest(station))) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
export function BreachesView() {
  const [parameter, setParameter] = useState("all");
  const all = breachRows(STATIONS),
    rows = all.filter((r) => parameter === "all" || r.parameter.key === parameter);
  const download = () => {
    const csv = [
      "Station,Parameter,Value,Unit,Limit",
      ...rows.map(
        (r) =>
          `"${r.station.name}",${r.parameter.label},${r.value},${r.parameter.unit},${r.parameter.key === "ph" ? "6.5–8.5" : `${r.parameter.higherIsBetter ? ">=" : "<="} ${r.parameter.standard}`}`,
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "AquaMap-November-Sample-Breaches.csv";
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <>
      <div className="breach-parameter-tabs">
        <Button
          variant="ghost"
          className={parameter === "all" ? "selected" : ""}
          onClick={() => setParameter("all")}
        >
          All parameters <span>{all.length}</span>
        </Button>
        {PARAMS.map((p) => (
          <Button
            key={p.key}
            variant="ghost"
            className={parameter === p.key ? "selected" : ""}
            onClick={() => setParameter(p.key)}
          >
            {p.label}
            <span>{all.filter((r) => r.parameter.key === p.key).length}</span>
          </Button>
        ))}
      </div>
      <div className="section-heading mt-7">
        <div>
          <h2>
            Limit exceedances <span className="count-label">{rows.length}</span>
          </h2>
          <p className="section-subtitle">November sample readings · study reference limits</p>
        </div>
        <Button variant="outline" size="sm" onClick={download}>
          <Download />
          Export CSV
        </Button>
      </div>
      <div className="table-scroll">
        <table className="station-table">
          <thead>
            <tr>
              <th>Station</th>
              <th>Parameter</th>
              <th>Measured</th>
              <th>Study limit</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={`${r.station.id}-${r.parameter.key}`}>
                <td>
                  <strong>{r.station.name}</strong>
                  <small className="block text-muted-foreground mt-1">
                    {r.station.id} · {r.station.type}
                  </small>
                </td>
                <td>{r.parameter.label}</td>
                <td className="text-destructive font-semibold">
                  {r.value} {r.parameter.unit}
                </td>
                <td>
                  {r.parameter.key === "ph"
                    ? "6.5–8.5"
                    : `${r.parameter.higherIsBetter ? "≥" : "≤"} ${r.parameter.standard} ${r.parameter.unit}`}
                </td>
                <td>
                  <span className="breach-status">
                    <AlertTriangle />
                    Outside limit
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <div className="empty-state">No breaches for this parameter</div>}
      </div>
    </>
  );
}
