import SafeScreen from "@/components/SafeScreen";
import { Chip, EmptyState, SearchBar } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { fetchJobs, JobRow } from "@/services/jobs";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const CATEGORIES = ["All", "Design", "Engineering", "Marketing", "Finance", "Management"] as const;
const TYPES = ["All", "Full-time", "Part-time", "Contract", "Freelance"] as const;

export default function Jobs() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { profile, hasRole } = useAuth();
  const avatarSrc = profile?.avatarUrl
    ? { uri: profile.avatarUrl }
    : require("../../assets/images/react-logo.png");

  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("All");
  const [activeType, setActiveType] = useState("All");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const data = await fetchJobs(50);
    setJobs(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Accept filter params from filter screen
  useEffect(() => {
    if (params.category && typeof params.category === "string") setActiveCat(params.category);
    if (params.type && typeof params.type === "string") setActiveType(params.type);
  }, [params.category, params.type]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  function classifyCategory(title: string): string {
    const t = title.toLowerCase();
    if (t.includes("design") || t.includes("ui") || t.includes("ux") || t.includes("creative")) return "Design";
    if (t.includes("engineer") || t.includes("develop") || t.includes("software") || t.includes("front") || t.includes("back")) return "Engineering";
    if (t.includes("market") || t.includes("growth") || t.includes("content") || t.includes("social")) return "Marketing";
    if (t.includes("financ") || t.includes("account")) return "Finance";
    if (t.includes("manage") || t.includes("lead") || t.includes("director")) return "Management";
    return "Other";
  }

  function timeAgo(ts?: string | null): string {
    if (!ts) return "";
    const diff = Date.now() - new Date(ts).getTime();
    const days = Math.floor(diff / 86400000);
    if (days < 1) return "Today";
    if (days === 1) return "1d ago";
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? "1w ago" : `${weeks}w ago`;
  }

  const filtered = jobs.filter((j) => {
    const q = search.toLowerCase();
    if (q && !j.title.toLowerCase().includes(q) && !j.org.toLowerCase().includes(q)) return false;
    if (activeCat !== "All" && classifyCategory(j.title) !== activeCat) return false;
    if (activeType !== "All" && j.type !== activeType) return false;
    return true;
  });

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
          <Pressable style={styles.filterBtn} hitSlop={6} onPress={() => router.push("/filter")}>
            <MaterialIcons name="tune" size={20} color={colors.textPrimary} />
          </Pressable>
        </View>

        <Text style={styles.pageTitle}>Jobs</Text>

        <SearchBar value={search} onChangeText={setSearch} placeholder="Search jobs…" />

        {/* Category chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {CATEGORIES.map((c) => (
            <Chip key={c} label={c} selected={activeCat === c} onPress={() => setActiveCat(c)} />
          ))}
        </ScrollView>

        {/* Type chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {TYPES.map((t) => (
            <Chip key={t} label={t} selected={activeType === t} onPress={() => setActiveType(t)} />
          ))}
        </ScrollView>

        {/* Job cards */}
        {filtered.length === 0 && !loading ? (
          <EmptyState icon="work" title="No jobs found" subtitle="Try adjusting your filters" />
        ) : (
          filtered.map((job) => (
            <Pressable key={job.id} onPress={() => router.push(`/job-detail?id=${job.id}` as any)}>
              <View style={styles.jobCard}>
                <View style={styles.jobHeader}>
                  {job.image_url ? (
                    <Image source={{ uri: job.image_url }} style={styles.jobLogo} contentFit="cover" />
                  ) : (
                    <View style={styles.jobLogoPlaceholder}>
                      <MaterialIcons name="business" size={22} color={colors.textSecondary} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.jobTitle} numberOfLines={1}>{job.title}</Text>
                    <Text style={styles.jobOrg}>{job.org}</Text>
                  </View>
                  <MaterialIcons name="bookmark-border" size={20} color={colors.textSecondary} />
                </View>
                <View style={styles.jobTags}>
                  <View style={styles.tag}>
                    <MaterialIcons name="location-on" size={12} color={colors.textSecondary} />
                    <Text style={styles.tagText}>{job.location ?? "Remote"}</Text>
                  </View>
                  {job.type ? (
                    <View style={[styles.tag, styles.tagGreen]}>
                      <Text style={[styles.tagText, { color: colors.accentGreen }]}>{job.type}</Text>
                    </View>
                  ) : null}
                  {job.salary ? (
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>{job.salary}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.jobPosted}>{timeAgo(job.posted_at)}</Text>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>

      {/* Post Job FAB — only for business/admin */}
      {hasRole("business", "admin") && (
        <Pressable
          style={styles.fab}
          onPress={() => router.push("/create-job" as any)}
        >
          <MaterialIcons name="add" size={28} color={colors.textDark} />
        </Pressable>
      )}
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
  filterBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.outline, alignItems: "center", justifyContent: "center" },
  pageTitle: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.title, marginTop: spacing.xs },
  chipRow: { gap: spacing.sm },
  jobCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.outline,
    padding: spacing.md,
  },
  jobHeader: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  jobLogo: { width: 44, height: 44, borderRadius: 10 },
  jobLogoPlaceholder: { width: 44, height: 44, borderRadius: 10, backgroundColor: "#1a1a1a", alignItems: "center", justifyContent: "center" },
  jobTitle: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.lg },
  jobOrg: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm, marginTop: 2 },
  jobTags: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md },
  tag: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#1a1a1a", paddingHorizontal: 8, paddingVertical: 4, borderRadius: radii.pill },
  tagGreen: { backgroundColor: "#1a2e24" },
  tagText: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.xs },
  jobPosted: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.xs, marginTop: spacing.sm },
  fab: { position: "absolute", right: spacing.lg, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accentYellow, alignItems: "center", justifyContent: "center", elevation: 6, shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6 },
});
