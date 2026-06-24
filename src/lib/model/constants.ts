/** Плотность PLA по умолчанию (г/см³) — для оценки веса до выбора материала */
export const DEFAULT_PLA_DENSITY_G_CM3 = 1.24;

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
