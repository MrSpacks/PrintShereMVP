"use client";

import { Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { ModelHomeSteps } from "@/components/model/model-home-steps";
import { useTranslations } from "@/i18n/locale-provider";
import { ACCEPTED_MODEL_EXTENSIONS } from "@/lib/model/constants";
import { isAcceptedModelFile } from "@/lib/model/parse-model-file";
import { cn } from "@/lib/utils";

interface ModelDropzoneProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
  className?: string;
}

export function ModelDropzone({
  onFileSelect,
  isLoading = false,
  className,
}: ModelDropzoneProps) {
  const { t } = useTranslations();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (!file || !isAcceptedModelFile(file)) return;
      onFileSelect(file);
    },
    [onFileSelect]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragOver(false);
      handleFiles(event.dataTransfer.files);
    },
    [handleFiles]
  );

  const accept = ACCEPTED_MODEL_EXTENSIONS.join(",");

  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-start gap-6 overflow-y-auto p-4 sm:justify-center sm:p-6",
        className
      )}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "flex w-full max-w-[17rem] cursor-pointer flex-col items-center rounded-xl border-2 border-dashed px-5 py-8 transition-colors sm:max-w-xs",
          isDragOver
            ? "border-brand bg-brand/10"
            : "border-zinc-600 bg-zinc-800/50 hover:border-zinc-500 hover:bg-zinc-800"
        )}
      >
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-700/80 sm:mb-4 sm:h-14 sm:w-14">
          <Upload className="h-5 w-5 text-zinc-300 sm:h-6 sm:w-6" aria-hidden />
        </div>

        <p className="text-center text-sm font-medium text-zinc-200">
          {isLoading ? t("model.analyzing") : t("model.dropTitle")}
        </p>
        <p className="mt-1 text-center text-xs text-zinc-500">
          {t("model.dropHint")}
        </p>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4 border-zinc-600 bg-transparent text-zinc-200 hover:bg-zinc-700 sm:mt-5"
          disabled={isLoading}
          onClick={(event) => {
            event.stopPropagation();
            inputRef.current?.click();
          }}
        >
          {t("model.browseFiles")}
        </Button>
      </div>

      <ModelHomeSteps />

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        disabled={isLoading}
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />
    </div>
  );
}
