import SafeScreen from "@/components/SafeScreen";
import { Avatar } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { Course, fetchCourses } from "@/services/courses";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function SkillsLearn() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const profileName = profile?.fullName ?? "Guest";
  const isBusinessOrAdmin = profile?.role === "business" || profile?.role === "admin";

  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  useFocusEffect(
    useCallback(() => {
      refreshProfile();
      fetchCourses(user?.id).then((data) => {
        setAllCourses(data);
      });
    }, [refreshProfile, user?.id])
  );

  // Only courses the user has actually enrolled in
  const enrolledCourses = allCourses.filter((c) => c.isEnrolled);
  const inProgressCourses = enrolledCourses.filter((c) => c.progressPercent < 100);
  const displayProgress = inProgressCourses.length > 0 ? inProgressCourses : enrolledCourses;

  const categories = ["All", ...Array.from(new Set(allCourses.map((c) => c.category)))];
  const filteredCourses =
    selectedCategory === "All"
      ? allCourses
      : allCourses.filter((c) => c.category === selectedCategory);

  const recommended = allCourses.find((c) => c.id === "r1") || allCourses[0];

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Top Header */}
        <View style={styles.topRow}>
          <Pressable style={styles.topLeft} onPress={() => router.push("/profile")}>
            <Avatar
              uri={profile?.avatarUrl}
              name={profile?.fullName}
              size={44}
              bordered
              borderColor={colors.accentYellow}
            />
            <View>
              <Text style={styles.topGreeting}>Good day,</Text>
              <Text style={styles.topName}>{profileName}</Text>
            </View>
          </Pressable>
          <View style={styles.topActions}>
            {isBusinessOrAdmin && (
              <Pressable
                style={[styles.topActionBtn, styles.topActionStudio]}
                hitSlop={6}
                onPress={() => router.push("/create-course" as any)}
              >
                <MaterialIcons name="add" size={20} color="#121212" />
              </Pressable>
            )}
            <Pressable style={[styles.topActionBtn, styles.topActionDark]} hitSlop={6}>
              <MaterialIcons name="language" size={18} color="#fff" />
            </Pressable>
            <Pressable
              style={[styles.topActionBtn, styles.topActionGreen]}
              hitSlop={6}
              onPress={() => router.push("/notifications")}
            >
              <MaterialIcons name="notifications" size={18} color="#fff" />
            </Pressable>
          </View>
        </View>

        {/* Business / Studio Course Creator Callout */}
        {isBusinessOrAdmin && (
          <View style={styles.studioBanner}>
            <View style={styles.studioBannerHeader}>
              <View style={styles.studioTag}>
                <MaterialIcons name="business" size={14} color="#74B9FF" />
                <Text style={styles.studioTagText}>STUDIO MASTERCLASS</Text>
              </View>
              <Text style={styles.studioBannerTitle}>Publish Courses for Creatives</Text>
            </View>
            <Text style={styles.studioBannerDesc}>
              Share your studio's workflows, design systems, and techniques with thousands of active creative minds.
            </Text>
            <Pressable
              style={styles.studioActionBtn}
              onPress={() => router.push("/create-course" as any)}
              hitSlop={6}
            >
              <MaterialIcons name="school" size={16} color="#121212" />
              <Text style={styles.studioActionBtnText}>Create New Course</Text>
            </Pressable>
          </View>
        )}

        {/* Progress Status (Only enrolled courses) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Progress Status</Text>
          {enrolledCourses.length > 0 && (
            <Pressable hitSlop={6} onPress={() => router.push("/skills/dashboard" as any)}>
              <Text style={styles.sectionLink}>View Dashboard</Text>
            </Pressable>
          )}
        </View>

        {displayProgress.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.cardRow}>
              {displayProgress.map((c) => (
                <View key={c.id} style={styles.courseCard}>
                  <Image source={c.image} style={styles.courseImage} contentFit="cover" />
                  <Pressable
                    style={styles.courseBody}
                    onPress={() => router.push(`/course/${c.id}`)}
                    hitSlop={6}
                  >
                    <Text style={styles.courseTitle} numberOfLines={1}>
                      {c.title}
                    </Text>
                    <View style={styles.courseMetaRow}>
                      <MaterialIcons name="view-module" size={16} color={colors.textMuted} />
                      <Text style={styles.courseMetaText}>{c.lessonsCount} Lessons</Text>
                      <MaterialIcons
                        name="schedule"
                        size={16}
                        color={colors.textMuted}
                        style={{ marginLeft: spacing.md }}
                      />
                      <Text style={styles.courseMetaText}>{c.duration}</Text>
                    </View>
                    <View style={styles.progressRow}>
                      <Text style={styles.progressLabel}>Progress</Text>
                      <Text style={styles.progressPercent}>{c.progressPercent}%</Text>
                    </View>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${c.progressPercent}%` as `${number}%` },
                        ]}
                      />
                    </View>
                  </Pressable>
                </View>
              ))}
            </View>
          </ScrollView>
        ) : (
          <View style={styles.emptyProgressCard}>
            <View style={styles.emptyIconWrap}>
              <MaterialIcons name="auto-stories" size={26} color={colors.accentYellow} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.emptyTitle}>No Courses in Progress</Text>
              <Text style={styles.emptyDesc}>
                Explore courses in the catalog below and tap to enroll. Your progress will show up here.
              </Text>
            </View>
          </View>
        )}

        {/* Recommended Course */}
        {recommended && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Masterclass</Text>
              <Pressable
                hitSlop={6}
                onPress={() => router.push(`/course/${recommended.id}`)}
              >
                <Text style={styles.sectionLink}>Overview</Text>
              </Pressable>
            </View>
            <View style={styles.recoCard}>
              <Image source={recommended.image} style={styles.recoImage} contentFit="cover" />
              <View style={styles.recoBody}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <Text style={styles.recoTitle} numberOfLines={2}>
                    {recommended.title}
                  </Text>
                  {recommended.isEnrolled && (
                    <View style={styles.enrolledBadge}>
                      <MaterialIcons name="check-circle" size={12} color={colors.accentGreen} />
                      <Text style={styles.enrolledBadgeText}>Enrolled</Text>
                    </View>
                  )}
                </View>
                <View style={styles.recoMetaRow}>
                  <MaterialIcons name="view-module" size={16} color={colors.textMuted} />
                  <Text style={styles.recoMetaText}>{recommended.lessonsCount} Lessons</Text>
                  <MaterialIcons
                    name="schedule"
                    size={16}
                    color={colors.textMuted}
                    style={{ marginLeft: spacing.md }}
                  />
                  <Text style={styles.recoMetaText}>{recommended.duration}</Text>
                  <MaterialIcons
                    name="person"
                    size={16}
                    color={colors.textMuted}
                    style={{ marginLeft: spacing.md }}
                  />
                  <Text style={styles.recoMetaText}>{recommended.level}</Text>
                </View>
                <View style={styles.recoActions}>
                  <Pressable
                    style={[styles.cta, styles.ctaGreen]}
                    hitSlop={6}
                    onPress={() => router.push(`/course/${recommended.id}`)}
                  >
                    <Text style={styles.ctaTextDark}>
                      {recommended.isEnrolled
                        ? recommended.progressPercent === 100
                          ? "Completed"
                          : `Resume (${recommended.progressPercent}%)`
                        : "View Syllabus"}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.cta, styles.ctaYellow]}
                    hitSlop={6}
                    onPress={() => router.push(`/course/${recommended.id}`)}
                  >
                    <Text style={styles.ctaTextDark}>
                      {recommended.isEnrolled ? "Continue" : "Start Course"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Explore All Courses */}
        <View style={[styles.sectionHeader, { marginTop: spacing.xl }]}>
          <Text style={styles.sectionTitle}>Explore Courses Catalog</Text>
          <Text style={styles.countText}>{filteredCourses.length} Masterclasses</Text>
        </View>

        {/* Category Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -spacing.lg, paddingHorizontal: spacing.lg }}>
          <View style={styles.chipsRow}>
            {categories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <Pressable
                  key={cat}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setSelectedCategory(cat)}
                  hitSlop={4}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{cat}</Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {/* Catalog List */}
        <View style={styles.catalogList}>
          {filteredCourses.map((c) => (
            <Pressable
              key={c.id}
              style={styles.catalogCard}
              onPress={() => router.push(`/course/${c.id}`)}
              hitSlop={4}
            >
              <Image source={c.image} style={styles.catalogImage} contentFit="cover" />
              <View style={styles.catalogBody}>
                <View style={styles.catalogHeaderRow}>
                  <Text style={styles.catalogCategory}>{c.category}</Text>
                  {c.isEnrolled ? (
                    <View style={styles.enrolledMiniBadge}>
                      <Text style={styles.enrolledMiniText}>{c.progressPercent}%</Text>
                    </View>
                  ) : (
                    <Text style={styles.freeBadge}>FREE</Text>
                  )}
                </View>
                <Text style={styles.catalogTitle} numberOfLines={2}>
                  {c.title}
                </Text>
                <View style={styles.catalogMetaRow}>
                  <Text style={styles.catalogMetaText}>{c.lessonsCount} lessons</Text>
                  <Text style={styles.dotSeparator}>•</Text>
                  <Text style={styles.catalogMetaText}>{c.duration}</Text>
                  <Text style={styles.dotSeparator}>•</Text>
                  <Text style={styles.catalogMetaText}>{c.level}</Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
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
  progressRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  progressLabel: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm, marginTop: 2 },
  progressPercent: { color: colors.accentYellow, fontFamily: fonts.semibold, fontSize: fonts.size.sm },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#1e1e1e",
    borderWidth: 1,
    borderColor: colors.outline,
  },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: colors.accentGreen },
  recoCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.outline,
    overflow: "hidden",
  },
  recoImage: { width: "100%", height: 140 },
  recoBody: { padding: spacing.md, gap: spacing.sm },
  recoTitle: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.md },
  recoSub: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm },
  recoMetaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  recoMetaText: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm },
  recoActions: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.md },
  cta: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
  },
  ctaGreen: { backgroundColor: colors.accentGreen },
  ctaYellow: { backgroundColor: colors.accentYellow },
  ctaTextDark: { color: colors.textDark, fontFamily: fonts.semibold, fontSize: fonts.size.md },
  topActionStudio: { backgroundColor: colors.accentYellow },
  studioBanner: {
    backgroundColor: "#161c24",
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: "#74B9FF40",
    padding: spacing.md,
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  studioBannerHeader: { gap: 4 },
  studioTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  studioTagText: {
    color: "#74B9FF",
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 0.6,
  },
  studioBannerTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: fonts.size.md,
  },
  studioBannerDesc: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: fonts.size.xs,
    lineHeight: 18,
  },
  studioActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.accentYellow,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  studioActionBtnText: {
    color: "#121212",
    fontFamily: fonts.bold,
    fontSize: fonts.size.xs,
  },
  emptyProgressCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.outline,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  emptyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accentYellow + "18",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.semibold,
    fontSize: fonts.size.sm,
  },
  emptyDesc: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: fonts.size.xs,
    lineHeight: 16,
  },
  enrolledBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.accentGreen + "20",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  enrolledBadgeText: {
    color: colors.accentGreen,
    fontFamily: fonts.semibold,
    fontSize: 11,
  },
  countText: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: fonts.size.xs,
  },
  chipsRow: {
    flexDirection: "row",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  chipActive: {
    backgroundColor: colors.accentYellow + "25",
    borderColor: colors.accentYellow,
  },
  chipText: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: fonts.size.xs,
  },
  chipTextActive: {
    color: colors.accentYellow,
    fontFamily: fonts.semibold,
  },
  catalogList: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  catalogCard: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.outline,
    overflow: "hidden",
  },
  catalogImage: {
    width: 100,
    height: "100%",
    minHeight: 90,
  },
  catalogBody: {
    flex: 1,
    padding: spacing.sm,
    gap: 4,
  },
  catalogHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  catalogCategory: {
    color: colors.accentYellow,
    fontFamily: fonts.semibold,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  enrolledMiniBadge: {
    backgroundColor: colors.accentGreen + "25",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  enrolledMiniText: {
    color: colors.accentGreen,
    fontFamily: fonts.bold,
    fontSize: 10,
  },
  freeBadge: {
    color: colors.accentGreen,
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  catalogTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.semibold,
    fontSize: fonts.size.sm,
  },
  catalogMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  catalogMetaText: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: fonts.size.xs,
  },
  dotSeparator: {
    color: colors.textMuted,
    fontSize: 10,
  },
});
