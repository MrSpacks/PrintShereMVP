import { SplitScreenLayout } from "@/components/layout/split-screen-layout";
import { MapPanel } from "@/components/map/map-panel";
import { ModelPanel } from "@/components/model/model-panel";

/**
 * Главная страница — split screen с 3D viewer и картой.
 */
export default function HomePage() {
  return (
    <SplitScreenLayout
      leftPanel={<ModelPanel />}
      rightPanel={<MapPanel />}
    />
  );
}
