import { useAuth } from "@/contexts/AuthContext";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type ToolBadge = "Popular" | "Trusted by Pros" | "New" | null;
type Tool = {
  id: string;
  title: string;
  category: "Career" | "Design" | "Business";
  description: string;
  badge: ToolBadge;
};

export default function SkillsTools() {
  const router = useRouter();
  const { profile } = useAuth();
  const profileName = profile?.fullName ?? "Guest";
  const avatarSrc = profile?.avatarUrl
    ? { uri: profile.avatarUrl }
    : require("../../../../assets/images/react-logo.png");

  const categories = ["All", "Career", "Design", "Business"] as const;
  const [activeCat, setActiveCat] = useState<typeof categories[number]>("All");

  const tools: Tool[] = useMemo(
    () => [
      {
        id: "portfolio-review",
        title: "AI Portfolio Review",
        category: "Career",
        description:
          "Get instant feedback on your portfolio with tailored suggestions to improve structure, visuals, and storytelling.",
        badge: "Popular",
      },
      {
        id: "rate-calculator",
        title: "AI Rate Calculator",
        category: "Business",
        description:
          "Generate fair pricing for your services based on industry data, experience level, and project scope.",
        badge: "Trusted by Pros",
      },
      {
        id: "brief-interpreter",
        title: "Brief Interpreter",
        category: "Business",
        description:
          "Upload or paste a client brief and get a breakdown of requirements, goals, deliverables, and potential challenges.",
        badge: "New",
      },
    ],
    []
  );
  const filtered = tools.filter((t) => (activeCat === "All" ? true : t.category === activeCat));
  return (
    <View style={styles.container}>
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

        <Text style={styles.title}>AI Tools</Text>
        <Text style={styles.subtitle}>Smart tools designed to accelerate your creative career.</Text>

        <View style={styles.filterRow}>
          {categories.map((c) => {
            const isActive = activeCat === c;
            return (
              <Pressable
                key={c}
                hitSlop={6}
                onPress={() => setActiveCat(c)}
                style={[styles.chip, isActive ? styles.chipActive : null]}
              >
                <Text style={[styles.chipText, isActive ? styles.chipTextActive : null]}>{c}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.list}>
          {filtered.map((t) => (
            <View key={t.id} style={styles.toolCard}>
              <View style={styles.toolHeader}>
                <View style={styles.toolTitleRow}>
                  <View style={styles.toolIconWrap}>
                    <MaterialIcons name="workspace-premium" size={18} color={colors.accentYellow} />
                  </View>
                  <Text style={styles.toolTitle}>{t.title}</Text>
                </View>
                {t.badge ? (
                  <View style={[styles.badge, t.badge === "New" ? styles.badgeNew : t.badge === "Popular" ? styles.badgePopular : styles.badgeTrusted]}>
                    <Text style={styles.badgeText}>{t.badge}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.toolDesc}>{t.description}</Text>
              <Pressable
                style={styles.openBtn}
                hitSlop={6}
                onPress={() => {
                  if (t.id === "portfolio-review") router.push("/skills/tools/portfolio-review" as any);
                  else if (t.id === "rate-calculator") router.push("/rate-calculator" as any);
                  else if (t.id === "brief-interpreter") router.push("/brief-interpreter" as any);
                  else if (t.id === "career-path") router.push("/career-path" as any);
                  else if (t.id === "contract-templates") router.push("/contract-templates" as any);
                }}
              >
                <Text style={styles.openBtnText}>Open</Text>
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
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
  title: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.title, marginTop: spacing.sm },
  subtitle: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.md, lineHeight: 20 },
  filterRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  chip: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.outline,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  chipActive: {
    borderColor: colors.accentYellow,
    backgroundColor: "#2a2200",
  },
  chipText: { color: colors.textSecondary, fontFamily: fonts.semibold, fontSize: fonts.size.sm },
  chipTextActive: { color: colors.accentYellow },
  list: { marginTop: spacing.md, gap: spacing.md },
  toolCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.outline,
    padding: spacing.md,
  },
  toolHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  toolTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  toolIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2a2200",
    borderWidth: 1,
    borderColor: colors.accentYellow,
  },
  toolTitle: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.lg },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  badgeText: { color: colors.textDark, fontFamily: fonts.semibold, fontSize: fonts.size.xs },
  badgeNew: { backgroundColor: colors.accentYellow, borderColor: colors.accentYellow },
  badgePopular: { backgroundColor: "#5c3d3d", borderColor: "#7a4a4a" },
  badgeTrusted: { backgroundColor: "#243a2e", borderColor: "#2f5b42" },
  toolDesc: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.md, lineHeight: 20, marginTop: spacing.sm },
  openBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.accentGreen,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
  },
  openBtnText: { color: colors.textDark, fontFamily: fonts.bold, fontSize: fonts.size.md },
});

