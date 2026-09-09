import {
  approveVerification,
  fetchVerificationRequests,
  rejectVerification,
  VerificationRequest,
} from "@/services/admin";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

export default function AdminVerifications() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 840;

  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "all">("pending");

  useEffect(() => {
    fetchVerificationRequests().then((data) => {
      setRequests(data);
      setLoading(false);
    });
  }, []);

  async function handleApprove(req: VerificationRequest) {
    const success = await approveVerification(req.id);
    if (success) {
      setRequests((prev) =>
        prev.map((r) => (r.id === req.id ? { ...r, status: "approved" } : r))
      );
      Alert.alert(
        "Badge Granted",
        `✓ ${req.full_name} has been granted the verified Blue Badge and mentor privileges.`
      );
    }
  }

  async function handleReject(req: VerificationRequest) {
    Alert.alert(
      "Decline Application",
      `Are you sure you want to decline ${req.full_name}'s verification request?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Decline",
          style: "destructive",
          onPress: async () => {
            await rejectVerification(req.id);
            setRequests((prev) =>
              prev.map((r) => (r.id === req.id ? { ...r, status: "rejected" } : r))
            );
          },
        },
      ]
    );
  }

  function handleOpenLink(url?: string) {
    if (!url) return;
    Linking.openURL(url).catch(() => {
      Alert.alert("Link Notice", `Portfolio URL: ${url}`);
    });
  }

  const displayedRequests =
    activeTab === "pending"
      ? requests.filter((r) => r.status === "pending")
      : requests;

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={colors.accentYellow} />
        <Text style={styles.loadingText}>Loading verification applicants…</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.content, isDesktop && styles.desktopContent]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.pageTitle}>Creator Verification Queue</Text>
          <Text style={styles.pageSubtitle}>
            Review creative portfolios, case study depth, and grant verified Blue Badges.
          </Text>
        </View>
        <View style={styles.queueStatsBadge}>
          <MaterialIcons name="verified" size={16} color={colors.textDark} />
          <Text style={styles.queueStatsText}>
            {requests.filter((r) => r.status === "pending").length} Pending Review
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <Pressable
          style={[styles.tabBtn, activeTab === "pending" && styles.tabBtnActive]}
          onPress={() => setActiveTab("pending")}
          hitSlop={6}
        >
          <Text style={[styles.tabBtnText, activeTab === "pending" && styles.tabBtnTextActive]}>
            Pending Review ({requests.filter((r) => r.status === "pending").length})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabBtn, activeTab === "all" && styles.tabBtnActive]}
          onPress={() => setActiveTab("all")}
          hitSlop={6}
        >
          <Text style={[styles.tabBtnText, activeTab === "all" && styles.tabBtnTextActive]}>
            All Applications ({requests.length})
          </Text>
        </Pressable>
      </View>

      {/* Requests List */}
      <View style={styles.list}>
        {displayedRequests.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialIcons name="done-all" size={36} color={colors.accentGreen} />
            <Text style={styles.emptyTitle}>Verification Queue Clear</Text>
            <Text style={styles.emptyText}>All creator applications have been reviewed!</Text>
          </View>
        ) : (
          displayedRequests.map((req) => {
            const isApproved = req.status === "approved";
            const isRejected = req.status === "rejected";

            return (
              <View key={req.id} style={styles.requestCard}>
                <View style={styles.cardHeader}>
                  <Image
                    source={
                      req.avatar_url
                        ? { uri: req.avatar_url }
                        : require("../../assets/images/react-logo.png")
                    }
                    style={styles.avatar}
                  />
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={styles.nameRow}>
                      <Text style={styles.name}>{req.full_name}</Text>
                      {isApproved && (
                        <MaterialIcons name="verified" size={16} color="#00B894" />
                      )}
                    </View>
                    <Text style={styles.role}>{req.role}</Text>
                    <Text style={styles.submittedAt}>Applied {req.submitted_at}</Text>
                  </View>

                  {/* Status Badge */}
                  <View
                    style={[
                      styles.statusBadge,
                      isApproved
                        ? styles.statusBadgeApproved
                        : isRejected
                        ? styles.statusBadgeRejected
                        : styles.statusBadgePending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        isApproved
                          ? styles.statusTextApproved
                          : isRejected
                          ? styles.statusTextRejected
                          : styles.statusTextPending,
                      ]}
                    >
                      {req.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Candidate Bio */}
                <Text style={styles.bio}>{req.bio}</Text>

                {/* Verification Signals Matrix */}
                <View style={styles.signalsRow}>
                  <View style={styles.signalChip}>
                    <MaterialIcons name="collections" size={14} color={colors.accentYellow} />
                    <Text style={styles.signalText}>{req.case_studies_count} Case Studies</Text>
                  </View>
                  <View style={styles.signalChip}>
                    <MaterialIcons name="groups" size={14} color={colors.accentGreen} />
                    <Text style={styles.signalText}>{req.followers_count} Followers</Text>
                  </View>
                  {req.portfolio_url ? (
                    <Pressable
                      style={styles.signalChipLink}
                      onPress={() => handleOpenLink(req.portfolio_url)}
                      hitSlop={6}
                    >
                      <MaterialIcons name="link" size={14} color="#60a5fa" />
                      <Text style={styles.signalLinkText} numberOfLines={1}>
                        {req.portfolio_url.replace("https://", "")}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>

                {/* Triage Action Buttons */}
                {req.status === "pending" && (
                  <View style={styles.actionsRow}>
                    <Pressable
                      style={styles.declineBtn}
                      onPress={() => handleReject(req)}
                      hitSlop={6}
                    >
                      <MaterialIcons name="close" size={16} color="#ff6b6b" />
                      <Text style={styles.declineBtnText}>Decline</Text>
                    </Pressable>

                    <Pressable
                      style={styles.approveBtn}
                      onPress={() => handleApprove(req)}
                      hitSlop={6}
                    >
                      <MaterialIcons name="verified" size={16} color={colors.textDark} />
                      <Text style={styles.approveBtnText}>Approve Blue Badge</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md },
  loadingText: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.md },
  content: { padding: spacing.lg, gap: spacing.lg },
  desktopContent: { padding: spacing.xl, maxWidth: 1200, alignSelf: "center", width: "100%" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: spacing.md },
  pageTitle: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.title },
  pageSubtitle: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm, marginTop: 4 },
  queueStatsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.accentYellow,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
  },
  queueStatsText: { color: colors.textDark, fontFamily: fonts.bold, fontSize: fonts.size.xs },
  tabsRow: { flexDirection: "row", gap: spacing.sm },
  tabBtn: {
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  tabBtnActive: { backgroundColor: "#1e1e1e", borderColor: colors.accentYellow },
  tabBtnText: { color: colors.textSecondary, fontFamily: fonts.semibold, fontSize: fonts.size.xs },
  tabBtnTextActive: { color: colors.accentYellow, fontFamily: fonts.bold },
  list: { gap: spacing.md },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    gap: spacing.xs,
  },
  emptyTitle: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.md },
  emptyText: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm },
  requestCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.outline,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardHeader: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#1e1e1e" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.md },
  role: { color: colors.textSecondary, fontFamily: fonts.semibold, fontSize: fonts.size.xs },
  submittedAt: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 11 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.pill },
  statusBadgePending: { backgroundColor: "#3a2d12" },
  statusBadgeApproved: { backgroundColor: "#064e3b" },
  statusBadgeRejected: { backgroundColor: "#451212" },
  statusBadgeText: { fontFamily: fonts.bold, fontSize: 10 },
  statusTextPending: { color: colors.accentYellow },
  statusTextApproved: { color: colors.accentGreen },
  statusTextRejected: { color: "#ff6b6b" },
  bio: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm, lineHeight: 20 },
  signalsRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  signalChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#161616",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  signalText: { color: colors.textSecondary, fontFamily: fonts.semibold, fontSize: fonts.size.xs },
  signalChipLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#14233a",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "#1e3a5f",
  },
  signalLinkText: { color: "#93c5fd", fontFamily: fonts.semibold, fontSize: fonts.size.xs },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.outline,
    paddingTop: spacing.md,
  },
  declineBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#2a1515",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "#4d2020",
  },
  declineBtnText: { color: "#ff6b6b", fontFamily: fonts.semibold, fontSize: fonts.size.xs },
  approveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.accentGreen,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radii.pill,
  },
  approveBtnText: { color: colors.textDark, fontFamily: fonts.bold, fontSize: fonts.size.xs },
});
