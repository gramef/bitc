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
  bio: string | null;
  role: UserRole;
  isMentor: boolean;
  mentorApproved: boolean;
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

/* ────────────────────── Provider ────────────────────── */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  /* ---------- Fetch profile helper ---------- */
  const fetchProfile = useCallback(async (userId: string) => {
    const sb = getSupabase();
    if (!sb) return;
    const { data } = await sb
      .from("profiles")
      .select("id, full_name, avatar_url, bio, role, is_mentor, mentor_approved")
      .eq("id", userId)
      .maybeSingle();
    if (data) {
      setProfile({
        id: data.id,
        fullName: data.full_name ?? "Guest",
        avatarUrl: data.avatar_url ?? null,
        bio: data.bio ?? null,
        role: (data.role as UserRole) ?? "user",
        isMentor: data.is_mentor ?? false,
        mentorApproved: data.mentor_approved ?? false,
      });
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
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  /* ---------- Actions ---------- */
  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  const signOut = useCallback(async () => {
    const sb = getSupabase();
    if (sb) await sb.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
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
