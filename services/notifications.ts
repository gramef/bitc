import { getSupabase } from "@/lib/supabase";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Configure foreground notification presentation handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

export type NotificationRow = {
  id: string;
  title: string;
  subtitle: string;
  created_at: string;
  unread: boolean;
  route_id: string;
};

/**
 * Fetch in-app notifications for the logged-in user
 */
export async function fetchNotifications(): Promise<NotificationRow[]> {
  const sb = getSupabase();
  if (!sb) return [];

  const { data: userRes } = await sb.auth.getUser();
  const userId = userRes?.user?.id;

  try {
    let query = sb
      .from("notifications")
      .select("id,title,subtitle,created_at,unread,route_id")
      .order("created_at", { ascending: false })
      .limit(50);

    if (userId) {
      query = query.or(`user_id.eq.${userId},user_id.is.null`);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data as NotificationRow[];
  } catch {
    return [];
  }
}

/**
 * Register device for push notifications and sync token to user profile
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === "web") {
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Push notification permission not granted");
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    // Save token to profile in Supabase
    const sb = getSupabase();
    if (sb && token) {
      const { data: userRes } = await sb.auth.getUser();
      if (userRes?.user?.id) {
        await sb
          .from("profiles")
          .update({ push_token: token })
          .eq("id", userRes.user.id);
      }
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#D6B226",
      });
    }

    return token;
  } catch (error) {
    console.warn("Failed to register for push notifications:", error);
    return null;
  }
}

/**
 * Schedule a local notification (e.g. event starting reminder, booking alert)
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  secondsFromNow = 1,
  data: Record<string, any> = {}
): Promise<string | null> {
  if (Platform.OS === "web") {
    // Web desktop notification
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(title, { body });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification(title, { body });
          }
        });
      }
    }
    return null;
  }

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(secondsFromNow, 1),
      },
    });
    return id;
  } catch (err) {
    console.warn("Error scheduling local notification:", err);
    return null;
  }
}

/**
 * Trigger an instant event ticket registration confirmation alert
 */
export async function sendTicketConfirmedNotification(eventTitle: string, ticketCode: string): Promise<void> {
  await scheduleLocalNotification(
    "🎟️ Pass Confirmed: " + eventTitle,
    `Your weekend brunch pass (${ticketCode}) is ready! Present scannable QR at the venue door.`,
    1,
    { type: "event_ticket", ticketCode }
  );
}

/**
 * Trigger an instant application status update notification
 */
export async function sendApplicationStatusNotification(jobTitle: string, status: string): Promise<void> {
  const statusEmoji = status === "shortlisted" ? "🎉" : "📋";
  await scheduleLocalNotification(
    `${statusEmoji} Application Update: ${jobTitle}`,
    `Your portfolio application was marked as "${status.toUpperCase()}". Check your Candidate Dashboard.`,
    1,
    { type: "job_application", status }
  );
}
