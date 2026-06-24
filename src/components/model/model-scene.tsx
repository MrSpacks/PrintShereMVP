/// <reference types="@react-three/fiber" />

"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useLoader } from "@react-three/fiber";
import { Center } from "@react-three/drei";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";

import type { ModelFileType } from "@/types/model";

const MODEL_COLOR = "#9ca3af";

interface ModelMeshProps {
  url: string;
  fileType: ModelFileType;
}

/**
 * Загружает STL/OBJ и центрирует модель в сцене.
 * Материал — нейтральный серый для превью перед печатью.
 */
function ModelMesh({ url, fileType }: ModelMeshProps) {
  if (fileType === "stl") {
    return <StlMesh url={url} />;
  }
  return <ObjMesh url={url} />;
}

function StlMesh({ url }: { url: string }) {
  const geometry = useLoader(STLLoader, url);

  const centeredGeometry = useMemo(() => {
    const cloned = geometry.clone();
    cloned.center();
    cloned.computeVertexNormals();
    return cloned;
  }, [geometry]);

  return (
    <Center>
      <mesh geometry={centeredGeometry} castShadow receiveShadow>
        <meshStandardMaterial
          color={MODEL_COLOR}
          metalness={0.15}
          roughness={0.65}
        />
      </mesh>
    </Center>
  );
}

function ObjMesh({ url }: { url: string }) {
  const group = useLoader(OBJLoader, url);
  const ref = useRef<THREE.Group>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;

    const box = new THREE.Box3().setFromObject(ref.current);
    const center = box.getCenter(new THREE.Vector3());
    ref.current.position.sub(center);
  }, [group]);

  return (
    <group ref={ref}>
      {group.children.map((child) => {
        if (!(child instanceof THREE.Mesh)) return null;
        const geometry = child.geometry as THREE.BufferGeometry;

        return (
          <mesh
            key={child.uuid}
            geometry={geometry}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial
              color={MODEL_COLOR}
              metalness={0.15}
              roughness={0.65}
            />
          </mesh>
        );
      })}
    </group>
  );
}

export { ModelMesh };
