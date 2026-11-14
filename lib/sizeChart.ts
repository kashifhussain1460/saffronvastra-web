// Garment measurements per size, in inches (Product.measurements from the API, or the standard charts below).
// The standard charts match the backend's defaults (backend/src/modules/catalogue/measurements.ts): common Indian
// unisex jacket sizing, chest 38/40/42/44 in for S–XL. Keep the two in step.
export interface MeasurementRow {
  size: string;
  fitsChestMin?: number;
  fitsChestMax?: number;
  chest: number;
  shoulder?: number;
  sleeve?: number;
  length: number;
}

export interface ProductMeasurements {
  note?: string;
  rows: MeasurementRow[];
}

export const MEASUREMENT_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Free Size"] as const;

export const STANDARD_NOTE =
  "Standard measurements for this style. Each piece is hand embroidered and made to order, so measurements can vary by up to 1 inch (2.5 cm).";

export const STANDARD_JACKET: ProductMeasurements = {
  note: STANDARD_NOTE,
  rows: [
    { size: "S", fitsChestMin: 34, fitsChestMax: 36, chest: 38, shoulder: 16, sleeve: 23, length: 26 },
    { size: "M", fitsChestMin: 36, fitsChestMax: 38, chest: 40, shoulder: 16.5, sleeve: 23.5, length: 26.5 },
    { size: "L", fitsChestMin: 38, fitsChestMax: 40, chest: 42, shoulder: 17, sleeve: 24, length: 27 },
    { size: "XL", fitsChestMin: 40, fitsChestMax: 42, chest: 44, shoulder: 17.5, sleeve: 24.5, length: 27.5 },
    { size: "Free Size", fitsChestMin: 34, fitsChestMax: 42, chest: 46, shoulder: 18, sleeve: 23, length: 28 },
  ],
};

export const STANDARD_LONG_KIMONO: ProductMeasurements = {
  note: STANDARD_NOTE,
  rows: [
    { size: "S", fitsChestMin: 34, fitsChestMax: 36, chest: 42, sleeve: 21, length: 36 },
    { size: "M", fitsChestMin: 36, fitsChestMax: 38, chest: 44, sleeve: 21, length: 36.5 },
    { size: "L", fitsChestMin: 38, fitsChestMax: 40, chest: 46, sleeve: 21.5, length: 37 },
    { size: "XL", fitsChestMin: 40, fitsChestMax: 42, chest: 48, sleeve: 22, length: 37.5 },
    { size: "Free Size", fitsChestMin: 34, fitsChestMax: 42, chest: 48, sleeve: 21, length: 37 },
  ],
};

// Sleeveless vests and waistcoats: the jacket body (Nehru-jacket proportions) without a sleeve.
export const STANDARD_VEST: ProductMeasurements = {
  note: STANDARD_NOTE,
  rows: STANDARD_JACKET.rows.map(({ sleeve: _sleeve, ...rest }) => rest),
};

// Inches to centimetres, to the nearest half centimetre.
export const toCm = (inches: number) => Math.round(inches * 2.54 * 2) / 2;

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : String(n).replace(/\.0+$/, ""));

// A value in the chosen unit, e.g. 40 -> "40" (in) or "101.5" (cm).
export const inUnit = (inches: number, unit: "in" | "cm") => fmt(unit === "in" ? inches : toCm(inches));

// Rows the product page can show: only valid rows, in the usual size order.
export function measurementRows(value: unknown): MeasurementRow[] {
  const rows = (value as ProductMeasurements | null)?.rows;
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((r) => r && typeof r.size === "string" && typeof r.chest === "number" && typeof r.length === "number")
    .sort((a, b) => MEASUREMENT_SIZES.indexOf(a.size as any) - MEASUREMENT_SIZES.indexOf(b.size as any));
}
