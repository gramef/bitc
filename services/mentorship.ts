import { getSupabase } from "@/lib/supabase";
import { scheduleLocalNotification } from "./notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

export const DEFAULT_MENTORS: Mentor[] = [
  {
    id: "mentor-1",
    name: "Amara Okafor",
    specialization: "Principal Brand Identity & Art Direction",
    bio: "Ex-Pentagram collaborator with 10+ years crafting identities for African & global consumer tech and lifestyle brands.",
    rating: 4.95,
    sessions: 42,
    price: "Free (Community)",
    avatarColor: "#6C5CE7",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "mentor-2",
    name: "David Kalu",
    specialization: "3D Motion Design & Cinema 4D",
    bio: "Lead 3D animator and motion director. Teaches portfolio curation, client proposals, and advanced Cinema4D / Octane workflows.",
    rating: 4.9,
    sessions: 38,
    price: "Free (Community)",
    avatarColor: "#00B894",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "mentor-3",
    name: "Chioma Adebayo",
    specialization: "Senior Product & Design Systems Lead",
    bio: "Staff Product Designer leading scalable design systems across fintech & mobile banking. Focus on career growth and UX teardowns.",
    rating: 5.0,
    sessions: 64,
    price: "Free (Community)",
    avatarColor: "#E17055",
    avatar_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "mentor-4",
    name: "Tunde Bakare",
    specialization: "Fullstack Mobile & Creative Engineering",
    bio: "Engineering lead bridging React Native, WebGL, and interactive web. Helps creatives build technical products and ship independently.",
    rating: 4.88,
    sessions: 29,
    price: "Free (Community)",
    avatarColor: "#0984E3",
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "mentor-5",
    name: "Zainab Bello",
    specialization: "Creative Studio Founder & Pricing Strategy",
    bio: "Founded a boutique 15-person design studio. Mentors designers on client negotiations, contracts, value pricing, and scaling.",
    rating: 4.97,
    sessions: 51,
    price: "Free (Community)",
    avatarColor: "#FDCB6E",
    avatar_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "mentor-6",
    name: "Kemi Martins",
    specialization: "Commercial Photography & Visual Storytelling",
    bio: "Editorial and commercial photographer published in Vogue & GQ. Reviews lighting, photo direction, client briefs, and contracts.",
    rating: 4.92,
    sessions: 33,
    price: "Free (Community)",
    avatarColor: "#A29BFE",
    avatar_url: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=400&q=80",
  },
];

export async function fetchMentors(query?: string): Promise<Mentor[]> {
  const sb = getSupabase();
  let list: Mentor[] = [];

  if (sb) {
    try {
      let builder = sb
        .from("mentors")
        .select("*")
        .order("rating", { ascending: false });

      if (query && query.trim().length > 0) {
        builder = builder.ilike("name", `%${query.trim()}%`);
      }

      const { data, error } = await builder;
      if (!error && data && data.length > 0) {
        list = data as Mentor[];
      }
    } catch {
      // mentors table might not exist
    }

    // If mentors table returned empty, also check profiles marked as mentors
    if (list.length === 0) {
      try {
        const { data: profMentors } = await sb
          .from("profiles")
          .select("id, full_name, bio, avatar_url, role, rating")
          .or("is_mentor.eq.true,mentor_approved.eq.true")
          .limit(10);

        if (profMentors && profMentors.length > 0) {
          list = profMentors.map((p) => ({
            id: p.id,
            name: p.full_name || "Community Mentor",
            specialization: p.bio?.slice(0, 45) || "Creative Specialist",
            bio: p.bio || "Available for portfolio reviews and 1:1 creative mentoring.",
            rating: Number(p.rating || 4.9),
            sessions: 12,
            price: "Free (Community)",
            avatarColor: "#6C5CE7",
            avatar_url: p.avatar_url,
          }));
        }
      } catch {}
    }
  }

  // Fallback to rich curated mentors list
  if (list.length === 0) {
    list = DEFAULT_MENTORS;
  }

  if (query && query.trim().length > 0) {
    const q = query.toLowerCase();
    list = list.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.specialization.toLowerCase().includes(q) ||
        m.bio.toLowerCase().includes(q)
    );
  }

  return list;
}

export type MentorBooking = {
  id: string;
  mentor_id: string;
  mentor_name?: string;
  user_id: string;
  session_date: string;
  session_time: string;
  topic?: string | null;
  notes?: string | null;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  created_at?: string;
};

const BOOKINGS_STORAGE_KEY = "@bitc_mentor_bookings";

export async function bookMentorSession(
  mentorId: string,
  sessionDate: string,
  sessionTime: string,
  topic?: string,
  notes?: string,
  mentorName?: string
): Promise<{ ok: boolean; error?: string; booking?: MentorBooking }> {
  const sb = getSupabase();
  let userId = "guest_user";
  if (sb) {
    const { data: userRes } = await sb.auth.getUser();
    if (userRes?.user?.id) userId = userRes.user.id;
  }

  const newBooking: MentorBooking = {
    id: `book_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    mentor_id: mentorId,
    mentor_name: mentorName,
    user_id: userId,
    session_date: sessionDate,
    session_time: sessionTime,
    topic: topic || null,
    notes: notes || null,
    status: "confirmed",
    created_at: new Date().toISOString(),
  };

  // 1. Persist to local storage
  try {
    const raw = await AsyncStorage.getItem(`${BOOKINGS_STORAGE_KEY}_${userId}`);
    const existing: MentorBooking[] = raw ? JSON.parse(raw) : [];
    existing.unshift(newBooking);
    await AsyncStorage.setItem(`${BOOKINGS_STORAGE_KEY}_${userId}`, JSON.stringify(existing));
  } catch {}

  // 2. Attempt Supabase insert if table exists
  if (sb && userId !== "guest_user") {
    try {
      await sb.from("mentor_bookings").insert({
        mentor_id: mentorId,
        user_id: userId,
        session_date: sessionDate,
        session_time: sessionTime,
        topic: topic || null,
        notes: notes || null,
        status: "confirmed",
      });
    } catch {}
  }

  // 3. Trigger instant push / in-app notification
  const displayTarget = mentorName ? `with ${mentorName}` : "session";
  scheduleLocalNotification(
    "🎉 Mentorship Booked!",
    `Your 1:1 ${displayTarget} is confirmed for ${sessionDate} at ${sessionTime}.`,
    1,
    { type: "mentor_booking", bookingId: newBooking.id }
  ).catch(() => {});

  return { ok: true, booking: newBooking };
}

export async function fetchMyMentorBookings(): Promise<MentorBooking[]> {
  const sb = getSupabase();
  let userId = "guest_user";
  if (sb) {
    const { data: userRes } = await sb.auth.getUser();
    if (userRes?.user?.id) userId = userRes.user.id;
  }

  try {
    const raw = await AsyncStorage.getItem(`${BOOKINGS_STORAGE_KEY}_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
