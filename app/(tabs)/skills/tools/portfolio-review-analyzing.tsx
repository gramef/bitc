import SafeScreen from "@/components/SafeScreen";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function AIPortfolioAnalyzing() {
  const router = useRouter();
  const now = useMemo(() => new Date(), []);
  const timeStr = useMemo(() => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const h = pad(now.getHours());
    const m = pad(now.getMinutes());
    const s = pad(now.getSeconds());
    const d = pad(now.getDate());
    const month = now.toLocaleString(undefined, { month: "short" });
    const y = now.getFullYear();
    return `${h}:${m}:${s}  -  ${d} ${month}. ${y}`;
  }, [now]);
  const progress = 40;
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        router.replace("/skills/tools/portfolio-review-results");
      } catch {}
    }, 1800);
    return () => clearTimeout(t);
  }, [router]);
  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={6}>
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
          <View style={{ width: 32 }} />
        </View>

        <Text style={styles.title}>Analyzing Your Portfolio</Text>
        <Text style={styles.subtitle}>Sit tight — this usually takes less than 20 seconds.</Text>

        <View style={styles.scanWrap}>
          <View style={styles.scanCornersRow}>
            <View style={[styles.corner, { borderLeftWidth: 2, borderTopWidth: 2 }]} />
            <View style={{ flex: 1 }} />
            <View style={[styles.corner, { borderRightWidth: 2, borderTopWidth: 2 }]} />
          </View>
          <View style={styles.scanCenter}>
            <MaterialIcons name="insert-drive-file" size={48} color={colors.textSecondary} />
            <View style={styles.scanLine} />
          </View>
          <View style={styles.scanCornersRow}>
            <View style={[styles.corner, { borderLeftWidth: 2, borderBottomWidth: 2 }]} />
            <View style={{ flex: 1 }} />
            <View style={[styles.corner, { borderRightWidth: 2, borderBottomWidth: 2 }]} />
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>File/Link:</Text>
          <Text style={styles.infoValue}>Josh Banks Portfolio.PDF</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Uploaded by:</Text>
          <Text style={styles.infoValue}>User Name</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Time:</Text>
          <Text style={styles.infoValue}>{timeStr}</Text>
        </View>

        <Text style={styles.progressText}>Progress: {progress}%</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>

        <View style={styles.steps}>
          <Text style={styles.stepActive}>Step 1: Checking layout and structure</Text>
          <Text style={styles.stepActive}>Step 2: Reviewing visual hierarchy</Text>
          <Text style={styles.step}>Step 3: Evaluating project descriptions</Text>
          <Text style={styles.step}>Step 4: Scoring consistency and branding</Text>
          <Text style={styles.step}>Step 5: Generating recommendations</Text>
        </View>
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
  subtitle: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.md },
  scanWrap: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.outline,
    padding: spacing.lg,
  },
  scanCornersRow: { flexDirection: "row" },
  corner: {
    width: 28,
    height: 28,
    borderColor: colors.textSecondary,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  scanCenter: {
    alignItems: "center",
    justifyContent: "center",
    height: 140,
  },
  scanLine: { height: 2, width: "80%", backgroundColor: colors.accentYellow, marginTop: spacing.md },
  infoRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.sm },
  infoLabel: { color: colors.textSecondary, fontFamily: fonts.semibold, fontSize: fonts.size.sm },
  infoValue: { color: colors.textPrimary, fontFamily: fonts.regular, fontSize: fonts.size.sm },
  progressText: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm, marginTop: spacing.lg },
  progressTrack: { height: 10, borderRadius: 5, backgroundColor: "#2b2b2b" },
  progressFill: { height: 10, borderRadius: 5, backgroundColor: "#555" },
  steps: { marginTop: spacing.lg, gap: 6 },
  step: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm },
  stepActive: { color: colors.accentYellow, fontFamily: fonts.semibold, fontSize: fonts.size.sm },
});
