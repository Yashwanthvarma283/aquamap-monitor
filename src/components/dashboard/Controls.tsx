import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATIONS, PARAMS, type ParamKey } from "@/lib/water";
export function StationSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="station-selector" aria-label="Selected station">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATIONS.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            {s.id} · {s.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
export function ParameterSelect({
  value,
  onChange,
  wqi = false,
  label = "Analytics parameter",
}: {
  value: string;
  onChange: (v: "wqi" | ParamKey) => void;
  wqi?: boolean;
  label?: string;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as "wqi" | ParamKey)}>
      <SelectTrigger className="parameter-selector" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {wqi && <SelectItem value="wqi">Water quality index</SelectItem>}
        {PARAMS.map((p) => (
          <SelectItem key={p.key} value={p.key}>
            {p.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
