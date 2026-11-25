import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from "react-leaflet";
import { divIcon } from "leaflet";
import { LocateFixed, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type Station,
  type ParamKey,
  PARAMS,
  computeWQI,
  gradeWQI,
  latest,
  exceeds,
} from "@/lib/water";
import { GRADE_CLASS } from "@/components/GradeBadge";
interface Props {
  stations: Station[];
  selectedId: string;
  colorBy: "wqi" | ParamKey;
  onSelect: (id: string) => void;
  layer?: "streets" | "satellite";
}
export default function WaterMap({
  stations,
  selectedId,
  colorBy,
  onSelect,
  layer = "streets",
}: Props) {
  return (
    <MapContainer
      center={[13.07, 80.22]}
      zoom={11}
      zoomControl={false}
      className="h-full w-full"
      scrollWheelZoom={true}
    >
      <MapControls stations={stations} selectedId={selectedId} />
      {layer === "streets" ? (
        <TileLayer
          key="streets"
          attribution="© OpenStreetMap contributors"
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      ) : (
        <TileLayer
          key="satellite"
          attribution="Tiles © Esri"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
      )}
      {stations.map((s) => {
        const r = latest(s),
          wqi = computeWQI(r),
          sel = s.id === selectedId;
        const param = PARAMS.find((p) => p.key === colorBy);
        const gradeClass =
          colorBy === "wqi"
            ? GRADE_CLASS[gradeWQI(wqi)]
            : param && exceeds(param, r[param.key])
              ? "quality-unsuitable"
              : "quality-excellent";
        const value = colorBy === "wqi" ? Math.round(wqi) : param ? r[param.key] : wqi;
        const icon = divIcon({
          className: "station-marker-wrapper",
          html: `<div class="station-pin ${gradeClass} ${sel ? "is-selected" : ""}"><span class="pin-dot"></span><strong>${value}</strong></div>`,
          iconSize: [58, 34],
          iconAnchor: [29, 40],
        });
        return (
          <Marker
            key={s.id}
            position={[s.lat, s.lng]}
            icon={icon}
            zIndexOffset={sel ? 1000 : 0}
            eventHandlers={{ click: () => onSelect(s.id) }}
            title={`${s.id} · ${s.name}`}
          >
            <Tooltip direction="top" offset={[0, -35]}>
              <strong>{s.name}</strong>
              <br />
              {colorBy === "wqi"
                ? `WQI ${wqi} · ${gradeWQI(wqi)}`
                : `${param?.label}: ${value} ${param?.unit ?? ""}`}
            </Tooltip>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
function MapControls({ stations, selectedId }: { stations: Station[]; selectedId: string }) {
  const map = useMap();
  const fit = () => {
    if (stations.length)
      map.fitBounds(
        stations.map((s) => [s.lat, s.lng] as [number, number]),
        { paddingTopLeft: [55, 85], paddingBottomRight: [55, 70], maxZoom: 13 },
      );
  };
  useEffect(() => {
    if (stations.length)
      map.fitBounds(
        stations.map((s) => [s.lat, s.lng] as [number, number]),
        { padding: [55, 85], maxZoom: 13, animate: false },
      );
  }, [map, stations]);
  useEffect(() => {
    const s = stations.find((s) => s.id === selectedId);
    if (s)
      map.panTo([s.lat, s.lng], {
        animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      });
  }, [map, selectedId, stations]);
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return (
    <div className="map-navigation">
      <Button
        variant="outline"
        size="icon"
        aria-label="Zoom in"
        title="Zoom in"
        onClick={() => map.zoomIn()}
      >
        <Plus />
      </Button>
      <Button
        variant="outline"
        size="icon"
        aria-label="Zoom out"
        title="Zoom out"
        onClick={() => map.zoomOut()}
      >
        <Minus />
      </Button>
      <Button
        variant="outline"
        size="icon"
        aria-label="Show all stations"
        title="Show all stations"
        onClick={fit}
      >
        <LocateFixed />
      </Button>
    </div>
  );
}
