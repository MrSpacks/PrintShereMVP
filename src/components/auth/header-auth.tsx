"use client";

import Link from "next/link";
import { LogOut, LayoutDashboard, Package, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";

export function HeaderAuth() {
  const { user, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="h-8 w-24 animate-pulse rounded-md bg-muted" aria-hidden />
    );
  }

  if (!user) {
    return (
      <>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/login">Log In</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/signup">Sign Up</Link>
        </Button>
      </>
    );
  }

  return (
    <>
      {user.role === "maker" && (
        <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
          <Link href="/dashboard" className="gap-1.5">
            <LayoutDashboard className="h-3.5 w-3.5" aria-hidden />
            Dashboard
          </Link>
        </Button>
      )}

      <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
        <Link href="/orders" className="gap-1.5">
          <Package className="h-3.5 w-3.5" aria-hidden />
          Orders
        </Link>
      </Button>

      <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
        <User className="h-4 w-4" aria-hidden />
        <span className="max-w-[140px] truncate font-medium text-foreground">
          {user.name}
        </span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">
          {user.role}
        </span>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => void logout()}
        className="gap-1.5"
      >
        <LogOut className="h-3.5 w-3.5" aria-hidden />
        Log Out
      </Button>
    </>
  );
}
