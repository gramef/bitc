import SafeScreen from "@/components/SafeScreen";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchUserPortfolio,
  fetchUserPosts,
  fetchUserProfile,
  toggleFollowUser,
  type MyPortfolioItem,
  type MyPost,
  type PublicProfile,
} from "@/services/profile";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Tab = "Posts" | "Portfolio" | "Reviews";

import { Avatar } from "@/components/ui/Avatar";
import { ProfileCover } from "@/components/ui/ProfileCover";

export default function PublicUserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user: me } = useAuth();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("Posts");
  const [refreshing, setRefreshing] = useState(false);

  const [posts, setPosts] = useState<MyPost[]>([]);
  const [portfolio, setPortfolio] = useState<MyPortfolioItem[]>([]);

  const isMe = me?.id === id;

  async function loadData() {
    if (!id) return;
    const p = await fetchUserProfile(id);
    setProfile(p);
    if (p) {
      const [uPosts, uPort] = await Promise.all([
        fetchUserPosts(id),
        fetchUserPortfolio(id),
      ]);
      setPosts(uPosts);
      setPortfolio(uPort);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [id]);

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  async function handleFollowToggle() {
    if (!profile || !id || isMe || followLoading) return;
    setFollowLoading(true);
    const nextState = !profile.isFollowing;
    const currentCnt = profile.followersCount;
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            isFollowing: nextState,
            followersCount: Math.max(0, prev.followersCount + (nextState ? 1 : -1)),
          }
        : null
    );

    const res = await toggleFollowUser(id, nextState, currentCnt);
    if (res.ok && res.newFollowersCount !== undefined) {
      setProfile((prev) => (prev ? { ...prev, followersCount: res.newFollowersCount } : null));
    }
    setFollowLoading(false);
  }

  if (loading) {
    return (
      <SafeScreen>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.accentYellow} />
          <Text style={styles.loadingText}>Loading profile…</Text>
        </View>
      </SafeScreen>
    );
  }

  if (!profile) {
    return (
      <SafeScreen>
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>User profile not found</Text>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentYellow} />
        }
      >
        {/* Cover & Avatar */}
        <View style={styles.coverWrap}>
          <ProfileCover
            uri={profile.coverUrl}
            role={profile.role}
            height={160}
            borderRadius={0}
            editable={isMe}
            onPressEdit={() => router.push("/profile-setup")}
          />
          <Pressable style={styles.headerBackBtn} hitSlop={8} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={20} color="#fff" />
          </Pressable>

          <View style={styles.avatarCenter}>
            <Avatar
              uri={profile.avatarUrl}
              name={profile.fullName}
              size={88}
              bordered
              borderColor={colors.accentYellow}
            />
          </View>
        </View>

        {/* Follow / Message / Edit Button Bar */}
        <View style={styles.actionRow}>
          {!isMe ? (
            <View style={styles.actionButtons}>
              <Pressable
                style={styles.messageBtn}
                onPress={() => router.push(`/messages/${id}` as any)}
                hitSlop={8}
              >
                <MaterialIcons name="mail-outline" size={16} color={colors.textPrimary} />
                <Text style={styles.messageBtnText}>Message</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.followBtn,
                  profile.isFollowing ? styles.followingBtn : styles.notFollowingBtn,
                ]}
                onPress={handleFollowToggle}
                disabled={followLoading}
              >
                {followLoading ? (
                  <ActivityIndicator size="small" color={profile.isFollowing ? colors.textPrimary : colors.textDark} />
                ) : (
                  <>
                    <MaterialIcons
                      name={profile.isFollowing ? "check" : "person-add"}
                      size={16}
                      color={profile.isFollowing ? colors.textPrimary : colors.textDark}
                    />
                    <Text
                      style={[
                        styles.followBtnText,
                        profile.isFollowing ? styles.followingBtnText : styles.notFollowingBtnText,
                      ]}
                    >
                      {profile.isFollowing ? "Following" : "Follow"}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.editBtn} onPress={() => router.push("/profile-setup")}>
              <Text style={styles.editBtnText}>Edit Profile</Text>
            </Pressable>
          )}
        </View>

        {/* Header Text */}
        <View style={styles.headerText}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{profile.fullName}</Text>
            <MaterialIcons name="verified" size={18} color={colors.accentYellow} />
          </View>

          {profile.role && profile.role !== "user" && (
            <View style={styles.roleBadge}>
              <MaterialIcons
                name={profile.role === "business" ? "work" : profile.role === "admin" ? "admin-panel-settings" : "brush"}
                size={14}
                color="#00B894"
              />
              <Text style={styles.roleBadgeText}>{profile.role}</Text>
            </View>
          )}

          <Text style={styles.bio}>{profile.bio || "No bio yet"}</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Projects</Text>
            <Text style={styles.statValue}>{profile.projectsCount}</Text>
          </View>
          <View style={[styles.statCard, styles.statActive]}>
            <Text style={[styles.statLabel, styles.statLabelActive]}>Followers</Text>
            <Text style={[styles.statValue, styles.statValueActive]}>{profile.followersCount}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Ratings</Text>
            <Text style={styles.statValue}>{profile.rating}</Text>
          </View>
        </View>

        {/* Tabs Row */}
        <View style={styles.tabsRow}>
          {(["Posts", "Portfolio", "Reviews"] as Tab[]).map((t) => (
            <Pressable key={t} onPress={() => setTab(t)} style={styles.tabBtn} hitSlop={6}>
              <Text style={[styles.tabText, tab === t ? styles.tabTextActive : styles.tabTextInactive]}>
                {t}
              </Text>
              {tab === t ? <View style={styles.tabUnderline} /> : null}
            </Pressable>
          ))}
        </View>

        {/* Tab Content */}
        {tab === "Posts" && (
          <View style={styles.list}>
            {posts.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No posts shared yet</Text>
              </View>
            ) : (
              posts.map((p) => (
                <View key={p.id} style={styles.postCard}>
                  <View style={styles.postHeader}>
                    <Avatar
                      uri={profile.avatarUrl}
                      name={profile.fullName}
                      size={36}
                    />
                    <View style={{ flex: 1, marginLeft: spacing.sm }}>
                      <Text style={styles.postName}>{profile.fullName}</Text>
                      <Text style={styles.postMeta}>{p.time}</Text>
                    </View>
                  </View>
                  <Text style={styles.postText}>{p.text}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {tab === "Portfolio" && (
          <View style={styles.list}>
            {portfolio.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No portfolio projects published yet</Text>
              </View>
            ) : (
              portfolio.map((item) => (
                <View key={item.id} style={styles.portfolioCard}>
                  {item.image_url ? (
                    <Image source={{ uri: item.image_url }} style={styles.portfolioImg} contentFit="cover" />
                  ) : (
                    <View style={styles.portfolioPlaceholder}>
                      <MaterialIcons name="image" size={32} color={colors.textMuted} />
                    </View>
                  )}
                  <Text style={styles.portfolioTitle}>{item.title}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {tab === "Reviews" && (
          <View style={styles.list}>
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No reviews received yet</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md },
  loadingText: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.lg },
  backBtn: { backgroundColor: colors.surface, borderRadius: radii.pill, paddingHorizontal: 24, paddingVertical: 12, borderWidth: 1, borderColor: colors.outline },
  backBtnText: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.md },

  coverWrap: { width: "100%", height: 160, backgroundColor: "#1A1A1A", position: "relative" },
  cover: { width: "100%", height: "100%" },
  headerBackBtn: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarCenter: { position: "absolute", bottom: -44, left: 0, right: 0, alignItems: "center" },
  avatarWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: colors.accentYellow,
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  avatar: { width: "100%", height: "100%" },

  actionRow: { marginTop: 48, paddingHorizontal: spacing.lg, alignItems: "flex-end" },
  actionButtons: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  messageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  messageBtnText: {
    color: colors.textPrimary,
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  followBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radii.pill,
  },
  notFollowingBtn: { backgroundColor: colors.accentYellow },
  followingBtn: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.outline },
  followBtnText: { fontFamily: fonts.bold, fontSize: 13 },
  notFollowingBtnText: { color: colors.textDark },
  followingBtnText: { color: colors.textPrimary },
  editBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  editBtnText: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: 13 },

  headerText: { alignItems: "center", marginTop: spacing.xs, paddingHorizontal: spacing.xl },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.title },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#00B89420",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  roleBadgeText: { color: "#00B894", fontFamily: fonts.semibold, fontSize: 12, textTransform: "capitalize" },
  bio: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm, textAlign: "center", marginTop: 6 },

  statsRow: { flexDirection: "row", gap: spacing.md, paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
    gap: 2,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  statActive: { borderColor: colors.accentYellow, backgroundColor: "#EAD05412" },
  statLabel: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 11 },
  statLabelActive: { color: colors.accentYellow, fontFamily: fonts.semibold },
  statValue: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.xl },
  statValueActive: { color: colors.accentYellow },

  tabsRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  tabBtn: { flex: 1, alignItems: "center", paddingVertical: spacing.md, position: "relative" },
  tabText: { fontFamily: fonts.bold, fontSize: fonts.size.md },
  tabTextActive: { color: colors.textPrimary },
  tabTextInactive: { color: colors.textMuted },
  tabUnderline: { position: "absolute", bottom: 0, height: 3, width: "60%", backgroundColor: colors.accentYellow, borderRadius: 2 },

  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md, paddingBottom: spacing.xl * 1.5 },
  emptyCard: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.xl, alignItems: "center", borderWidth: 1, borderColor: colors.outline },
  emptyText: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: fonts.size.md },

  postCard: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.outline, gap: spacing.sm },
  postHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  postAvatar: { width: 36, height: 36, borderRadius: 18 },
  postName: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.md },
  postMeta: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 11 },
  postText: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.md, lineHeight: 20 },

  portfolioCard: { backgroundColor: colors.surface, borderRadius: radii.lg, overflow: "hidden", borderWidth: 1, borderColor: colors.outline },
  portfolioImg: { width: "100%", height: 160 },
  portfolioPlaceholder: { width: "100%", height: 160, backgroundColor: "#1A1A1A", alignItems: "center", justifyContent: "center" },
  portfolioTitle: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.md, padding: spacing.md },
});
