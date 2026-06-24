import Link from "next/link";
import { Package } from "lucide-react";

import { getOrderTotalCzk } from "@/lib/orders/map-order";
import type { OrderResponse, OrderStatus } from "@/types/order";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "bg-amber-50 text-amber-700",
  confirmed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-zinc-100 text-zinc-600",
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

interface OrderCardProps {
  order: OrderResponse;
  view: "customer" | "maker" | "admin";
}

export function OrderCard({ order, view }: OrderCardProps) {
  const total = getOrderTotalCzk(order);

  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
            <h2 className="truncate text-sm font-semibold text-foreground">
              {order.fileName}
            </h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {view === "maker" ? "Customer order" : order.makerName}
          </p>
        </div>

        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
            STATUS_STYLES[order.status]
          )}
        >
          {STATUS_LABELS[order.status]}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-xs text-muted-foreground">Weight</dt>
          <dd className="font-medium">{order.weightGrams}g</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Print</dt>
          <dd className="font-medium">{order.printCostCzk} CZK</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Delivery</dt>
          <dd className="font-medium">
            {order.deliveryMethod === "zasilkovna"
              ? `Zásilkovna ${order.deliveryPriceCzk} CZK`
              : "Pickup"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Total</dt>
          <dd className="font-semibold text-brand">
            {total} CZK
          </dd>
        </div>
      </dl>

      <p className="mt-3 text-xs text-muted-foreground">
        Ordered {formatDate(order.createdAt)} · #{order.id.slice(-8)}
      </p>
    </article>
  );
}

interface OrdersEmptyStateProps {
  role: "customer" | "maker" | "admin";
}

export function OrdersEmptyState({ role }: OrdersEmptyStateProps) {
  const message =
    role === "maker"
      ? "No incoming orders yet. Customers will appear here after they place a print request."
      : "You haven't placed any orders yet. Upload a model and pick a maker on the map.";

  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
      <Package className="mx-auto h-10 w-10 text-muted-foreground" />
      <p className="mt-4 text-sm text-muted-foreground">{message}</p>
      {role === "customer" && (
        <Link
          href="/"
          className="mt-4 inline-block text-sm font-semibold text-brand hover:underline"
        >
          Go to map →
        </Link>
      )}
    </div>
  );
}
