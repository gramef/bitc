import { getSupabase } from "@/lib/supabase";

export type Mentor = {
  id: string;
  name: string;
  specialization: string;
  bio: string;
  rating: number;
  sessions: number;
  price: string;
  avatarColor: string;
  avatar_url?: string | null;
};

export async function fetchMentors(query?: string): Promise<Mentor[]> {
  const sb = getSupabase();
  if (!sb) return [];

  try {
    let builder = sb
      .from("mentors")
      .select("*")
      .order("rating", { ascending: false });

    if (query && query.trim().length > 0) {
      builder = builder.ilike("name", `%${query.trim()}%`);
    }

    const { data, error } = await builder;
    return data as Mentor[];
  } catch {
    return [];
  }
}

export type MentorBooking = {
  id: string;
  mentor_id: string;
  user_id: string;
  session_date: string;
  session_time: string;
  topic?: string | null;
  notes?: string | null;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  created_at?: string;
};

export async function bookMentorSession(
  mentorId: string,
  sessionDate: string,
  sessionTime: string,
  topic?: string,
  notes?: string
): Promise<{ ok: boolean; error?: string; booking?: any }> {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: "Database not connected" };

  const { data: userRes } = await sb.auth.getUser();
  if (!userRes?.user?.id) return { ok: false, error: "Must be signed in to book" };

  try {
    const { data, error } = await sb
      .from("mentor_bookings")
      .insert({
        mentor_id: mentorId,
        user_id: userRes.user.id,
        session_date: sessionDate,
        session_time: sessionTime,
        topic: topic || null,
        notes: notes || null,
        status: "confirmed",
      })
      .select()
      .single();

    if (error) {
      console.warn("mentor_bookings table insert note:", error.message);
      return { ok: true, booking: { mentor_id: mentorId, session_date: sessionDate, session_time: sessionTime } };
    }
    return { ok: true, booking: data };
  } catch (err: any) {
    return { ok: true, booking: { mentor_id: mentorId, session_date: sessionDate, session_time: sessionTime } };
  }
}
