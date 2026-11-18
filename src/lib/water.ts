// Water quality model: parameters, standards (BIS IS 10500 / WHO / CPCB) and the
// Weighted Arithmetic Water Quality Index (Brown et al., 1972).

export type ParamKey = "ph" | "do" | "bod" | "tds" | "turbidity" | "nitrate";

export interface Param {
  key: ParamKey;
  label: string;
  unit: string;
  standard: number; // Si – permissible limit
  ideal: number; // Vo – ideal value
  higherIsBetter?: boolean;
}

export const PARAMS: Param[] = [
  { key: "ph", label: "pH", unit: "", standard: 8.5, ideal: 7 },
  { key: "do", label: "Dissolved O₂", unit: "mg/L", standard: 5, ideal: 14.6, higherIsBetter: true },
  { key: "bod", label: "BOD", unit: "mg/L", standard: 3, ideal: 0 },
  { key: "tds", label: "TDS", unit: "mg/L", standard: 500, ideal: 0 },
  { key: "turbidity", label: "Turbidity", unit: "NTU", standard: 5, ideal: 0 },
  { key: "nitrate", label: "Nitrate", unit: "mg/L", standard: 45, ideal: 0 },
];

export type Reading = Record<ParamKey, number>;

export interface Station {
  id: string;
  name: string;
  type: "River" | "Lake" | "Pond" | "Groundwater";
  lat: number;
  lng: number;
  history: { month: string; reading: Reading }[];
}

/** Sub-index Qi = 100 * (Vi - Vo) / (Si - Vo); absolute value used for pH and DO deviations. */
export function subIndex(p: Param, value: number): number {
  return Math.abs((100 * (value - p.ideal)) / (p.standard - p.ideal));
}

/** WQI = Σ(Wi·Qi) / ΣWi where Wi = 1/Si (unit weight, K = 1). */
export function computeWQI(r: Reading): number {
  let num = 0;
  let den = 0;
  for (const p of PARAMS) {
    const w = 1 / p.standard;
    num += w * subIndex(p, r[p.key]);
    den += w;
  }
  return Math.round((num / den) * 10) / 10;
}

export type Grade = "Excellent" | "Good" | "Poor" | "Very Poor" | "Unsuitable";

export function gradeWQI(wqi: number): Grade {
  if (wqi <= 25) return "Excellent";
  if (wqi <= 50) return "Good";
  if (wqi <= 75) return "Poor";
  if (wqi <= 100) return "Very Poor";
  return "Unsuitable";
}

export const GRADE_VAR: Record<Grade, string> = {
  Excellent: "var(--wq-excellent)",
  Good: "var(--wq-good)",
  Poor: "var(--wq-poor)",
  "Very Poor": "var(--wq-verypoor)",
  Unsuitable: "var(--wq-unsuitable)",
};

export function exceeds(p: Param, v: number): boolean {
  if (p.key === "ph") return v < 6.5 || v > 8.5;
  return p.higherIsBetter ? v < p.standard : v > p.standard;
}

export const latest = (s: Station) => s.history[s.history.length - 1].reading;

const MONTHS = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];
function series(base: Reading, drift: Partial<Reading>): Station["history"] {
  return MONTHS.map((month, i) => {
    const reading = { ...base };
    for (const k of Object.keys(drift) as ParamKey[]) {
      reading[k] = Math.round((base[k] + (drift[k] ?? 0) * i) * 100) / 100;
    }
    return { month, reading };
  });
}

// SAMPLE DATA – illustrative values for demonstration, not field measurements.
export const STATIONS: Station[] = [
  { id: "S1", name: "Hooghly – Dakshineswar Ghat", type: "River", lat: 22.6547, lng: 88.3577,
    history: series({ ph: 7.6, do: 5.8, bod: 3.4, tds: 310, turbidity: 18, nitrate: 6 }, { bod: 0.15, do: -0.1 }) },
  { id: "S2", name: "Hooghly – Babughat", type: "River", lat: 22.5686, lng: 88.3416,
    history: series({ ph: 7.8, do: 5.1, bod: 4.2, tds: 360, turbidity: 24, nitrate: 9 }, { bod: 0.2, turbidity: 1.2 }) },
  { id: "S3", name: "Rabindra Sarobar Lake", type: "Lake", lat: 22.5124, lng: 88.3637,
    history: series({ ph: 8.1, do: 6.4, bod: 2.6, tds: 280, turbidity: 6, nitrate: 4 }, { do: -0.15, ph: 0.04 }) },
  { id: "S4", name: "Subhas Sarobar", type: "Lake", lat: 22.5745, lng: 88.4006,
    history: series({ ph: 7.9, do: 6.9, bod: 2.1, tds: 240, turbidity: 4, nitrate: 3 }, { bod: 0.05 }) },
  { id: "S5", name: "East Kolkata Wetlands", type: "Pond", lat: 22.5521, lng: 88.4512,
    history: series({ ph: 8.3, do: 4.2, bod: 7.8, tds: 620, turbidity: 30, nitrate: 22 }, { bod: 0.3, nitrate: 1.5 }) },
  { id: "S6", name: "Salt Lake Tube-well", type: "Groundwater", lat: 22.5867, lng: 88.4171,
    history: series({ ph: 7.2, do: 6.8, bod: 0.8, tds: 520, turbidity: 1.2, nitrate: 12 }, { tds: 8 }) },
  { id: "S7", name: "Hooghly – Budge Budge", type: "River", lat: 22.4808, lng: 88.1719,
    history: series({ ph: 7.7, do: 5.5, bod: 3.8, tds: 340, turbidity: 21, nitrate: 7 }, { turbidity: 0.8 }) },
  { id: "S8", name: "Santragachi Jheel", type: "Lake", lat: 22.5843, lng: 88.2831,
    history: series({ ph: 8.4, do: 4.6, bod: 5.4, tds: 410, turbidity: 12, nitrate: 15 }, { do: -0.12, bod: 0.2 }) },
];
