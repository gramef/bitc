import SafeScreen from "@/components/SafeScreen";
import { Avatar } from "@/components/ui/Avatar";
import { ProfileCover } from "@/components/ui/ProfileCover";
import { useAuth } from "@/contexts/AuthContext";
import { getRoleBadge } from "@/services/permissions";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, Modal, Platform, Pressable, RefreshControl, ScrollView, Share, StyleSheet, Text, TextInput, View } from "react-native";


import { EventRow, fetchMyTickets, MyTicketWithEvent } from "@/services/events";
import { JobRow } from "@/services/jobs";

type Tab = "Posts" | "Portfolio" | "Reviews" | "Open Roles" | "Events";

export default function UserProfile() {
  const router = useRouter();
  const { profile: authProfile, signOut, refreshProfile } = useAuth();
  const role = authProfile?.role ?? "creative";
  const [tab, setTab] = useState<Tab>(
    role === "business" ? "Open Roles" : role === "user" ? "Events" : "Portfolio"
  );
  const [refreshing, setRefreshing] = useState(false);
  const [fullName, setFullName] = useState(authProfile?.fullName ?? "Guest");
  const [bio, setBio] = useState<string | null>(authProfile?.bio ?? null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(authProfile?.avatarUrl ?? null);
  const [coverUrl, setCoverUrl] = useState<string | null>(authProfile?.coverUrl ?? null);

  // Synchronize state immediately when authProfile changes or refreshes
  useEffect(() => {
    if (authProfile) {
      if (authProfile.fullName && authProfile.fullName !== "Guest") {
        setFullName(authProfile.fullName);
      }
      if (authProfile.bio) {
        setBio(authProfile.bio);
      }
      if (authProfile.avatarUrl) {
        setAvatarUrl(authProfile.avatarUrl);
      }
      if (authProfile.coverUrl) {
        setCoverUrl(authProfile.coverUrl);
      }
    }
  }, [authProfile]);

  // Re-sync on screen focus
  useFocusEffect(
    useCallback(() => {
      refreshProfile();
      loadProfileData();
    }, [refreshProfile])
  );
  const [stats, setStats] = useState<{ label: string; value: string; active: boolean }[]>([
    { label: "Projects", value: "0", active: false },
    { label: "Followers", value: "0", active: false },
    { label: "Ratings", value: "0", active: false },
  ]);
  const [posts, setPosts] = useState<
    { id: string; time: string; text: string; views: string; likes: string; comments: string; reach: string; bookmark: boolean }[]
  >([]);
  const [portfolio, setPortfolio] = useState<{ id: string; title: string; image_url: string | null; created_at: string | null }[]>([]);
  const [reviews, setReviews] = useState<{ id: string; rating: number; text: string; created_at: string | null }[]>([]);
  const [myJobs, setMyJobs] = useState<JobRow[]>([]);
  const [myTickets, setMyTickets] = useState<MyTicketWithEvent[]>([]);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [commentModal, setCommentModal] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeText, setComposeText] = useState("");
  const [portfolioComposeOpen, setPortfolioComposeOpen] = useState(false);
  const [portfolioTitle, setPortfolioTitle] = useState("");
  const [portfolioImageUrl, setPortfolioImageUrl] = useState("");
  const [portfolioLocalUri, setPortfolioLocalUri] = useState<string | null>(null);
  const [deleteMenuOpen, setDeleteMenuOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  async function handleUpdateAvatar() {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission Required", "Please allow photo library access to change your picture.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        quality: 0.7,
        allowsEditing: true,
        aspect: [1, 1],
        base64: true,
        mediaTypes: ["images"] as any,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.uri) return;

      const previewUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
      setAvatarUrl(previewUri);

      const { getSupabase } = await import("@/lib/supabase");
      const sb = getSupabase();
      if (!sb || !authProfile?.id) return;

      let savedUrl = previewUri;
      // Fast attempt with Supabase Storage (max 2.5s)
      try {
        const stamp = Date.now();
        const path = `public/${authProfile.id}/${stamp}.jpg`;
        const uploadTask = (async () => {
          const fetchRes = await fetch(previewUri);
          const body = await fetchRes.blob();
          const { error: upErr } = await sb.storage.from("avatars").upload(path, body, {
            upsert: true,
            contentType: "image/jpeg",
          });
          if (!upErr) {
            const pub = sb.storage.from("avatars").getPublicUrl(path);
            if (pub?.data?.publicUrl) return `${pub.data.publicUrl}?t=${stamp}`;
          }
          return null;
        })();
        const timeoutTask = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500));
        const resUrl = await Promise.race([uploadTask, timeoutTask]);
        if (resUrl) savedUrl = resUrl;
      } catch {
        // use previewUri fallback
      }

      await sb.from("profiles").update({ avatar_url: savedUrl }).eq("id", authProfile.id);
      setAvatarUrl(savedUrl);
      await refreshProfile();
    } catch (err: any) {
      console.warn("Direct avatar update error:", err);
    }
  }

  async function handleUpdateCover() {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission Required", "Please allow photo library access to change your cover banner.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        quality: 0.75,
        allowsEditing: true,
        aspect: [16, 7],
        base64: true,
        mediaTypes: ["images"] as any,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.uri) return;

      const previewUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
      setCoverUrl(previewUri);
      if (authProfile?.id) {
        import("@react-native-async-storage/async-storage").then(({ default: AsyncStorage }) => {
          AsyncStorage.setItem(`@bitc_cover_${authProfile.id}`, previewUri).catch(() => {});
        });
      }

      const { getSupabase } = await import("@/lib/supabase");
      const sb = getSupabase();
      if (!sb || !authProfile?.id) return;

      let savedUrl = previewUri;
      // Fast attempt with Supabase Storage (max 2.5s)
      try {
        const stamp = Date.now();
        const path = `public/${authProfile.id}/cover_${stamp}.jpg`;
        const uploadTask = (async () => {
          const fetchRes = await fetch(previewUri);
          const body = await fetchRes.blob();
          const { error: upErr } = await sb.storage.from("avatars").upload(path, body, {
            upsert: true,
            contentType: "image/jpeg",
          });
          if (!upErr) {
            const pub = sb.storage.from("avatars").getPublicUrl(path);
            if (pub?.data?.publicUrl) return `${pub.data.publicUrl}?t=${stamp}`;
          }
          return null;
        })();
        const timeoutTask = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500));
        const resUrl = await Promise.race([uploadTask, timeoutTask]);
        if (resUrl) savedUrl = resUrl;
      } catch {}

      // 1. Persist to Auth metadata (synced to cloud across devices)
      await sb.auth.updateUser({ data: { cover_url: savedUrl } }).catch(() => {});

      // 2. Try updating profiles table
      try {
        await sb.from("profiles").update({ cover_url: savedUrl } as any).eq("id", authProfile.id);
      } catch {}

      setCoverUrl(savedUrl);
      await refreshProfile();
    } catch (err: any) {
      console.warn("Direct cover update error:", err);
    }
  }

  async function loadProfileData() {
    const { fetchMyProfile, fetchMyPosts, fetchMyPortfolio, fetchMyReviews, fetchEngagementForPosts } = await import("@/services/profile");
    const p = await fetchMyProfile();
    setFullName(p.fullName);
    setBio(p.bio);
    if (p.avatarUrl) setAvatarUrl(p.avatarUrl);
    if (p.coverUrl) setCoverUrl(p.coverUrl);
    const currentRole = authProfile?.role ?? "creative";
    if (currentRole === "business") {
      const { fetchJobs } = await import("@/services/jobs");
      const allJobs = await fetchJobs(50);
      const filteredJobs = allJobs.filter(
        (j) => j.user_id === authProfile?.id || (j as any).created_by === authProfile?.id || (p.fullName && p.fullName !== "Guest" && j.org.toLowerCase() === p.fullName.toLowerCase())
      );
      setMyJobs(filteredJobs);
      setStats([
        { label: "Open Roles", value: String(filteredJobs.length), active: true },
        { label: "Followers", value: String(p.followersCount ?? 0), active: false },
        { label: "Rating", value: p.rating > 0 ? p.rating.toFixed(1) : "—", active: false },
      ]);
    } else if (currentRole === "user") {
      const tickets = await fetchMyTickets();
      setMyTickets(tickets);
      setStats([
        { label: "Brunches", value: String(tickets.length), active: true },
        { label: "Following", value: String(p.followersCount ?? 0), active: false },
        { label: "Passes", value: String(tickets.filter((t) => t.status === "valid").length), active: false },
      ]);
    } else {
      const pItems = await fetchMyPortfolio();
      setPortfolio(pItems);
      setStats([
        { label: "Projects", value: String(pItems.length || p.projectsCount || 0), active: true },
        { label: "Followers", value: String(p.followersCount ?? 0), active: false },
        { label: "Ratings", value: p.rating > 0 ? p.rating.toFixed(1) : "—", active: false },
      ]);
    }
    const list = await fetchMyPosts();
    setPosts(list);
    const ids = list.map((p) => p.id);
    if (ids.length > 0) {
      const { likes, comments, likedByMe } = await fetchEngagementForPosts(ids);
      setLiked(likedByMe);
      setPosts((prev) =>
        prev.map((p) => ({
          ...p,
          likes: String(likes[p.id] ?? 0),
          comments: String(comments[p.id] ?? 0),
        }))
      );
    }
    fetchMyPortfolio().then(setPortfolio);
    fetchMyReviews().then(setReviews);
  }

  useEffect(() => {
    loadProfileData();
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    await loadProfileData();
    setRefreshing(false);
  }

  async function handleSignOut() {
    if (Platform.OS === "web") {
      const confirmed = typeof window !== "undefined" ? window.confirm("Are you sure you want to sign out?") : true;
      if (confirmed) {
        await signOut();
        router.replace("/login");
      }
      return;
    }
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/login");
        },
      },
    ]);
  }

  function incMetric(postId: string, field: "views" | "comments") {
    const current = posts.find((p) => p.id === postId);
    if (!current) return;
    const newVal = String(Number((current as any)[field]) + 1);
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, [field]: newVal } : p)));
    import("@/services/profile").then(({ updatePost }) => {
      updatePost(postId, { [field]: Number(newVal) } as any);
    });
  }

  function openDeleteMenu(postId: string) {
    setDeleteTargetId(postId);
    setDeleteMenuOpen(true);
  }

  async function confirmDeletePost() {
    if (!deleteTargetId) {
      setDeleteMenuOpen(false);
      return;
    }
    const { deletePost } = await import("@/services/profile");
    const res = await deletePost(deleteTargetId);
    if (res.ok) {
      setPosts((prev) => prev.filter((p) => p.id !== deleteTargetId));
    }
    setDeleteMenuOpen(false);
    setDeleteTargetId(null);
  }

  function toggleBookmark(postId: string) {
    const current = posts.find((p) => p.id === postId);
    if (!current) return;
    const next = !current.bookmark;
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, bookmark: next } : p)));
    import("@/services/profile").then(({ updatePost }) => {
      updatePost(postId, { bookmark: next });
    });
  }

  function toggleLike(postId: string) {
    const current = posts.find((p) => p.id === postId);
    if (!current) return;
    const isLiked = !!liked[postId];
    const nextLiked = !isLiked;
    const newLikes = Number(current.likes) + (nextLiked ? 1 : -1);
    setLiked((prev) => ({ ...prev, [postId]: nextLiked }));
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, likes: String(newLikes) } : p)));
    import("@/services/profile").then((m) => {
      m.toggleLike(postId, nextLiked);
    });
  }

  function openCommentModal(postId: string) {
    setActivePostId(postId);
    setCommentText("");
    setCommentModal(true);
  }

  function submitComment() {
    if (!activePostId) return;
    import("@/services/profile").then((m) => {
      m.addComment(activePostId, commentText).then((res) => {
        if (res.ok) {
          incMetric(activePostId!, "comments");
        }
      });
    });
    setCommentModal(false);
  }

  return (
    <SafeScreen>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentYellow} />}>
        <View style={styles.coverWrap}>
          <ProfileCover
            uri={coverUrl}
            role={role}
            height={160}
            borderRadius={radii.card}
            editable
            onPressEdit={handleUpdateCover}
          />
          <View style={styles.avatarCenter}>
            <Pressable
              style={styles.avatarWrap}
              onPress={handleUpdateAvatar}
              accessibilityRole="button"
              accessibilityLabel="Change profile picture"
              hitSlop={8}
            >
              <Avatar uri={avatarUrl} name={fullName} size={88} bordered />
              <View style={styles.avatarCameraBadge}>
                <MaterialIcons name="photo-camera" size={14} color="#121212" />
              </View>
            </Pressable>
          </View>
          <Pressable style={styles.editBadge} hitSlop={6} onPress={() => router.push("/profile-setup")}>
            <MaterialIcons name="edit" size={18} color={colors.textDark} />
          </Pressable>
        </View>

        {/* Quick Profile Nav: Messages & Settings */}
        <View style={styles.topNavRow}>
          <Pressable style={styles.topNavBtn} hitSlop={6} onPress={() => router.push("/messages" as any)}>
            <MaterialIcons name="mail-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.topNavBtnText}>Messages</Text>
          </Pressable>
          <Pressable style={styles.topNavBtn} hitSlop={6} onPress={() => router.push("/settings" as any)}>
            <MaterialIcons name="settings" size={18} color={colors.textSecondary} />
            <Text style={[styles.topNavBtnText, { color: colors.textSecondary }]}>Settings</Text>
          </Pressable>
        </View>

        {/* Super Admin Console Launcher (for Admins / Dev Mode) */}
        {(authProfile?.role === "admin" || __DEV__) && (
          <Pressable
            style={styles.adminBanner}
            onPress={() => router.push("/admin" as any)}
          >
            <View style={styles.adminBannerLeft}>
              <View style={styles.adminIconWrap}>
                <MaterialIcons name="admin-panel-settings" size={20} color="#FF7675" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={styles.adminBannerTitle}>Super Admin Console</Text>
                  <View style={styles.adminPill}>
                    <Text style={styles.adminPillText}>WEB</Text>
                  </View>
                </View>
                <Text style={styles.adminBannerSubtitle}>Live event rosters, creator badges & room moderation</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
          </Pressable>
        )}

        <View style={styles.headerText}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{fullName}</Text>
            <MaterialIcons name="verified" size={18} color={colors.accentYellow} />
          </View>
          {authProfile?.role && (
            (() => {
              const badge = getRoleBadge(authProfile.role);
              return (
                <View style={{
                  alignSelf: "flex-start",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  backgroundColor: badge.bgColor,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 12,
                  marginTop: 4,
                }}>
                  <MaterialIcons
                    name={badge.icon as any}
                    size={14}
                    color={badge.color}
                  />
                  <Text style={{
                    color: badge.color,
                    fontFamily: fonts.semibold,
                    fontSize: 12,
                    textTransform: "capitalize",
                  }}>
                    {badge.label}
                  </Text>
                </View>
              );
            })()
          )}
          <Text style={styles.bio}>{bio || ""}</Text>
        </View>

        <View style={styles.statsRow}>
          {stats.map((s, i) => (
            <View
              key={i}
              style={[styles.statCard, s.active ? styles.statActive : styles.statInactive]}
            >
              <Text style={[styles.statLabel, s.active ? styles.statLabelActive : styles.statLabelInactive]}>
                {s.label}
              </Text>
              <Text style={[styles.statValue, s.active ? styles.statValueActive : styles.statValueInactive]}>
                {s.value}
              </Text>
            </View>
          ))}
        </View>

        {/* Dynamic Persona-Tailored Tabs */}
        {(() => {
          const availableTabs: Tab[] =
            role === "business"
              ? ["Open Roles", "Posts", "Reviews"]
              : role === "user"
              ? ["Events", "Posts", "Reviews"]
              : ["Portfolio", "Posts", "Reviews"];

          return (
            <View style={styles.tabsRow}>
              {availableTabs.map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setTab(t)}
                  style={styles.tabBtn}
                  hitSlop={6}
                >
                  <Text
                    style={[
                      styles.tabText,
                      tab === t ? styles.tabTextActive : styles.tabTextInactive,
                    ]}
                  >
                    {t}
                  </Text>
                  {tab === t ? <View style={styles.tabUnderline} /> : null}
                </Pressable>
              ))}
            </View>
          );
        })()}

        {tab === "Open Roles" ? (
          <View style={styles.list}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: spacing.sm,
              }}
            >
              <Text
                style={{
                  color: colors.textSecondary,
                  fontFamily: fonts.semibold,
                  fontSize: fonts.size.sm,
                }}
              >
                Studio Open Roles ({myJobs.length})
              </Text>
              <Pressable
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  backgroundColor: colors.accentYellow,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: radii.pill,
                }}
                onPress={() => router.push("/create-job" as any)}
              >
                <MaterialIcons name="add" size={16} color={colors.textDark} />
                <Text
                  style={{
                    color: colors.textDark,
                    fontFamily: fonts.bold,
                    fontSize: fonts.size.xs,
                  }}
                >
                  Post a Job
                </Text>
              </Pressable>
            </View>

            {myJobs.length === 0 ? (
              <View
                style={[
                  styles.postCard,
                  { alignItems: "center", paddingVertical: spacing.xl },
                ]}
              >
                <MaterialIcons
                  name="business-center"
                  size={40}
                  color={colors.textSecondary}
                  style={{ marginBottom: spacing.sm }}
                />
                <Text
                  style={[
                    styles.postText,
                    { textAlign: "center", marginBottom: spacing.xs },
                  ]}
                >
                  No active job briefs yet
                </Text>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontFamily: fonts.regular,
                    fontSize: fonts.size.sm,
                    textAlign: "center",
                    marginBottom: spacing.md,
                  }}
                >
                  Publish freelance gigs, full-time contracts, and design briefs to hire verified talent.
                </Text>
                <Pressable
                  style={{
                    backgroundColor: colors.accentYellow,
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderRadius: radii.pill,
                  }}
                  onPress={() => router.push("/create-job" as any)}
                >
                  <Text
                    style={{
                      color: colors.textDark,
                      fontFamily: fonts.bold,
                      fontSize: fonts.size.sm,
                    }}
                  >
                    + Post a Job Opportunity
                  </Text>
                </Pressable>
              </View>
            ) : (
              myJobs.map((j) => (
                <Pressable
                  key={j.id}
                  onPress={() => router.push(`/job-detail?id=${j.id}` as any)}
                  style={styles.postCard}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text
                        style={[
                          styles.postText,
                          { fontFamily: fonts.bold, fontSize: fonts.size.md },
                        ]}
                      >
                        {j.title}
                      </Text>
                      <Text
                        style={{
                          color: colors.textSecondary,
                          fontFamily: fonts.regular,
                          fontSize: fonts.size.xs,
                        }}
                      >
                        {j.org} · {j.location || "Remote"}
                      </Text>
                    </View>
                    <View
                      style={{
                        backgroundColor: "#6C5CE720",
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6,
                      }}
                    >
                      <Text
                        style={{
                          color: "#6C5CE7",
                          fontFamily: fonts.bold,
                          fontSize: 10,
                        }}
                      >
                        ACTIVE BRIEF
                      </Text>
                    </View>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: spacing.md,
                    }}
                  >
                    <Text
                      style={{
                        color: colors.accentYellow,
                        fontFamily: fonts.semibold,
                        fontSize: fonts.size.sm,
                      }}
                    >
                      {j.salary || j.type || "Contract"}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <MaterialIcons
                        name="people"
                        size={16}
                        color={colors.textSecondary}
                      />
                      <Text
                        style={{
                          color: colors.textSecondary,
                          fontFamily: fonts.regular,
                          fontSize: fonts.size.xs,
                        }}
                      >
                        Review Applicants →
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))
            )}
          </View>
        ) : tab === "Events" ? (
          <View style={styles.list}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: spacing.sm,
              }}
            >
              <Text
                style={{
                  color: colors.textSecondary,
                  fontFamily: fonts.semibold,
                  fontSize: fonts.size.sm,
                }}
              >
                My Weekend Brunches & Passes ({myTickets.length})
              </Text>
              <Pressable
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  backgroundColor: colors.accentYellow,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: radii.pill,
                }}
                onPress={() => router.push("/(tabs)/events")}
              >
                <MaterialIcons name="search" size={16} color={colors.textDark} />
                <Text
                  style={{
                    color: colors.textDark,
                    fontFamily: fonts.bold,
                    fontSize: fonts.size.xs,
                  }}
                >
                  Find Brunches
                </Text>
              </Pressable>
            </View>

            {myTickets.length === 0 ? (
              <View
                style={[
                  styles.postCard,
                  { alignItems: "center", paddingVertical: spacing.xl },
                ]}
              >
                <MaterialIcons
                  name="local-activity"
                  size={40}
                  color={colors.textSecondary}
                  style={{ marginBottom: spacing.sm }}
                />
                <Text
                  style={[
                    styles.postText,
                    { textAlign: "center", marginBottom: spacing.xs },
                  ]}
                >
                  No brunch passes yet
                </Text>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontFamily: fonts.regular,
                    fontSize: fonts.size.sm,
                    textAlign: "center",
                    marginBottom: spacing.md,
                  }}
                >
                  Discover weekend brunches, networking mixers, and live audio rooms in your city.
                </Text>
                <Pressable
                  style={{
                    backgroundColor: colors.accentYellow,
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderRadius: radii.pill,
                  }}
                  onPress={() => router.push("/(tabs)/events")}
                >
                  <Text
                    style={{
                      color: colors.textDark,
                      fontFamily: fonts.bold,
                      fontSize: fonts.size.sm,
                    }}
                  >
                    Explore Upcoming Brunches
                  </Text>
                </Pressable>
              </View>
            ) : (
              myTickets.map((tkt) => (
                <Pressable
                  key={tkt.id}
                  onPress={() => router.push(`/event-detail?id=${tkt.event_id}` as any)}
                  style={styles.postCard}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text
                        style={[
                          styles.postText,
                          { fontFamily: fonts.bold, fontSize: fonts.size.md },
                        ]}
                      >
                        {tkt.event_title || "BITC Brunch Event"}
                      </Text>
                      <Text
                        style={{
                          color: colors.textSecondary,
                          fontFamily: fonts.regular,
                          fontSize: fonts.size.xs,
                        }}
                      >
                        {tkt.event_city || "London"} ·{" "}
                        {tkt.event_date
                          ? new Date(tkt.event_date).toLocaleDateString("en-GB", {
                              month: "short",
                              day: "numeric",
                            })
                          : "Upcoming"}
                      </Text>
                    </View>
                    <View
                      style={{
                        backgroundColor: tkt.status === "checked_in" ? "#6C5CE720" : "#00B89420",
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6,
                      }}
                    >
                      <Text
                        style={{
                          color: tkt.status === "checked_in" ? "#6C5CE7" : "#00B894",
                          fontFamily: fonts.bold,
                          fontSize: 10,
                        }}
                      >
                        {tkt.status === "checked_in" ? "CHECKED IN" : "CONFIRMED PASS"}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: spacing.md,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <MaterialIcons
                        name="qr-code"
                        size={16}
                        color={colors.accentYellow}
                      />
                      <Text
                        style={{
                          color: colors.accentYellow,
                          fontFamily: fonts.semibold,
                          fontSize: fonts.size.xs,
                        }}
                      >
                        {tkt.ticket_code}
                      </Text>
                    </View>
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontFamily: fonts.regular,
                        fontSize: fonts.size.xs,
                      }}
                    >
                      Details →
                    </Text>
                  </View>
                </Pressable>
              ))
            )}
          </View>
        ) : tab === "Posts" ? (
          <View style={styles.list}>
            {posts.length === 0 ? (
              <View style={styles.postCard}>
                <Text style={styles.postText}>No posts yet</Text>
              </View>
            ) : (
              posts.map((p, idx) => (
                <View key={p.id} style={styles.postCard}>
                  <View style={styles.postHeader}>
                    <View style={styles.postAvatarWrap}>
                      <Avatar uri={avatarUrl} name={fullName} size={38} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.nameRowSmall}>
                        <Text style={styles.postName}>{fullName}</Text>
                        <MaterialIcons name="verified" size={16} color={colors.accentYellow} />
                      </View>
                      <Text style={styles.postMeta}>{p.time}</Text>
                    </View>
                    <Pressable hitSlop={6} onPress={() => openDeleteMenu(p.id)}>
                      <MaterialIcons name="more-vert" size={20} color={colors.textMuted} />
                    </Pressable>
                  </View>
                  <Pressable onPress={() => router.push(`/post/${p.id}`)} hitSlop={6}>
                    <Text style={styles.postText}>{p.text}</Text>
                  </Pressable>
                  <View style={styles.postActions}>
                    <Pressable style={styles.metric} hitSlop={6} onPress={() => incMetric(p.id, "views")}>
                      <MaterialIcons name="visibility" size={18} color={colors.textMuted} />
                      <Text style={styles.metricText}>{p.views}</Text>
                    </Pressable>
                    <Pressable style={styles.metric} hitSlop={6} onPress={() => toggleLike(p.id)}>
                      <MaterialIcons name={liked[p.id] ? "favorite" : "favorite-border"} size={18} color={colors.textMuted} />
                      <Text style={styles.metricText}>{p.likes}</Text>
                    </Pressable>
                    <Pressable style={styles.metric} hitSlop={6} onPress={() => openCommentModal(p.id)}>
                      <MaterialIcons name="mode-comment" size={18} color={colors.textMuted} />
                      <Text style={styles.metricText}>{p.comments}</Text>
                    </Pressable>
                    <View style={styles.metric}>
                      <MaterialIcons name="bar-chart" size={18} color={colors.textMuted} />
                      <Text style={styles.metricText}>{p.reach}</Text>
                    </View>
                    <Pressable style={styles.iconBtn} hitSlop={6} onPress={() => toggleBookmark(p.id)}>
                      <MaterialIcons name={p.bookmark ? "bookmark" : "bookmark-border"} size={18} color={colors.textMuted} />
                    </Pressable>
                    <Pressable
                      style={styles.iconBtn}
                      hitSlop={6}
                      onPress={() => Share.share({ message: p.text || fullName })}
                    >
                      <MaterialIcons name="share" size={18} color={colors.textMuted} />
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : tab === "Portfolio" ? (
          <View style={styles.list}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm }}>
              <Text style={{ color: colors.textSecondary, fontFamily: fonts.semibold, fontSize: fonts.size.sm }}>
                Showcase ({portfolio.length})
              </Text>
              <Pressable
                style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.accentYellow, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.pill }}
                onPress={() => setPortfolioComposeOpen(true)}
              >
                <MaterialIcons name="add" size={16} color={colors.textDark} />
                <Text style={{ color: colors.textDark, fontFamily: fonts.bold, fontSize: fonts.size.xs }}>Add Project</Text>
              </Pressable>
            </View>

            {portfolio.length === 0 ? (
              <View style={[styles.postCard, { alignItems: "center", paddingVertical: spacing.xl }]}>
                <MaterialIcons name="collections" size={40} color={colors.textSecondary} style={{ marginBottom: spacing.sm }} />
                <Text style={[styles.postText, { textAlign: "center", marginBottom: spacing.xs }]}>No portfolio projects yet</Text>
                <Text style={{ color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm, textAlign: "center", marginBottom: spacing.md }}>
                  Showcase your best creative work, case studies, and client projects.
                </Text>
                <Pressable
                  style={{ backgroundColor: colors.accentYellow, paddingHorizontal: 20, paddingVertical: 10, borderRadius: radii.pill }}
                  onPress={() => setPortfolioComposeOpen(true)}
                >
                  <Text style={{ color: colors.textDark, fontFamily: fonts.bold, fontSize: fonts.size.sm }}>+ Add Your First Project</Text>
                </Pressable>
              </View>
            ) : (
              portfolio.map((it) => (
                <View key={it.id} style={styles.postCard}>
                  {it.image_url ? (
                    <Image source={{ uri: it.image_url }} style={{ width: "100%", height: 180, borderRadius: radii.md }} contentFit="cover" />
                  ) : (
                    <View style={{ width: "100%", height: 120, borderRadius: radii.md, backgroundColor: "#1e1e1e", alignItems: "center", justifyContent: "center" }}>
                      <MaterialIcons name="palette" size={32} color={colors.textSecondary} />
                    </View>
                  )}
                  <Text style={[styles.postText, { marginTop: spacing.sm, fontFamily: fonts.semibold, fontSize: fonts.size.md }]}>{it.title}</Text>
                  {it.created_at ? (
                    <Text style={{ color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.xs, marginTop: 2 }}>
                      Added {new Date(it.created_at).toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" })}
                    </Text>
                  ) : null}
                </View>
              ))
            )}
          </View>
        ) : (
          <View style={styles.list}>
            {reviews.length === 0 ? (
              <View style={styles.postCard}>
                <Text style={styles.postText}>No reviews yet</Text>
              </View>
            ) : (
              reviews.map((r) => (
                <View key={r.id} style={styles.postCard}>
                  <Text style={styles.postText}>{r.text}</Text>
                  <View style={styles.postActions}>
                    <MaterialIcons name="star" size={18} color={colors.accentYellow} />
                    <Text style={styles.metricText}>{String(r.rating)}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
        <Modal visible={commentModal} transparent animationType="fade" onRequestClose={() => setCommentModal(false)}>
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", paddingHorizontal: spacing.lg }}>
            <View style={{ backgroundColor: colors.surface, borderRadius: radii.card, padding: spacing.lg }}>
              <Text style={{ color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.md }}>Add Comment</Text>
              <View style={{ height: spacing.md }} />
              <TextInput
                value={commentText}
                onChangeText={setCommentText}
                style={{ color: colors.textPrimary, fontFamily: fonts.regular, fontSize: fonts.size.md, borderWidth: 1, borderColor: colors.outline, borderRadius: radii.md, padding: spacing.md }}
                placeholder="Write something..."
                placeholderTextColor="#9E9E9E"
              />
              <View style={{ height: spacing.md }} />
              <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: spacing.md }}>
                <Pressable onPress={() => setCommentModal(false)} hitSlop={6}>
                  <Text style={{ color: colors.textSecondary, fontFamily: fonts.semibold }}>Cancel</Text>
                </Pressable>
                <Pressable onPress={submitComment} hitSlop={6}>
                  <Text style={{ color: colors.accentYellow, fontFamily: fonts.semibold }}>Post</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
        <Modal visible={deleteMenuOpen} transparent animationType="fade" onRequestClose={() => setDeleteMenuOpen(false)}>
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", paddingHorizontal: spacing.lg }}>
            <View style={{ backgroundColor: colors.surface, borderRadius: radii.card, padding: spacing.lg }}>
              <View style={{ gap: spacing.md }}>
                <Pressable onPress={confirmDeletePost} hitSlop={6}>
                  <Text style={{ color: colors.accentYellow, fontFamily: fonts.semibold }}>Delete Post</Text>
                </Pressable>
                <Pressable onPress={() => setDeleteMenuOpen(false)} hitSlop={6}>
                  <Text style={{ color: colors.textSecondary, fontFamily: fonts.semibold }}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
        <Modal visible={composeOpen} transparent animationType="fade" onRequestClose={() => setComposeOpen(false)}>
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", paddingHorizontal: spacing.lg }}>
            <View style={{ backgroundColor: colors.surface, borderRadius: radii.card, padding: spacing.lg }}>
              <Text style={{ color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.md }}>Create Post</Text>
              <View style={{ height: spacing.md }} />
              <TextInput
                value={composeText}
                onChangeText={setComposeText}
                style={{ color: colors.textPrimary, fontFamily: fonts.regular, fontSize: fonts.size.md, borderWidth: 1, borderColor: colors.outline, borderRadius: radii.md, padding: spacing.md }}
                placeholder="What's on your mind?"
                placeholderTextColor="#9E9E9E"
                multiline
              />
              <View style={{ height: spacing.md }} />
              <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: spacing.md }}>
                <Pressable onPress={() => setComposeOpen(false)} hitSlop={6}>
                  <Text style={{ color: colors.textSecondary, fontFamily: fonts.semibold }}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    const text = composeText.trim();
                    if (!text) {
                      setComposeOpen(false);
                      return;
                    }
                    import("@/services/profile").then(async (m) => {
                      const res = await m.createPost(text);
                      if (res.ok) {
                        const list = await m.fetchMyPosts();
                        setPosts(list);
                        const ids = list.map((p) => p.id);
                        if (ids.length > 0) {
                          const { likes, comments, likedByMe } = await m.fetchEngagementForPosts(ids);
                          setLiked(likedByMe);
                          setPosts((prev) =>
                            prev.map((p) => ({
                              ...p,
                              likes: String(likes[p.id] ?? 0),
                              comments: String(comments[p.id] ?? 0),
                            }))
                          );
                        }
                      }
                      setComposeText("");
                      setComposeOpen(false);
                    });
                  }}
                  hitSlop={6}
                >
                  <Text style={{ color: colors.accentYellow, fontFamily: fonts.semibold }}>Post</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
        <Modal visible={portfolioComposeOpen} transparent animationType="fade" onRequestClose={() => setPortfolioComposeOpen(false)}>
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", paddingHorizontal: spacing.lg }}>
            <View style={{ backgroundColor: colors.surface, borderRadius: radii.card, padding: spacing.lg }}>
              <Text style={{ color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.md }}>Add Portfolio Item</Text>
              <View style={{ height: spacing.md }} />
              <TextInput
                value={portfolioTitle}
                onChangeText={setPortfolioTitle}
                style={{ color: colors.textPrimary, fontFamily: fonts.regular, fontSize: fonts.size.md, borderWidth: 1, borderColor: colors.outline, borderRadius: radii.md, padding: spacing.md }}
                placeholder="Title"
                placeholderTextColor="#9E9E9E"
              />
              <View style={{ height: spacing.md }} />
              <TextInput
                value={portfolioImageUrl}
                onChangeText={setPortfolioImageUrl}
                style={{ color: colors.textPrimary, fontFamily: fonts.regular, fontSize: fonts.size.md, borderWidth: 1, borderColor: colors.outline, borderRadius: radii.md, padding: spacing.md }}
                placeholder="Image URL (optional)"
                placeholderTextColor="#9E9E9E"
              />
              <View style={{ height: spacing.sm }} />
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Pressable
                  onPress={async () => {
                    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
                    if (!perm.granted) {
                      return;
                    }
                    const result = await ImagePicker.launchImageLibraryAsync({
                      quality: 0.8,
                      allowsEditing: true,
                      mediaTypes: ["images"] as any,
                    });
                    if (result.canceled) return;
                    const asset = result.assets?.[0];
                    if (asset?.uri) {
                      setPortfolioLocalUri(asset.uri);
                      setPortfolioImageUrl(asset.uri);
                    }
                  }}
                  hitSlop={6}
                  style={{ paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.outline, borderRadius: radii.pill }}
                >
                  <Text style={{ color: colors.textPrimary, fontFamily: fonts.semibold }}>Pick Image</Text>
                </Pressable>
                {portfolioImageUrl ? (
                  <Image source={{ uri: portfolioImageUrl }} style={{ width: 64, height: 64, borderRadius: 8 }} contentFit="cover" />
                ) : null}
              </View>
              <View style={{ height: spacing.md }} />
              <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: spacing.md }}>
                <Pressable onPress={() => setPortfolioComposeOpen(false)} hitSlop={6}>
                  <Text style={{ color: colors.textSecondary, fontFamily: fonts.semibold }}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    const t = portfolioTitle.trim();
                    const url = portfolioImageUrl.trim();
                    if (!t) {
                      setPortfolioComposeOpen(false);
                      return;
                    }
                    import("@/services/profile").then(async (m) => {
                      let finalUrl: string | null = url ? url : null;
                      if (portfolioLocalUri) {
                        try {
                          const uploaded = await m.uploadPortfolioImageFromUri(portfolioLocalUri);
                          if (uploaded) {
                            finalUrl = uploaded;
                          }
                        } catch { }
                      }
                      const res = await m.createPortfolioItem(t, finalUrl);
                      if (res.ok) {
                        const list = await m.fetchMyPortfolio();
                        setPortfolio(list);
                        setStats((prev) =>
                          prev.map((s) => (s.label === "Projects" ? { ...s, value: String(list.length) } : s))
                        );
                      }
                      setPortfolioTitle("");
                      setPortfolioImageUrl("");
                      setPortfolioLocalUri(null);
                      setPortfolioComposeOpen(false);
                    });
                  }}
                  hitSlop={6}
                >
                  <Text style={{ color: colors.accentYellow, fontFamily: fonts.semibold }}>Add</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
      <Pressable
        style={styles.fabMain}
        hitSlop={8}
        onPress={() => {
          if (tab === "Posts") setComposeOpen(true);
          else if (tab === "Portfolio") setPortfolioComposeOpen(true);
          else setComposeOpen(true);
        }}
      >
        <MaterialIcons name="add" size={24} color="#fff" />
      </Pressable>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  coverWrap: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: radii.card,
    overflow: "visible",
    position: "relative",
  },
  cover: {
    width: "100%",
    height: 160,
    zIndex: 1,
  },
  avatarCenter: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: -32,
    alignItems: "center",
    zIndex: 2,
  },
  avatarWrap: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 2,
    borderColor: colors.outline,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  avatarCameraBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accentYellow,
    borderWidth: 2,
    borderColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  editBadge: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.sm,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.outline,
    zIndex: 3,
  },
  headerText: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl + 6,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  name: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: fonts.size.xl,
  },
  nameRowSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  role: {
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    fontSize: fonts.size.md,
    marginBottom: spacing.sm,
  },
  bio: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: fonts.size.sm,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  statCard: {
    flex: 1,
    borderRadius: radii.card,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
  },
  statInactive: {
    backgroundColor: "#fff",
    borderColor: colors.outline,
  },
  statActive: {
    backgroundColor: colors.accentGreen,
    borderColor: colors.accentGreen,
  },
  statLabel: {
    fontFamily: fonts.semibold,
    fontSize: fonts.size.sm,
    marginBottom: spacing.xs,
  },
  statLabelInactive: {
    color: colors.textDark,
  },
  statLabelActive: {
    color: colors.textDark,
  },
  statValue: {
    fontFamily: fonts.bold,
    fontSize: fonts.size.lg,
  },
  statValueInactive: {
    color: colors.textDark,
  },
  statValueActive: {
    color: colors.textDark,
  },
  tabsRow: {
    flexDirection: "row",
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  tabBtn: {
    alignItems: "center",
  },
  tabText: {
    fontFamily: fonts.semibold,
    fontSize: fonts.size.md,
  },
  tabTextInactive: {
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.textPrimary,
  },
  tabUnderline: {
    marginTop: 6,
    height: 2,
    width: 28,
    backgroundColor: colors.accentYellow,
    borderRadius: 1,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    marginTop: spacing.md,
    gap: spacing.lg,
  },
  postCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.outline,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    position: "relative",
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  postAvatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  postAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignSelf: "center",
    marginTop: 1,
  },
  postName: {
    color: colors.textPrimary,
    fontFamily: fonts.semibold,
    fontSize: fonts.size.md,
  },
  postMeta: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: fonts.size.sm,
  },
  postText: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: fonts.size.md,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  postActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  metric: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metricText: {
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    fontSize: fonts.size.sm,
  },
  iconBtn: {
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  topNavRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  topNavBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  topNavBtnText: {
    color: colors.textPrimary,
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  adminBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#201214",
    borderWidth: 1,
    borderColor: "#FF767550",
    borderRadius: radii.card,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  adminBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  adminIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#FF767520",
    alignItems: "center",
    justifyContent: "center",
  },
  adminBannerTitle: {
    color: "#fff",
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  adminBannerSubtitle: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 11,
    marginTop: 2,
  },
  adminPill: {
    backgroundColor: "#FF7675",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  adminPillText: {
    color: "#fff",
    fontFamily: fonts.bold,
    fontSize: 9,
  },
  fabMain: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.lg,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.accentGreen,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.outline,
  },
});
