import SafeScreen from "@/components/SafeScreen";
import { useAuth } from "@/contexts/AuthContext";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type Stat = { label: string; value: string; suffix?: string };
type Course = {
  id: string;
  title: string;
  lessons: number;
  duration: string;
  progress: number;
  image: any;
};

export default function SkillsDashboard() {
  const router = useRouter();
  const { profile } = useAuth();
  const profileName = profile?.fullName ?? "Guest";
  const avatarSrc = profile?.avatarUrl
    ? { uri: profile.avatarUrl }
    : require("../../../assets/images/react-logo.png");

  const stats: Stat[] = useMemo(
    () => [
      { label: "Learning Streak", value: "134", suffix: "Days" },
      { label: "Courses Completed", value: "23" },
      { label: "Ai Tools Used This Week", value: "4" },
    ],
    []
  );
  const courses: Course[] = useMemo(
    () => [
      {
        id: "c1",
        title: "Mastering Logo Variations",
        lessons: 17,
        duration: "1-2 Hours",
        progress: 89,
        image: require("../../../images/image 2.png"),
      },
      {
        id: "c2",
        title: "UI/UX Design Essentials",
        lessons: 24,
        duration: "2-3 Hours",
        progress: 42,
        image: require("../../../images/image 1.png"),
      },
    ],
    []
  );
  const tools = useMemo(() => ["Midjourney", "Runway", "Figma AI", "ChatGPT", "Stable Diffusion"], []);
  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <View style={styles.topLeft}>
            <View style={styles.topAvatarWrap}>
              <Image source={avatarSrc} style={styles.topAvatar} contentFit="cover" />
            </View>
            <View>
              <Text style={styles.topGreeting}>Good day,</Text>
              <Text style={styles.topName}>{profileName}</Text>
            </View>
          </View>
          <View style={styles.topActions}>
            <Pressable style={[styles.topActionBtn, styles.topActionDark]} hitSlop={6}>
              <MaterialIcons name="language" size={18} color="#fff" />
            </Pressable>
            <Pressable style={[styles.topActionBtn, styles.topActionDark]} hitSlop={6}>
              <MaterialIcons name="search" size={18} color="#fff" />
            </Pressable>
            <Pressable style={[styles.topActionBtn, styles.topActionGreen]} hitSlop={6} onPress={() => router.push("/notifications")}>
              <MaterialIcons name="notifications" size={18} color="#fff" />
            </Pressable>
          </View>
        </View>

        <Text style={styles.pageTitle}>Skills Vaults</Text>
        <Text style={styles.pageSubtitle}>
          Ai-powered tools and learning resources to elevate your creative career faster. Unlock smart tools built to help you grow, create, and level up faster.
        </Text>

        <View style={styles.statsRow}>
          {stats.map((s, idx) => (
            <View key={idx} style={[styles.statCard, idx === 0 ? styles.statCardHighlight : null]}>
              <Text style={[styles.statValue, idx === 0 ? styles.statValueDark : null]}>
                {s.value}
                {s.suffix ? "" : ""}
              </Text>
              <Text style={[styles.statLabel, idx === 0 ? styles.statLabelDark : null]}>
                {s.label + (s.suffix ? `\n${s.suffix}` : "")}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Progress Status</Text>
          <Pressable hitSlop={6}>
            <Text style={styles.sectionLink}>See all</Text>
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.cardRow}>
            {courses.map((c) => (
              <View key={c.id} style={styles.courseCard}>
                <Image source={c.image} style={styles.courseImage} contentFit="cover" />
                <View style={styles.courseBody}>
                  <Text style={styles.courseTitle}>{c.title}</Text>
                  <View style={styles.courseMetaRow}>
                    <MaterialIcons name="view-module" size={16} color={colors.textMuted} />
                    <Text style={styles.courseMetaText}>{c.lessons} Lessons</Text>
                    <MaterialIcons name="schedule" size={16} color={colors.textMuted} style={{ marginLeft: spacing.md }} />
                    <Text style={styles.courseMetaText}>{c.duration}</Text>
                  </View>
                  <Text style={styles.progressLabel}>Progress</Text>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${c.progress}%` }]} />
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Launch - Ai Tools</Text>
          <Pressable hitSlop={6}>
            <Text style={styles.sectionLink}>View all</Text>
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.toolsRow}>
            {tools.map((t) => (
              <Pressable key={t} style={styles.toolChip} hitSlop={6}>
                <Text style={styles.toolChipText}>{t}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, paddingTop: spacing.lg, gap: spacing.md },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  topLeft: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  topAvatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  topAvatar: { width: 38, height: 38, borderRadius: 19, alignSelf: "center", marginTop: 1 },
  topGreeting: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm },
  topName: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.md },
  topActions: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  topActionBtn: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  topActionDark: { backgroundColor: "#141414" },
  topActionGreen: { backgroundColor: colors.accentGreen },
  pageTitle: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.title, alignSelf: "center", marginTop: spacing.lg },
  pageSubtitle: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: fonts.size.md,
    lineHeight: 20,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  statsRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.lg },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.outline,
    padding: spacing.md,
  },
  statCardHighlight: { backgroundColor: colors.accentYellow },
  statValue: { color: colors.accentYellow, fontFamily: fonts.bold, fontSize: 26 },
  statValueDark: { color: colors.textDark },
  statLabel: { color: colors.textSecondary, fontFamily: fonts.semibold, fontSize: fonts.size.sm, marginTop: 4 },
  statLabelDark: { color: colors.textDark },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.lg },
  sectionTitle: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.lg },
  sectionLink: { color: colors.accentYellow, fontFamily: fonts.semibold, fontSize: fonts.size.sm },
  cardRow: { flexDirection: "row", gap: spacing.md, paddingVertical: spacing.sm },
  courseCard: {
    width: 240,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.outline,
    overflow: "hidden",
  },
  courseImage: { width: "100%", height: 120 },
  courseBody: { paddingHorizontal: spacing.md, paddingVertical: spacing.md, gap: spacing.sm },
  courseTitle: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.md },
  courseMetaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  courseMetaText: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm },
  progressLabel: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm, marginTop: 2 },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#1e1e1e",
    borderWidth: 1,
    borderColor: colors.outline,
  },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: colors.accentGreen },
  toolsRow: { flexDirection: "row", gap: spacing.md, paddingVertical: spacing.sm },
  toolChip: {
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.outline,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  toolChipText: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.sm },
});
