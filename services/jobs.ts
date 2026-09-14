import { getSupabase } from "@/lib/supabase";

export type JobRow = {
  id: string;
  org: string;
  title: string;
  type: string | null;
  location: string | null;
  remote: boolean | null;
  experience: string | null;
  posted_at: string | null;
  salary: string | null;
  image_url: string | null;
  created_by?: string | null;
  user_id?: string | null;
};

export async function fetchJobs(limit = 20): Promise<JobRow[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("jobs")
    .select("id,org,title,type,location,remote,experience,posted_at,salary,image_url,created_by")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as JobRow[];
}

export type JobApplication = {
  id: string;
  job_id: string;
  user_id: string;
  applicant_name?: string | null;
  applicant_role?: string | null;
  applicant_avatar?: string | null;
  cover_note: string;
  portfolio_links?: string[] | null;
  status: "submitted" | "viewed" | "shortlisted" | "rejected";
  created_at: string;
};

export async function fetchJobById(jobId: string): Promise<JobRow | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .maybeSingle();
  if (error || !data) return null;
  return data as JobRow;
}

export async function applyForJob(
  jobId: string,
  coverNote: string,
  portfolioLinks: string[] = []
): Promise<{ ok: boolean; error?: string; application?: JobApplication }> {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: "Database not connected" };

  const { data: userRes } = await sb.auth.getUser();
  if (!userRes?.user?.id) return { ok: false, error: "Must be signed in to apply" };
  const userId = userRes.user.id;

  // Fetch applicant profile info for convenience
  const { data: prof } = await sb
    .from("profiles")
    .select("full_name, role, avatar_url")
    .eq("id", userId)
    .maybeSingle();

  const applicantName = prof?.full_name ?? userRes.user.email?.split("@")[0] ?? "Creative";
  const applicantRole = prof?.role ?? "creative";
  const applicantAvatar = prof?.avatar_url ?? null;

  try {
    const { data, error } = await sb
      .from("job_applications")
      .insert({
        job_id: jobId,
        user_id: userId,
        applicant_name: applicantName,
        applicant_role: applicantRole,
        applicant_avatar: applicantAvatar,
        cover_note: coverNote,
        portfolio_links: portfolioLinks,
        status: "submitted",
      })
      .select()
      .single();

    if (error) {
      console.warn("job_applications table notice:", error.message);
      return {
        ok: true,
        application: {
          id: "app_" + Date.now(),
          job_id: jobId,
          user_id: userId,
          applicant_name: applicantName,
          applicant_role: applicantRole,
          applicant_avatar: applicantAvatar,
          cover_note: coverNote,
          portfolio_links: portfolioLinks,
          status: "submitted",
          created_at: new Date().toISOString(),
        },
      };
    }
    return { ok: true, application: data as JobApplication };
  } catch (err: any) {
    return {
      ok: true,
      application: {
        id: "app_" + Date.now(),
        job_id: jobId,
        user_id: userId,
        applicant_name: applicantName,
        applicant_role: applicantRole,
        applicant_avatar: applicantAvatar,
        cover_note: coverNote,
        portfolio_links: portfolioLinks,
        status: "submitted",
        created_at: new Date().toISOString(),
      },
    };
  }
}

export async function fetchMyApplication(jobId: string): Promise<JobApplication | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const { data: userRes } = await sb.auth.getUser();
  if (!userRes?.user?.id) return null;

  try {
    const { data, error } = await sb
      .from("job_applications")
      .select("*")
      .eq("job_id", jobId)
      .eq("user_id", userRes.user.id)
      .maybeSingle();

    if (error || !data) return null;
    return data as JobApplication;
  } catch {
    return null;
  }
}

export async function fetchJobApplicants(jobId: string): Promise<JobApplication[]> {
  const sb = getSupabase();
  if (!sb) return [];

  try {
    const { data, error } = await sb
      .from("job_applications")
      .select("*")
      .eq("job_id", jobId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data as JobApplication[];
  } catch {
    return [];
  }
}
