import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export type ReminderResult =
  | { ok: true; id: string }
  | { ok: false; reason: "web" | "permission" | "unavailable" };

export async function scheduleTaskReminder(title: string, minutes = 30, dueAt?: string): Promise<ReminderResult> {
  if (Platform.OS === "web") return { ok: false, reason: "web" };

  try {
    const current = await Notifications.getPermissionsAsync();
    const permission = current.granted ? current : await Notifications.requestPermissionsAsync();
    if (!permission.granted) return { ok: false, reason: "permission" };

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("jarvis-reminders", {
        name: "Lembretes Jarvis",
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 150, 250],
        lightColor: "#78F3E5",
      });
    }

    const dueDate = dueAt ? new Date(dueAt) : null;
    const trigger = dueDate && dueDate.getTime() > Date.now()
      ? { type: Notifications.SchedulableTriggerInputTypes.DATE as const, date: dueDate, ...(Platform.OS === "android" ? { channelId: "jarvis-reminders" } : {}) }
      : { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL as const, seconds: Math.max(60, minutes * 60), repeats: false, ...(Platform.OS === "android" ? { channelId: "jarvis-reminders" } : {}) };

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Jarvis · próximo passo",
        body: title,
        sound: "default",
      },
      trigger,
    });
    return { ok: true, id };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}
