"use client";

import { Camera, User } from "lucide-react";
import { useRef } from "react";

import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/locale-provider";
import { resizeImageToDataUrl } from "@/lib/users/resize-avatar";
import { cn } from "@/lib/utils";

interface AvatarPickerProps {
  avatarUrl: string | null;
  name: string;
  onChange: (avatarUrl: string | null) => void;
  onError?: (message: string) => void;
}

export function AvatarPicker({
  avatarUrl,
  name,
  onChange,
  onError,
}: AvatarPickerProps) {
  const { t } = useTranslations();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;

    try {
      const dataUrl = await resizeImageToDataUrl(file);
      onChange(dataUrl);
    } catch {
      onError?.(t("profile.avatarInvalid"));
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center">
      <div
        className={cn(
          "relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted"
        )}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <User className="h-10 w-10 text-muted-foreground" aria-hidden />
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(event) => {
            void handleFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => inputRef.current?.click()}
        >
          <Camera className="h-3.5 w-3.5" aria-hidden />
          {avatarUrl ? t("profile.changeAvatar") : t("profile.uploadAvatar")}
        </Button>
        {avatarUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(null)}
          >
            {t("profile.removeAvatar")}
          </Button>
        )}
      </div>
    </div>
  );
}
