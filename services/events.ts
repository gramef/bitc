import { getSupabase } from "@/lib/supabase";

export type EventRow = {
  id: string;
  title: string;
  org: string | null;
  city: string | null;
  event_date: string | null;
  image_url: string | null;
};

export async function fetchEvents(limit = 20): Promise<EventRow[]> {
  const sb = getSupabase();
  const fallback: EventRow[] = [
    {
      id: "e1",
      title: "Halloween Rave",
      org: "Josh Banks Studios",
      city: "Birmingham, UK",
      event_date: "2025-11-31",
      image_url: null,
    },
    {
      id: "e2",
      title: "Design Meetup",
      org: "BITC Community",
      city: "London, UK",
      event_date: "2025-12-02",
      image_url: null,
    },
  ];
  if (!sb) return fallback;
  const { data, error } = await sb
    .from("events")
    .select("id,title,org,city,event_date,image_url")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return fallback;
  return data as EventRow[];
}
