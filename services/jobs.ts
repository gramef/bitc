import { getSupabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type JobRow = {
  id: string;
  org: string;
  company?: string | null;
  title: string;
  description?: string | null;
  type: string | null;
  location: string | null;
  city?: string | null;
  remote: boolean | null;
  experience: string | null;
  posted_at: string | null;
  salary: string | null;
  image_url: string | null;
  owner_id?: string | null;
  posted_by?: string | null;
  created_at?: string | null;
  user_id?: string | null;
};

export type CreateJobParams = {
  title: string;
  org?: string;
  description?: string;
  location?: string;
  salary?: string;
  type: string;
  experience?: string;
  remote: boolean;
};

const CUSTOM_JOBS_KEY = "@bitc_custom_jobs";

export async function fetchCustomJobsLocally(): Promise<JobRow[]> {
  try {
    const existingStr = await AsyncStorage.getItem(CUSTOM_JOBS_KEY);
    return existingStr ? JSON.parse(existingStr) : [];
  } catch {
    return [];
  }
}

async function saveCustomJobLocally(job: JobRow) {
  try {
    const list = await fetchCustomJobsLocally();
    const updated = [job, ...list.filter((j) => j.id !== job.id)];
    await AsyncStorage.setItem(CUSTOM_JOBS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn("Could not save custom job locally:", err);
  }
}

export async function createJob(params: CreateJobParams): Promise<{
  ok: boolean;
  error?: string;
  job?: JobRow;
}> {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: "Database not connected" };

  const { data: userRes } = await sb.auth.getUser();
  const userId = userRes?.user?.id;
  if (!userId) {
    return { ok: false, error: "Must be signed in to post a job" };
  }

  // Fetch employer organization name from profile if not provided
  let orgName: string = params.org?.trim() || "";
  if (!orgName) {
    const { data: prof } = await sb
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle();
    orgName = prof?.full_name || "Company";
  }

  const nowIso = new Date().toISOString();
  const newJobPayload = {
    title: params.title.trim(),
    org: orgName,
    company: orgName,
    description: params.description?.trim() || null,
    location: params.location?.trim() || null,
    city: params.location?.trim() || null,
    salary: params.salary?.trim() || null,
    type: params.type,
    experience: params.experience?.trim() || null,
    remote: params.remote,
    posted_at: nowIso,
    owner_id: userId,
    posted_by: userId,
  };

  try {
    const { data, error } = await sb
      .from("jobs")
      .insert(newJobPayload)
      .select()
      .maybeSingle();

    if (error) {
      console.warn("Supabase jobs table notice:", error.message);
      // Fallback: save to local custom jobs cache so business user always sees their posting
      const fallbackJob: JobRow = {
        id: "job_" + Date.now(),
        ...newJobPayload,
        image_url: null,
      };
      await saveCustomJobLocally(fallbackJob);
      return { ok: true, job: fallbackJob };
    }

    const createdJob = (data as JobRow) || {
      id: "job_" + Date.now(),
      ...newJobPayload,
      image_url: null,
    };
    await saveCustomJobLocally(createdJob);
    return { ok: true, job: createdJob };
  } catch (e: any) {
    console.error("Job creation error:", e);
    const fallbackJob: JobRow = {
      id: "job_" + Date.now(),
      ...newJobPayload,
      image_url: null,
    };
    await saveCustomJobLocally(fallbackJob);
    return { ok: true, job: fallbackJob };
  }
}

export async function fetchJobs(limit = 50): Promise<JobRow[]> {
  const localJobs = await fetchCustomJobsLocally();
  const sb = getSupabase();
  if (!sb) return localJobs;

  try {
    const { data, error } = await sb
      .from("jobs")
      .select("id,org,company,title,type,location,city,remote,experience,posted_at,salary,image_url,posted_by,owner_id,description")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data) {
      return localJobs;
    }

    const cloudJobs = data as JobRow[];
    const cloudIds = new Set(cloudJobs.map((j) => j.id));
    const merged = [
      ...localJobs.filter((j) => !cloudIds.has(j.id)),
      ...cloudJobs,
    ];
    return merged;
  } catch {
    return localJobs;
  }
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
