"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  AuthCard,
  AuthError,
  AuthField,
  AuthLink,
  AuthSubmitButton,
} from "@/components/auth/auth-form";
import { useAuth } from "@/components/auth/auth-provider";
import type { MakerSignupPayload } from "@/types/auth";

export function BecomeMakerForm() {
  const router = useRouter();
  const { signupMaker } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [workshopName, setWorkshopName] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload: MakerSignupPayload = {
      name,
      email,
      password,
      workshopName,
      address,
    };

    try {
      await signupMaker(payload);
      router.push("/dashboard");
      router.refresh();
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Registration failed";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Become a Maker"
      subtitle="Create your account and put your workshop on the map. Materials, prices and limits — in your dashboard."
      size="lg"
      footer={
        <>
          Just want to print something?{" "}
          <AuthLink href="/signup">Sign up as customer</AuthLink>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <AuthError message={error} />

        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-foreground">
            Your account
          </legend>
          <AuthField id="name" label="Full name" value={name} onChange={setName} />
          <AuthField
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
          />
          <AuthField
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
          />
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-foreground">
            Workshop
          </legend>

          <AuthField
            id="workshopName"
            label="Workshop name"
            value={workshopName}
            onChange={setWorkshopName}
          />

          <div className="space-y-2">
            <label htmlFor="address" className="text-sm font-medium">
              Full address
            </label>
            <textarea
              id="address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              required
              rows={3}
              placeholder="Street, city, postal code, country"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="text-xs text-muted-foreground">
              Used to place your pin on the map. You can change it later in the
              dashboard.
            </p>
          </div>
        </fieldset>

        <AuthSubmitButton
          isSubmitting={isSubmitting}
          label="Register Workshop"
        />
      </form>
    </AuthCard>
  );
}
