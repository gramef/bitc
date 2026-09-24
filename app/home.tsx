import SafeScreen from "@/components/SafeScreen";
import { Avatar, EmptyState, SearchBar } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { EventRow, fetchEvents } from "@/services/events";
import { fetchJobs, JobRow } from "@/services/jobs";
import { getUnreadNotificationCount } from "@/services/notifications";
import { getRoleBadge } from "@/services/permissions";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
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

  const { profile, user, refreshProfile } = useAuth();
  const role = profile?.role ?? "creative";
  const badge = getRoleBadge(role);
  const rawName =
    (profile?.fullName && profile.fullName !== "Guest" ? profile.fullName : null) ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    (user?.email ? user.email.split("@")[0] : null) ||
    "Creator";
  const cleanFirst = rawName.split(" ")[0].replace(/[^a-zA-Z0-9_-]/g, "");
  const firstName = cleanFirst ? cleanFirst.charAt(0).toUpperCase() + cleanFirst.slice(1) : "Creator";

  const [unreadCount, setUnreadCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      refreshProfile();
      getUnreadNotificationCount().then(setUnreadCount);
    }, [refreshProfile])
  );

  const [events, setEvents] = useState<EventRow[]>([]);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const loadData = useCallback(async () => {
    const [e, j, unread] = await Promise.all([
      fetchEvents(5),
      fetchJobs(5),
      getUnreadNotificationCount(),
    ]);
    setEvents(e);
    setJobs(j);
    setUnreadCount(unread);
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
    { label: "Rooms", icon: "mic" as const, route: "/rooms", gradient: ["#FF4444", "#ff7675"] as const },
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
            <Avatar
              uri={profile?.avatarUrl}
              name={profile?.fullName}
              size={42}
              bordered
              borderColor={colors.accentYellow}
            />
            <View>
              <Text style={styles.topGreeting}>{getGreeting()} 👋</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 }}>
                <Text style={styles.topName}>{firstName}</Text>
                {badge && (
                  <View
                    style={{
                      backgroundColor: badge.bgColor,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 10,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <MaterialIcons name={badge.icon as any} size={11} color={badge.color} />
                    <Text
                      style={{
                        color: badge.color,
                        fontFamily: fonts.bold,
                        fontSize: 9,
                        letterSpacing: 0.5,
                      }}
                    >
                      {badge.label.toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </Pressable>
          <View style={styles.topRight}>
            <Pressable
              style={styles.iconBtn}
              hitSlop={8}
              onPress={() => router.push("/notifications")}
            >
              <MaterialIcons name="notifications-none" size={22} color={colors.textPrimary} />
              {unreadCount > 0 && <View style={styles.badge} />}
            </Pressable>
          </View>
        </View>

        {/* ── Search ── */}
        <View style={styles.searchWrap}>
          <SearchBar value={search} onChangeText={setSearch} placeholder="Search events, jobs, people…" />
        </View>

        {/* ── Persona Tailored Focus Card ── */}
        {(() => {
          if (role === "business") {
            return (
              <View style={[styles.personaCardWrap, { borderColor: "#6C5CE750" }]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View style={[styles.personaIconBox, { backgroundColor: "#6C5CE725" }]}>
                    <MaterialIcons name="business" size={24} color="#6C5CE7" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.personaCardTitle}>Studio Hiring Hub</Text>
                    <Text style={styles.personaCardSub}>
                      Post open briefs & contracts to hire top verified creative talent.
                    </Text>
                  </View>
                </View>
                <View style={styles.personaBtnRow}>
                  <Pressable
                    style={[styles.personaPrimaryBtn, { backgroundColor: "#6C5CE7" }]}
                    onPress={() => router.push("/create-job" as any)}
                  >
                    <MaterialIcons name="add" size={16} color="#fff" />
                    <Text style={[styles.personaPrimaryBtnText, { color: "#fff" }]}>Post a Job</Text>
                  </Pressable>
                  <Pressable
                    style={styles.personaSecondaryBtn}
                    onPress={() => router.push("/create-event" as any)}
                  >
                    <MaterialIcons name="event" size={16} color={colors.textPrimary} />
                    <Text style={styles.personaSecondaryBtnText}>Host Summit</Text>
                  </Pressable>
                </View>
              </View>
            );
          } else if (role === "user") {
            return (
              <View style={[styles.personaCardWrap, { borderColor: "#FDCB6E50" }]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View style={[styles.personaIconBox, { backgroundColor: "#FDCB6E25" }]}>
                    <MaterialIcons name="local-activity" size={24} color="#FDCB6E" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.personaCardTitle}>Weekend Brunches & Passes</Text>
                    <Text style={styles.personaCardSub}>
                      Discover upcoming networking brunches, mixers & tune into live rooms.
                    </Text>
                  </View>
                </View>
                <View style={styles.personaBtnRow}>
                  <Pressable
                    style={[styles.personaPrimaryBtn, { backgroundColor: "#D6B226" }]}
                    onPress={() => router.push("/(tabs)/events")}
                  >
                    <MaterialIcons name="search" size={16} color="#141414" />
                    <Text style={[styles.personaPrimaryBtnText, { color: "#141414" }]}>Find Brunches</Text>
                  </Pressable>
                  <Pressable
                    style={styles.personaSecondaryBtn}
                    onPress={() => router.push("/rooms")}
                  >
                    <MaterialIcons name="mic" size={16} color={colors.textPrimary} />
                    <Text style={styles.personaSecondaryBtnText}>Join Audio Rooms</Text>
                  </Pressable>
                </View>
              </View>
            );
          } else {
            // Creative persona
            return (
              <View style={[styles.personaCardWrap, { borderColor: "#00B89450" }]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View style={[styles.personaIconBox, { backgroundColor: "#00B89425" }]}>
                    <MaterialIcons name="brush" size={24} color="#00B894" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.personaCardTitle}>Creative Showcase Hub</Text>
                    <Text style={styles.personaCardSub}>
                      Add case studies to your portfolio & run an AI review to win studio briefs.
                    </Text>
                  </View>
                </View>
                <View style={styles.personaBtnRow}>
                  <Pressable
                    style={[styles.personaPrimaryBtn, { backgroundColor: "#00B894" }]}
                    onPress={() => router.push("/profile" as any)}
                  >
                    <MaterialIcons name="add" size={16} color="#141414" />
                    <Text style={[styles.personaPrimaryBtnText, { color: "#141414" }]}>+ Add Project</Text>
                  </Pressable>
                  <Pressable
                    style={styles.personaSecondaryBtn}
                    onPress={() => router.push("/skills/tools/portfolio-review-upload" as any)}
                  >
                    <MaterialIcons name="auto-awesome" size={16} color={colors.textPrimary} />
                    <Text style={styles.personaSecondaryBtnText}>AI Review</Text>
                  </Pressable>
                </View>
              </View>
            );
          }
        })()}

        {/* ── Quick Actions ── */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionsScroll}>
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
        </ScrollView>

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
              <Pressable
                key={ev.id}
                style={styles.eventCard}
                onPress={() => router.push(`/event-detail?id=${ev.id}` as any)}
              >
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
              </Pressable>
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
            <Pressable
              key={job.id}
              style={styles.jobCard}
              onPress={() => router.push(`/job-detail?id=${job.id}` as any)}
            >
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
  actionsScroll: { flexDirection: "row", gap: 10, paddingRight: spacing.lg },
  actionCard: {
    width: 78,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.outline,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: "center",
    gap: 6,
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

  /* ── Persona Focus Card ── */
  personaCardWrap: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1.5,
    padding: spacing.md,
    gap: spacing.sm,
    marginTop: 2,
  },
  personaIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  personaCardTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  personaCardSub: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  personaBtnRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  personaPrimaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
  },
  personaPrimaryBtnText: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  personaSecondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: colors.outline,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
  },
  personaSecondaryBtnText: {
    color: colors.textPrimary,
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
});
