import {
  fetchReportedPosts,
  ReportedPost,
  resolveReportedPost,
  terminateLiveRoom,
} from "@/services/admin";
import { fetchLiveRooms, RoomRow } from "@/services/rooms";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

export default function AdminModeration() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 840;

  const [liveRooms, setLiveRooms] = useState<RoomRow[]>([]);
  const [reportedPosts, setReportedPosts] = useState<ReportedPost[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [rooms, reports] = await Promise.all([
        fetchLiveRooms(),
        fetchReportedPosts(),
      ]);
      setLiveRooms(rooms);
      setReportedPosts(reports);
    } catch (err) {
      console.warn("Failed loading moderation data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleKillRoom(room: RoomRow) {
    Alert.alert(
      "Emergency Room Termination",
      `Terminate "${room.title}" immediately? All audio tracks will be severed.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Terminate Room",
          style: "destructive",
          onPress: async () => {
            const res = await terminateLiveRoom(room.id);
            Alert.alert("Room Terminated", res.message);
            setLiveRooms((prev) => prev.filter((r) => r.id !== room.id));
          },
        },
      ]
    );
  }

  async function handleResolvePost(report: ReportedPost, action: "remove" | "dismiss") {
    const success = await resolveReportedPost(report.id, action);
    if (success) {
      setReportedPosts((prev) => prev.filter((p) => p.id !== report.id));
      Alert.alert(
        action === "remove" ? "Post Removed" : "Report Dismissed",
        action === "remove"
          ? "The flagged post has been purged from the community feed."
          : "Report dismissed without content action."
      );
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={colors.accentYellow} />
        <Text style={styles.loadingText}>Connecting to LiveKit and safety audit stream…</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.content, isDesktop && styles.desktopContent]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.pageTitle}>Audio & Content Moderation</Text>
          <Text style={styles.pageSubtitle}>
            Live audio room oversight, speaker controls, and community safety triage.
          </Text>
        </View>
        <View style={styles.safetyStatusBadge}>
          <View style={styles.statusDotGreen} />
          <Text style={styles.safetyStatusText}>All Safety Rules Enforced</Text>
        </View>
      </View>

      {/* Section 1: Active Audio Rooms */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <View style={styles.livePulseRed} />
            <Text style={styles.sectionTitle}>
              Active LiveKit Audio Rooms ({liveRooms.length})
            </Text>
          </View>
          <Pressable style={styles.refreshBtn} onPress={loadData} hitSlop={6}>
            <MaterialIcons name="refresh" size={16} color={colors.textSecondary} />
            <Text style={styles.refreshBtnText}>Refresh</Text>
          </Pressable>
        </View>

        {liveRooms.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialIcons name="mic-off" size={32} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No Active Audio Rooms</Text>
            <Text style={styles.emptyDesc}>Community voice rooms are currently quiet.</Text>
          </View>
        ) : (
          <View style={styles.roomsGrid}>
            {liveRooms.map((room) => (
              <View key={room.id} style={styles.roomCard}>
                <View style={styles.roomCardTop}>
                  <View style={styles.roomLiveBadge}>
                    <Text style={styles.roomLiveText}>ON AIR</Text>
                  </View>
                  <View style={styles.roomListenersBadge}>
                    <MaterialIcons name="headphones" size={12} color={colors.accentGreen} />
                    <Text style={styles.roomListenersText}>
                      {(room as any).participant_count ?? (room.max_speakers ? `${room.max_speakers} Max` : "Active")}
                    </Text>
                  </View>
                </View>

                <Text style={styles.roomTitle}>{room.title}</Text>
                <Text style={styles.roomHost}>
                  Hosted by {(room as any).host_name || room.category || "Community Host"}
                </Text>

                {room.topic ? (
                  <View style={styles.topicPill}>
                    <Text style={styles.topicText}>#{room.topic}</Text>
                  </View>
                ) : null}

                {/* Admin Actions */}
                <View style={styles.roomActionsRow}>
                  <Pressable
                    style={styles.joinBtn}
                    onPress={() => router.push(`/room/${room.id}`)}
                    hitSlop={6}
                  >
                    <MaterialIcons name="volume-up" size={14} color={colors.textPrimary} />
                    <Text style={styles.joinBtnText}>Inspect Audio</Text>
                  </Pressable>

                  <Pressable
                    style={styles.terminateBtn}
                    onPress={() => handleKillRoom(room)}
                    hitSlop={6}
                  >
                    <MaterialIcons name="block" size={14} color="#ff6b6b" />
                    <Text style={styles.terminateBtnText}>Force End</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Section 2: Flagged & Reported Content */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Flagged Community Content ({reportedPosts.length})
          </Text>
        </View>

        {reportedPosts.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialIcons name="verified-user" size={32} color={colors.accentGreen} />
            <Text style={styles.emptyTitle}>Zero Unresolved Reports</Text>
            <Text style={styles.emptyDesc}>Feed posts and comments comply with platform guidelines.</Text>
          </View>
        ) : (
          <View style={styles.reportsList}>
            {reportedPosts.map((report) => (
              <View key={report.id} style={styles.reportCard}>
                <View style={styles.reportHeader}>
                  <View style={styles.violationTag}>
                    <MaterialIcons name="report-problem" size={14} color="#ff6b6b" />
                    <Text style={styles.violationTagText}>Violation Flag</Text>
                  </View>
                  <Text style={styles.reportedTime}>{report.reported_at}</Text>
                </View>

                {/* Violation Reason */}
                <Text style={styles.reportReason}>
                  <Text style={{ fontFamily: fonts.bold, color: colors.textPrimary }}>Reason: </Text>
                  {report.reason}
                </Text>

                {/* Flagged Text Body */}
                <View style={styles.flaggedContentBox}>
                  <Text style={styles.flaggedAuthor}>User: {report.author_name}</Text>
                  <Text style={styles.flaggedText}>"{report.post_text}"</Text>
                </View>

                <Text style={styles.reportedByText}>Flagged by: {report.reported_by}</Text>

                {/* Resolution Controls */}
                <View style={styles.reportActionsRow}>
                  <Pressable
                    style={styles.dismissBtn}
                    onPress={() => handleResolvePost(report, "dismiss")}
                    hitSlop={6}
                  >
                    <Text style={styles.dismissBtnText}>Dismiss Report</Text>
                  </Pressable>

                  <Pressable
                    style={styles.removeContentBtn}
                    onPress={() => handleResolvePost(report, "remove")}
                    hitSlop={6}
                  >
                    <MaterialIcons name="delete-forever" size={16} color="#fff" />
                    <Text style={styles.removeContentBtnText}>Delete Post & Warn User</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md },
  loadingText: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.md },
  content: { padding: spacing.lg, gap: spacing.xl },
  desktopContent: { padding: spacing.xl, maxWidth: 1200, alignSelf: "center", width: "100%" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: spacing.md },
  pageTitle: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.title },
  pageSubtitle: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm, marginTop: 4 },
  safetyStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#112a1c",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.accentGreen,
  },
  statusDotGreen: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accentGreen },
  safetyStatusText: { color: colors.accentGreen, fontFamily: fonts.bold, fontSize: fonts.size.xs },
  section: { gap: spacing.md },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  livePulseRed: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#e74c3c" },
  sectionTitle: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.lg },
  refreshBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.surface, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radii.pill },
  refreshBtnText: { color: colors.textSecondary, fontFamily: fonts.semibold, fontSize: fonts.size.xs },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    gap: spacing.xs,
  },
  emptyTitle: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.md },
  emptyDesc: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm },
  roomsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  roomCard: {
    flex: 1,
    minWidth: 280,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.outline,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  roomCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  roomLiveBadge: { backgroundColor: "#e74c3c", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  roomLiveText: { color: "#fff", fontFamily: fonts.bold, fontSize: 10 },
  roomListenersBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#112a1c", paddingHorizontal: 8, paddingVertical: 3, borderRadius: radii.pill },
  roomListenersText: { color: colors.accentGreen, fontFamily: fonts.semibold, fontSize: 11 },
  roomTitle: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.md },
  roomHost: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.xs },
  topicPill: { alignSelf: "flex-start", backgroundColor: "#1c1c1c", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  topicText: { color: colors.accentYellow, fontFamily: fonts.semibold, fontSize: 10 },
  roomActionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.outline,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  joinBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "#1f1f1f",
    paddingVertical: 8,
    borderRadius: radii.pill,
  },
  joinBtnText: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.xs },
  terminateBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "#3a1717",
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "#5c2424",
  },
  terminateBtnText: { color: "#ff6b6b", fontFamily: fonts.bold, fontSize: fonts.size.xs },
  reportsList: { gap: spacing.md },
  reportCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: "#662828",
    padding: spacing.lg,
    gap: spacing.sm,
  },
  reportHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  violationTag: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#331515", paddingHorizontal: 8, paddingVertical: 4, borderRadius: radii.pill },
  violationTagText: { color: "#ff8080", fontFamily: fonts.bold, fontSize: 11 },
  reportedTime: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 11 },
  reportReason: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm },
  flaggedContentBox: {
    backgroundColor: "#161616",
    borderRadius: radii.md,
    padding: spacing.md,
    gap: 4,
    borderLeftWidth: 3,
    borderLeftColor: "#ff6b6b",
  },
  flaggedAuthor: { color: colors.textSecondary, fontFamily: fonts.semibold, fontSize: fonts.size.xs },
  flaggedText: { color: colors.textPrimary, fontFamily: fonts.regular, fontSize: fonts.size.sm, fontStyle: "italic" },
  reportedByText: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: fonts.size.xs },
  reportActionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.outline,
    paddingTop: spacing.md,
    marginTop: spacing.xs,
  },
  dismissBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outline,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
  },
  dismissBtnText: { color: colors.textSecondary, fontFamily: fonts.semibold, fontSize: fonts.size.xs },
  removeContentBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#d63031",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
  },
  removeContentBtnText: { color: "#fff", fontFamily: fonts.bold, fontSize: fonts.size.xs },
});
