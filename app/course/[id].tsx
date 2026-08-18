import SafeScreen from "@/components/SafeScreen";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function CourseView() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const data = useMemo(() => {
    return {
      title: "Designing for Mobile: UI Foundations",
      lessons: 45,
      duration: "5-8 Hours",
      level: "Beginner",
      rating: "4.8",
      progress: 0,
      image: require("../../images/Rectangle 93.png"),
      summary:
        "Master the fundamentals of designing intuitive, user-friendly mobile interfaces. In this course, you’ll learn how to structure layouts, apply spacing rules, design with responsiveness in mind, and create visually appealing UI patterns tailored for mobile devices.",
      bullets: [
        "Understand the principles of mobile UI design",
        "Apply spacing, typography, and grids effectively",
        "Build wireframes and clickable prototypes",
        "Use real-world design patterns for mobile apps",
        "Design with accessibility and best practices in mind",
      ],
      tabs: ["Lessons", "Requirements", "Reviews"],
      activeTab: "Lessons",
    };
  }, [id]);
  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={6} style={styles.iconBtn}>
            <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.pageTitle}>Course View</Text>
          <View style={{ width: 32 }} />
        </View>

        <Image source={data.image} style={styles.heroImage} contentFit="cover" />

        <Text style={styles.courseTitle}>{data.title}</Text>
        <View style={styles.metaRow}>
          <MaterialIcons name="view-module" size={16} color={colors.textMuted} />
          <Text style={styles.metaText}>{data.lessons} Lessons</Text>
          <MaterialIcons name="schedule" size={16} color={colors.textMuted} style={{ marginLeft: spacing.md }} />
          <Text style={styles.metaText}>{data.duration}</Text>
          <MaterialIcons name="person" size={16} color={colors.textMuted} style={{ marginLeft: spacing.md }} />
          <Text style={styles.metaText}>{data.level}</Text>
          <MaterialIcons name="star" size={16} color={colors.accentYellow} style={{ marginLeft: spacing.md }} />
          <Text style={styles.metaText}>{data.rating}</Text>
        </View>

        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Progress</Text>
          <Text style={styles.progressPercent}>{data.progress}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${data.progress}%` }]} />
        </View>

        <Text style={styles.summary}>{data.summary}</Text>

        <View style={styles.learnBox}>
          <Text style={styles.learnTitle}>You’ll learn how to:</Text>
          <View style={{ gap: 6, marginTop: spacing.sm }}>
            {data.bullets.map((b, i) => (
              <Text key={i} style={styles.learnItem}>• {b}</Text>
            ))}
          </View>
        </View>

        <View style={styles.tabsRow}>
          {data.tabs.map((t) => (
            <View key={t} style={{ alignItems: "center" }}>
              <Text style={[styles.tabText, t === data.activeTab ? styles.tabTextActive : null]}>{t}</Text>
              {t === data.activeTab ? <View style={styles.tabUnderline} /> : <View style={{ height: 8 }} />}
            </View>
          ))}
        </View>

        <View style={{ height: spacing.lg }} />
        <Pressable style={styles.ctaMain} hitSlop={8}>
          <Text style={styles.ctaText}>Start Course</Text>
        </Pressable>
        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, paddingTop: spacing.lg, gap: spacing.md },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.outline,
  },
  pageTitle: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.title },
  heroImage: { width: "100%", height: 180, borderRadius: radii.card, marginTop: spacing.md, overflow: "hidden" },
  courseTitle: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.lg, marginTop: spacing.md },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.xs },
  metaText: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm },
  progressHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.md },
  progressLabel: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm },
  progressPercent: { color: colors.accentYellow, fontFamily: fonts.semibold, fontSize: fonts.size.sm },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#1e1e1e",
    borderWidth: 1,
    borderColor: colors.outline,
  },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: colors.accentGreen },
  summary: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: fonts.size.md,
    lineHeight: 20,
    marginTop: spacing.md,
  },
  learnBox: {
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.outline,
    padding: spacing.md,
    marginTop: spacing.md,
    backgroundColor: colors.surface,
  },
  learnTitle: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.md },
  learnItem: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm },
  tabsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    marginTop: spacing.lg,
  },
  tabText: { color: colors.textSecondary, fontFamily: fonts.semibold, fontSize: fonts.size.md },
  tabTextActive: { color: colors.textPrimary },
  tabUnderline: {
    height: 3,
    backgroundColor: colors.accentYellow,
    width: 36,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    marginTop: 6,
  },
  ctaMain: {
    backgroundColor: colors.accentGreen,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
  },
  ctaText: { color: colors.textDark, fontFamily: fonts.bold, fontSize: fonts.size.lg },
});
