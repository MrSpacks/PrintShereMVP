import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";

import {
  buildModelStats,
  extractMeshGeometries,
} from "@/lib/model/geometry-stats";
import type { ModelData, ModelFileType } from "@/types/model";

const STL_EXTENSIONS = new Set(["stl"]);
const OBJ_EXTENSIONS = new Set(["obj"]);

export function getModelFileType(fileName: string): ModelFileType | null {
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (!extension) return null;
  if (STL_EXTENSIONS.has(extension)) return "stl";
  if (OBJ_EXTENSIONS.has(extension)) return "obj";
  return null;
}

export function isAcceptedModelFile(file: File): boolean {
  return getModelFileType(file.name) !== null;
}

/**
 * Парсит STL/OBJ файл: загружает геометрию через Three.js loaders,
 * рассчитывает объём, вес и габариты для отображения и прайсинга на карте.
 */
export async function parseModelFile(file: File): Promise<ModelData> {
  const fileType = getModelFileType(file.name);
  if (!fileType) {
    throw new Error("Unsupported file format. Please upload STL or OBJ.");
  }

  const arrayBuffer = await file.arrayBuffer();
  const objectUrl = URL.createObjectURL(file);

  let geometries: THREE.BufferGeometry[];

  if (fileType === "stl") {
    const loader = new STLLoader();
    const geometry = loader.parse(arrayBuffer);
    geometries = [geometry];
  } else {
    const loader = new OBJLoader();
    const text = new TextDecoder().decode(arrayBuffer);
    const group = loader.parse(text);
    geometries = extractMeshGeometries(group);

    if (geometries.length === 0) {
      URL.revokeObjectURL(objectUrl);
      throw new Error("OBJ file contains no printable mesh geometry.");
    }
  }

  const stats = buildModelStats(geometries);

  if (stats.volumeCm3 <= 0 || stats.weightGrams <= 0) {
    URL.revokeObjectURL(objectUrl);
    throw new Error(
      "Could not calculate model volume. Ensure the mesh is watertight."
    );
  }

  return {
    fileName: file.name,
    fileType,
    objectUrl,
    stats,
  };
}
