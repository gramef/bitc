import SafeScreen from "@/components/SafeScreen";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type Course = {
  id: string;
  title: string;
  lessons: number;
  duration: string;
  level?: string;
  progress?: number;
  image: any;
};

export default function SkillsLearn() {
  const router = useRouter();
  const [profileName, setProfileName] = useState("Guest");
  const [avatarSrc, setAvatarSrc] = useState<any>(require("../../../assets/images/react-logo.png"));
  useEffect(() => {
    import("@/services/profile").then(({ fetchMyProfile }) => {
      fetchMyProfile().then((p) => {
        setProfileName(p.fullName);
        if (p.avatarUrl) setAvatarSrc({ uri: p.avatarUrl });
      });
    });
  }, []);

  const inProgress: Course[] = useMemo(
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

  const recommended: Course = {
    id: "r1",
    title: "Designing for Mobile: UI Foundations",
    lessons: 24,
    duration: "5-8 Hours",
    level: "Beginner",
    image: require("../../../images/Rectangle 93.png"),
  };

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

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Progress Status</Text>
          <Pressable hitSlop={6}>
            <Text style={styles.sectionLink}>See all</Text>
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.cardRow}>
            {inProgress.map((c) => (
              <View key={c.id} style={styles.courseCard}>
                <Image source={c.image} style={styles.courseImage} contentFit="cover" />
              <Pressable style={styles.courseBody} onPress={() => router.push(`/course/${c.id}`)} hitSlop={6}>
                  <Text style={styles.courseTitle}>{c.title}</Text>
                  <View style={styles.courseMetaRow}>
                    <MaterialIcons name="view-module" size={16} color={colors.textMuted} />
                    <Text style={styles.courseMetaText}>{c.lessons} Lessons</Text>
                    <MaterialIcons name="schedule" size={16} color={colors.textMuted} style={{ marginLeft: spacing.md }} />
                    <Text style={styles.courseMetaText}>{c.duration}</Text>
                  </View>
                  <View style={styles.progressRow}>
                    <Text style={styles.progressLabel}>Progress</Text>
                    <Text style={styles.progressPercent}>{c.progress}%</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${c.progress}%` }]} />
                  </View>
                </Pressable>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recommended Courses</Text>
          <Pressable hitSlop={6}>
            <Text style={styles.sectionLink}>View all</Text>
          </Pressable>
        </View>
        <View style={styles.recoCard}>
          <Image source={recommended.image} style={styles.recoImage} contentFit="cover" />
          <View style={styles.recoBody}>
            <Text style={styles.recoTitle}>{recommended.title}</Text>
            <Text style={styles.recoSub}>{recommended.lessons} Lessons</Text>
            <View style={styles.recoMetaRow}>
              <MaterialIcons name="view-module" size={16} color={colors.textMuted} />
              <Text style={styles.recoMetaText}>{recommended.lessons} Lessons</Text>
              <MaterialIcons name="schedule" size={16} color={colors.textMuted} style={{ marginLeft: spacing.md }} />
              <Text style={styles.recoMetaText}>{recommended.duration}</Text>
              <MaterialIcons name="person" size={16} color={colors.textMuted} style={{ marginLeft: spacing.md }} />
              <Text style={styles.recoMetaText}>{recommended.level}</Text>
            </View>
            <View style={styles.recoActions}>
              <Pressable style={[styles.cta, styles.ctaGreen]} hitSlop={6} onPress={() => router.push(`/course/${recommended.id}`)}>
                <Text style={styles.ctaTextDark}>View</Text>
              </Pressable>
              <Pressable style={[styles.cta, styles.ctaYellow]} hitSlop={6} onPress={() => router.push(`/course/${recommended.id}`)}>
                <Text style={styles.ctaTextDark}>Start</Text>
              </Pressable>
            </View>
          </View>
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
});
