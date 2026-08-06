/**
 * Push notification setup for the SPORTTIME Expo app.
 *
 * Handles requesting permission and registering the Expo push token with the
 * API server so the backend can notify the customer when their order status
 * changes.
 *
 * Uses a dynamic require so the module compiles even when expo-notifications
 * is not yet installed (graceful no-op on web and in simulators).
 *
 * Usage:
 *   import { setupPushNotifications } from '@/services/pushNotifications';
 *   await setupPushNotifications(customerPhone);
 */

import { Platform } from "react-native";
import { registerPushToken } from "./ordersClient";

// Type-only shape — avoids a hard dependency on expo-notifications at
// compile time while still giving TypeScript something to check.
interface ExpoNotificationHandler {
  handleNotification: () => Promise<{
    shouldShowAlert: boolean;
    shouldPlaySound: boolean;
    shouldSetBadge: boolean;
    shouldShowBanner: boolean;
    shouldShowList: boolean;
  }>;
}
interface ExpoNotificationsModule {
  AndroidImportance: { MAX: number };
  setNotificationHandler(handler: { handleNotification: ExpoNotificationHandler["handleNotification"] }): void;
  getPermissionsAsync(): Promise<{ status: string }>;
  requestPermissionsAsync(): Promise<{ status: string }>;
  setNotificationChannelAsync(id: string, options: Record<string, unknown>): Promise<void>;
  getExpoPushTokenAsync(): Promise<{ data: string }>;
  addNotificationReceivedListener(callback: (n: {
    request: { content: { title?: string | null; body?: string | null; data?: Record<string, unknown> | null } };
  }) => void): { remove(): void };
}

function loadNotificationsModule(): ExpoNotificationsModule | null {
  if (Platform.OS === "web") return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
    return require("expo-notifications") as ExpoNotificationsModule;
  } catch {
    return null;
  }
}

/**
 * Request push permissions and register the Expo push token with the server.
 * Call once after the user provides their phone number (e.g. after checkout).
 *
 * @param phone  The customer's phone number (stored locally).
 * @returns  The Expo push token string, or null if unavailable.
 */
export async function setupPushNotifications(
  phone: string,
): Promise<string | null> {
  const Notifications = loadNotificationsModule();
  if (!Notifications) return null;

  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") return null;

    // Android notification channel for order updates
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("orders", {
        name: "Замовлення",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF6A00",
        sound: "default",
      });
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    if (token && phone) {
      await registerPushToken(phone, token);
    }

    return token ?? null;
  } catch {
    // Device doesn't support push notifications or module unavailable
    return null;
  }
}

interface IncomingNotification {
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
}

/**
 * Add a listener for push notifications received while the app is foregrounded.
 * Returns a cleanup function to remove the listener.
 */
export function addNotificationListener(
  onNotification: (notification: IncomingNotification) => void,
): () => void {
  const Notifications = loadNotificationsModule();
  if (!Notifications) return () => undefined;

  try {
    const subscription = Notifications.addNotificationReceivedListener((n) => {
      onNotification({
        title: n.request.content.title ?? undefined,
        body: n.request.content.body ?? undefined,
        data: (n.request.content.data ?? {}) as Record<string, unknown>,
      });
    });
    return () => subscription.remove();
  } catch {
    return () => undefined;
  }
}
