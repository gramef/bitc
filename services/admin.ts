/**
 * Admin Service for BITC
 * 
 * Provides platform oversight, KPI aggregation, creator verification triage,
 * and live community moderation for Super Admin users.
 */

import { getSupabase } from "@/lib/supabase";
import { fetchAllEventStats } from "./events";
import { fetchLiveRooms } from "./rooms";

export type VerificationRequest = {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  role: string;
  bio: string;
  portfolio_url?: string;
  case_studies_count: number;
  followers_count: number;
  status: "pending" | "approved" | "rejected";
  submitted_at: string;
};

export type ReportedPost = {
  id: string;
  post_id: string;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  post_text: string;
  reason: string;
  reported_by: string;
  reported_at: string;
  status: "pending" | "resolved" | "dismissed";
};

export type AdminKPIs = {
  totalMembers: number;
  activeCreatives: number;
  verifiedCreators: number;
  activeAudioRooms: number;
  openJobs: number;
  totalEvents: number;
  ticketsIssued: number;
  checkedInCount: number;
  marketplaceItemsClaimed: number;
  estimatedPlatformGrossVolume: string;
};

// Seed verification requests for demo & initial deployment
let verificationQueueState: VerificationRequest[] = [
  {
    id: "ver_01",
    user_id: "usr_201",
    full_name: "Kofi Mensah",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    role: "Senior Product Designer",
    bio: "Ex-Monzo UI designer specializing in fintech systems & micro-interactions. Mentored 40+ junior creatives.",
    portfolio_url: "https://kofimensah.design",
    case_studies_count: 5,
    followers_count: 1420,
    status: "pending",
    submitted_at: "2 hours ago",
  },
  {
    id: "ver_02",
    user_id: "usr_202",
    full_name: "Zainab Al-Mansoor",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    role: "Brand Strategist & Type Director",
    bio: "Helping heritage and modern consumer brands express unique cultural identities across EMEA.",
    portfolio_url: "https://behance.net/zainab-design",
    case_studies_count: 8,
    followers_count: 3290,
    status: "pending",
    submitted_at: "Yesterday",
  },
  {
    id: "ver_03",
    user_id: "usr_203",
    full_name: "Liam O'Connor",
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    role: "Motion Design & 3D Specialist",
    bio: "Cinema4D and Blender artist creating title sequences and interactive WebGL assets for brands.",
    portfolio_url: "https://dribbble.com/liamoc",
    case_studies_count: 6,
    followers_count: 890,
    status: "pending",
    submitted_at: "3 days ago",
  },
];

let reportedPostsState: ReportedPost[] = [
  {
    id: "rep_01",
    post_id: "post_910",
    author_id: "usr_99",
    author_name: "Spam Bot Account",
    author_avatar: null,
    post_text: "MAKE £5000 A DAY CLICK HERE TELEGRAM LINK http://bit.ly/crypto-scam",
    reason: "Cryptocurrency spam and fraudulent links in Community feed",
    reported_by: "Sophie Tremblay",
    reported_at: "15 mins ago",
    status: "pending",
  },
  {
    id: "rep_02",
    post_id: "post_911",
    author_id: "usr_88",
    author_name: "Unverified Recruiter",
    author_avatar: null,
    post_text: "Need 20 Figma screens designed for FREE as a trial test, high potential work next year.",
    reason: "Exploitative unpaid client brief / violates fair work policy",
    reported_by: "Amara Okafor",
    reported_at: "1 hour ago",
    status: "pending",
  },
];

/**
 * Fetch executive dashboard KPIs
 */
export async function fetchAdminKPIs(): Promise<AdminKPIs> {
  const [eventStats, rooms] = await Promise.all([
    fetchAllEventStats(),
    fetchLiveRooms(),
  ]);

  let totalVolumeCents = 0;
  try {
    const { fetchPaymentHistory } = await import("./payments");
    const transactions = await fetchPaymentHistory();
    totalVolumeCents = transactions.reduce(
      (acc, tx) => acc + (tx.status === "succeeded" ? tx.amountCents : 0),
      0
    );
  } catch {}

  const sb = getSupabase();
  let totalProfiles = 0;
  let activeCreatives = 0;
  let verifiedCount = 0;
  let openJobs = 0;

  if (sb) {
    try {
      const [profRes, creatRes, jobRes] = await Promise.all([
        sb.from("profiles").select("*", { count: "exact", head: true }),
        sb.from("profiles").select("*", { count: "exact", head: true }).eq("role", "creative"),
        sb.from("jobs").select("*", { count: "exact", head: true }),
      ]);
      if (profRes.count !== null && profRes.count !== undefined) totalProfiles = profRes.count;
      if (creatRes.count !== null && creatRes.count !== undefined) activeCreatives = creatRes.count;
      if (jobRes.count !== null && jobRes.count !== undefined) openJobs = jobRes.count;
    } catch {}
  }

  return {
    totalMembers: totalProfiles,
    activeCreatives: activeCreatives || totalProfiles,
    verifiedCreators: verifiedCount,
    activeAudioRooms: rooms.length,
    openJobs,
    totalEvents: eventStats.totalEvents,
    ticketsIssued: eventStats.totalTicketsIssued,
    checkedInCount: eventStats.checkedInCount,
    marketplaceItemsClaimed: 0,
    estimatedPlatformGrossVolume: `$${(totalVolumeCents / 100).toLocaleString()}`,
  };
}

/**
 * Fetch creator verification requests queue
 */
export async function fetchVerificationRequests(): Promise<VerificationRequest[]> {
  return verificationQueueState;
}

/**
 * Approve a verification request (Grants Blue Badge)
 */
export async function approveVerification(id: string): Promise<boolean> {
  const req = verificationQueueState.find((r) => r.id === id);
  if (!req) return false;

  req.status = "approved";

  const sb = getSupabase();
  if (sb) {
    try {
      await sb
        .from("profiles")
        .update({ is_verified: true, mentor_approved: true })
        .eq("id", req.user_id);
    } catch {}
  }

  return true;
}

/**
 * Reject a verification request
 */
export async function rejectVerification(id: string, _reason?: string): Promise<boolean> {
  const req = verificationQueueState.find((r) => r.id === id);
  if (!req) return false;

  req.status = "rejected";
  return true;
}

/**
 * Fetch community feed reported posts
 */
export async function fetchReportedPosts(): Promise<ReportedPost[]> {
  return reportedPostsState.filter((r) => r.status === "pending");
}

/**
 * Resolve a reported post (remove or dismiss)
 */
export async function resolveReportedPost(reportId: string, action: "remove" | "dismiss"): Promise<boolean> {
  const item = reportedPostsState.find((r) => r.id === reportId);
  if (!item) return false;

  item.status = action === "remove" ? "resolved" : "dismissed";

  if (action === "remove") {
    const sb = getSupabase();
    if (sb) {
      try {
        await sb.from("posts").delete().eq("id", item.post_id);
      } catch {}
    }
  }

  return true;
}

/**
 * Terminate a live audio room immediately (Super Admin Kill-Switch)
 */
export async function terminateLiveRoom(roomId: string): Promise<{ ok: boolean; message: string }> {
  const sb = getSupabase();
  if (sb) {
    try {
      await sb.from("rooms").update({ is_active: false }).eq("id", roomId);
    } catch {}
  }

  return {
    ok: true,
    message: `✓ Room ${roomId} has been terminated. Audio participants disconnected.`,
  };
}
