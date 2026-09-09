import SafeScreen from "@/components/SafeScreen";
import { useAuth } from "@/contexts/AuthContext";
import { analyzePortfolio, PortfolioAnalysisResult } from "@/services/ai";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function AIPortfolioAnalyzing() {
  const router = useRouter();
  const { profile } = useAuth();
  const params = useLocalSearchParams<{
    fileName?: string;
    fileUri?: string;
    portfolioUrl?: string;
  }>();

  const [currentStep, setCurrentStep] = useState(1);
  const [progress, setProgress] = useState(20);
  const [analyzingDone, setAnalyzingDone] = useState(false);

  const displayFileOrUrl = useMemo(() => {
    if (params.fileName) return params.fileName;
    if (params.portfolioUrl) return params.portfolioUrl;
    return "Portfolio Document";
  }, [params.fileName, params.portfolioUrl]);

  const userName = profile?.fullName || "Creative Member";
  const userRole = profile?.bio || "UI/UX & Brand Designer";

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

  useEffect(() => {
    let isCancelled = false;

    async function runReview() {
      // Step 1: Layout & structure
      setCurrentStep(1);
      setProgress(25);
      await new Promise((r) => setTimeout(r, 600));
      if (isCancelled) return;

      // Step 2: Visual hierarchy
      setCurrentStep(2);
      setProgress(50);
      await new Promise((r) => setTimeout(r, 650));
      if (isCancelled) return;

      // Step 3: Project descriptions
      setCurrentStep(3);
      setProgress(72);
      await new Promise((r) => setTimeout(r, 600));
      if (isCancelled) return;

      // Step 4: Scoring consistency & executing AI analysis
      setCurrentStep(4);
      setProgress(88);

      const analysis: PortfolioAnalysisResult = await analyzePortfolio({
        fileName: params.fileName,
        fileUri: params.fileUri,
        portfolioUrl: params.portfolioUrl,
        userName,
        role: userRole,
      });

      if (isCancelled) return;

      // Step 5: Generating recommendations
      setCurrentStep(5);
      setProgress(100);
      setAnalyzingDone(true);
      await new Promise((r) => setTimeout(r, 500));

      if (!isCancelled) {
        router.replace({
          pathname: "/skills/tools/portfolio-review-results",
          params: {
            resultJson: JSON.stringify(analysis),
          },
        });
      }
    }

    runReview();

    return () => {
      isCancelled = true;
    };
  }, [params.fileName, params.fileUri, params.portfolioUrl, userName, userRole, router]);

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
        <Text style={styles.subtitle}>
          {analyzingDone
            ? "Synthesis complete! Loading your customized report..."
            : "Sit tight — our AI is inspecting visual balance, craft, and commercial positioning."}
        </Text>

        <View style={styles.scanWrap}>
          <View style={styles.scanCornersRow}>
            <View style={[styles.corner, { borderLeftWidth: 2, borderTopWidth: 2 }]} />
            <View style={{ flex: 1 }} />
            <View style={[styles.corner, { borderRightWidth: 2, borderTopWidth: 2 }]} />
          </View>
          <View style={styles.scanCenter}>
            <MaterialIcons
              name={params.portfolioUrl ? "language" : "insert-drive-file"}
              size={48}
              color={colors.accentYellow}
            />
            <View style={styles.scanLine} />
          </View>
          <View style={styles.scanCornersRow}>
            <View style={[styles.corner, { borderLeftWidth: 2, borderBottomWidth: 2 }]} />
            <View style={{ flex: 1 }} />
            <View style={[styles.corner, { borderRightWidth: 2, borderBottomWidth: 2 }]} />
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Target Submission:</Text>
            <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="middle">
              {displayFileOrUrl}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Submitted by:</Text>
            <Text style={styles.infoValue}>{userName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Evaluation Timestamp:</Text>
            <Text style={styles.infoValue}>{timeStr}</Text>
          </View>
        </View>

        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>Analysis Progress</Text>
          <Text style={styles.progressPercent}>{progress}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>

        <View style={styles.steps}>
          <View style={styles.stepItem}>
            <MaterialIcons
              name={currentStep >= 1 ? "check-circle" : "radio-button-unchecked"}
              size={18}
              color={currentStep >= 1 ? colors.accentGreen : colors.textMuted}
            />
            <Text style={currentStep >= 1 ? styles.stepActive : styles.step}>
              Step 1: Checking layout and spatial structure
            </Text>
          </View>

          <View style={styles.stepItem}>
            <MaterialIcons
              name={currentStep >= 2 ? "check-circle" : "radio-button-unchecked"}
              size={18}
              color={currentStep >= 2 ? colors.accentGreen : colors.textMuted}
            />
            <Text style={currentStep >= 2 ? styles.stepActive : styles.step}>
              Step 2: Reviewing visual hierarchy & typography contrast
            </Text>
          </View>

          <View style={styles.stepItem}>
            <MaterialIcons
              name={currentStep >= 3 ? "check-circle" : "radio-button-unchecked"}
              size={18}
              color={currentStep >= 3 ? colors.accentGreen : colors.textMuted}
            />
            <Text style={currentStep >= 3 ? styles.stepActive : styles.step}>
              Step 3: Evaluating project storytelling & case study depth
            </Text>
          </View>

          <View style={styles.stepItem}>
            <MaterialIcons
              name={currentStep >= 4 ? "check-circle" : "radio-button-unchecked"}
              size={18}
              color={currentStep >= 4 ? colors.accentGreen : colors.textMuted}
            />
            <Text style={currentStep >= 4 ? styles.stepActive : styles.step}>
              Step 4: Scoring consistency, branding & commercial readiness
            </Text>
          </View>

          <View style={styles.stepItem}>
            <MaterialIcons
              name={currentStep >= 5 ? "check-circle" : "radio-button-unchecked"}
              size={18}
              color={currentStep >= 5 ? colors.accentGreen : colors.textMuted}
            />
            <Text style={currentStep >= 5 ? styles.stepActive : styles.step}>
              Step 5: Synthesizing actionable recommendations
            </Text>
          </View>
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
    borderColor: colors.accentYellow,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  scanCenter: {
    alignItems: "center",
    justifyContent: "center",
    height: 120,
  },
  scanLine: { height: 2, width: "80%", backgroundColor: colors.accentYellow, marginTop: spacing.md },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.outline,
    padding: spacing.md,
    gap: spacing.xs,
  },
  infoRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  infoLabel: { color: colors.textSecondary, fontFamily: fonts.semibold, fontSize: fonts.size.sm },
  infoValue: { flex: 1, textAlign: "right", color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.sm },
  progressHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.md },
  progressText: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm },
  progressPercent: { color: colors.accentGreen, fontFamily: fonts.bold, fontSize: fonts.size.sm },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: "#2b2b2b", overflow: "hidden" },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: colors.accentGreen },
  steps: { marginTop: spacing.lg, gap: spacing.md },
  stepItem: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  step: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: fonts.size.sm, flex: 1 },
  stepActive: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.sm, flex: 1 },
});

