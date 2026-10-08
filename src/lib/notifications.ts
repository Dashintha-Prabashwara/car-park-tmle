// HTML5 Desktop Notification helper

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return "denied";
  return Notification.permission;
}

export function sendBrowserNotification(title: string, body: string, icon = "/favicon.ico"): void {
  if (!isNotificationSupported() || Notification.permission !== "granted") {
    return;
  }

  try {
    new Notification(title, {
      body,
      icon,
      badge: icon,
      silent: true, // We manage our own synthesized chime
    });
  } catch {
    // Ignore restricted notification context
  }
}
