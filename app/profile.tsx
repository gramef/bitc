import SafeScreen from "@/components/SafeScreen";
import { useAuth } from "@/contexts/AuthContext";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Modal, Pressable, RefreshControl, ScrollView, Share, StyleSheet, Text, TextInput, View } from "react-native";


type Tab = "Posts" | "Portfolio" | "Reviews";

export default function UserProfile() {
  const router = useRouter();
  const { profile: authProfile, signOut, refreshProfile } = useAuth();
  const [tab, setTab] = useState<Tab>("Posts");
  const [refreshing, setRefreshing] = useState(false);
  const [fullName, setFullName] = useState("Guest");
  const [bio, setBio] = useState<string | null>(null);
  const [avatarSrc, setAvatarSrc] = useState<any>(require("../assets/images/react-logo.png"));
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
  async function loadProfileData() {
    const { fetchMyProfile, fetchMyPosts, fetchMyPortfolio, fetchMyReviews, fetchEngagementForPosts } = await import("@/services/profile");
    const p = await fetchMyProfile();
    setFullName(p.fullName);
    setBio(p.bio);
    if (p.avatarUrl) setAvatarSrc({ uri: p.avatarUrl });
    setStats([
      { label: "Projects", value: String(p.projectsCount ?? 0), active: false },
      { label: "Followers", value: String(p.followersCount ?? 0), active: false },
      { label: "Ratings", value: String(p.rating ?? 0), active: false },
    ]);
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
          <Image
            source={require("../images/Rectangle 104.png")}
            style={styles.cover}
            contentFit="cover"
          />
          <View style={styles.avatarCenter}>
            <View style={styles.avatarWrap}>
              <Image source={avatarSrc} style={styles.avatar} contentFit="cover" />
            </View>
          </View>
          <Pressable style={styles.editBadge} hitSlop={6} onPress={() => router.push("/profile-setup")}>
            <MaterialIcons name="edit" size={18} color={colors.textDark} />
          </Pressable>
        </View>

        {/* Settings button */}
        <Pressable style={styles.signOutBtn} hitSlop={6} onPress={() => router.push("/settings" as any)}>
          <MaterialIcons name="settings" size={18} color={colors.textSecondary} />
          <Text style={[styles.signOutText, { color: colors.textSecondary }]}>Settings</Text>
        </Pressable>

        <View style={styles.headerText}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{fullName}</Text>
            <MaterialIcons name="verified" size={18} color={colors.accentYellow} />
          </View>
          {authProfile?.role && authProfile.role !== "user" && (
            <View style={{
              alignSelf: "flex-start",
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              backgroundColor: authProfile.role === "business" ? "#6C5CE720" : authProfile.role === "admin" ? "#E1705520" : "#00B89420",
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 12,
              marginTop: 4,
            }}>
              <MaterialIcons
                name={authProfile.role === "business" ? "work" : authProfile.role === "admin" ? "admin-panel-settings" : "brush"}
                size={14}
                color={authProfile.role === "business" ? "#6C5CE7" : authProfile.role === "admin" ? "#E17055" : "#00B894"}
              />
              <Text style={{
                color: authProfile.role === "business" ? "#6C5CE7" : authProfile.role === "admin" ? "#E17055" : "#00B894",
                fontFamily: fonts.semibold,
                fontSize: 12,
                textTransform: "capitalize",
              }}>
                {authProfile.role}
              </Text>
            </View>
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

        {tab === "Posts" ? (
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
                      <Image source={avatarSrc} style={styles.postAvatar} />
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
            {portfolio.length === 0 ? (
              <View style={styles.postCard}>
                <Text style={styles.postText}>No portfolio items yet</Text>
              </View>
            ) : (
              portfolio.map((it) => (
                <View key={it.id} style={styles.postCard}>
                  {it.image_url ? <Image source={{ uri: it.image_url }} style={{ width: "100%", height: 160, borderRadius: 12 }} contentFit="cover" /> : null}
                  <Text style={[styles.postText, { marginTop: 8 }]}>{it.title}</Text>
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
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: colors.outline,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
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
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: "#5a2020",
    backgroundColor: "#1a0a0a",
  },
  signOutText: {
    color: "#ff6b6b",
    fontFamily: fonts.semibold,
    fontSize: fonts.size.md,
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
