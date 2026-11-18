import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet";
import { LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type Station, type ParamKey, PARAMS, computeWQI, gradeWQI, GRADE_VAR, latest, exceeds } from "@/lib/water";

interface Props {
  stations: Station[];
  selectedId: string;
  colorBy: "wqi" | ParamKey;
  onSelect: (id: string) => void;
}

function resolve(v: string) {
  const name = v.slice(4, -1);
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "gray";
}

export default function WaterMap({ stations, selectedId, colorBy, onSelect }: Props) {
  return (
    <MapContainer bounds={stations.map((s) => [s.lat, s.lng] as [number, number])} boundsOptions={{ padding: [32, 32] }} className="h-full w-full" scrollWheelZoom={false}>
      <MapControls stations={stations} selectedId={selectedId} />
      <TileLayer
        attribution="© OpenStreetMap contributors"
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {stations.map((s) => {
        const r = latest(s);
        const wqi = computeWQI(r);
        let color: string;
        let label: string;
        if (colorBy === "wqi") {
          color = resolve(GRADE_VAR[gradeWQI(wqi)]);
          label = `WQI ${wqi} · ${gradeWQI(wqi)}`;
        } else {
          const p = PARAMS.find((x) => x.key === colorBy);
          if (!p) return null;
          const bad = exceeds(p, r[colorBy]);
          color = resolve(bad ? "var(--wq-unsuitable)" : "var(--wq-excellent)");
          label = `${p.label}: ${r[colorBy]} ${p.unit} ${bad ? "(exceeds limit)" : "(within limit)"}`;
        }
        const sel = s.id === selectedId;
        return (
          <CircleMarker
            key={s.id}
            center={[s.lat, s.lng]}
            radius={sel ? 14 : 10}
            pathOptions={{ color: resolve(sel ? "var(--foreground)" : "var(--card)"), weight: sel ? 3 : 2, fillColor: color, fillOpacity: 0.9 }}
            eventHandlers={{ click: () => onSelect(s.id) }}
          >
            <Tooltip direction="top">
              <strong>{s.name}</strong>
              <br />
              {label}
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}

function MapControls({ stations, selectedId }: { stations: Station[]; selectedId: string }) {
  const map = useMap();
  useEffect(() => {
    const station = stations.find((s) => s.id === selectedId);
    if (station && !map.getBounds().contains([station.lat, station.lng])) map.panTo([station.lat, station.lng]);
  }, [map, stations, selectedId]);
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
      map.fitBounds(stations.map((s) => [s.lat, s.lng] as [number, number]), { padding: [32, 32], animate: false });
    });
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map, stations]);
  return <div className="map-fit-control"><Button variant="outline" size="icon" aria-label="Show all stations" title="Show all stations" onClick={(event) => { event.stopPropagation(); map.fitBounds(stations.map((s) => [s.lat, s.lng] as [number, number]), { padding: [32, 32] }); }}><LocateFixed /></Button></div>;
}
