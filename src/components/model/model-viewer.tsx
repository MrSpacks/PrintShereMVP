/// <reference types="@react-three/fiber" />

"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

import { ModelMesh } from "@/components/model/model-scene";
import type { ModelFileType } from "@/types/model";

interface ModelViewerProps {
  objectUrl: string;
  fileType: ModelFileType;
}

function ViewerFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#52525b" wireframe />
    </mesh>
  );
}

/**
 * Three.js canvas с орбитальным управлением.
 * Рендер только на клиенте (импортируется через dynamic ssr:false).
 */
export function ModelViewer({ objectUrl, fileType }: ModelViewerProps) {
  return (
    <div className="h-full w-full">
      <Canvas
        camera={{ position: [0, 0, 120], fov: 45, near: 0.1, far: 10000 }}
        gl={{ antialias: true, alpha: false }}
        className="h-full w-full"
      >
        <color attach="background" args={["#18181b"]} />
        <ambientLight intensity={0.55} />
        <directionalLight position={[80, 120, 60]} intensity={1.1} />
        <directionalLight position={[-60, -40, -80]} intensity={0.35} />

        <Suspense fallback={<ViewerFallback />}>
          <ModelMesh url={objectUrl} fileType={fileType} />
        </Suspense>

        <OrbitControls
          enablePan={false}
          minDistance={20}
          maxDistance={400}
          makeDefault
        />
      </Canvas>
    </div>
  );
}
