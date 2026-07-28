"use client";

import { useEffect, useRef } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { useMessageInbox } from "@/hooks/use-message-inbox";
import { usePendingOrdersCount } from "@/hooks/use-pending-orders-count";
import { useTranslations } from "@/i18n/locale-provider";
import { showBrowserNotification } from "@/lib/notifications/browser-notifications";
import { hasMakerAccess } from "@/types/user";

/**
 * Browser notifications при новých zprávách / objednávkách (když je app na pozadí).
 */
export function AppNotificationWatcher() {
  const { user } = useAuth();
  const { t } = useTranslations();
  const enabled = Boolean(user);
  const isMaker = user ? hasMakerAccess(user) : false;

  const { totalUnread, items } = useMessageInbox(enabled);
  const { count: pendingOrders } = usePendingOrdersCount(enabled && isMaker);

  const prevUnread = useRef<number | null>(null);
  const prevPending = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      prevUnread.current = null;
      prevPending.current = null;
      return;
    }

    if (prevUnread.current !== null && totalUnread > prevUnread.current) {
      const latest = items[0];
      showBrowserNotification(t("notifications.newMessageTitle"), {
        body: latest
          ? t("notifications.newMessageBody", {
              name: latest.senderName,
              preview: latest.preview,
            })
          : t("inbox.title"),
        tag: "printshare-message",
        url: latest ? `/orders/${latest.orderId}` : "/orders",
      });
    }
    prevUnread.current = totalUnread;
  }, [enabled, items, t, totalUnread]);

  useEffect(() => {
    if (!enabled || !isMaker) {
      prevPending.current = null;
      return;
    }

    if (prevPending.current !== null && pendingOrders > prevPending.current) {
      showBrowserNotification(t("notifications.newOrderTitle"), {
        body: t("notifications.newOrderBody", { count: pendingOrders }),
        tag: "printshare-order",
        url: "/orders",
      });
    }
    prevPending.current = pendingOrders;
  }, [enabled, isMaker, pendingOrders, t]);

  return null;
}
