import {
  STATIONS,
  PARAMS,
  computeWQI,
  gradeWQI,
  latest,
  exceeds,
  subIndex,
  type Station,
  type Grade,
  type ParamKey,
} from "./water";
export const GRADES: Grade[] = ["Excellent", "Good", "Poor", "Very Poor", "Unsuitable"];
export const TYPES = ["River", "Lake", "Pond", "Groundwater"] as const;
export function stationChange(station: Station) {
  const first = station.history[0];
  return first
    ? Math.round((computeWQI(latest(station)) - computeWQI(first.reading)) * 10) / 10
    : 0;
}
export function summarize(stations: Station[]) {
  const scores = stations.map((s) => computeWQI(latest(s)));
  return {
    stations: stations.length,
    samples: stations.reduce((n, s) => n + s.history.length, 0),
    readings: stations.reduce((n, s) => n + s.history.length * PARAMS.length, 0),
    average: scores.length
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      : 0,
    breaches: stations.reduce(
      (n, s) => n + PARAMS.filter((p) => exceeds(p, latest(s)[p.key])).length,
      0,
    ),
    improving: stations.filter((s) => stationChange(s) < 0).length,
    distribution: GRADES.map((grade) => ({
      grade,
      count: scores.filter((score) => gradeWQI(score) === grade).length,
    })),
  };
}
export function monthlyAverages(stations: Station[], parameter: "wqi" | ParamKey = "wqi") {
  const months = stations[0]?.history.map((h) => h.month) ?? [];
  return months.map((month) => {
    const values = stations.flatMap((s) => {
      const h = s.history.find((h) => h.month === month);
      return h ? [parameter === "wqi" ? computeWQI(h.reading) : h.reading[parameter]] : [];
    });
    return {
      month,
      value: values.length
        ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100
        : 0,
    };
  });
}
export function breachRows(stations: Station[]) {
  return stations.flatMap((station) =>
    PARAMS.filter((p) => exceeds(p, latest(station)[p.key])).map((parameter) => ({
      station,
      parameter,
      value: latest(station)[parameter.key],
    })),
  );
}
export function contributions(station: Station) {
  const denominator = PARAMS.reduce((n, p) => n + 1 / p.standard, 0);
  return PARAMS.map((p) => ({
    label: p.label,
    value: Math.round((subIndex(p, latest(station)[p.key]) / p.standard / denominator) * 100) / 100,
  }));
}
export const SUMMARY = summarize(STATIONS);
export function pageHead(title: string, description: string) {
  return {
    meta: [
      { title: `${title} | AquaMap Chennai` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} | AquaMap Chennai` },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  };
}
