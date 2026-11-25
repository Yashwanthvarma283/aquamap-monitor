import { useState } from "react";
import { Search, Download, ArrowDownRight, ArrowUpRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GradeBadge } from "@/components/GradeBadge";
import { STATIONS, PARAMS, latest, exceeds, computeWQI, gradeWQI } from "@/lib/water";
import { TYPES, stationChange } from "@/lib/analytics";
import { StationDetail } from "./StationDetail";
export function StationDirectory() {
  const [search, setSearch] = useState(""),
    [type, setType] = useState("all"),
    [sort, setSort] = useState("id"),
    [selected, setSelected] = useState<string | null>(null);
  const filtered = STATIONS.filter(
    (s) =>
      (type === "all" || s.type === type) &&
      `${s.name} ${s.id}`.toLowerCase().includes(search.toLowerCase()),
  ).sort((a, b) =>
    sort === "wqi"
      ? computeWQI(latest(b)) - computeWQI(latest(a))
      : sort === "name"
        ? a.name.localeCompare(b.name)
        : Number(a.id.slice(1)) - Number(b.id.slice(1)),
  );
  const station = STATIONS.find((s) => s.id === selected);
  const download = () => {
    const csv = [
      "Station,Type,Latitude,Longitude," +
        PARAMS.map((p) => p.label).join(",") +
        ",WQI,Classification",
      ...filtered.map(
        (s) =>
          `"${s.name}",${s.type},${s.lat},${s.lng},${PARAMS.map((p) => latest(s)[p.key]).join(",")},${computeWQI(latest(s))},${gradeWQI(computeWQI(latest(s)))}`,
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "AquaMap-Chennai-Sample-Stations.csv";
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <main className="content-page">
      <div className="page-title-row">
        <div>
          <div className="eyebrow">SAMPLING NETWORK</div>
          <h1>
            Station directory<span className="title-dot">.</span>
          </h1>
          <p>Every location, every latest reading, in one place.</p>
        </div>
        <Button variant="outline" onClick={download}>
          <Download />
          Export data
        </Button>
      </div>
      <div className="directory-toolbar">
        <div className="search-field">
          <Search className="size-4" />
          <Input
            aria-label="Search stations"
            placeholder="Search stations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-44" aria-label="Water body type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All water bodies</SelectItem>
            {TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-40" aria-label="Sort stations">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="id">Station ID</SelectItem>
            <SelectItem value="wqi">Highest WQI</SelectItem>
            <SelectItem value="name">Name A–Z</SelectItem>
          </SelectContent>
        </Select>
        <span>{filtered.length} stations · November</span>
      </div>
      <div className="table-scroll">
        <table className="station-table">
          <thead>
            <tr>
              <th>Station / water body</th>
              {PARAMS.map((p) => (
                <th key={p.key}>
                  {p.label}
                  <small className="block">{p.unit || "—"}</small>
                </th>
              ))}
              <th>WQI / classification</th>
              <th>Δ since June</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id}>
                <td>
                  <Button
                    variant="link"
                    className="h-auto p-0 text-left text-foreground whitespace-normal justify-start"
                    onClick={() => setSelected(s.id)}
                  >
                    {s.name}
                  </Button>
                  <small className="block mt-1 text-muted-foreground">
                    {s.id} · {s.type}
                  </small>
                </td>
                {PARAMS.map((p) => (
                  <td
                    key={p.key}
                    className={exceeds(p, latest(s)[p.key]) ? "font-semibold text-destructive" : ""}
                  >
                    {latest(s)[p.key]}
                  </td>
                ))}
                <td>
                  <div className="flex items-center gap-3">
                    <strong>{computeWQI(latest(s))}</strong>
                    <GradeBadge grade={gradeWQI(computeWQI(latest(s)))} />
                  </div>
                </td>
                <td>
                  <span className={`change-value ${stationChange(s) < 0 ? "improving" : ""}`}>
                    {stationChange(s) < 0 ? <ArrowDownRight /> : <ArrowUpRight />}
                    {Math.abs(stationChange(s))}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && (
          <div className="empty-state">
            No matching stations
            <Button
              variant="link"
              onClick={() => {
                setSearch("");
                setType("all");
              }}
            >
              Clear filters
            </Button>
          </div>
        )}
      </div>
      <p className="dataset-footnote">
        Illustrative readings · approximate Chennai locations · not a safety assessment.
      </p>
      {station && (
        <div className="detail-modal-backdrop" onClick={() => setSelected(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Station details"
            className="detail-modal"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Escape") setSelected(null);
            }}
          >
            <Button
              autoFocus
              className="modal-close"
              variant="ghost"
              size="icon"
              aria-label="Close station details"
              onClick={() => setSelected(null)}
            >
              <X />
            </Button>
            <StationDetail station={station} />
          </div>
        </div>
      )}
    </main>
  );
}
