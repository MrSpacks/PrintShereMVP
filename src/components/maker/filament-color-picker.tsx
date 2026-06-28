import {
  FILAMENT_COLOR_KIND_ORDER,
  getFilamentColorDef,
  getFilamentColors,
  getFilamentSwatchStyle,
  type FilamentColorKind,
} from "@/lib/makers/filament-colors";
import type { PrinterType } from "@/types/maker";
import { cn } from "@/lib/utils";

const SWATCH_SIZE = {
  sm: "h-3.5 w-3.5",
  md: "h-5 w-5",
  lg: "h-7 w-7",
} as const;

interface FilamentColorSwatchProps {
  colorId: string;
  size?: keyof typeof SWATCH_SIZE;
  className?: string;
  title?: string;
}

export function FilamentColorSwatch({
  colorId,
  size = "md",
  className,
  title,
}: FilamentColorSwatchProps) {
  const def = getFilamentColorDef(colorId);

  if (!def) {
    return (
      <span
        className={cn(
          "inline-block shrink-0 rounded-full border border-border bg-muted",
          SWATCH_SIZE[size],
          className
        )}
        title={title ?? colorId}
        aria-hidden
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-block shrink-0 rounded-full border shadow-sm",
        SWATCH_SIZE[size],
        className
      )}
      style={getFilamentSwatchStyle(def)}
      title={title ?? def.label}
      aria-hidden
    />
  );
}

interface FilamentColorPickerProps {
  printerType: PrinterType;
  value: string;
  onChange: (colorId: string) => void;
  groupLabels: Record<FilamentColorKind, string>;
}

export function FilamentColorPicker({
  printerType,
  value,
  onChange,
  groupLabels,
}: FilamentColorPickerProps) {
  const colors = getFilamentColors(printerType);

  return (
    <div className="space-y-3">
      {FILAMENT_COLOR_KIND_ORDER.map((kind) => {
        const options = colors.filter((color) => color.kind === kind);
        if (options.length === 0) return null;

        return (
          <div key={kind}>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              {groupLabels[kind]}
            </p>
            <div className="flex flex-wrap gap-2">
              {options.map((color) => {
                const selected = value === color.id;
                return (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => onChange(color.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-xs transition-colors",
                      selected
                        ? "border-brand bg-brand/10 ring-1 ring-brand/40"
                        : "border-border bg-background hover:border-brand/30 hover:bg-muted/40"
                    )}
                    aria-pressed={selected}
                    aria-label={color.label}
                  >
                    <FilamentColorSwatch colorId={color.id} size="lg" />
                    <span className="font-medium text-foreground">
                      {color.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
