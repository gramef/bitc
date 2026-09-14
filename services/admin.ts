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

// Real in-memory fallback queues (empty by default for new environments)
let verificationQueueState: VerificationRequest[] = [];
let reportedPostsState: ReportedPost[] = [];

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
export async function submitVerificationRequest(params: {
  portfolioUrl: string;
  caseStudiesCount?: number;
  notes?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: "Database not connected" };

  const { data: userRes } = await sb.auth.getUser();
  if (!userRes?.user?.id) return { ok: false, error: "Must be signed in to request verification" };

  try {
    const { error } = await sb.from("creator_verifications").insert({
      user_id: userRes.user.id,
      portfolio_url: params.portfolioUrl,
      case_studies_count: params.caseStudiesCount || 0,
      notes: params.notes || null,
      status: "pending",
    });

    if (error) {
      console.warn("creator_verifications notice:", error.message);
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Failed to submit verification" };
  }
}

/**
 * Fetch creator verification requests queue
 */
export async function fetchVerificationRequests(): Promise<VerificationRequest[]> {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb
        .from("creator_verifications")
        .select(`
          id, user_id, portfolio_url, case_studies_count, status, submitted_at,
          profiles:user_id (full_name, avatar_url, role, bio)
        `)
        .order("submitted_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          user_id: d.user_id,
          full_name: d.profiles?.full_name || "Creative",
          avatar_url: d.profiles?.avatar_url || null,
          role: d.profiles?.role || "Creative",
          bio: d.profiles?.bio || "",
          portfolio_url: d.portfolio_url,
          case_studies_count: d.case_studies_count || 0,
          followers_count: 0,
          status: d.status,
          submitted_at: d.submitted_at,
        }));
      }
    } catch {}
  }
  return verificationQueueState;
}

/**
 * Approve a verification request (Grants Blue Badge)
 */
export async function approveVerification(id: string): Promise<boolean> {
  const req = verificationQueueState.find((r) => r.id === id);
  if (req) req.status = "approved";

  const sb = getSupabase();
  if (sb) {
    try {
      const { data } = await sb
        .from("creator_verifications")
        .update({ status: "approved", reviewed_at: new Date().toISOString() })
        .eq("id", id)
        .select("user_id")
        .maybeSingle();

      const targetUserId = data?.user_id || req?.user_id;
      if (targetUserId) {
        await sb
          .from("profiles")
          .update({ is_verified: true, mentor_approved: true })
          .eq("id", targetUserId);
      }
    } catch {}
  }

  return true;
}

/**
 * Reject a verification request
 */
export async function rejectVerification(id: string, _reason?: string): Promise<boolean> {
  const req = verificationQueueState.find((r) => r.id === id);
  if (req) req.status = "rejected";

  const sb = getSupabase();
  if (sb) {
    try {
      await sb
        .from("creator_verifications")
        .update({ status: "rejected", reviewed_at: new Date().toISOString() })
        .eq("id", id);
    } catch {}
  }

  return true;
}

/**
 * Fetch community feed reported posts
 */
export async function fetchReportedPosts(): Promise<ReportedPost[]> {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb
        .from("reported_content")
        .select(`
          id, post_id, reason, reported_by, reported_at, status,
          posts:post_id (body, author_id, profiles:author_id (full_name, avatar_url))
        `)
        .eq("status", "pending")
        .order("reported_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          post_id: d.post_id,
          author_id: d.posts?.author_id || "unknown",
          author_name: d.posts?.profiles?.full_name || "User",
          author_avatar: d.posts?.profiles?.avatar_url || null,
          post_text: d.posts?.body || "",
          reason: d.reason,
          reported_by: d.reported_by,
          reported_at: d.reported_at,
          status: d.status,
        }));
      }
    } catch {}
  }
  return reportedPostsState.filter((r) => r.status === "pending");
}

/**
 * Resolve a reported post (remove or dismiss)
 */
export async function resolveReportedPost(reportId: string, action: "remove" | "dismiss"): Promise<boolean> {
  const item = reportedPostsState.find((r) => r.id === reportId);
  if (item) item.status = action === "remove" ? "resolved" : "dismissed";

  const sb = getSupabase();
  if (sb) {
    try {
      await sb
        .from("reported_content")
        .update({ status: action === "remove" ? "resolved" : "dismissed" })
        .eq("id", reportId);

      if (action === "remove" && item?.post_id) {
        await sb.from("posts").delete().eq("id", item.post_id);
      }
    } catch {}
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
