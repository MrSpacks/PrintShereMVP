export function canUseBrowserNotifications(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getBrowserNotificationPermission():
  | NotificationPermission
  | "unsupported" {
  if (!canUseBrowserNotifications()) return "unsupported";
  return Notification.permission;
}

export async function requestBrowserNotificationPermission(): Promise<
  NotificationPermission | "unsupported"
> {
  if (!canUseBrowserNotifications()) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

/** Уведомление, когда вкладка в фоне или свёрнута (как в приложении). */
export function showBrowserNotification(
  title: string,
  options?: NotificationOptions & { url?: string }
): void {
  if (!canUseBrowserNotifications()) return;
  if (Notification.permission !== "granted") return;
  if (typeof document !== "undefined" && document.visibilityState === "visible") {
    return;
  }

  const { url, ...rest } = options ?? {};

  try {
    const notification = new Notification(title, {
      icon: "/icon.png",
      badge: "/icon.png",
      ...rest,
    });

    if (url) {
      notification.onclick = () => {
        window.focus();
        window.location.href = url;
        notification.close();
      };
    }
  } catch {
    // Safari / older browsers
  }
}
