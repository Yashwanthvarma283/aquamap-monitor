import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
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
    <MapContainer bounds={stations.map((s) => [s.lat, s.lng] as [number, number])} boundsOptions={{ padding: [24, 24] }} className="h-full w-full" scrollWheelZoom>
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
          const p = PARAMS.find((x) => x.key === colorBy)!;
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
            pathOptions={{ color: sel ? "#0b2533" : "#ffffff", weight: sel ? 3 : 2, fillColor: color, fillOpacity: 0.9 }}
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
