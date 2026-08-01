"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MapPin } from "lucide-react";

import {
  AuthCard,
  AuthError,
  AuthField,
  AuthLink,
  AuthSubmitButton,
} from "@/components/auth/auth-form";
import { useAuth } from "@/components/auth/auth-provider";
import { PrinterPicker } from "@/components/maker/printer-picker";
import { useTranslations } from "@/i18n/locale-provider";
import { PRINTER_MODEL_CATALOG } from "@/lib/makers/printer-catalog";
import { reverseGeocode } from "@/lib/geocoding/reverse-geocode";
import type { MakerSignupPayload } from "@/types/auth";
import type { User } from "@/types/user";
import type { WorkshopPrinterInput } from "@/types/maker";

export function BecomeMakerForm() {
  const router = useRouter();
  const { user, signupMaker, refetch } = useAuth();
  const { t } = useTranslations();
  const isExistingAccount = Boolean(user);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [workshopName, setWorkshopName] = useState("");
  
  // Address fields
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  
  const [printers, setPrinters] = useState<WorkshopPrinterInput[]>([
    {
      technology: "fdm",
      modelKey: PRINTER_MODEL_CATALOG.fdm[0]?.key ?? "generic-fdm",
    },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const handleDetectLocation = async () => {
    if (!navigator.geolocation) {
      setError(t("becomeMaker.geolocationNotSupported"));
      return;
    }

    setIsDetectingLocation(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const { latitude, longitude } = position.coords;
      
      const result = await reverseGeocode(latitude, longitude);

      if (result) {
        if (result.street) setStreet(result.street);
        if (result.city) setCity(result.city);
        if (result.postalCode) setPostalCode(result.postalCode);
        if (result.country) setCountry(result.country);
      } else {
        setError(t("becomeMaker.locationDetectionFailed"));
      }
    } catch (error) {
      console.error("[handleDetectLocation] Error:", error);
      if (error instanceof GeolocationPositionError) {
        if (error.code === error.PERMISSION_DENIED) {
          setError(t("becomeMaker.locationPermissionDenied"));
        } else if (error.code === error.TIMEOUT) {
          setError(t("becomeMaker.locationTimeout"));
        } else {
          setError(t("becomeMaker.locationDetectionFailed"));
        }
      } else {
        setError(t("becomeMaker.locationDetectionFailed"));
      }
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Build full address from separate fields
      const fullAddress = [street, city, postalCode, country]
        .map(s => s.trim())
        .filter(Boolean)
        .join(", ");

      if (isExistingAccount) {
        const payload = { 
          workshopName: workshopName.trim(), 
          address: fullAddress, 
          printers 
        };
        console.log("[BecomeMakerForm] Submitting workshop for existing account:", {
          payload,
          workshopName: workshopName.trim(),
          address: fullAddress,
          printers: JSON.parse(JSON.stringify(printers)),
        });
        
        const response = await fetch("/api/maker/workshops", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = (await response.json()) as { error?: string; user?: User };

        if (!response.ok) {
          console.error("[BecomeMakerForm] Workshop creation failed:", data);
          throw new Error(data.error ?? t("becomeMaker.registrationFailed"));
        }

        await refetch();
      } else {
        const payload: MakerSignupPayload = {
          name: name.trim(),
          email: email.trim(),
          password,
          workshopName: workshopName.trim(),
          address: fullAddress,
          printers,
        };
        await signupMaker(payload);
      }

      router.push("/dashboard");
      router.refresh();
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : t("becomeMaker.registrationFailed");
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard
      title={t("becomeMaker.title")}
      subtitle={
        isExistingAccount
          ? t("becomeMaker.subtitleExisting", { name: user?.name ?? "" })
          : t("becomeMaker.subtitle")
      }
      size="xl"
      footer={
        isExistingAccount ? null : (
          <>
            {t("becomeMaker.footer")}{" "}
            <AuthLink href="/signup">{t("becomeMaker.signUpCustomer")}</AuthLink>
          </>
        )
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <AuthError message={error} />

        {!isExistingAccount ? (
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-foreground">
              {t("becomeMaker.yourAccount")}
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <AuthField
                id="name"
                label={t("common.fullName")}
                value={name}
                onChange={setName}
              />
              <AuthField
                id="email"
                label={t("common.email")}
                type="email"
                value={email}
                onChange={setEmail}
              />
            </div>
            <AuthField
              id="password"
              label={t("common.password")}
              type="password"
              value={password}
              onChange={setPassword}
            />
          </fieldset>
        ) : (
          <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            {t("becomeMaker.existingAccountHint", {
              email: user?.email ?? "",
            })}
          </p>
        )}

        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-foreground">
            {t("becomeMaker.workshop")}
          </legend>

          <AuthField
            id="workshopName"
            label={t("becomeMaker.workshopName")}
            value={workshopName}
            onChange={setWorkshopName}
          />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                {t("becomeMaker.workshopAddress")}
              </label>
              <button
                type="button"
                disabled={isDetectingLocation}
                className="flex items-center gap-1 text-xs text-brand hover:underline disabled:opacity-50"
                onClick={handleDetectLocation}
              >
                <MapPin className="h-3 w-3" />
                {isDetectingLocation 
                  ? t("common.loading")
                  : t("becomeMaker.detectLocation")
                }
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <AuthField
                id="street"
                label={t("becomeMaker.street")}
                value={street}
                onChange={setStreet}
                placeholder="Ulice 123"
              />
              <AuthField
                id="city"
                label={t("becomeMaker.city")}
                value={city}
                onChange={setCity}
                placeholder="Praha"
              />
              <AuthField
                id="postalCode"
                label={t("becomeMaker.postalCode")}
                value={postalCode}
                onChange={setPostalCode}
                placeholder="110 00"
              />
              <AuthField
                id="country"
                label={t("becomeMaker.country")}
                value={country}
                onChange={setCountry}
                placeholder="Česká republika"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {t("becomeMaker.addressHint")}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">{t("workshop.printersTitle")}</p>
            <p className="text-xs text-muted-foreground">
              {t("workshop.printersHint")}
            </p>
            <PrinterPicker printers={printers} onChange={setPrinters} />
          </div>
        </fieldset>

        <AuthSubmitButton
          isSubmitting={isSubmitting}
          label={t("becomeMaker.registerWorkshop")}
        />
      </form>
    </AuthCard>
  );
}
