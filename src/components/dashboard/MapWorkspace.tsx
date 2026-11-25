import { lazy, Suspense, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { MapPin, Search, Waves, X, Layers3, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { STATIONS, latest, computeWQI, gradeWQI, type ParamKey } from "@/lib/water";
import { GRADES, TYPES, SUMMARY } from "@/lib/analytics";
import { GradeBadge, GRADE_CLASS } from "@/components/GradeBadge";
import { ParameterSelect } from "./Controls";
import { StationDetail } from "./StationDetail";
const WaterMap = lazy(() => import("@/components/WaterMap"));
export function MapWorkspace() {
  const [selectedId, setSelectedId] = useState("S1");
  const [detailOpen, setDetailOpen] = useState(true);
  const selectStation = (id: string) => {
    setSelectedId(id);
    setDetailOpen(true);
  };
  const [colorBy, setColorBy] = useState<"wqi" | ParamKey>("wqi");
  const [type, setType] = useState("All");
  const [search, setSearch] = useState("");
  const [layer, setLayer] = useState<"streets" | "satellite">("streets");
  const station = STATIONS.find((s) => s.id === selectedId);
  const filtered = STATIONS.filter(
    (s) =>
      (type === "All" || s.type === type) &&
      `${s.id} ${s.name}`.toLowerCase().includes(search.toLowerCase()),
  );
  const selectType = (value: string) => {
    setType(value);
    const first = STATIONS.find((s) => value === "All" || s.type === value);
    if (first) setSelectedId(first.id);
  };
  return (
    <main className="explorer-page">
      <div className="page-title-row">
        <div>
          <div className="eyebrow">GEOSPATIAL OBSERVATORY</div>
          <h1>
            Chennai water explorer<span className="title-dot">.</span>
          </h1>
          <p>One city. Every water body. A clearer picture.</p>
        </div>
        <div className="study-period">
          <span className="status-dot" />
          June — November<small>6-month study window</small>
        </div>
      </div>
      <div className="explorer-summary">
        <div>
          <MapPin />
          <strong>{SUMMARY.stations}</strong>
          <span>sampling stations</span>
        </div>
        <span className="summary-divider" />
        <div>
          <Waves />
          <strong>4</strong>
          <span>water body types</span>
        </div>
        <span className="summary-divider" />
        <div>
          <Layers3 />
          <strong>{SUMMARY.readings.toLocaleString()}</strong>
          <span>parameter readings</span>
        </div>
        <span className="network-label">
          CHENNAI NETWORK
          <ArrowUpRight />
        </span>
      </div>
      <div className="explorer-grid">
        <section className="station-browser" aria-label="Station browser">
          <div className="browser-search">
            <Search />
            <Input
              placeholder="Find a station…"
              aria-label="Search map stations"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Clear map search"
                onClick={() => setSearch("")}
              >
                <X />
              </Button>
            )}
          </div>
          <div className="body-filters">
            {["All", ...TYPES].map((t) => (
              <Button
                key={t}
                variant="ghost"
                size="sm"
                className={type === t ? "selected" : ""}
                onClick={() => selectType(t)}
              >
                {t}
              </Button>
            ))}
          </div>
          <div className="browser-caption">
            STATIONS<span>{filtered.length} locations</span>
          </div>
          <div className="station-list">
            {filtered.map((s) => (
              <Button
                variant="ghost"
                className={`station-list-item ${s.id === selectedId ? "selected" : ""}`}
                key={s.id}
                onClick={() => selectStation(s.id)}
              >
                <span className="list-station-icon">
                  <Waves />
                </span>
                <span className="list-station-text">
                  <strong>{s.name.split(" – ")[0]}</strong>
                  <small>
                    {s.id} · {s.name.split(" – ")[1] ?? s.type}
                  </small>
                  <GradeBadge grade={gradeWQI(computeWQI(latest(s)))} />
                </span>
                <span
                  className={`list-score quality-value ${GRADE_CLASS[gradeWQI(computeWQI(latest(s)))]}`}
                >
                  {computeWQI(latest(s))}
                </span>
              </Button>
            ))}
            {!filtered.length && (
              <div className="empty-state">
                No matching stations
                <Button
                  variant="link"
                  onClick={() => {
                    setSearch("");
                    selectType("All");
                  }}
                >
                  Clear filters
                </Button>
              </div>
            )}
          </div>
          <div className="browser-footer">
            <span className="status-dot" />
            Approximate sampling locations
          </div>
        </section>
        <section className="map-workspace" aria-label="Chennai station map">
          <div className="map-toolbar">
            <div className="map-label">
              <MapPin />
              <span>
                Chennai<span>Tamil Nadu, India</span>
              </span>
            </div>
            <ParameterSelect
              value={colorBy}
              onChange={setColorBy}
              wqi
              label="Map colour parameter"
            />
          </div>
          <div className="premium-map">
            <ClientOnly
              fallback={
                <div className="map-loading">
                  <Waves />
                  Loading Chennai map…
                </div>
              }
            >
              <Suspense
                fallback={
                  <div className="map-loading">
                    <Waves />
                    Loading Chennai map…
                  </div>
                }
              >
                <WaterMap
                  stations={filtered}
                  selectedId={selectedId}
                  colorBy={colorBy}
                  onSelect={selectStation}
                  layer={layer}
                />
              </Suspense>
            </ClientOnly>
          </div>
          <div className="map-layers">
            <Button
              size="sm"
              variant={layer === "streets" ? "default" : "ghost"}
              onClick={() => setLayer("streets")}
            >
              <Layers3 />
              Streets
            </Button>
            <Button
              size="sm"
              variant={layer === "satellite" ? "default" : "ghost"}
              onClick={() => setLayer("satellite")}
            >
              Satellite
            </Button>
          </div>
          {detailOpen && station && (
            <div className="floating-detail">
              <Button
                variant="ghost"
                size="icon"
                className="map-detail-close"
                aria-label="Dismiss station details"
                title="Dismiss station details"
                onClick={() => setDetailOpen(false)}
              >
                <X />
              </Button>
              <StationDetail station={station} />
            </div>
          )}
          <div className="map-legend">
            {colorBy === "wqi" ? (
              GRADES.map((g) => (
                <span className={`legend-item ${GRADE_CLASS[g]}`} key={g}>
                  <span className="quality-dot" />
                  {g}
                </span>
              ))
            ) : (
              <>
                <span className="legend-item quality-excellent">
                  <span className="quality-dot" />
                  Within limit
                </span>
                <span className="legend-item quality-unsuitable">
                  <span className="quality-dot" />
                  Exceeds limit
                </span>
              </>
            )}
          </div>
        </section>
      </div>
      <p className="dataset-footnote">
        <FlaskIcon />
        Illustrative readings, not field measurements. WQI classifications are not a drinking-water
        safety assessment.
      </p>
    </main>
  );
}
function FlaskIcon() {
  return <Waves className="size-3.5" />;
}
