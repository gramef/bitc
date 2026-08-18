import SafeScreen from "@/components/SafeScreen";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function AIPortfolioReview() {
  const router = useRouter();
  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={6} style={styles.iconBtn}>
            <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <View style={{ width: 32 }} />
        </View>

        <Text style={styles.title}>AI Portfolio Review</Text>
        <Text style={styles.subtitle}>Get instant, personalised feedback to improve your creative portfolio.</Text>

        <Image source={require("../../../../images/Rectangle 93.png")} style={styles.heroImage} contentFit="cover" />

        <Text style={styles.paragraph}>
          The AI Portfolio Review tool analyses your creative portfolio and provides smart recommendations to improve layout,
          hierarchy, tone, and visual flow. Built for designers, photographers, writers, and all creative professionals.
        </Text>

        <Text style={styles.sectionTitle}>What This Tool Helps You With</Text>
        <View style={styles.bullets}>
          {[
            "Identifies strengths and weaknesses in your portfolio",
            "Suggests layout and structure improvements",
            "Highlights inconsistencies in tone or style",
            "Recommends missing sections/projects",
            "Grades your presentation style",
            "Provides action steps to boost hiring potential",
          ].map((b, i) => (
            <Text key={i} style={styles.bullet}>• {b}</Text>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Upload Options</Text>
        <View style={styles.bullets}>
          {[
            "Upload PDF",
            "Upload images (JPG/PNG)",
            "Paste portfolio URL (Behance, Dribbble, personal website)",
          ].map((b, i) => (
            <Text key={i} style={styles.bullet}>• {b}</Text>
          ))}
        </View>

        <Text style={styles.sectionTitle}>What You’ll Receive</Text>
        <View style={styles.bullets}>
          {[
            "Overall Portfolio Score (0–100)",
            "Visual Composition Score",
            "Storytelling & Presentation Score",
            "Professionalism Score",
          ].map((b, i) => (
            <Text key={i} style={styles.bullet}>• {b}</Text>
          ))}
        </View>

        <View style={{ height: spacing.md }} />
        <Pressable
          style={styles.ctaMain}
          hitSlop={8}
          onPress={() => router.push("/skills/tools/portfolio-review-upload")}
        >
          <Text style={styles.ctaText}>Start Portfolio Review</Text>
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
  title: { color: colors.accentYellow, fontFamily: fonts.bold, fontSize: fonts.size.title, alignSelf: "flex-start", marginTop: spacing.sm },
  subtitle: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.md, lineHeight: 20 },
  heroImage: { width: "100%", height: 180, borderRadius: radii.card, marginTop: spacing.md, overflow: "hidden" },
  paragraph: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: fonts.size.md,
    lineHeight: 20,
    marginTop: spacing.md,
  },
  sectionTitle: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.lg, marginTop: spacing.lg },
  bullets: { gap: 6, marginTop: spacing.sm },
  bullet: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm },
  ctaMain: {
    backgroundColor: colors.accentGreen,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
  },
  ctaText: { color: colors.textDark, fontFamily: fonts.bold, fontSize: fonts.size.lg },
});
