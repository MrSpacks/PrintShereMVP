import type { PrinterType } from "@/types/maker";

export type FilamentColorKind =
  | "solid"
  | "gradient"
  | "multicolor"
  | "transparent";

export interface FilamentColorDef {
  id: string;
  label: string;
  kind: FilamentColorKind;
  background: string;
  borderColor?: string;
}

const CHECKERBOARD =
  "linear-gradient(45deg, #d4d4d8 25%, transparent 25%), linear-gradient(-45deg, #d4d4d8 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #d4d4d8 75%), linear-gradient(-45deg, transparent 75%, #d4d4d8 75%)";

const CHECKERBOARD_SIZE = "8px 8px";
const CHECKERBOARD_POSITION = "0 0, 0 4px, 4px -4px, -4px 0px";

function transparentStyle(tint?: string): string {
  if (!tint) {
    return CHECKERBOARD;
  }
  return `${CHECKERBOARD}, ${tint}`;
}

export const FDM_FILAMENT_COLORS: FilamentColorDef[] = [
  { id: "Black", label: "Black", kind: "solid", background: "#18181b", borderColor: "#3f3f46" },
  { id: "White", label: "White", kind: "solid", background: "#fafafa", borderColor: "#d4d4d8" },
  { id: "Gray", label: "Gray", kind: "solid", background: "#71717a", borderColor: "#52525b" },
  { id: "Red", label: "Red", kind: "solid", background: "#dc2626" },
  { id: "Blue", label: "Blue", kind: "solid", background: "#2563eb" },
  { id: "Green", label: "Green", kind: "solid", background: "#16a34a" },
  { id: "Yellow", label: "Yellow", kind: "solid", background: "#eab308", borderColor: "#ca8a04" },
  { id: "Orange", label: "Orange", kind: "solid", background: "#ea580c" },
  { id: "Purple", label: "Purple", kind: "solid", background: "#9333ea" },
  { id: "Pink", label: "Pink", kind: "solid", background: "#ec4899" },
  { id: "Brown", label: "Brown", kind: "solid", background: "#78350f" },
  { id: "Beige", label: "Beige", kind: "solid", background: "#d6c4a8", borderColor: "#a8a29e" },
  { id: "Natural", label: "Natural", kind: "solid", background: "#e8dcc8", borderColor: "#d6d3d1" },
  { id: "Silver", label: "Silver", kind: "solid", background: "linear-gradient(135deg, #e4e4e7, #a1a1aa)" },
  { id: "Gold", label: "Gold", kind: "solid", background: "linear-gradient(135deg, #fde68a, #ca8a04)" },
  { id: "Copper", label: "Copper", kind: "solid", background: "linear-gradient(135deg, #fdba74, #b45309)" },
  {
    id: "Transparent",
    label: "Transparent",
    kind: "transparent",
    background: transparentStyle("linear-gradient(rgba(186,230,253,0.45), rgba(186,230,253,0.45))"),
    borderColor: "#93c5fd",
  },
  {
    id: "Rainbow",
    label: "Rainbow",
    kind: "multicolor",
    background:
      "linear-gradient(90deg, #ef4444, #f97316, #eab308, #22c55e, #3b82f6, #8b5cf6)",
  },
  {
    id: "Marble",
    label: "Marble",
    kind: "multicolor",
    background:
      "radial-gradient(circle at 25% 35%, #a1a1aa 0%, transparent 12%), radial-gradient(circle at 70% 65%, #71717a 0%, transparent 10%), #f4f4f5",
    borderColor: "#d4d4d8",
  },
  {
    id: "Wood",
    label: "Wood",
    kind: "multicolor",
    background: "linear-gradient(160deg, #92400e 0%, #d97706 35%, #78350f 70%, #451a03 100%)",
  },
  {
    id: "Silk Red-Gold",
    label: "Silk Red-Gold",
    kind: "gradient",
    background: "linear-gradient(135deg, #dc2626 0%, #fbbf24 50%, #dc2626 100%)",
  },
  {
    id: "Silk Blue-Green",
    label: "Silk Blue-Green",
    kind: "gradient",
    background: "linear-gradient(135deg, #2563eb 0%, #22d3ee 50%, #16a34a 100%)",
  },
  {
    id: "Silk Purple-Pink",
    label: "Silk Purple-Pink",
    kind: "gradient",
    background: "linear-gradient(135deg, #7c3aed 0%, #ec4899 50%, #7c3aed 100%)",
  },
  {
    id: "Silk Black-Gray",
    label: "Silk Black-Gray",
    kind: "gradient",
    background: "linear-gradient(135deg, #18181b 0%, #a1a1aa 50%, #18181b 100%)",
  },
];

export const RESIN_FILAMENT_COLORS: FilamentColorDef[] = [
  { id: "Black", label: "Black", kind: "solid", background: "#18181b", borderColor: "#3f3f46" },
  { id: "White", label: "White", kind: "solid", background: "#fafafa", borderColor: "#d4d4d8" },
  { id: "Gray", label: "Gray", kind: "solid", background: "#71717a", borderColor: "#52525b" },
  { id: "Red", label: "Red", kind: "solid", background: "#dc2626" },
  { id: "Blue", label: "Blue", kind: "solid", background: "#2563eb" },
  { id: "Green", label: "Green", kind: "solid", background: "#16a34a" },
  { id: "Yellow", label: "Yellow", kind: "solid", background: "#eab308", borderColor: "#ca8a04" },
  {
    id: "Clear",
    label: "Clear",
    kind: "transparent",
    background: transparentStyle("linear-gradient(rgba(254,249,195,0.35), rgba(254,249,195,0.35))"),
    borderColor: "#fde047",
  },
  {
    id: "Smoky",
    label: "Smoky",
    kind: "transparent",
    background: transparentStyle("linear-gradient(rgba(113,113,122,0.35), rgba(113,113,122,0.35))"),
    borderColor: "#a1a1aa",
  },
  {
    id: "Pearl",
    label: "Pearl",
    kind: "gradient",
    background: "linear-gradient(135deg, #f5f5f4 0%, #e7e5e4 40%, #fafafa 70%, #d6d3d1 100%)",
    borderColor: "#d4d4d8",
  },
  {
    id: "Silk Blue-Green",
    label: "Silk Blue-Green",
    kind: "gradient",
    background: "linear-gradient(135deg, #2563eb 0%, #22d3ee 50%, #16a34a 100%)",
  },
];

const FILAMENT_COLOR_BY_ID = new Map<string, FilamentColorDef>(
  [...FDM_FILAMENT_COLORS, ...RESIN_FILAMENT_COLORS].map((color) => [
    color.id,
    color,
  ])
);

export const FILAMENT_COLOR_KIND_ORDER: FilamentColorKind[] = [
  "solid",
  "gradient",
  "multicolor",
  "transparent",
];

export function getFilamentColors(printerType: PrinterType): FilamentColorDef[] {
  return printerType === "fdm" ? FDM_FILAMENT_COLORS : RESIN_FILAMENT_COLORS;
}

export function getFilamentColorIds(printerType: PrinterType): string[] {
  return getFilamentColors(printerType).map((color) => color.id);
}

export function getFilamentColorDef(colorId: string): FilamentColorDef | undefined {
  return FILAMENT_COLOR_BY_ID.get(colorId);
}

export function isValidFilamentColor(
  printerType: PrinterType,
  colorId: string
): boolean {
  return getFilamentColorIds(printerType).includes(colorId);
}

export function getFilamentSwatchStyle(def: FilamentColorDef): {
  background: string;
  backgroundSize?: string;
  backgroundPosition?: string;
  borderColor: string;
} {
  const isCheckerboard = def.kind === "transparent";
  return {
    background: def.background,
    ...(isCheckerboard
      ? {
          backgroundSize: CHECKERBOARD_SIZE,
          backgroundPosition: CHECKERBOARD_POSITION,
        }
      : {}),
    borderColor: def.borderColor ?? "rgba(0,0,0,0.12)",
  };
}

export function getFilamentSwatchInlineStyle(colorId: string) {
  const def = getFilamentColorDef(colorId);
  if (!def) return null;
  return getFilamentSwatchStyle(def);
}
