"use client";

import { Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AuthError } from "@/components/auth/auth-form";
import { Button } from "@/components/ui/button";
import { WorkshopToolbar } from "@/components/maker/workshop-toolbar";
import { useAuth } from "@/components/auth/auth-provider";
import { useTranslations } from "@/i18n/locale-provider";
import { PRINTER_TYPES } from "@/lib/makers/capabilities";
import {
  getColorOptions,
  getMaterialOptions,
} from "@/lib/makers/filament-options";
import {
  FilamentColorPicker,
  FilamentColorSwatch,
} from "@/components/maker/filament-color-picker";
import type {
  MakerFilament,
  MakerProfile,
  MakerStatus,
  MakerWorkshopSummary,
  PrinterType,
  UpdateMakerProfilePayload,
} from "@/types/maker";
import {
  WORKSHOP_UI_STATUSES,
  normalizeWorkshopUiStatus,
} from "@/lib/makers/workshop-status";
import { cn } from "@/lib/utils";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-sm font-medium text-foreground">{children}</span>;
}

function DashboardInput({
  id,
  label,
  type = "text",
  value,
  onChange,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  );
}

function FilamentRow({
  filament,
  onDelete,
  isDeleting,
}: {
  filament: MakerFilament;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const { t } = useTranslations();
  const typeLabel =
    filament.printerType === "fdm"
      ? t("printer.fdm")
      : t("printer.resin");

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2">
      <div className="flex min-w-0 items-center gap-2.5 text-sm">
        <FilamentColorSwatch colorId={filament.color} size="md" />
        <div className="min-w-0">
          <span className="font-medium">{filament.material}</span>
          <span className="text-muted-foreground"> · {filament.color}</span>
          <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {typeLabel}
          </span>
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={isDeleting}
        onClick={() => onDelete(filament.id)}
        className="shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700"
        aria-label={`${t("common.remove")} ${filament.material} ${filament.color}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

function AddFilamentPanel({
  printerTypes,
  onAdd,
  onClose,
}: {
  printerTypes: PrinterType[];
  onAdd: (printerType: PrinterType, material: string, color: string) => Promise<void>;
  onClose: () => void;
}) {
  const { t } = useTranslations();
  const defaultType = printerTypes[0] ?? "fdm";
  const [printerType, setPrinterType] = useState<PrinterType>(defaultType);
  const materials = useMemo(
    () => getMaterialOptions(printerType),
    [printerType]
  );
  const [material, setMaterial] = useState(materials[0] ?? "");
  const colors = useMemo(
    () => getColorOptions(printerType, material),
    [printerType, material]
  );
  const [color, setColor] = useState(colors[0] ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const nextMaterials = getMaterialOptions(printerType);
    setMaterial(nextMaterials[0] ?? "");
  }, [printerType]);

  useEffect(() => {
    const nextColors = getColorOptions(printerType, material);
    setColor(nextColors[0] ?? "");
  }, [printerType, material]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await onAdd(printerType, material, color);
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : t("dashboard.addFailed")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="space-y-3 rounded-lg border border-dashed border-brand/40 bg-brand/5 p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <FieldLabel>{t("dashboard.addFilamentTitle")}</FieldLabel>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted"
          aria-label={t("common.close")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <AuthError message={error} />

      {printerTypes.length > 1 && (
        <div className="space-y-2">
          <FieldLabel>{t("dashboard.printerType")}</FieldLabel>
          <select
            value={printerType}
            onChange={(event) =>
              setPrinterType(event.target.value as PrinterType)
            }
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {printerTypes.map((type) => (
              <option key={type} value={type}>
                {t(`printer.${type}`)}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <FieldLabel>{t("dashboard.material")}</FieldLabel>
          <select
            value={material}
            onChange={(event) => setMaterial(event.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {materials.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <FieldLabel>{t("dashboard.color")}</FieldLabel>
          <FilamentColorPicker
            printerType={printerType}
            value={color}
            onChange={setColor}
            groupLabels={{
              solid: t("filamentColor.groupSolid"),
              gradient: t("filamentColor.groupGradient"),
              multicolor: t("filamentColor.groupMulticolor"),
              transparent: t("filamentColor.groupTransparent"),
            }}
          />
        </div>
      </div>

      <Button type="submit" variant="brand" size="sm" disabled={isSubmitting}>
        {isSubmitting ? t("common.adding") : t("common.add")}
      </Button>
    </form>
  );
}

export function MakerDashboard() {
  const { t } = useTranslations();
  const { user } = useAuth();
  const [workshops, setWorkshops] = useState<MakerWorkshopSummary[]>([]);
  const [profile, setProfile] = useState<MakerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [pricePerGramFdmCzk, setPricePerGramFdmCzk] = useState("5");
  const [pricePerGramResinCzk, setPricePerGramResinCzk] = useState("12");
  const [minOrderPriceCzk, setMinOrderPriceCzk] = useState("0");
  const [offersDelivery, setOffersDelivery] = useState(false);
  const [deliveryPriceCzk, setDeliveryPriceCzk] = useState("0");
  const [infillPercent, setInfillPercent] = useState("20");
  const [wallThicknessMm, setWallThicknessMm] = useState("1.2");
  const [supportCoefficient, setSupportCoefficient] = useState("1.15");
  const [companyId, setCompanyId] = useState("");
  const [printerTypes, setPrinterTypes] = useState<PrinterType[]>(["fdm"]);
  const [status, setStatus] = useState<MakerStatus>("available");

  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [showAddFilament, setShowAddFilament] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const applyProfile = useCallback((next: MakerProfile) => {
    setProfile(next);
    setName(next.name);
    setAddress(next.address);
    setPricePerGramFdmCzk(String(next.pricePerGramFdmCzk));
    setPricePerGramResinCzk(String(next.pricePerGramResinCzk));
    setMinOrderPriceCzk(String(next.minOrderPriceCzk));
    setOffersDelivery(next.offersDelivery);
    setDeliveryPriceCzk(String(next.deliveryPriceCzk));
    setInfillPercent(String(next.infillPercent));
    setWallThicknessMm(String(next.wallThicknessMm));
    setSupportCoefficient(String(next.supportCoefficient));
    setCompanyId(next.companyId ?? "");
    setPrinterTypes(next.printerTypes);
    // В UI только «работаю» / «не работаю»; busy из БД → hidden
    setStatus(normalizeWorkshopUiStatus(next.status));
  }, []);

  const loadWorkshops = useCallback(async () => {
    const response = await fetch("/api/maker/workshops");
    if (!response.ok) return;
    const data = (await response.json()) as {
      workshops?: MakerWorkshopSummary[];
    };
    setWorkshops(data.workshops ?? []);
  }, []);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await fetch("/api/maker/profile");
      const data = (await response.json()) as {
        profile?: MakerProfile;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? t("dashboard.loadFailed"));
      }

      if (!data.profile) {
        throw new Error(t("dashboard.profileNotFound"));
      }

      applyProfile(data.profile);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : t("dashboard.loadFailed")
      );
    } finally {
      setIsLoading(false);
    }
  }, [applyProfile, t]);

  useEffect(() => {
    void loadWorkshops();
    void loadProfile();
  }, [loadProfile, loadWorkshops]);

  const togglePrinterType = (type: PrinterType) => {
    setPrinterTypes((current) => {
      if (current.includes(type)) {
        return current.length === 1 ? current : current.filter((item) => item !== type);
      }
      return [...current, type];
    });
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaveError(null);
    setSaveMessage(null);
    setIsSaving(true);

    const payload: UpdateMakerProfilePayload = {
      name,
      address,
      pricePerGramFdmCzk: Number(pricePerGramFdmCzk),
      pricePerGramResinCzk: Number(pricePerGramResinCzk),
      minOrderPriceCzk: Number(minOrderPriceCzk),
      offersDelivery,
      deliveryPriceCzk: Number(deliveryPriceCzk),
      infillPercent: Number(infillPercent),
      wallThicknessMm: Number(wallThicknessMm),
      supportCoefficient: Number(supportCoefficient),
      companyId: companyId.trim() === "" ? null : companyId.trim(),
      printerTypes,
      status,
    };

    try {
      const response = await fetch("/api/maker/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as {
        profile?: MakerProfile;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? t("dashboard.saveFailed"));
      }

      if (data.profile) {
        applyProfile(data.profile);
      }

      setSaveMessage(t("dashboard.settingsSaved"));
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : t("dashboard.saveFailed")
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddFilament = async (
    printerType: PrinterType,
    material: string,
    color: string
  ) => {
    const response = await fetch("/api/maker/filaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ printerType, material, color }),
    });

    const data = (await response.json()) as {
      filament?: MakerFilament;
      error?: string;
    };

    if (!response.ok) {
      throw new Error(data.error ?? t("dashboard.addFailed"));
    }

    if (data.filament && profile) {
      setProfile({
        ...profile,
        filaments: [...profile.filaments, data.filament].sort((a, b) =>
          `${a.printerType}${a.material}`.localeCompare(
            `${b.printerType}${b.material}`
          )
        ),
      });
    }
  };

  const handleDeleteFilament = async (id: string) => {
    setDeletingId(id);

    try {
      const response = await fetch(`/api/maker/filaments/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? t("dashboard.deleteFailed"));
      }

      if (profile) {
        setProfile({
          ...profile,
          filaments: profile.filaments.filter((item) => item.id !== id),
        });
      }
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : t("dashboard.deleteFailed")
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 animate-pulse rounded-md bg-muted" />
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (loadError || !profile) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
        {loadError ?? t("dashboard.loadFailed")}
        <div className="mt-4">
          <Button variant="outline" size="sm" onClick={() => void loadProfile()}>
            {t("common.retry")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WorkshopToolbar
        workshops={workshops}
        activeMakerId={user?.makerId ?? null}
        onSwitch={async () => {
          await loadWorkshops();
          await loadProfile();
        }}
        onCreated={async () => {
          await loadWorkshops();
          await loadProfile();
        }}
        onDeleted={async () => {
          await loadWorkshops();
          await loadProfile();
        }}
      />

      <div className="grid gap-6 xl:grid-cols-2 xl:items-start">
      <form onSubmit={(event) => void handleSave(event)}>
        <section className="rounded-xl border border-border bg-card p-5 shadow-sm md:p-6">
          <h2 className="text-lg font-semibold">{t("dashboard.settingsTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("dashboard.settingsSubtitle")}
          </p>

          <div className="mt-5 space-y-4">
            <AuthError message={saveError} />
            {saveMessage && (
              <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                {saveMessage}
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <DashboardInput
                id="workshop-name"
                label={t("dashboard.workshopName")}
                value={name}
                onChange={setName}
              />

              {/* Доступность на карте: два состояния вместо busy/hidden/pause */}
              <div className="space-y-2">
                <FieldLabel>{t("dashboard.statusLabel")}</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {WORKSHOP_UI_STATUSES.map((value) => {
                    const isSelected = status === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setStatus(value)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                          isSelected
                            ? "border-brand bg-brand text-white"
                            : "border-input bg-background hover:bg-muted"
                        )}
                      >
                        {value === "available"
                          ? t("dashboard.statusWorking")
                          : t("dashboard.statusNotWorking")}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="workshop-address" className="text-sm font-medium">
                {t("dashboard.address")}
              </label>
              <textarea
                id="workshop-address"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                rows={2}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="company-id" className="text-sm font-medium">
                {t("dashboard.companyId")}
              </label>
              <input
                id="company-id"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="12345678"
                value={companyId}
                onChange={(event) =>
                  setCompanyId(event.target.value.replace(/[^\d]/g, "").slice(0, 8))
                }
                className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <p className="text-xs text-muted-foreground">
                {t("dashboard.companyIdHelp")}
              </p>
              {profile.occasionalIncomeRemainingCzk !== null &&
                profile.occasionalIncomeRemainingCzk !== undefined && (
                  <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    <p className="font-medium">{t("dashboard.incomeLimitTitle")}</p>
                    <p className="mt-1">
                      {t("dashboard.incomeLimitYtd", {
                        ytd: profile.yearToDatePrintIncomeCzk ?? 0,
                        limit: profile.occasionalIncomeLimitCzk ?? 50000,
                      })}
                    </p>
                    <p>
                      {t("dashboard.incomeLimitRemaining", {
                        remaining: profile.occasionalIncomeRemainingCzk,
                      })}
                    </p>
                    {profile.occasionalIncomeRemainingCzk === 0 && (
                      <p className="mt-1 font-medium">
                        {t("dashboard.incomeLimitReached")}
                      </p>
                    )}
                  </div>
                )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {printerTypes.includes("fdm") && (
                <DashboardInput
                  id="price-per-gram-fdm"
                  label={t("dashboard.pricePerGramFdm")}
                  type="number"
                  value={pricePerGramFdmCzk}
                  onChange={setPricePerGramFdmCzk}
                />
              )}
              {printerTypes.includes("resin") && (
                <DashboardInput
                  id="price-per-gram-resin"
                  label={t("dashboard.pricePerGramResin")}
                  type="number"
                  value={pricePerGramResinCzk}
                  onChange={setPricePerGramResinCzk}
                />
              )}
              <DashboardInput
                id="min-order"
                label={t("dashboard.minOrderPrice")}
                type="number"
                value={minOrderPriceCzk}
                onChange={setMinOrderPriceCzk}
              />
            </div>

            <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <FieldLabel>{t("dashboard.deliveryTitle")}</FieldLabel>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("dashboard.deliveryHelp")}
                  </p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={offersDelivery}
                    onChange={(event) => setOffersDelivery(event.target.checked)}
                    className="h-4 w-4 rounded border-input"
                  />
                  {t("dashboard.offersDelivery")}
                </label>
              </div>
              {offersDelivery && (
                <DashboardInput
                  id="delivery-price"
                  label={t("dashboard.deliveryPrice")}
                  type="number"
                  value={deliveryPriceCzk}
                  onChange={setDeliveryPriceCzk}
                />
              )}
            </div>

            <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
              <div className="mb-2">
                <FieldLabel>{t("dashboard.printSettings")}</FieldLabel>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("dashboard.printSettingsHelp")}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <label htmlFor="infill" className="text-sm font-medium">
                    {t("dashboard.infillPercent")}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="infill"
                      type="number"
                      min="0"
                      max="100"
                      step="5"
                      value={infillPercent}
                      onChange={(event) => setInfillPercent(event.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="wall-thickness" className="text-sm font-medium">
                    {t("dashboard.wallThickness")}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="wall-thickness"
                      type="number"
                      min="0.4"
                      max="5"
                      step="0.2"
                      value={wallThicknessMm}
                      onChange={(event) => setWallThicknessMm(event.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <span className="text-sm text-muted-foreground">mm</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="support-coeff" className="text-sm font-medium">
                    {t("dashboard.supportCoefficient")}
                  </label>
                  <input
                    id="support-coeff"
                    type="number"
                    min="1"
                    max="2"
                    step="0.05"
                    value={supportCoefficient}
                    onChange={(event) => setSupportCoefficient(event.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <FieldLabel>{t("dashboard.printerTypes")}</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {PRINTER_TYPES.map((type) => {
                  const isSelected = printerTypes.includes(type.id);
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => togglePrinterType(type.id)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                        isSelected
                          ? "border-brand bg-brand text-white"
                          : "border-input bg-background hover:bg-muted"
                      )}
                    >
                      {t(`printer.${type.id}`)}
                    </button>
                  );
                })}
              </div>
            </div>

            {profile.printers.length > 0 && (
              <div className="space-y-2">
                <FieldLabel>{t("workshop.registeredPrinters")}</FieldLabel>
                <ul className="space-y-2">
                  {profile.printers.map((printer) => (
                    <li
                      key={printer.id}
                      className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm"
                    >
                      <span className="font-medium">{printer.modelLabel}</span>
                      <span className="text-muted-foreground">
                        {" "}
                        · {t(`printer.${printer.technology}`)}
                      </span>
                      {printer.isCustom && (
                        <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {t("workshop.customBadge")}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            </div>
          </div>

          <div className="mt-5">
            <Button type="submit" variant="brand" disabled={isSaving}>
              {isSaving ? t("common.saving") : t("dashboard.saveSettings")}
            </Button>
          </div>
        </section>
      </form>

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{t("dashboard.filamentsTitle")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("dashboard.filamentsSubtitle")}
            </p>
          </div>

          {!showAddFilament && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddFilament(true)}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              {t("common.add")}
            </Button>
          )}
        </div>

        <div className="mt-5 space-y-3">
          {showAddFilament && (
            <AddFilamentPanel
              printerTypes={printerTypes}
              onAdd={handleAddFilament}
              onClose={() => setShowAddFilament(false)}
            />
          )}

          {profile.filaments.length === 0 && !showAddFilament && (
            <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              {t("dashboard.noFilaments")}
            </p>
          )}

          {profile.filaments.map((filament) => (
            <FilamentRow
              key={filament.id}
              filament={filament}
              onDelete={(id) => void handleDeleteFilament(id)}
              isDeleting={deletingId === filament.id}
            />
          ))}
        </div>
      </section>
      </div>
    </div>
  );
}
