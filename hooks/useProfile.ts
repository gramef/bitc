import { useAuth } from "@/contexts/AuthContext";

/**
 * Convenience hook that returns the current user's profile info.
 * Re-renders only when the profile inside AuthContext changes.
 */
export function useProfile() {
    const { profile, refreshProfile, loading } = useAuth();

    return {
        /** Display name (falls back to "Guest") */
        fullName: profile?.fullName ?? "Guest",
        /** Avatar public URL or null */
        avatarUrl: profile?.avatarUrl ?? null,
        /** Bio or null */
        bio: profile?.bio ?? null,
        /** User ID from profile */
        userId: profile?.id ?? null,
        /** Whether the auth state is still loading */
        loading,
        /** Force re-fetch from the database */
        refreshProfile,
    };
}
