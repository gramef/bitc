import SafeScreen from "@/components/SafeScreen";
import { EmptyState } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { addComment, createPost, fetchAuthorsByIds, fetchEngagementForPosts, fetchPublicPosts, toggleLike } from "@/services/profile";
import { fetchLiveRooms } from "@/services/rooms";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type DisplayPost = {
  id: string;
  userId: string;
  name: string;
  role: string;
  time: string;
  text: string;
  avatarUrl: string | null;
  likes: number;
  comments: number;
  views: number;
  likedByMe: boolean;
};

export default function Community() {
  const router = useRouter();
  const { profile, user } = useAuth();
  const avatarSrc = profile?.avatarUrl
    ? { uri: profile.avatarUrl }
    : require("../../assets/images/react-logo.png");

  const [posts, setPosts] = useState<DisplayPost[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newPostText, setNewPostText] = useState("");
  const [postingLoading, setPostingLoading] = useState(false);
  const [liveRoomCount, setLiveRoomCount] = useState(0);

  // Comment modal
  const [commentModal, setCommentModal] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  const loadPosts = useCallback(async () => {
    try {
      const rawPosts = await fetchPublicPosts(50);
      if (rawPosts.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }
      const userIds = [...new Set(rawPosts.map((p) => p.user_id))];
      const [authors, engagement] = await Promise.all([
        fetchAuthorsByIds(userIds),
        fetchEngagementForPosts(rawPosts.map((p) => p.id)),
      ]);

      const displayPosts: DisplayPost[] = rawPosts.map((p) => {
        const author = authors[p.user_id];
        const dt = new Date(p.time);
        const diff = Date.now() - dt.getTime();
        const hrs = Math.floor(diff / 3600000);
        const timeStr = hrs < 1 ? "Just now" : hrs < 24 ? `${hrs}h ago` : `${Math.floor(hrs / 24)}d ago`;
        return {
          id: p.id,
          userId: p.user_id,
          name: author?.full_name ?? "Anonymous",
          role: author?.bio ?? "Creative",
          time: timeStr,
          text: p.text,
          avatarUrl: author?.avatar_url ?? null,
          likes: engagement.likes[p.id] ?? 0,
          comments: engagement.comments[p.id] ?? 0,
          views: p.views,
          likedByMe: engagement.likedByMe[p.id] ?? false,
        };
      });
      setPosts(displayPosts);
    } catch {
      // keep existing posts on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
    fetchLiveRooms().then((r) => setLiveRoomCount(r.length));
  }, [loadPosts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  }, [loadPosts]);

  async function handleCreatePost() {
    if (!newPostText.trim() || postingLoading) return;
    setPostingLoading(true);
    try {
      await createPost(newPostText.trim());
      setNewPostText("");
      await loadPosts();
    } catch {
      // silent fail
    } finally {
      setPostingLoading(false);
    }
  }

  async function handleLike(postId: string, currentlyLiked: boolean) {
    await toggleLike(postId, !currentlyLiked);
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, likedByMe: !currentlyLiked, likes: p.likes + (currentlyLiked ? -1 : 1) }
          : p
      )
    );
  }

  async function handleComment() {
    if (!commentModal || !commentText.trim()) return;
    await addComment(commentModal, commentText.trim());
    setPosts((prev) =>
      prev.map((p) => (p.id === commentModal ? { ...p, comments: p.comments + 1 } : p))
    );
    setCommentText("");
    setCommentModal(null);
  }

  async function handleShare(text: string) {
    Share.share({ message: text });
  }

  return (
    <SafeScreen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentYellow} />
        }
      >
        {/* Header */}
        <View style={styles.topRow}>
          <View style={styles.topLeft}>
            <View style={styles.topAvatarWrap}>
              <Image source={avatarSrc} style={styles.topAvatar} contentFit="cover" />
            </View>
            <View>
              <Text style={styles.topGreeting}>Good day,</Text>
              <Text style={styles.topName}>{profile?.fullName ?? "Guest"}</Text>
            </View>
          </View>
          <Pressable style={styles.notifBtn} hitSlop={6} onPress={() => router.push("/notifications")}>
            <MaterialIcons name="notifications" size={20} color={colors.textPrimary} />
          </Pressable>
        </View>

        <Text style={styles.pageTitle}>Community</Text>

        {/* Live Rooms Banner */}
        <Pressable
          style={styles.liveBanner}
          onPress={() => router.push("/rooms" as any)}
        >
          <View style={styles.liveBannerLeft}>
            <View style={styles.liveBannerDot} />
            <View>
              <Text style={styles.liveBannerTitle}>BITC Live</Text>
              <Text style={styles.liveBannerSub}>
                {liveRoomCount > 0
                  ? `${liveRoomCount} room${liveRoomCount > 1 ? "s" : ""} happening now`
                  : "Start or join a live conversation"}
              </Text>
            </View>
          </View>
          <MaterialIcons name="arrow-forward-ios" size={14} color={colors.accentYellow} />
        </Pressable>

        {/* Compose */}
        {user ? (
          <View style={styles.composeCard}>
            <View style={styles.composeRow}>
              <View style={styles.composeAvatarWrap}>
                <Image source={avatarSrc} style={styles.composeAvatar} contentFit="cover" />
              </View>
              <TextInput
                style={styles.composeInput}
                placeholder="Share something with the community…"
                placeholderTextColor={colors.textSecondary}
                value={newPostText}
                onChangeText={setNewPostText}
                multiline
              />
            </View>
            <Pressable
              style={[styles.postBtn, (!newPostText.trim() || postingLoading) && styles.postBtnDisabled]}
              onPress={handleCreatePost}
              disabled={!newPostText.trim() || postingLoading}
            >
              <Text style={styles.postBtnText}>{postingLoading ? "Posting…" : "Post"}</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Posts */}
        {posts.length === 0 && !loading ? (
          <EmptyState icon="forum" title="No posts yet" subtitle="Be the first to share something!" />
        ) : (
          posts.map((post) => (
            <View key={post.id} style={styles.postCard}>
              <View style={styles.postHeader}>
                <View style={styles.postAvatarWrap}>
                  <Image
                    source={post.avatarUrl ? { uri: post.avatarUrl } : require("../../assets/images/react-logo.png")}
                    style={styles.postAvatar}
                    contentFit="cover"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.postName}>{post.name}</Text>
                  <Text style={styles.postRole}>{post.role}</Text>
                </View>
                <Text style={styles.postTime}>{post.time}</Text>
              </View>
              <Text style={styles.postText}>{post.text}</Text>
              <View style={styles.postActions}>
                <Pressable style={styles.actionBtn} onPress={() => handleLike(post.id, post.likedByMe)}>
                  <MaterialIcons
                    name={post.likedByMe ? "favorite" : "favorite-border"}
                    size={18}
                    color={post.likedByMe ? "#ff6b6b" : colors.textSecondary}
                  />
                  <Text style={styles.actionText}>{post.likes}</Text>
                </Pressable>
                <Pressable style={styles.actionBtn} onPress={() => setCommentModal(post.id)}>
                  <MaterialIcons name="chat-bubble-outline" size={18} color={colors.textSecondary} />
                  <Text style={styles.actionText}>{post.comments}</Text>
                </Pressable>
                <Pressable style={styles.actionBtn} onPress={() => handleShare(post.text)}>
                  <MaterialIcons name="share" size={18} color={colors.textSecondary} />
                </Pressable>
                <View style={styles.actionBtn}>
                  <MaterialIcons name="visibility" size={18} color={colors.textSecondary} />
                  <Text style={styles.actionText}>{post.views}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Comment Modal */}
      <Modal visible={!!commentModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Comment</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Write a comment…"
              placeholderTextColor={colors.textSecondary}
              value={commentText}
              onChangeText={setCommentText}
              multiline
              autoFocus
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => { setCommentModal(null); setCommentText(""); }}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalSubmitBtn} onPress={handleComment}>
                <Text style={styles.modalSubmitText}>Post</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xl, gap: spacing.md },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  topLeft: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  topAvatarWrap: { width: 44, height: 44, borderRadius: 22, overflow: "hidden", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.outline },
  topAvatar: { width: 42, height: 42, borderRadius: 21 },
  topGreeting: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm },
  topName: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.lg },
  notifBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.accentGreen, alignItems: "center", justifyContent: "center" },
  pageTitle: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.title, marginTop: spacing.xs },
  // Live banner
  liveBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.accentYellow + "40",
    padding: spacing.md,
  },
  liveBannerLeft: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  liveBannerDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#FF4444" },
  liveBannerTitle: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.md },
  liveBannerSub: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.xs },
  // Compose
  composeCard: { backgroundColor: colors.surface, borderRadius: radii.card, borderWidth: 1, borderColor: colors.outline, padding: spacing.md },
  composeRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  composeAvatarWrap: { width: 36, height: 36, borderRadius: 18, overflow: "hidden" },
  composeAvatar: { width: 36, height: 36, borderRadius: 18 },
  composeInput: { flex: 1, color: colors.textPrimary, fontFamily: fonts.regular, fontSize: fonts.size.md, minHeight: 40, paddingTop: 0 },
  postBtn: { alignSelf: "flex-end", backgroundColor: colors.accentYellow, borderRadius: radii.pill, paddingHorizontal: 20, paddingVertical: 8, marginTop: spacing.sm },
  postBtnDisabled: { opacity: 0.5 },
  postBtnText: { color: colors.textDark, fontFamily: fonts.semibold, fontSize: fonts.size.sm },
  // Posts
  postCard: { backgroundColor: colors.surface, borderRadius: radii.card, borderWidth: 1, borderColor: colors.outline, padding: spacing.md },
  postHeader: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.sm },
  postAvatarWrap: { width: 40, height: 40, borderRadius: 20, overflow: "hidden" },
  postAvatar: { width: 40, height: 40, borderRadius: 20 },
  postName: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.md },
  postRole: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.xs },
  postTime: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.xs },
  postText: { color: colors.textPrimary, fontFamily: fonts.regular, fontSize: fonts.size.md, lineHeight: 22 },
  postActions: { flexDirection: "row", gap: spacing.lg, marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.divider },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  actionText: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.xs },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing.xl },
  modalTitle: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.lg, marginBottom: spacing.md },
  modalInput: { color: colors.textPrimary, fontFamily: fonts.regular, fontSize: fonts.size.md, minHeight: 80, borderWidth: 1, borderColor: colors.outline, borderRadius: radii.sm, padding: spacing.md, textAlignVertical: "top" },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: spacing.lg, marginTop: spacing.lg },
  modalCancel: { color: colors.textSecondary, fontFamily: fonts.semibold, fontSize: fonts.size.md },
  modalSubmitBtn: { backgroundColor: colors.accentYellow, borderRadius: radii.pill, paddingHorizontal: 20, paddingVertical: 10 },
  modalSubmitText: { color: colors.textDark, fontFamily: fonts.semibold, fontSize: fonts.size.md },
});
