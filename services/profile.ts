import { getSupabase, getSupabaseUrl } from "@/lib/supabase";

export type ProfileInfo = {
  fullName: string;
  avatarUrl: string | null;
  bio: string | null;
  projectsCount: number;
  followersCount: number;
  rating: number;
};

export type MyPost = {
  id: string;
  time: string;
  text: string;
  views: string;
  likes: string;
  comments: string;
  reach: string;
  bookmark: boolean;
};

export type MyPortfolioItem = {
  id: string;
  title: string;
  image_url: string | null;
  created_at: string | null;
};

export type MyReview = {
  id: string;
  rating: number;
  text: string;
  created_at: string | null;
};

export async function fetchMyProfile(): Promise<ProfileInfo> {
  const sb = getSupabase();
  const fallback: ProfileInfo = {
    fullName: "Guest",
    avatarUrl: null,
    bio: null,
    projectsCount: 0,
    followersCount: 0,
    rating: 0,
  };
  if (!sb) return fallback;
  const { data: userRes, error: userErr } = await sb.auth.getUser();
  if (userErr || !userRes?.user?.id) return fallback;
  const userId = userRes.user.id;
  const { data, error } = await sb
    .from("profiles")
    .select("full_name, avatar_url, bio, projects_count, followers_count, rating")
    .eq("id", userId)
    .single();
  if (error || !data) return fallback;
  return {
    fullName: data.full_name ?? "Guest",
    avatarUrl: data.avatar_url ?? null,
    bio: data.bio ?? null,
    projectsCount: Number(data.projects_count ?? 0),
    followersCount: Number(data.followers_count ?? 0),
    rating: Number(data.rating ?? 0),
  };
}

function toTimeString(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffH < 1) {
    const diffM = Math.floor(diffMs / (1000 * 60));
    return `${diffM}m`;
  }
  if (diffH < 24) return `${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d`;
}

export async function fetchMyPosts(limit = 20): Promise<MyPost[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data: userRes, error: userErr } = await sb.auth.getUser();
  if (userErr || !userRes?.user?.id) return [];
  const userId = userRes.user.id;
  const { data, error } = await sb
    .from("posts")
    .select("id,text,created_at,views,likes,comments,reach,bookmark")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return (data as any[]).map((r) => ({
    id: String(r.id),
    time: toTimeString(r.created_at),
    text: String(r.text ?? ""),
    views: String(r.views ?? 0),
    likes: String(r.likes ?? 0),
    comments: String(r.comments ?? 0),
    reach: String(r.reach ?? 0),
    bookmark: Boolean(r.bookmark ?? false),
  }));
}

export async function fetchMyPortfolio(limit = 20): Promise<MyPortfolioItem[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data: userRes, error: userErr } = await sb.auth.getUser();
  if (userErr || !userRes?.user?.id) return [];
  const userId = userRes.user.id;
  const { data, error } = await sb
    .from("portfolio_items")
    .select("id,title,image_url,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return (data as any[]).map((r) => ({
    id: String(r.id),
    title: String(r.title ?? ""),
    image_url: r.image_url ? String(r.image_url) : null,
    created_at: r.created_at ? String(r.created_at) : null,
  }));
}

export async function fetchMyReviews(limit = 20): Promise<MyReview[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data: userRes, error: userErr } = await sb.auth.getUser();
  if (userErr || !userRes?.user?.id) return [];
  const userId = userRes.user.id;
  const { data, error } = await sb
    .from("reviews")
    .select("id,rating,text,created_at")
    .eq("target_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return (data as any[]).map((r) => ({
    id: String(r.id),
    rating: Number(r.rating ?? 0),
    text: String(r.text ?? ""),
    created_at: r.created_at ? String(r.created_at) : null,
  }));
}

export async function updatePost(
  postId: string,
  changes: Partial<{ views: number; likes: number; comments: number; bookmark: boolean }>
): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb.from("posts").update(changes as any).eq("id", postId);
  return !error;
}

export async function toggleLike(postId: string, like: boolean): Promise<{ ok: boolean }> {
  const sb = getSupabase();
  if (!sb) return { ok: false };
  const { data: userRes, error: userErr } = await sb.auth.getUser();
  if (userErr || !userRes?.user?.id) return { ok: false };
  const userId = userRes.user.id;
  if (like) {
    const { error } = await sb.from("post_likes").insert({ post_id: postId, user_id: userId });
    return { ok: !error };
  } else {
    const { error } = await sb.from("post_likes").delete().eq("post_id", postId).eq("user_id", userId);
    return { ok: !error };
  }
}

export async function addComment(postId: string, text: string): Promise<{ ok: boolean }> {
  const sb = getSupabase();
  if (!sb) return { ok: false };
  const { data: userRes, error: userErr } = await sb.auth.getUser();
  if (userErr || !userRes?.user?.id) return { ok: false };
  const userId = userRes.user.id;
  const { error } = await sb.from("post_comments").insert({ post_id: postId, user_id: userId, text });
  return { ok: !error };
}

export async function createPost(text: string): Promise<{ ok: boolean; id?: string }> {
  const sb = getSupabase();
  if (!sb) return { ok: false };
  const { data: userRes, error: userErr } = await sb.auth.getUser();
  if (userErr || !userRes?.user?.id) return { ok: false };
  const userId = userRes.user.id;
  const insertRes = await sb
    .from("posts")
    .insert({ user_id: userId, text })
    .select("id")
    .single();
  if (insertRes.error) return { ok: false };
  return { ok: true, id: String((insertRes.data as any)?.id) };
}

export async function createPortfolioItem(title: string, imageUrl?: string | null): Promise<{ ok: boolean; id?: string }> {
  const sb = getSupabase();
  if (!sb) return { ok: false };
  const { data: userRes, error: userErr } = await sb.auth.getUser();
  if (userErr || !userRes?.user?.id) return { ok: false };
  const userId = userRes.user.id;
  const insertRes = await sb
    .from("portfolio_items")
    .insert({ user_id: userId, title, image_url: imageUrl ?? null })
    .select("id")
    .single();
  if (insertRes.error) return { ok: false };
  return { ok: true, id: String((insertRes.data as any)?.id) };
}

export async function uploadPortfolioImageFromUri(uri: string): Promise<string | null> {
  const sb = getSupabase();
  const baseUrl = getSupabaseUrl();
  if (!sb || !baseUrl) return null;
  const { data: sessionRes } = await sb.auth.getSession();
  const token = sessionRes?.session?.access_token;
  if (!token) return null;
  const extGuess = uri.split(".").pop()?.toLowerCase()?.split("?")[0] || "jpg";
  const ext = extGuess.includes("/") ? "jpg" : extGuess;
  const { data: userRes } = await sb.auth.getUser();
  const userId = userRes?.user?.id || "unknown";
  const stamp = Date.now();
  const path = `public/${userId}/${stamp}.${ext}`;
  const name = `${stamp}.${ext}`;
  const type = `image/${ext}`;
  const form = new FormData();
  form.append("file", { uri, name, type } as any);
  const res = await fetch(`${baseUrl}/storage/v1/object/portfolio/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "x-upsert": "true",
    },
    body: form,
  });
  if (!res.ok) return null;
  const pub = sb.storage.from("portfolio").getPublicUrl(path);
  return pub.data.publicUrl ?? null;
}

export async function fetchEngagementForPosts(
  postIds: string[]
): Promise<{ likes: Record<string, number>; comments: Record<string, number>; likedByMe: Record<string, boolean> }> {
  const sb = getSupabase();
  if (!sb || postIds.length === 0) return { likes: {}, comments: {}, likedByMe: {} };
  const { data: userRes } = await sb.auth.getUser();
  const me = userRes?.user?.id || null;
  const likeListRes = await sb.from("post_likes").select("post_id,user_id").in("post_id", postIds);
  const likesRows = likeListRes.data || [];
  const commentListRes = await sb.from("post_comments").select("post_id").in("post_id", postIds);
  const commentRows = commentListRes.data || [];
  const likes: Record<string, number> = {};
  const likedByMe: Record<string, boolean> = {};
  for (const r of likesRows as any[]) {
    const pid = String(r.post_id);
    likes[pid] = (likes[pid] || 0) + 1;
    if (me && String(r.user_id) === me) {
      likedByMe[pid] = true;
    }
  }
  const comments: Record<string, number> = {};
  for (const r of commentRows as any[]) {
    const pid = String(r.post_id);
    comments[pid] = (comments[pid] || 0) + 1;
  }
  return { likes, comments, likedByMe };
}

export type PublicPost = {
  id: string;
  user_id: string;
  time: string;
  text: string;
  views: number;
  reach: number;
};

export async function fetchPublicPosts(limit = 50): Promise<PublicPost[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("posts")
    .select("id,user_id,text,created_at,views,reach")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return (data as any[]).map((r) => ({
    id: String(r.id),
    user_id: String(r.user_id),
    time: toTimeString(r.created_at),
    text: String(r.text ?? ""),
    views: Number(r.views ?? 0),
    reach: Number(r.reach ?? 0),
  }));
}

export type AuthorBrief = { full_name: string; avatar_url: string | null; bio: string | null };

export async function fetchAuthorsByIds(userIds: string[]): Promise<Record<string, AuthorBrief>> {
  const sb = getSupabase();
  const result: Record<string, AuthorBrief> = {};
  const unique = Array.from(new Set(userIds.filter(Boolean)));
  if (!sb || unique.length === 0) return result;
  const { data, error } = await sb
    .from("profiles")
    .select("id,full_name,avatar_url,bio")
    .in("id", unique);
  if (error || !data) return result;
  for (const r of data as any[]) {
    result[String(r.id)] = {
      full_name: String(r.full_name ?? "Member"),
      avatar_url: r.avatar_url ? String(r.avatar_url) : null,
      bio: r.bio ? String(r.bio) : null,
    };
  }
  return result;
}

export type PostDetail = {
  id: string;
  userId: string;
  text: string;
  time: string;
  createdAt: string;
  views: number;
  reach: number;
  author: AuthorBrief;
  likes: number;
  comments: number;
  likedByMe: boolean;
};

export async function fetchPostDetail(postId: string): Promise<PostDetail | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from("posts")
    .select("id,user_id,text,created_at,views,reach")
    .eq("id", postId)
    .single();
  if (error || !data) return null;
  const postUserId = String((data as any).user_id);
  const authorMap = await fetchAuthorsByIds([postUserId]);
  const { likes, comments, likedByMe } = await fetchEngagementForPosts([String((data as any).id)]);
  return {
    id: String((data as any).id),
    userId: postUserId,
    text: String((data as any).text ?? ""),
    time: toTimeString((data as any).created_at),
    createdAt: String((data as any).created_at),
    views: Number((data as any).views ?? 0),
    reach: Number((data as any).reach ?? 0),
    author: authorMap[postUserId] || { full_name: "Member", avatar_url: null, bio: null },
    likes: Number(likes[String((data as any).id)] ?? 0),
    comments: Number(comments[String((data as any).id)] ?? 0),
    likedByMe: Boolean(likedByMe[String((data as any).id)] ?? false),
  };
}

export type PostComment = {
  id: string;
  userId: string;
  text: string;
  time: string;
  author: AuthorBrief;
  likes: number;
  likedByMe: boolean;
};

export async function fetchCommentsForPost(postId: string): Promise<PostComment[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("post_comments")
    .select("id,user_id,text,created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  const rows = data as any[];
  const userIds = rows.map((r) => String(r.user_id));
  const authorMap = await fetchAuthorsByIds(userIds);
  const ids = rows.map((r) => String(r.id));
  const { likes, likedByMe } = await fetchCommentLikes(ids);
  return rows.map((r) => ({
    id: String(r.id),
    userId: String(r.user_id),
    text: String(r.text ?? ""),
    time: toTimeString(r.created_at),
    author: authorMap[String(r.user_id)] || { full_name: "Member", avatar_url: null, bio: null },
    likes: Number(likes[String(r.id)] ?? 0),
    likedByMe: Boolean(likedByMe[String(r.id)] ?? false),
  }));
}

export async function fetchCommentLikes(
  commentIds: string[]
): Promise<{ likes: Record<string, number>; likedByMe: Record<string, boolean> }> {
  const sb = getSupabase();
  if (!sb || commentIds.length === 0) return { likes: {}, likedByMe: {} };
  const { data: userRes } = await sb.auth.getUser();
  const me = userRes?.user?.id || null;
  const res = await sb.from("post_comment_likes").select("comment_id,user_id").in("comment_id", commentIds);
  const rows = res.data || [];
  const likes: Record<string, number> = {};
  const likedByMe: Record<string, boolean> = {};
  for (const r of rows as any[]) {
    const cid = String(r.comment_id);
    likes[cid] = (likes[cid] || 0) + 1;
    if (me && String(r.user_id) === me) {
      likedByMe[cid] = true;
    }
  }
  return { likes, likedByMe };
}

export async function toggleCommentLike(commentId: string, like: boolean): Promise<{ ok: boolean }> {
  const sb = getSupabase();
  if (!sb) return { ok: false };
  const { data: userRes, error: userErr } = await sb.auth.getUser();
  if (userErr || !userRes?.user?.id) return { ok: false };
  const userId = userRes.user.id;
  if (like) {
    const { error } = await sb.from("post_comment_likes").insert({ comment_id: commentId, user_id: userId });
    return { ok: !error };
  } else {
    const { error } = await sb.from("post_comment_likes").delete().eq("comment_id", commentId).eq("user_id", userId);
    return { ok: !error };
  }
}

export async function deletePost(postId: string): Promise<{ ok: boolean }> {
  const sb = getSupabase();
  if (!sb) return { ok: false };
  const { data: userRes, error: userErr } = await sb.auth.getUser();
  if (userErr || !userRes?.user?.id) return { ok: false };
  const userId = userRes.user.id;
  const { error } = await sb.from("posts").delete().eq("id", postId).eq("user_id", userId);
  return { ok: !error };
}
