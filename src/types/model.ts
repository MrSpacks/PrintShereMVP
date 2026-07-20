/** Поддерживаемые форматы 3D-моделей */
export type ModelFileType = "stl" | "obj";

/** Габариты модели в миллиметрах */
export interface ModelDimensions {
  width: number;
  height: number;
  depth: number;
}

/** Настройки печати для расчета реального веса */
export interface PrintSettings {
  /** Процент заполнения (infill) — обычно 15-25% */
  infillPercent: number;
  /** Толщина стенок в мм — обычно 1.0-2.0 мм */
  wallThicknessMm: number;
  /** Коэффициент поддержек — множитель для учета supports (1.0 = без поддержек, 1.3 = +30%) */
  supportCoefficient: number;
}

/** Рассчитанные параметры модели для прайсинга */
export interface ModelStats {
  /** Объём в см³ */
  volumeCm3: number;
  /** Реальный вес при печати с учетом настроек, г */
  weightGrams: number;
  /** Вес только модели (без поддержек), г */
  modelWeightGrams?: number;
  /** Вес поддержек, г */
  supportWeightGrams?: number;
  dimensions: ModelDimensions;
}

/** Загруженная модель, готовая к отображению и расчёту цены */
export interface ModelData {
  fileName: string;
  fileType: ModelFileType;
  /** Blob URL для Three.js viewer */
  objectUrl: string;
  /** Исходный файл для загрузки при создании заказа */
  sourceFile: File;
  stats: ModelStats;
}
