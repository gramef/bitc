import BookmarkIcon from "@/assets/icons/bookmark.svg";
import HeartIcon from "@/assets/icons/heart.svg";
import ReplyIcon from "@/assets/icons/reply.svg";
import RepostIcon from "@/assets/icons/repost.svg";
import ShareIcon from "@/assets/icons/share.svg";
import SafeScreen from "@/components/SafeScreen";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from "react-native";

type CommentItem = {
  id: string;
  userId: string;
  name: string;
  role: string;
  time: string;
  text: string;
  avatarUrl?: string | null;
  likes: string;
  liked: boolean;
};

export default function PostView() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeText, setComposeText] = useState("");
  const [liked, setLiked] = useState(false);
  const [bookmark, setBookmark] = useState(false);
  const [deleteMenuOpen, setDeleteMenuOpen] = useState(false);
  const [post, setPost] = useState<{
    id: string;
    name: string;
    role: string;
    time: string;
    createdAt: string;
    text: string;
    avatarUrl?: string | null;
    stats: { views: string; likes: string; comments: string; shares: string };
  } | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    import("@/services/profile").then(async (m) => {
      const detail = await m.fetchPostDetail(String(id));
      if (detail) {
        setPost({
          id: detail.id,
          name: detail.author.full_name,
          role: detail.author.bio ?? "Member",
          time: detail.time,
          createdAt: detail.createdAt,
          text: detail.text,
          avatarUrl: detail.author.avatar_url ?? null,
          stats: {
            views: String(detail.views),
            likes: String(detail.likes),
            comments: String(detail.comments),
            shares: String(detail.reach),
          },
        });
        setLiked(Boolean(detail.likedByMe));
        import("@/services/profile").then(({ updatePost }) => {
          const newViews = detail.views + 1;
          updatePost(detail.id, { views: newViews });
          setPost((prev) => (prev ? { ...prev, stats: { ...prev.stats, views: String(newViews) } } : prev));
        });
      }
      const cmts = await m.fetchCommentsForPost(String(id));
      setComments(
        cmts.map((c) => ({
          id: c.id,
          userId: c.userId,
          name: c.author.full_name,
          role: c.author.bio ?? "Member",
          time: c.time,
          text: c.text,
          avatarUrl: c.author.avatar_url ?? null,
          likes: String(c.likes ?? 0),
          liked: Boolean(c.likedByMe ?? false),
        }))
      );
      setLoading(false);
    });
  }, [id]);

  const avatarSrc = useMemo(() => {
    return post?.avatarUrl ? { uri: post.avatarUrl } : require("../../assets/images/react-logo.png");
  }, [post?.avatarUrl]);

  function toggleLike() {
    if (!post) return;
    const next = !liked;
    setLiked(next);
    import("@/services/profile").then(({ toggleLike }) => {
      toggleLike(post.id, next);
    });
    setPost((prev) =>
      prev
        ? {
          ...prev,
          stats: {
            ...prev.stats,
            likes: String(Math.max(0, Number(prev.stats.likes) + (next ? 1 : -1))),
          },
        }
        : prev
    );
  }

  function formatExact(iso: string) {
    const d = new Date(iso);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    const date = `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    return `${h}:${m} ${ampm} - ${date}`;
  }
  function formatViews(nStr: string) {
    const n = Number(nStr || 0);
    return `${n.toLocaleString()} Views`;
  }

  function submitComment() {
    if (!post || !composeText.trim()) return;
    import("@/services/profile").then(async (m) => {
      const res = await m.addComment(post.id, composeText.trim());
      if (res.ok) {
        const cmts = await m.fetchCommentsForPost(post.id);
        setComments(
          cmts.map((c) => ({
            id: c.id,
            userId: c.userId,
            name: c.author.full_name,
            role: c.author.bio ?? "Member",
            time: c.time,
            text: c.text,
            avatarUrl: c.author.avatar_url ?? null,
            likes: String(c.likes ?? 0),
            liked: Boolean(c.likedByMe ?? false),
          }))
        );
        setPost((prev) =>
          prev
            ? {
              ...prev,
              stats: {
                ...prev.stats,
                comments: String(Number(prev.stats.comments) + 1),
              },
            }
            : prev
        );
      }
      setComposeText("");
      setComposeOpen(false);
    });
  }

  function toggleCommentLike(commentId: string) {
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? {
            ...c,
            liked: !c.liked,
            likes: String(Math.max(0, Number(c.likes) + (c.liked ? -1 : 1))),
          }
          : c
      )
    );
    import("@/services/profile").then(({ toggleCommentLike }) => {
      const target = comments.find((c) => c.id === commentId);
      const next = target ? !target.liked : true;
      toggleCommentLike(commentId, next);
    });
  }

  function toggleBookmark() {
    if (!post) return;
    const next = !bookmark;
    setBookmark(next);
    import("@/services/profile").then(({ updatePost }) => {
      updatePost(post.id, { bookmark: next });
    });
  }

  if (loading || !post) {
    return (
      <SafeScreen>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={6} style={styles.iconBtn}>
            <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.pageTitle}>Post View</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: colors.textSecondary, fontFamily: fonts.regular }}>Loading...</Text>
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={6} style={styles.iconBtn}>
            <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.pageTitle}>Post View</Text>
          <View style={{ width: 32 }} />
        </View>

        <View style={styles.postCard}>
          <View style={styles.postHeader}>
            <View style={styles.postAvatarWrap}>
              <Image source={avatarSrc} style={styles.postAvatar} contentFit="cover" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.nameRowSmall}>
                <Text style={styles.postName}>{post.name}</Text>
                <MaterialIcons name="verified" size={16} color={colors.accentYellow} />
              </View>
              <Text style={styles.postMeta}>{post.role}</Text>
            </View>
            <Pressable hitSlop={6} style={styles.iconBtn} onPress={() => setDeleteMenuOpen(true)}>
              <MaterialIcons name="more-vert" size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          <Text style={styles.postText}>{post.text}</Text>
          <Text style={styles.timestamp}>{formatExact(post.createdAt)} - {formatViews(post.stats.views)}</Text>

          <View style={styles.postActions}>
            <Pressable style={styles.metric} hitSlop={6} onPress={toggleLike}>
              <HeartIcon width={18} height={18} />
              <Text style={styles.metricText}>{post.stats.likes}</Text>
            </Pressable>
            <Pressable style={styles.metric} hitSlop={6} onPress={() => setComposeOpen(true)}>
              <ReplyIcon width={18} height={18} />
              <Text style={styles.metricText}>{post.stats.comments}</Text>
            </Pressable>
            <View style={styles.metric}>
              <RepostIcon width={18} height={18} />
              <Text style={styles.metricText}>{post.stats.shares}</Text>
            </View>
            <Pressable style={styles.iconBtn} hitSlop={6} onPress={toggleBookmark}>
              <BookmarkIcon width={18} height={18} />
            </Pressable>
            <Pressable style={styles.iconBtn} hitSlop={6} onPress={() => Share.share({ message: post.text || post.name })}>
              <ShareIcon width={18} height={18} />
            </Pressable>
          </View>
        </View>

        <View style={styles.redDivider} />

        <View style={styles.list}>
          {comments.map((c, idx) => (
            <View key={c.id} style={styles.commentCard}>
              <View style={styles.postHeader}>
                <View style={styles.postAvatarWrap}>
                  <Image
                    source={c.avatarUrl ? { uri: c.avatarUrl } : require("../../assets/images/react-logo.png")}
                    style={styles.postAvatar}
                    contentFit="cover"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRowSmall}>
                    <Text style={styles.postName}>{c.name}</Text>
                    <MaterialIcons name="verified" size={16} color={colors.accentYellow} />
                    <Text style={styles.timeDot}>· {c.time}</Text>
                  </View>
                  <Text style={styles.postMeta}>{c.role}</Text>
                </View>
                <Pressable hitSlop={6} style={styles.iconBtn}>
                  <MaterialIcons name="more-vert" size={20} color={colors.textMuted} />
                </Pressable>
              </View>
              <Text style={styles.postText}>{c.text}</Text>
              <View style={styles.postActions}>
                <Pressable style={styles.iconBtn} hitSlop={6}>
                  <ReplyIcon width={18} height={18} />
                </Pressable>
                <Pressable style={styles.metric} hitSlop={6} onPress={() => toggleCommentLike(c.id)}>
                  <HeartIcon width={18} height={18} />
                  <Text style={styles.metricText}>{c.likes}</Text>
                </Pressable>
                <Pressable style={styles.iconBtn} hitSlop={6}>
                  <RepostIcon width={18} height={18} />
                </Pressable>
                <Pressable style={styles.iconBtn} hitSlop={6}>
                  <BookmarkIcon width={18} height={18} />
                </Pressable>
                <Pressable style={styles.iconBtn} hitSlop={6}>
                  <ShareIcon width={18} height={18} />
                </Pressable>
              </View>
              {idx < comments.length - 1 ? <View style={styles.redDivider} /> : null}
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={deleteMenuOpen} transparent animationType="fade" onRequestClose={() => setDeleteMenuOpen(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", paddingHorizontal: spacing.lg }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: radii.card, padding: spacing.lg }}>
            <View style={{ gap: spacing.md }}>
              <Pressable
                onPress={async () => {
                  const { deletePost } = await import("@/services/profile");
                  if (post?.id) {
                    const res = await deletePost(post.id);
                    if (res.ok) {
                      setDeleteMenuOpen(false);
                      router.back();
                      return;
                    }
                  }
                  setDeleteMenuOpen(false);
                }}
                hitSlop={6}
              >
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
            <Text style={{ color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.md }}>Add Comment</Text>
            <View style={{ height: spacing.md }} />
            <TextInput
              value={composeText}
              onChangeText={setComposeText}
              style={{ color: colors.textPrimary, fontFamily: fonts.regular, fontSize: fonts.size.md, borderWidth: 1, borderColor: colors.outline, borderRadius: radii.md, padding: spacing.md }}
              placeholder="Write something..."
              placeholderTextColor="#9E9E9E"
              multiline
            />
            <View style={{ height: spacing.md }} />
            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: spacing.md }}>
              <Pressable onPress={() => setComposeOpen(false)} hitSlop={6}>
                <Text style={{ color: colors.textSecondary, fontFamily: fonts.semibold }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={submitComment} hitSlop={6}>
                <Text style={{ color: colors.accentYellow, fontFamily: fonts.semibold }}>Post</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
  },
  pageTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: fonts.size.lg,
  },
  iconBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  postCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.outline,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  commentCard: {
    paddingVertical: spacing.md,
    paddingHorizontal: 0,
    marginBottom: 0,
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
  nameRowSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  postName: {
    color: colors.textPrimary,
    fontFamily: fonts.semibold,
    fontSize: fonts.size.md,
  },
  timeDot: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: fonts.size.sm,
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
  timestamp: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: fonts.size.sm,
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
    fontFamily: fonts.regular,
    fontSize: fonts.size.sm,
  },
  list: {
    paddingBottom: spacing.lg,
  },
  redDivider: {
    height: 1,
    backgroundColor: "#6A3A3A",
    marginVertical: spacing.md,
  },
})
