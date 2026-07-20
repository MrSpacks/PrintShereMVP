import type { ModelData } from "@/types/model";

interface ModelMetadataProps {
  model: ModelData;
}

/**
 * Отображает имя файла, ориентировочный вес и габариты модели.
 */
export function ModelMetadata({ model }: ModelMetadataProps) {
  const { fileName, stats } = model;
  const { width, height, depth } = stats.dimensions;
  const hasBreakdown = stats.modelWeightGrams && stats.supportWeightGrams;

  return (
    <div className="border-t border-zinc-700/80 bg-zinc-900 px-4 py-3">
      <p className="truncate text-sm font-medium text-zinc-100">{fileName}</p>
      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
        {hasBreakdown ? (
          <span title={`Model: ${stats.modelWeightGrams}g + Supports: ${stats.supportWeightGrams}g`}>
            {stats.weightGrams}g
            <span className="ml-1 text-zinc-500">
              ({stats.modelWeightGrams}g + {stats.supportWeightGrams}g)
            </span>
          </span>
        ) : (
          <span>{stats.weightGrams}g</span>
        )}
        <span>
          {width} × {height} × {depth} mm
        </span>
        <span className="text-zinc-500">{stats.volumeCm3} cm³</span>
      </div>
    </div>
  );
}
