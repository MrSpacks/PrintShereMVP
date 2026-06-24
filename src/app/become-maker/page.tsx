"use client";

import Link from "next/link";

import { BecomeMakerForm } from "@/components/auth/become-maker-form";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";

export default function BecomeMakerPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (user?.role === "maker") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">You&apos;re already a maker</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Your workshop is on the map. Manage incoming orders from your
          dashboard.
        </p>
        <Button variant="brand" asChild>
          <Link href="/dashboard">Open Dashboard</Link>
        </Button>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Log out to register a workshop</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          You&apos;re signed in as a customer. Log out first, or use a different
          email to register as a maker.
        </p>
        <Button variant="outline" asChild>
          <Link href="/">Back to map</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg flex-1">
      <BecomeMakerForm />
    </div>
  );
}
