"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  /** Hide overlay above this breakpoint (null = always show when open) */
  hideAbove?: "md" | "lg" | null;
}

/** Above Leaflet panes (~1000) and mobile sticky bars. */
const SHEET_Z = 9999;

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  className,
  hideAbove = "lg",
}: BottomSheetProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const hideClass =
    hideAbove === "lg"
      ? "lg:hidden"
      : hideAbove === "md"
        ? "md:hidden"
        : "";

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 flex flex-col justify-end",
        hideClass
      )}
      style={{ zIndex: SHEET_Z }}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative max-h-[85vh] overflow-y-auto rounded-t-2xl border border-border bg-background shadow-2xl",
          className
        )}
      >
        {title && (
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
}
