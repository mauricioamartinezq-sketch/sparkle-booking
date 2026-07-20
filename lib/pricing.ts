// Single source of truth for services offered and how they're priced.
// Keep this in sync with the `services` table in Supabase (supabase/schema.sql).
// The server (Edge Function) recalculates the total from these rules too —
// never trust a price sent from the browser.

export type ServiceId =
  | "window_cleaning"
  | "pressure_washing"
  | "soft_washing"
  | "gutter_cleaning"
  | "holiday_lights";

export interface ServiceDef {
  id: ServiceId;
  label: string;
  description: string;
  unit: "per_window" | "per_sqft" | "flat_plus_length";
  basePrice: number; // price per unit, in USD
  minimumPrice: number; // minimum charge for this service
}

export const SERVICES: ServiceDef[] = [
  {
    id: "window_cleaning",
    label: "Window cleaning",
    description: "Interior & exterior, screens included",
    unit: "per_window",
    basePrice: 8,
    minimumPrice: 120,
  },
  {
    id: "pressure_washing",
    label: "Pressure washing",
    description: "Driveways, patios, walkways",
    unit: "per_sqft",
    basePrice: 0.25,
    minimumPrice: 150,
  },
  {
    id: "soft_washing",
    label: "Soft washing",
    description: "Low-pressure house or roof wash",
    unit: "per_sqft",
    basePrice: 0.35,
    minimumPrice: 200,
  },
  {
    id: "gutter_cleaning",
    label: "Gutter cleaning",
    description: "Debris removal & downspout flush",
    unit: "flat_plus_length",
    basePrice: 2.5,
    minimumPrice: 130,
  },
  {
    id: "holiday_lights",
    label: "Holiday lights",
    description: "Install, take-down & storage",
    unit: "flat_plus_length",
    basePrice: 6,
    minimumPrice: 350,
  },
];

export interface LineItemInput {
  serviceId: ServiceId;
  quantity: number; // windows, sq ft, or linear feet depending on unit
}

export function estimateTotal(items: LineItemInput[]): number {
  let total = 0;
  for (const item of items) {
    const svc = SERVICES.find((s) => s.id === item.serviceId);
    if (!svc) continue;
    const raw = svc.basePrice * item.quantity;
    total += Math.max(raw, svc.minimumPrice);
  }
  return Math.round(total * 100) / 100;
}

export const DEPOSIT_THRESHOLD = 1000;
export const DEPOSIT_RATE = 0.5;

export function depositDue(total: number): number {
  return total > DEPOSIT_THRESHOLD
    ? Math.round(total * DEPOSIT_RATE * 100) / 100
    : 0;
}
