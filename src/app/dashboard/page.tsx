"use client";

import Link from "next/link";

import { useAuth } from "@/components/auth/auth-provider";
import { MakerDashboard } from "@/components/maker/maker-dashboard";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Maker dashboard</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Log in with your maker account to manage workshop settings and
          materials.
        </p>
        <Button variant="brand" asChild>
          <Link href="/login">Log In</Link>
        </Button>
      </div>
    );
  }

  if (user.role !== "maker") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Maker access only</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          This page is for registered workshops. Want to list your printer?{" "}
          <Link href="/become-maker" className="font-medium text-brand hover:underline">
            Become a maker
          </Link>
        </p>
        <Button variant="outline" asChild>
          <Link href="/">Back to map</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Workshop dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update your profile, set a minimum order price, and manage plastics.
        </p>
      </div>

      <MakerDashboard />
    </div>
  );
}
