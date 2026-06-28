"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { AuthError } from "@/components/auth/auth-form";
import { PrinterPicker } from "@/components/maker/printer-picker";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
import { useTranslations } from "@/i18n/locale-provider";
import type { MakerWorkshopSummary, WorkshopPrinterInput } from "@/types/maker";

interface WorkshopToolbarProps {
  workshops: MakerWorkshopSummary[];
  activeMakerId: string | null;
  onSwitch: (makerId: string) => Promise<void>;
  onCreated: () => Promise<void>;
  onDeleted: () => Promise<void>;
}

export function WorkshopToolbar({
  workshops,
  activeMakerId,
  onSwitch,
  onCreated,
  onDeleted,
}: WorkshopToolbarProps) {
  const { t } = useTranslations();
  const { refetch } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [workshopName, setWorkshopName] = useState("");
  const [address, setAddress] = useState("");
  const [printers, setPrinters] = useState<WorkshopPrinterInput[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const activeWorkshop = workshops.find((item) => item.id === activeMakerId);

  async function handleSwitch(makerId: string) {
    if (makerId === activeMakerId) return;
    setIsBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/maker/workshops/${makerId}`, {
        method: "PATCH",
      });
      if (!response.ok) throw new Error("Failed");
      await onSwitch(makerId);
    } catch {
      setError(t("workshop.switchFailed"));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setIsBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/maker/workshops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workshopName, address, printers }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Failed");

      setShowCreate(false);
      setWorkshopName("");
      setAddress("");
      setPrinters([]);
      await refetch();
      await onCreated();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : t("workshop.createFailed")
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDelete() {
    if (!activeMakerId || !window.confirm(t("workshop.deleteConfirm"))) return;

    setIsBusy(true);
    setError(null);

    try {
      const response = await fetch(`/api/maker/workshops/${activeMakerId}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Failed");

      await refetch();
      await onDeleted();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : t("workshop.deleteFailed")
      );
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t("workshop.toolbarTitle")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("workshop.toolbarSubtitle")}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setShowCreate((current) => !current)}
        >
          <Plus className="h-4 w-4" />
          {t("workshop.addWorkshop")}
        </Button>
      </div>

      <AuthError message={error} />

      {workshops.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {workshops.map((workshop) => (
            <button
              key={workshop.id}
              type="button"
              disabled={isBusy}
              onClick={() => void handleSwitch(workshop.id)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                workshop.id === activeMakerId
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-input hover:bg-muted"
              }`}
            >
              {workshop.name}
            </button>
          ))}

          {activeWorkshop && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isBusy}
              onClick={() => void handleDelete()}
              className="ml-auto gap-1.5 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
              {t("workshop.deleteWorkshop")}
            </Button>
          )}
        </div>
      )}

      {showCreate && (
        <form onSubmit={(event) => void handleCreate(event)} className="space-y-4 border-t border-border pt-4">
          <input
            value={workshopName}
            onChange={(event) => setWorkshopName(event.target.value)}
            placeholder={t("becomeMaker.workshopName")}
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          />
          <textarea
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder={t("becomeMaker.addressPlaceholder")}
            required
            rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <PrinterPicker printers={printers} onChange={setPrinters} />
          <Button type="submit" variant="brand" size="sm" disabled={isBusy}>
            {isBusy ? t("common.saving") : t("workshop.createWorkshop")}
          </Button>
        </form>
      )}
    </section>
  );
}
