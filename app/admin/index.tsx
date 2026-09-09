import { AdminKPIs, fetchAdminKPIs } from "@/services/admin";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

export default function AdminOverview() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 840;

  const [kpis, setKpis] = useState<AdminKPIs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminKPIs().then((data) => {
      setKpis(data);
      setLoading(false);
    });
  }, []);

  if (loading || !kpis) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={colors.accentYellow} />
        <Text style={styles.loadingText}>Synthesizing platform operations…</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.content, isDesktop && styles.desktopContent]} showsVerticalScrollIndicator={false}>
      {/* Page Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.pageTitle}>Executive Command Center</Text>
          <Text style={styles.pageSubtitle}>
            Live platform metrics, event door operations, and community governance.
          </Text>
        </View>
        <View style={styles.liveIndicator}>
          <View style={styles.livePulse} />
          <Text style={styles.liveText}>SYSTEMS OPERATIONAL</Text>
        </View>
      </View>

      {/* KPI Metric Cards Grid */}
      <View style={styles.kpiGrid}>
        {/* Card 1: Members */}
        <View style={styles.kpiCard}>
          <View style={styles.kpiCardHeader}>
            <Text style={styles.kpiLabel}>Community Members</Text>
            <View style={[styles.kpiIconWrap, { backgroundColor: "#1e293b" }]}>
              <MaterialIcons name="people" size={18} color="#60a5fa" />
            </View>
          </View>
          <Text style={styles.kpiValue}>{kpis.totalMembers}</Text>
          <Text style={styles.kpiFootnote}>
            <Text style={{ color: colors.accentGreen, fontFamily: fonts.bold }}>+18% </Text>
            this month • {kpis.verifiedCreators} Verified Pros
          </Text>
        </View>

        {/* Card 2: Live Rooms */}
        <View style={styles.kpiCard}>
          <View style={styles.kpiCardHeader}>
            <Text style={styles.kpiLabel}>Live Audio Rooms</Text>
            <View style={[styles.kpiIconWrap, { backgroundColor: "#451a03" }]}>
              <MaterialIcons name="record-voice-over" size={18} color="#f59e0b" />
            </View>
          </View>
          <Text style={[styles.kpiValue, { color: colors.accentYellow }]}>
            {kpis.activeAudioRooms}
          </Text>
          <Text style={styles.kpiFootnote}>LiveKit WebRTC active • 0 reports</Text>
        </View>

        {/* Card 3: Event Tickets */}
        <View style={styles.kpiCard}>
          <View style={styles.kpiCardHeader}>
            <Text style={styles.kpiLabel}>Event Tickets Issued</Text>
            <View style={[styles.kpiIconWrap, { backgroundColor: "#064e3b" }]}>
              <MaterialIcons name="confirmation-number" size={18} color={colors.accentGreen} />
            </View>
          </View>
          <Text style={[styles.kpiValue, { color: colors.accentGreen }]}>
            {kpis.ticketsIssued}
          </Text>
          <Text style={styles.kpiFootnote}>
            {kpis.checkedInCount} Checked in at door ({kpis.totalEvents} upcoming events)
          </Text>
        </View>

        {/* Card 4: Platform Volume */}
        <View style={styles.kpiCard}>
          <View style={styles.kpiCardHeader}>
            <Text style={styles.kpiLabel}>Platform Gross Volume</Text>
            <View style={[styles.kpiIconWrap, { backgroundColor: "#311042" }]}>
              <MaterialIcons name="payments" size={18} color="#c084fc" />
            </View>
          </View>
          <Text style={styles.kpiValue}>{kpis.estimatedPlatformGrossVolume}</Text>
          <Text style={styles.kpiFootnote}>
            {kpis.marketplaceItemsClaimed} marketplace assets claimed
          </Text>
        </View>
      </View>

      {/* Operations Quick Triage Grid */}
      <Text style={styles.sectionHeading}>Priority Action Centers</Text>
      <View style={styles.actionsGrid}>
        {/* Action 1: Event Door Operations */}
        <Pressable
          style={styles.actionTile}
          onPress={() => router.push("/admin/events" as any)}
        >
          <View style={styles.actionTileTop}>
            <View style={[styles.actionIcon, { backgroundColor: colors.accentYellow }]}>
              <MaterialIcons name="qr-code-scanner" size={22} color={colors.textDark} />
            </View>
            <MaterialIcons name="arrow-forward" size={18} color={colors.textSecondary} />
          </View>
          <Text style={styles.actionTitle}>Event Operations & Door Scanner</Text>
          <Text style={styles.actionDesc}>
            Access live attendee rosters, view ticket codes, and check in brunch guests manually or with camera.
          </Text>
          <View style={styles.actionFooter}>
            <Text style={styles.actionLinkText}>Open Guest Roster →</Text>
          </View>
        </Pressable>

        {/* Action 2: Creator Verification Queue */}
        <Pressable
          style={styles.actionTile}
          onPress={() => router.push("/admin/verifications" as any)}
        >
          <View style={styles.actionTileTop}>
            <View style={[styles.actionIcon, { backgroundColor: colors.accentGreen }]}>
              <MaterialIcons name="verified" size={22} color={colors.textDark} />
            </View>
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>3 Pending</Text>
            </View>
          </View>
          <Text style={styles.actionTitle}>Creator Verification Queue</Text>
          <Text style={styles.actionDesc}>
            Review creative portfolios, case study depth, and grant official Blue Badges with mentor privileges.
          </Text>
          <View style={styles.actionFooter}>
            <Text style={styles.actionLinkText}>Review Applicants →</Text>
          </View>
        </Pressable>

        {/* Action 3: Live Audio & Community Safety */}
        <Pressable
          style={styles.actionTile}
          onPress={() => router.push("/admin/moderation" as any)}
        >
          <View style={styles.actionTileTop}>
            <View style={[styles.actionIcon, { backgroundColor: "#e74c3c" }]}>
              <MaterialIcons name="security" size={22} color="#fff" />
            </View>
            <MaterialIcons name="arrow-forward" size={18} color={colors.textSecondary} />
          </View>
          <Text style={styles.actionTitle}>Audio & Content Moderation</Text>
          <Text style={styles.actionDesc}>
            Monitor active LiveKit rooms, view speaker rosters, and trigger emergency audio kill-switch controls.
          </Text>
          <View style={styles.actionFooter}>
            <Text style={styles.actionLinkText}>Open Moderation Console →</Text>
          </View>
        </Pressable>
      </View>

      {/* Quick Links & Platform Actions */}
      <View style={styles.linksCard}>
        <View style={styles.linksCardHeader}>
          <MaterialIcons name="bolt" size={20} color={colors.accentYellow} />
          <Text style={styles.linksCardTitle}>Super Admin Shortcuts</Text>
        </View>
        <View style={styles.linksRow}>
          <Pressable
            style={styles.quickBtn}
            onPress={() => router.push("/create-event")}
          >
            <MaterialIcons name="event" size={16} color={colors.textDark} />
            <Text style={styles.quickBtnText}>Create Brunch Event</Text>
          </Pressable>

          <Pressable
            style={styles.quickBtnDark}
            onPress={() => router.push("/create-job")}
          >
            <MaterialIcons name="add-business" size={16} color={colors.textPrimary} />
            <Text style={styles.quickBtnDarkText}>Post Creative Job</Text>
          </Pressable>

          <Pressable
            style={styles.quickBtnDark}
            onPress={() => router.push("/create-room")}
          >
            <MaterialIcons name="mic" size={16} color={colors.textPrimary} />
            <Text style={styles.quickBtnDarkText}>Launch Admin Room</Text>
          </Pressable>
        </View>
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
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#161616",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  livePulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accentGreen },
  liveText: { color: colors.textSecondary, fontFamily: fonts.bold, fontSize: 10, letterSpacing: 0.5 },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  kpiCard: {
    flex: 1,
    minWidth: 220,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.outline,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  kpiCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  kpiLabel: { color: colors.textSecondary, fontFamily: fonts.semibold, fontSize: fonts.size.xs },
  kpiIconWrap: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  kpiValue: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: 32, marginTop: 4 },
  kpiFootnote: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: fonts.size.xs, marginTop: 2 },
  sectionHeading: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.lg, marginTop: spacing.md },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  actionTile: {
    flex: 1,
    minWidth: 260,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.outline,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  actionTileTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  actionIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  pendingBadge: { backgroundColor: colors.accentGreen, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radii.pill },
  pendingBadgeText: { color: colors.textDark, fontFamily: fonts.bold, fontSize: 10 },
  actionTitle: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.md },
  actionDesc: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm, lineHeight: 20 },
  actionFooter: { marginTop: spacing.xs },
  actionLinkText: { color: colors.accentYellow, fontFamily: fonts.semibold, fontSize: fonts.size.xs },
  linksCard: {
    backgroundColor: "#141414",
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.outline,
    padding: spacing.lg,
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  linksCardHeader: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  linksCardTitle: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.md },
  linksRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  quickBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.accentYellow,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.pill,
  },
  quickBtnText: { color: colors.textDark, fontFamily: fonts.bold, fontSize: fonts.size.xs },
  quickBtnDark: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  quickBtnDarkText: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.xs },
});
