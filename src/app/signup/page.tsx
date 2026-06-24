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

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await signup(name, email, password);
      router.push("/");
      router.refresh();
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "Signup failed";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Sign Up"
      subtitle="Create a customer account to order prints from local makers."
      footer={
        <>
          Already have an account? <AuthLink href="/login">Log in</AuthLink>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthError message={error} />

        <AuthField
          id="name"
          label="Full name"
          value={name}
          onChange={setName}
          autoComplete="name"
        />

        <AuthField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
        />

        <AuthField
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
        />

        <p className="text-xs text-muted-foreground">
          Password must be at least 8 characters.
        </p>

        <AuthSubmitButton isSubmitting={isSubmitting} label="Create Account" />
      </form>
    </AuthCard>
  );
}
