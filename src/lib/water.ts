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
  {
    key: "do",
    label: "Dissolved O₂",
    unit: "mg/L",
    standard: 5,
    ideal: 14.6,
    higherIsBetter: true,
  },
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

export const latest = (s: Station): Reading => {
  const sample = s.history.at(-1);
  if (!sample) throw new Error(`Station ${s.id} has no samples`);
  return sample.reading;
};

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

// SAMPLE DATA – illustrative readings and approximate Chennai sampling locations,
// not field measurements or surveyed sampling points.
export const STATIONS: Station[] = [
  {
    id: "S1",
    name: "Adyar River – Kotturpuram",
    type: "River",
    lat: 13.018,
    lng: 80.241,
    history: series(
      { ph: 7.6, do: 5.8, bod: 3.4, tds: 310, turbidity: 18, nitrate: 6 },
      { bod: 0.15, do: -0.1 },
    ),
  },
  {
    id: "S2",
    name: "Cooum River – Napier Bridge",
    type: "River",
    lat: 13.069,
    lng: 80.283,
    history: series(
      { ph: 7.8, do: 5.1, bod: 4.2, tds: 360, turbidity: 24, nitrate: 9 },
      { bod: 0.2, turbidity: 1.2 },
    ),
  },
  {
    id: "S3",
    name: "Porur Lake",
    type: "Lake",
    lat: 13.035,
    lng: 80.151,
    history: series(
      { ph: 8.1, do: 6.4, bod: 2.6, tds: 280, turbidity: 6, nitrate: 4 },
      { do: -0.15, ph: 0.04 },
    ),
  },
  {
    id: "S4",
    name: "Velachery Lake",
    type: "Lake",
    lat: 12.977,
    lng: 80.214,
    history: series(
      { ph: 7.9, do: 6.9, bod: 2.1, tds: 240, turbidity: 4, nitrate: 3 },
      { bod: 0.05 },
    ),
  },
  {
    id: "S5",
    name: "Mylapore Temple Tank",
    type: "Pond",
    lat: 13.033,
    lng: 80.269,
    history: series(
      { ph: 8.3, do: 4.2, bod: 7.8, tds: 620, turbidity: 30, nitrate: 22 },
      { bod: 0.3, nitrate: 1.5 },
    ),
  },
  {
    id: "S6",
    name: "Anna Nagar – Sample Borewell",
    type: "Groundwater",
    lat: 13.085,
    lng: 80.21,
    history: series(
      { ph: 7.2, do: 6.8, bod: 0.8, tds: 520, turbidity: 1.2, nitrate: 12 },
      { tds: 8 },
    ),
  },
  {
    id: "S7",
    name: "Kosasthalaiyar River – Ennore",
    type: "River",
    lat: 13.224,
    lng: 80.313,
    history: series(
      { ph: 7.7, do: 5.5, bod: 3.8, tds: 340, turbidity: 21, nitrate: 7 },
      { turbidity: 0.8 },
    ),
  },
  {
    id: "S8",
    name: "Puzhal Lake",
    type: "Lake",
    lat: 13.166,
    lng: 80.17,
    history: series(
      { ph: 8.4, do: 4.6, bod: 5.4, tds: 410, turbidity: 12, nitrate: 15 },
      { do: -0.12, bod: 0.2 },
    ),
  },
  {
    id: "S9",
    name: "Chembarambakkam Lake",
    type: "Lake",
    lat: 13.011,
    lng: 80.11,
    history: series(
      { ph: 7.3, do: 8.2, bod: 1.2, tds: 190, turbidity: 2.1, nitrate: 2.4 },
      { turbidity: -0.1, bod: -0.04, do: 0.1 },
    ),
  },
  {
    id: "S10",
    name: "Pallikaranai – Marsh Outlet",
    type: "Pond",
    lat: 12.944,
    lng: 80.219,
    history: series(
      { ph: 7.4, do: 4.8, bod: 5.7, tds: 460, turbidity: 16, nitrate: 18 },
      { bod: -0.2, turbidity: -0.7, do: 0.12 },
    ),
  },
  {
    id: "S11",
    name: "Adyar River – Thiru Vi Ka Bridge",
    type: "River",
    lat: 13.013,
    lng: 80.26,
    history: series(
      { ph: 7.9, do: 4.7, bod: 6.3, tds: 480, turbidity: 27, nitrate: 11 },
      { bod: -0.12, do: 0.06, turbidity: -0.4 },
    ),
  },
  {
    id: "S12",
    name: "Ambattur Lake",
    type: "Lake",
    lat: 13.113,
    lng: 80.151,
    history: series(
      { ph: 7.6, do: 6.7, bod: 2.2, tds: 330, turbidity: 7.8, nitrate: 5.6 },
      { turbidity: -0.6, do: 0.08, bod: -0.1 },
    ),
  },
  {
    id: "S13",
    name: "Madipakkam – Sample Borewell",
    type: "Groundwater",
    lat: 12.964,
    lng: 80.198,
    history: series(
      { ph: 7.1, do: 7.2, bod: 0.6, tds: 680, turbidity: 0.8, nitrate: 32 },
      { tds: -10, nitrate: -0.8 },
    ),
  },
  {
    id: "S14",
    name: "Thiruvottiyur – Sample Borewell",
    type: "Groundwater",
    lat: 13.159,
    lng: 80.299,
    history: series(
      { ph: 7.5, do: 6.1, bod: 1.4, tds: 890, turbidity: 2.4, nitrate: 48 },
      { tds: 12, nitrate: 0.6 },
    ),
  },
  {
    id: "S15",
    name: "Chitlapakkam Lake",
    type: "Lake",
    lat: 12.936,
    lng: 80.141,
    history: series(
      { ph: 7.2, do: 7.8, bod: 1.3, tds: 220, turbidity: 3.6, nitrate: 3.1 },
      { do: 0.08, turbidity: -0.2, bod: -0.05 },
    ),
  },
  {
    id: "S16",
    name: "Cooum River – Chetpet",
    type: "River",
    lat: 13.068,
    lng: 80.242,
    history: series(
      { ph: 8.2, do: 3.8, bod: 8.1, tds: 550, turbidity: 34, nitrate: 20 },
      { bod: 0.15, do: -0.06, turbidity: 0.4 },
    ),
  },
];
