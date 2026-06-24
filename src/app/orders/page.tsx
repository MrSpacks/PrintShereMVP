"use client";

import Link from "next/link";

import { OrderCard, OrdersEmptyState } from "@/components/orders/order-card";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { useOrders } from "@/hooks/use-orders";
import type { UserRole } from "@/types/user";

const PAGE_TITLES: Record<UserRole, { title: string; subtitle: string }> = {
  customer: {
    title: "My Orders",
    subtitle: "Track your 3D print requests with local makers in Prague.",
  },
  maker: {
    title: "Incoming Orders",
    subtitle: "Print jobs placed with your workshop.",
  },
  admin: {
    title: "All Orders",
    subtitle: "Overview of every order on the platform.",
  },
};

export default function OrdersPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { orders, role, isLoading, error, refetch } = useOrders(Boolean(user));

  if (isAuthLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">My Orders</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Log in to see your print orders and track their status.
        </p>
        <Button variant="brand" asChild>
          <Link href="/login">Log In</Link>
        </Button>
      </div>
    );
  }

  const pageMeta = PAGE_TITLES[user.role];
  const listRole = role ?? user.role;

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {pageMeta.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {pageMeta.subtitle}
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={refetch}>
          Refresh
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((key) => (
            <div
              key={key}
              className="h-36 animate-pulse rounded-xl bg-muted"
              aria-hidden
            />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <OrdersEmptyState role={listRole} />
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order.id}>
              <OrderCard order={order} view={listRole} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
