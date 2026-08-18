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
};

export async function fetchJobs(limit = 20): Promise<JobRow[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("jobs")
    .select("id,org,title,type,location,remote,experience,posted_at,salary,image_url")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as JobRow[];
}
