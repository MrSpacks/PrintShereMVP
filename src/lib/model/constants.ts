/** Плотность материалов для 3D печати (г/см³) */
export const MATERIAL_DENSITIES = {
  pla: 1.24,
  abs: 1.04,
  petg: 1.27,
  tpu: 1.21,
  nylon: 1.14,
  resin: 1.18,
  resinFlexible: 1.15,
  resinTough: 1.20,
} as const;

/** Плотность PLA по умолчанию (г/см³) — для оценки веса до выбора материала */
export const DEFAULT_PLA_DENSITY_G_CM3 = MATERIAL_DENSITIES.pla;

/** Плотность resin по умолчанию (г/см³) */
export const DEFAULT_RESIN_DENSITY_G_CM3 = MATERIAL_DENSITIES.resin;

/** Настройки печати по умолчанию для оценки веса до выбора мейкера */
export const DEFAULT_PRINT_SETTINGS = {
  infillPercent: 20,
  wallThicknessMm: 1.2,
  supportCoefficient: 1.15,
} as const;

/** Допустимые расширения файлов */
export const ACCEPTED_MODEL_EXTENSIONS = [".stl", ".obj"] as const;

export const ACCEPTED_MODEL_MIME_TYPES = [
  "model/stl",
  "application/sla",
  "application/vnd.ms-pki.stl",
  "application/octet-stream",
  "text/plain",
  "model/obj",
  "application/obj",
] as const;

/**
 * Значение для <input accept>.
 * На iOS/iPadOS фильтр `.stl`/`.obj` часто делает файлы серыми и невыбираемыми
 * (система не знает UTI). Там не ограничиваем picker — валидируем после выбора.
 */
export function getModelFileInputAccept(): string | undefined {
  if (typeof navigator === "undefined") {
    return ACCEPTED_MODEL_EXTENSIONS.join(",");
  }

  const ua = navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  if (isIOS) {
    return undefined;
  }

  return ACCEPTED_MODEL_EXTENSIONS.join(",");
}
