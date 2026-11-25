import { ArrowDownRight, ArrowUpRight, Check, AlertTriangle, MapPin } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { GradeBadge, GRADE_CLASS } from "@/components/GradeBadge";
import { PARAMS, latest, computeWQI, gradeWQI, exceeds, type Station } from "@/lib/water";
import { stationChange } from "@/lib/analytics";
export function StationDetail({ station }: { station: Station }) {
  const reading = latest(station),
    score = computeWQI(reading),
    grade = gradeWQI(score),
    delta = stationChange(station);
  return (
    <div className="selected-detail">
      <div className="detail-eyebrow">
        <span>
          <span className="status-dot" />
          SELECTED STATION
        </span>
        <span>{station.id}</span>
      </div>
      <h2>{station.name}</h2>
      <div className="detail-meta">
        <span className="water-type">{station.type}</span>
        <span>
          <MapPin className="size-3" />
          {station.lat.toFixed(3)}° N, {station.lng.toFixed(3)}° E
        </span>
      </div>
      <div className="station-score">
        <div>
          <span className="text-xs text-muted-foreground">Water quality index</span>
          <div className={`quality-value score-number ${GRADE_CLASS[grade]}`}>
            {score}
            <span>/ WQI</span>
          </div>
        </div>
        <GradeBadge grade={grade} />
      </div>
      <div className={`station-delta ${delta < 0 ? "improving" : ""}`}>
        {delta < 0 ? <ArrowDownRight /> : <ArrowUpRight />}
        {Math.abs(delta)} points {delta < 0 ? "lower" : "higher"} since June
      </div>
      <div className="detail-parameters">
        {PARAMS.map((p) => {
          const bad = exceeds(p, reading[p.key]);
          return (
            <div key={p.key}>
              <span>{p.label}</span>
              <strong className={bad ? "text-destructive" : ""}>
                {reading[p.key]} <small>{p.unit}</small>
                {bad ? <AlertTriangle /> : <Check />}
              </strong>
            </div>
          );
        })}
      </div>
      <div className="detail-bottom">
        <span>Latest sample · November</span>
        <Button asChild variant="ghost" size="sm">
          <Link to="/analytics/trends">
            Trends
            <ArrowUpRight />
          </Link>
        </Button>
      </div>
    </div>
  );
}
