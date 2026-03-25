import type { ChoreWithStatus } from "@/types";

const STORAGE_PREFIX = "chore-notifications-";

/**
 * Check approaching chore deadlines and fire browser notifications.
 * Deduplicates per chore per day using localStorage.
 */
export async function checkAndNotifyChores(
  chores: ChoreWithStatus[]
): Promise<void> {
  // Skip if notifications aren't supported or not granted
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const today = new Date().toISOString().slice(0, 10);
  const storageKey = STORAGE_PREFIX + today;

  // Clean up old date keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX) && key !== storageKey) {
      localStorage.removeItem(key);
    }
  }

  // Load already-notified IDs for today
  let notified: string[];
  try {
    notified = JSON.parse(localStorage.getItem(storageKey) || "[]");
  } catch {
    notified = [];
  }

  const urgentChores = chores.filter(
    (c) =>
      !c.completedToday &&
      c.daysUntilDeadline <= 1 &&
      !notified.includes(c.id)
  );

  if (urgentChores.length === 0) return;

  const newNotified = [...notified];

  for (const chore of urgentChores) {
    let body: string;
    let icon = "\u{1F9F9}";

    if (chore.daysUntilDeadline < 0) {
      body = `\u23F0 ${chore.name} is overdue!`;
      icon = "\u23F0";
    } else if (chore.daysUntilDeadline === 0) {
      body = `\u{1F9F9} ${chore.name} is due today!`;
    } else {
      body = `\u{1F4CB} ${chore.name} is due tomorrow`;
      icon = "\u{1F4CB}";
    }

    try {
      const reg = await navigator.serviceWorker?.ready;
      if (reg) {
        await reg.showNotification("keepsailing", {
          body,
          icon: "/icons/icon-192.png",
          badge: "/icons/icon-192.png",
          tag: `chore-${chore.id}`,
          data: { url: "/" },
        });
      } else {
        new Notification("keepsailing", { body, icon });
      }
    } catch {
      // Silent fail — notification APIs can throw in some environments
    }

    newNotified.push(chore.id);
  }

  localStorage.setItem(storageKey, JSON.stringify(newNotified));
}

/**
 * Request notification permission with a non-intrusive approach.
 * Returns true if permission is granted.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;

  const result = await Notification.requestPermission();
  return result === "granted";
}
