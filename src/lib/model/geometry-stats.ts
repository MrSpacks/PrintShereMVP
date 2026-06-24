import * as THREE from "three";

import { DEFAULT_PLA_DENSITY_G_CM3 } from "@/lib/model/constants";
import type { ModelDimensions, ModelStats } from "@/types/model";

/**
 * Подписанный объём тетраэдра с вершиной в начале координат.
 * Сумма по всем треугольникам меша даёт объём замкнутой модели.
 */
function signedVolumeOfTriangle(
  a: THREE.Vector3,
  b: THREE.Vector3,
  c: THREE.Vector3
): number {
  return a.dot(b.clone().cross(c)) / 6;
}

/**
 * Считает объём BufferGeometry через метод signed tetrahedron.
 * Работает для STL и триангулированных OBJ-мешей.
 */
export function computeGeometryVolumeMm3(geometry: THREE.BufferGeometry): number {
  const position = geometry.getAttribute("position");
  if (!position) return 0;

  const index = geometry.getIndex();
  let volume = 0;

  const va = new THREE.Vector3();
  const vb = new THREE.Vector3();
  const vc = new THREE.Vector3();

  const accumulateTriangle = (ia: number, ib: number, ic: number) => {
    va.fromBufferAttribute(position, ia);
    vb.fromBufferAttribute(position, ib);
    vc.fromBufferAttribute(position, ic);
    volume += signedVolumeOfTriangle(va, vb, vc);
  };

  if (index) {
    for (let i = 0; i < index.count; i += 3) {
      accumulateTriangle(index.getX(i), index.getX(i + 1), index.getX(i + 2));
    }
  } else {
    for (let i = 0; i < position.count; i += 3) {
      accumulateTriangle(i, i + 1, i + 2);
    }
  }

  return Math.abs(volume);
}

/** Габариты bounding box в мм (STL/OBJ обычно в мм) */
export function computeGeometryDimensions(
  geometry: THREE.BufferGeometry
): ModelDimensions {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox ?? new THREE.Box3();
  const size = box.getSize(new THREE.Vector3());

  return {
    width: round1(size.x),
    height: round1(size.y),
    depth: round1(size.z),
  };
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Агрегирует статистику по одной или нескольким геометриям.
 * Объём: мм³ → см³ (/1000), вес: см³ × плотность PLA.
 */
export function buildModelStats(
  geometries: THREE.BufferGeometry[],
  densityGPerCm3: number = DEFAULT_PLA_DENSITY_G_CM3
): ModelStats {
  let totalVolumeMm3 = 0;
  const combinedBox = new THREE.Box3();

  for (const geometry of geometries) {
    totalVolumeMm3 += computeGeometryVolumeMm3(geometry);
    geometry.computeBoundingBox();
    if (geometry.boundingBox) {
      combinedBox.union(geometry.boundingBox);
    }
  }

  const size = combinedBox.getSize(new THREE.Vector3());
  const volumeCm3 = totalVolumeMm3 / 1000;
  const weightGrams = volumeCm3 * densityGPerCm3;

  return {
    volumeCm3: round1(volumeCm3),
    weightGrams: round1(weightGrams),
    dimensions: {
      width: round1(size.x),
      height: round1(size.y),
      depth: round1(size.z),
    },
  };
}

/** Собирает все mesh-геометрии из загруженного Object3D (для OBJ) */
export function extractMeshGeometries(
  object: THREE.Object3D
): THREE.BufferGeometry[] {
  const geometries: THREE.BufferGeometry[] = [];

  object.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry instanceof THREE.BufferGeometry) {
      geometries.push(child.geometry);
    }
  });

  return geometries;
}
