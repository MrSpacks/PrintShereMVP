import { cn } from "@/lib/utils";

interface SplitScreenLayoutProps {
  /** Левая панель — зона 3D-модели (40%) */
  leftPanel: React.ReactNode;
  /** Правая панель — интерактивная карта (60%) */
  rightPanel: React.ReactNode;
  className?: string;
}

/**
 * Основной split-screen лейаут главного экрана.
 * 40% слева — 3D viewer / dropzone, 60% справа — карта мейкеров.
 */
export function SplitScreenLayout({
  leftPanel,
  rightPanel,
  className,
}: SplitScreenLayoutProps) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col lg:flex-row",
        className
      )}
    >
      {/* Левая панель — 3D модель */}
      <section
        className="flex min-h-[45vh] w-full flex-col border-b border-border lg:min-h-0 lg:w-[40%] lg:border-b-0 lg:border-r"
        aria-label="3D model panel"
      >
        {leftPanel}
      </section>

      {/* Правая панель — карта */}
      <section
        className="relative min-h-[55vh] w-full flex-1 lg:min-h-0 lg:w-[60%]"
        aria-label="Makers map panel"
      >
        {rightPanel}
      </section>
    </div>
  );
}
