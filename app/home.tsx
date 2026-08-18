import SafeScreen from "@/components/SafeScreen";
import { EmptyState, SearchBar } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { EventRow, fetchEvents } from "@/services/events";
import { fetchJobs, JobRow } from "@/services/jobs";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View
} from "react-native";

const { width: SCREEN_W } = Dimensions.get("window");

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function Home() {
  const router = useRouter();

  const { profile } = useAuth();
  const profileName = profile?.fullName ?? "Guest";
  const firstName = profileName.split(" ")[0];
  const avatarSrc = profile?.avatarUrl
    ? { uri: profile.avatarUrl }
    : require("../assets/images/react-logo.png");

  const [events, setEvents] = useState<EventRow[]>([]);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const loadData = useCallback(async () => {
    const [e, j] = await Promise.all([fetchEvents(5), fetchJobs(5)]);
    setEvents(e);
    setJobs(j);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  function formatDate(d?: string | null) {
    if (!d) return "";
    try {
      const dt = new Date(d);
      return dt.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    } catch {
      return d;
    }
  }

  const quickActions = [
    { label: "Events", icon: "event" as const, route: "/(tabs)/events", gradient: ["#6C5CE7", "#a29bfe"] as const },
    { label: "Jobs", icon: "work" as const, route: "/(tabs)/jobs", gradient: ["#00B894", "#55efc4"] as const },
    { label: "Skills", icon: "school" as const, route: "/(tabs)/skills", gradient: ["#E17055", "#fab1a0"] as const },
    { label: "Community", icon: "groups" as const, route: "/(tabs)/community", gradient: ["#0984E3", "#74b9ff"] as const },
  ];

  return (
    <SafeScreen>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accentYellow}

          />
        }
      >
        {/* ── Header ── */}
        <View style={styles.topRow}>
          <Pressable style={styles.topLeft} onPress={() => router.push("/profile")}>
            <View style={styles.topAvatarRing}>
              <Image source={avatarSrc} style={styles.topAvatar} contentFit="cover" />
            </View>
            <View>
              <Text style={styles.topGreeting}>{getGreeting()} 👋</Text>
              <Text style={styles.topName}>{firstName}</Text>
            </View>
          </Pressable>
          <View style={styles.topRight}>
            <Pressable
              style={styles.iconBtn}
              hitSlop={8}
              onPress={() => router.push("/notifications")}
            >
              <MaterialIcons name="notifications-none" size={22} color={colors.textPrimary} />
              <View style={styles.badge} />
            </Pressable>
          </View>
        </View>

        {/* ── Search ── */}
        <View style={styles.searchWrap}>
          <SearchBar value={search} onChangeText={setSearch} placeholder="Search events, jobs, people…" />
        </View>

        {/* ── Quick Actions ── */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          {quickActions.map((a) => (
            <Pressable
              key={a.label}
              style={styles.actionCard}
              onPress={() => router.push(a.route as any)}
            >
              <LinearGradient
                colors={a.gradient as unknown as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionGradient}
              >
                <MaterialIcons name={a.icon} size={22} color="#fff" />
              </LinearGradient>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* ── Upcoming Events ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          <Pressable hitSlop={8} onPress={() => router.push("/(tabs)/events")}>
            <Text style={styles.seeAll}>See All</Text>
          </Pressable>
        </View>

        {events.length === 0 ? (
          <EmptyState icon="event" title="No events yet" subtitle="Check back soon for upcoming events" />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContent}
          >
            {events.map((ev) => (
              <View key={ev.id} style={styles.eventCard}>
                <View style={styles.eventImageWrap}>
                  {ev.image_url ? (
                    <Image source={{ uri: ev.image_url }} style={styles.eventImage} contentFit="cover" />
                  ) : (
                    <LinearGradient
                      colors={["#1a1a2e", "#16213e"]}
                      style={styles.eventImagePlaceholder}
                    >
                      <MaterialIcons name="event" size={32} color={colors.accentYellow} />
                    </LinearGradient>
                  )}
                  <View style={styles.eventDateBadge}>
                    <Text style={styles.eventDateText}>{formatDate(ev.event_date)}</Text>
                  </View>
                </View>
                <View style={styles.eventBody}>
                  <Text style={styles.eventTitle} numberOfLines={2}>{ev.title}</Text>
                  <View style={styles.eventMetaRow}>
                    <MaterialIcons name="location-on" size={12} color={colors.textSecondary} />
                    <Text style={styles.eventMeta} numberOfLines={1}>{ev.city ?? "Online"}</Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        {/* ── Trending Jobs ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trending Jobs</Text>
          <Pressable hitSlop={8} onPress={() => router.push("/(tabs)/jobs")}>
            <Text style={styles.seeAll}>See All</Text>
          </Pressable>
        </View>

        {jobs.length === 0 ? (
          <EmptyState icon="work" title="No jobs posted yet" subtitle="New opportunities are added daily" />
        ) : (
          jobs.slice(0, 4).map((job, i) => (
            <Pressable key={job.id} style={styles.jobCard}>
              <View style={styles.jobLeft}>
                {job.image_url ? (
                  <Image source={{ uri: job.image_url }} style={styles.jobLogo} contentFit="cover" />
                ) : (
                  <LinearGradient
                    colors={[["#6C5CE7", "#a29bfe"], ["#00B894", "#55efc4"], ["#E17055", "#fab1a0"], ["#0984E3", "#74b9ff"]][i % 4] as unknown as [string, string]}
                    style={styles.jobLogoGradient}
                  >
                    <MaterialIcons name="business" size={18} color="#fff" />
                  </LinearGradient>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.jobTitle} numberOfLines={1}>{job.title}</Text>
                  <Text style={styles.jobOrg} numberOfLines={1}>{job.org}</Text>
                </View>
              </View>
              <View style={[styles.jobTypeBadge, job.type?.toLowerCase().includes("remote") && styles.jobTypeBadgeRemote]}>
                <Text style={[styles.jobTypeText, job.type?.toLowerCase().includes("remote") && styles.jobTypeTextRemote]}>
                  {job.type ?? "Full-time"}
                </Text>
              </View>
            </Pressable>
          ))
        )}

        {/* ── Explore More ── */}
        <Text style={[styles.sectionTitle, { marginTop: spacing.md }]}>Explore</Text>
        <View style={styles.exploreRow}>
          {[
            { label: "Mentorship", icon: "supervisor-account" as const, route: "/mentorship", color: "#6C5CE7" },
            { label: "Marketplace", icon: "storefront" as const, route: "/marketplace", color: "#00B894" },
            { label: "Wellbeing", icon: "favorite" as const, route: "/wellbeing", color: "#E17055" },
          ].map((item) => (
            <Pressable key={item.label} style={styles.exploreCard} onPress={() => router.push(item.route as any)}>
              <View style={[styles.exploreIcon, { backgroundColor: item.color + "20" }]}>
                <MaterialIcons name={item.icon} size={24} color={item.color} />
              </View>
              <Text style={styles.exploreLabel}>{item.label}</Text>
              <MaterialIcons name="chevron-right" size={18} color={colors.textSecondary} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
    gap: spacing.md,
  },

  /* ── Header ── */
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  topLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  topAvatarRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.accentYellow,
    padding: 2,
    overflow: "hidden",
  },
  topAvatar: { width: "100%", height: "100%", borderRadius: 22 },
  topGreeting: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm },
  topName: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.xl },
  topRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outline,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 8,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF6B6B",
    borderWidth: 1.5,
    borderColor: colors.surface,
  },

  /* ── Search ── */
  searchWrap: { marginTop: 4 },

  /* ── Sections ── */
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.xs },
  sectionTitle: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.lg },
  seeAll: { color: colors.accentYellow, fontFamily: fonts.semibold, fontSize: fonts.size.sm },

  /* ── Quick Actions ── */
  actionsRow: { flexDirection: "row", gap: 10, justifyContent: "space-between" },
  actionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.outline,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: "center",
    gap: 8,
  },
  actionGradient: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: { color: colors.textSecondary, fontFamily: fonts.semibold, fontSize: 11 },

  /* ── Events ── */
  carouselContent: { gap: 12, paddingRight: spacing.lg },
  eventCard: {
    width: 200,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.outline,
    overflow: "hidden",
  },
  eventImageWrap: { width: "100%", height: 110, position: "relative" },
  eventImage: { width: "100%", height: "100%" },
  eventImagePlaceholder: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
  eventDateBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  eventDateText: { color: "#fff", fontFamily: fonts.bold, fontSize: 10 },
  eventBody: { padding: 12, gap: 6 },
  eventTitle: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.sm, lineHeight: 18 },
  eventMetaRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  eventMeta: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.xs },

  /* ── Jobs ── */
  jobCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.outline,
    padding: 14,
  },
  jobLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  jobLogo: { width: 40, height: 40, borderRadius: 10 },
  jobLogoGradient: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  jobTitle: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.md },
  jobOrg: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm, marginTop: 2 },
  jobTypeBadge: {
    backgroundColor: "#2a2200",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
  },
  jobTypeBadgeRemote: { backgroundColor: "#1a2e24" },
  jobTypeText: { color: colors.accentYellow, fontFamily: fonts.semibold, fontSize: 11 },
  jobTypeTextRemote: { color: colors.accentGreen },

  /* ── Explore ── */
  exploreRow: { gap: 10 },
  exploreCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.outline,
    padding: 14,
    gap: 12,
  },
  exploreIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  exploreLabel: { flex: 1, color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.md },
});
