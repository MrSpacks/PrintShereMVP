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
