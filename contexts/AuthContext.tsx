import { getSupabase } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/* ────────────────────── Types ────────────────────── */

export type UserRole = "user" | "creative" | "business" | "admin";

export type Profile = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  bio: string | null;
  role: UserRole;
  isMentor: boolean;
  mentorApproved: boolean;
  isVerified: boolean;
  portfolioUrl: string | null;
};

type AuthState = {
  loading: boolean;
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  /** Refresh the profile from the database */
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Check if current user has a specific role */
  hasRole: (...roles: UserRole[]) => boolean;
};

const AuthContext = createContext<AuthState>({
  loading: true,
  user: null,
  session: null,
  profile: null,
  refreshProfile: async () => { },
  signOut: async () => { },
  hasRole: () => false,
});

import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHED_PROFILE_KEY = "@bitc_cached_profile";

/* ────────────────────── Provider ────────────────────── */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  // Pre-load cached profile instantly to eliminate placeholder flash
  useEffect(() => {
    AsyncStorage.getItem(CACHED_PROFILE_KEY).then((cached) => {
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.id) {
            setProfile(parsed);
          }
        } catch {}
      }
    });
  }, []);

  /* ---------- Fetch profile helper ---------- */
  const fetchProfile = useCallback(async (userId: string) => {
    const sb = getSupabase();
    if (!sb) return;
    const { data } = await sb
      .from("profiles")
      .select("id, full_name, avatar_url, bio, role, is_mentor, mentor_approved, is_verified, portfolio_url")
      .eq("id", userId)
      .maybeSingle();
    // Check user_metadata and AsyncStorage cache for cover_url
    let coverUrl: string | null = (data as any)?.cover_url ?? null;
    if (!coverUrl) {
      const userRes = await sb.auth.getUser().catch(() => null);
      coverUrl = userRes?.data?.user?.user_metadata?.cover_url ?? null;
    }
    if (!coverUrl) {
      const cached = await AsyncStorage.getItem(`@bitc_cover_${userId}`).catch(() => null);
      if (cached) coverUrl = cached;
    }

    if (data) {
      const p: Profile = {
        id: data.id,
        fullName: data.full_name ?? "Guest",
        avatarUrl: data.avatar_url ?? null,
        coverUrl: coverUrl ?? null,
        bio: data.bio ?? null,
        role: (data.role as UserRole) ?? "user",
        isMentor: data.is_mentor ?? false,
        mentorApproved: data.mentor_approved ?? false,
        isVerified: (data as any).is_verified ?? false,
        portfolioUrl: (data as any).portfolio_url ?? null,
      };
      setProfile(p);
      AsyncStorage.setItem(CACHED_PROFILE_KEY, JSON.stringify(p)).catch(() => {});
    }
  }, []);

  /* ---------- Listen for auth changes ---------- */
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setLoading(false);
      return;
    }

    // Initial session check
    sb.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfile(s.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Realtime listener
    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfile(s.user.id);
      } else {
        setProfile(null);
        AsyncStorage.removeItem(CACHED_PROFILE_KEY).catch(() => {});
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  /* ---------- Actions ---------- */
  const refreshProfile = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) return;
    const currentId = user?.id || (await sb.auth.getUser()).data.user?.id;
    if (currentId) await fetchProfile(currentId);
  }, [user, fetchProfile]);

  const signOut = useCallback(async () => {
    try {
      const sb = getSupabase();
      if (sb) {
        await sb.auth.signOut();
      }
    } catch (e) {
      console.warn("Error during Supabase signOut:", e);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
      AsyncStorage.removeItem(CACHED_PROFILE_KEY).catch(() => {});
    }
  }, []);

  const hasRole = useCallback(
    (...roles: UserRole[]) => {
      if (!profile) return false;
      return roles.includes(profile.role);
    },
    [profile]
  );

  const value = useMemo(
    () => ({ loading, user, session, profile, refreshProfile, signOut, hasRole }),
    [loading, user, session, profile, refreshProfile, signOut, hasRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* ────────────────────── Hook ────────────────────── */

export function useAuth() {
  return useContext(AuthContext);
}
