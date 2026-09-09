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
  if (!sb) return [];

  const { data, error } = await sb
    .from("notifications")
    .select("id,title,subtitle,created_at,unread,route_id")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) return [];
  return data as NotificationRow[];
}
