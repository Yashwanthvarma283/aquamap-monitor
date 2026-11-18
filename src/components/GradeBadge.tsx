import { type Grade } from "@/lib/water";

export const GRADE_CLASS: Record<Grade, string> = {
  Excellent: "quality-excellent",
  Good: "quality-good",
  Poor: "quality-poor",
  "Very Poor": "quality-verypoor",
  Unsuitable: "quality-unsuitable",
};

export function GradeBadge({ grade }: { grade: Grade }) {
  return <span className={`quality-badge ${GRADE_CLASS[grade]}`}><span className="quality-dot" />{grade}</span>;
}