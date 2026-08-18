import SafeScreen from "@/components/SafeScreen";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function AIPortfolioResults() {
  const router = useRouter();
  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={6}>
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
          <View style={{ width: 32 }} />
        </View>

        <Text style={styles.title}>Your Portfolio Review is Ready!</Text>
        <Text style={styles.subtitle}>Here’s your personalized breakdown and improvement suggestions.</Text>

        <Text style={styles.sectionTitle}>★ Overall Portfolio Score</Text>
        <View style={styles.card}>
          <Text style={styles.scoreLarge}>82 / 100</Text>
          <Text style={styles.paragraph}>
            Strong foundation. A few improvements can make it outstanding.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>📊 Detailed Scores</Text>
        <View style={styles.card}>
          <Text style={styles.itemTitle}>Visual Composition: 85/100</Text>
          <Text style={styles.itemBody}>Clean layout with good spacing. Improve alignment for stronger balance.</Text>

          <View style={{ height: spacing.md }} />
          <Text style={styles.itemTitle}>Storytelling Quality: 78/100</Text>
          <Text style={styles.itemBody}>
            Your case studies need more narrative flow and problem/ solution clarity.
          </Text>

          <View style={{ height: spacing.md }} />
          <Text style={styles.itemTitle}>Consistency & Branding: 80/100</Text>
          <Text style={styles.itemBody}>
            Color usage is consistent, but typography shifts between projects.
          </Text>

          <View style={{ height: spacing.md }} />
          <Text style={styles.itemTitle}>Professionalism: 88/100</Text>
          <Text style={styles.itemBody}>Your portfolio feels polished — great first impressions!</Text>
        </View>

        <Text style={styles.sectionTitle}>📝 Top Recommendations</Text>
        <View style={styles.card}>
          {[
            "Add more detailed case studies to at least 2 projects",
            "Expand your process explanations (research → execution → outcome)",
            "Improve typography alignment in Project 2 & Project 4",
            "Include a personal introduction page or short bio",
            "Add measurable results (e.g., conversions, engagement, downloads)",
          ].map((t, i) => (
            <Text key={i} style={styles.bullet}>• {t}</Text>
          ))}
        </View>

        <View style={{ height: spacing.lg }} />
        <Pressable style={styles.ctaMain} hitSlop={8}>
          <Text style={styles.ctaText}>Download Full Report (PDF)</Text>
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
  cancel: { color: colors.textSecondary, fontFamily: fonts.semibold, fontSize: fonts.size.md },
  title: { color: colors.accentYellow, fontFamily: fonts.bold, fontSize: fonts.size.title, alignSelf: "flex-start", marginTop: spacing.sm },
  subtitle: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.md, lineHeight: 20 },
  sectionTitle: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.lg, marginTop: spacing.lg },
  card: {
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.outline,
    padding: spacing.md,
  },
  scoreLarge: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: 28 },
  paragraph: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.md, lineHeight: 20, marginTop: spacing.sm },
  itemTitle: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.md },
  itemBody: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm, lineHeight: 20 },
  bullet: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm, lineHeight: 20 },
  ctaMain: {
    backgroundColor: colors.accentGreen,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
  },
  ctaText: { color: colors.textDark, fontFamily: fonts.bold, fontSize: fonts.size.lg },
});

