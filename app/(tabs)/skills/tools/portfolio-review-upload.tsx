import SafeScreen from "@/components/SafeScreen";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

export default function AIPortfolioReviewUpload() {
  const router = useRouter();
  const [url, setUrl] = useState("");
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

        <View style={styles.dropZone}>
          <Pressable style={styles.browseBtn} hitSlop={8}>
            <MaterialIcons name="folder-open" size={18} color={colors.textDark} />
            <Text style={styles.browseText}>Browse files</Text>
          </Pressable>
          <Text style={styles.dropHelp}>Drop or paste document here</Text>
          <Text style={styles.dropHint}>PDF, JPG, PNG / Max. 50 MB</Text>
        </View>
        <Text style={styles.privacy}>Your data is secure and never stored permanently.</Text>

        <Text style={styles.inputLabel}>Portfolio URI</Text>
        <TextInput
          placeholder="Enter Behance, Dribbble, personal website..."
          placeholderTextColor={colors.textSecondary}
          value={url}
          onChangeText={setUrl}
          style={styles.input}
        />

        <View style={{ height: spacing.lg }} />
        <Pressable style={styles.ctaMain} hitSlop={8} onPress={() => router.push("/skills/tools/portfolio-review-analyzing")}>
          <Text style={styles.ctaText}>Start Review</Text>
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
  dropZone: {
    marginTop: spacing.lg,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: "#6b3f3f",
    borderStyle: "dashed",
    padding: spacing.lg,
    alignItems: "center",
    backgroundColor: "#221a1a",
  },
  browseBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.accentYellow,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  browseText: { color: colors.textDark, fontFamily: fonts.semibold, fontSize: fonts.size.md },
  dropHelp: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm, marginTop: spacing.md },
  dropHint: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.xs, marginTop: 2 },
  privacy: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm, textAlign: "center", marginTop: spacing.sm },
  inputLabel: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.md, marginTop: spacing.lg },
  input: {
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: "#6b3f3f",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontFamily: fonts.regular,
    fontSize: fonts.size.md,
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
