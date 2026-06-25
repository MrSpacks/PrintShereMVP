"use client";

import dynamic from "next/dynamic";
import { RotateCcw, X } from "lucide-react";
import { useCallback } from "react";

import { ModelDropzone } from "@/components/model/model-dropzone";
import { ModelMetadata } from "@/components/model/model-metadata";
import { PriceFooter } from "@/components/model/price-footer";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/locale-provider";
import { parseModelFile } from "@/lib/model/parse-model-file";
import { useModelStore } from "@/store/model-store";
import { cn } from "@/lib/utils";

const ModelViewer = dynamic(
  () =>
    import("@/components/model/model-viewer").then((mod) => mod.ModelViewer),
  {
    ssr: false,
    loading: () => <ModelViewerLoading />,
  }
);

function ModelViewerLoading() {
  const { t } = useTranslations();
  return (
    <div className="flex h-full items-center justify-center text-sm text-zinc-500">
      {t("model.loadingViewer")}
    </div>
  );
}

interface ModelPanelProps {
  className?: string;
}

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

/**
 * Левая панель: dropzone → Three.js viewer → метаданные → Total Price.
 */
export function ModelPanel({ className }: ModelPanelProps) {
  const { t } = useTranslations();
  const model = useModelStore((state) => state.model);
  const isParsing = useModelStore((state) => state.isParsing);
  const parseError = useModelStore((state) => state.parseError);
  const setModel = useModelStore((state) => state.setModel);
  const setParsing = useModelStore((state) => state.setParsing);
  const setParseError = useModelStore((state) => state.setParseError);
  const clearModel = useModelStore((state) => state.clearModel);

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setParseError(t("model.fileTooLarge"));
        return;
      }

      setParsing(true);
      setParseError(null);

      try {
        const parsed = await parseModelFile(file);
        setModel(parsed);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : t("model.parseFailed");
        setParseError(message);
      } finally {
        setParsing(false);
      }
    },
    [setModel, setParseError, setParsing, t]
  );

  return (
    <div className={cn("flex h-full min-h-0 flex-col bg-zinc-900", className)}>
      <div className="relative min-h-0 flex-1">
        {!model ? (
          <ModelDropzone
            onFileSelect={handleFileSelect}
            isLoading={isParsing}
          />
        ) : (
          <>
            <ModelViewer
              objectUrl={model.objectUrl}
              fileType={model.fileType}
            />

            <div className="absolute right-3 top-3 flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 border-zinc-600 bg-zinc-900/80 text-zinc-300 backdrop-blur hover:bg-zinc-800"
                onClick={clearModel}
                aria-label={t("model.removeModel")}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <p className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1.5 text-xs text-zinc-500">
              <RotateCcw className="h-3 w-3" aria-hidden />
              {t("model.dragToRotate")}
            </p>
          </>
        )}

        {parseError && (
          <div
            role="alert"
            className="absolute inset-x-4 bottom-4 rounded-lg border border-red-900/60 bg-red-950/90 px-3 py-2 text-xs text-red-300"
          >
            {parseError}
          </div>
        )}
      </div>

      {model && <ModelMetadata model={model} />}
      <PriceFooter />
    </div>
  );
}
