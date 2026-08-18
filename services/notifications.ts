import { getSupabase } from "@/lib/supabase";

export type NotificationRow = {
  id: string;
  title: string;
  subtitle: string;
  created_at: string;
  unread: boolean;
  route_id: string;
};

export async function fetchNotifications(): Promise<NotificationRow[]> {
  const sb = getSupabase();
  const fallback: NotificationRow[] = [
    {
      id: "n1",
      title: "Your application was viewed",
      subtitle: "TalentWave reviewed your application for “UI Designer”.",
      created_at: new Date().toISOString(),
      unread: true,
      route_id: "application-viewed",
    },
    {
      id: "n2",
      title: "Design Masterclass",
      subtitle: "Starts in 30 minutes. Don’t miss out!",
      created_at: new Date().toISOString(),
      unread: true,
      route_id: "design-masterclass",
    },
    {
      id: "n3",
      title: "Interview Scheduled",
      subtitle: "Your interview for “Product Designer” is set for Thursday, 3 PM.",
      created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      unread: false,
      route_id: "interview-scheduled",
    },
    {
      id: "n4",
      title: "Profile Strength Increased",
      subtitle: "You added new certification. Your profile is 80% complete.",
      created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      unread: false,
      route_id: "profile-strength-increased",
    },
  ];
  if (!sb) {
    return fallback;
  }
  const { data, error } = await sb
    .from("notifications")
    .select("id,title,subtitle,created_at,unread,route_id")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error || !data) {
    return fallback;
  }
  return data as NotificationRow[];
}
