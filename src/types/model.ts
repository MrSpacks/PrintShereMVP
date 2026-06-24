/** Поддерживаемые форматы 3D-моделей */
export type ModelFileType = "stl" | "obj";

/** Габариты модели в миллиметрах */
export interface ModelDimensions {
  width: number;
  height: number;
  depth: number;
}

/** Рассчитанные параметры модели для прайсинга */
export interface ModelStats {
  /** Объём в см³ */
  volumeCm3: number;
  /** Ориентировочный вес при печати PLA, г */
  weightGrams: number;
  dimensions: ModelDimensions;
}

/** Загруженная модель, готовая к отображению и расчёту цены */
export interface ModelData {
  fileName: string;
  fileType: ModelFileType;
  /** Blob URL для Three.js viewer */
  objectUrl: string;
  stats: ModelStats;
}
