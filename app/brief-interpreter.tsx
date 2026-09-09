import SafeScreen from "@/components/SafeScreen";
import { BriefAnalysisResult, interpretBrief } from "@/services/ai";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const SAMPLE_BRIEFS = [
  {
    label: "Mobile App MVP",
    text: "We are an early-stage fintech startup looking to design an MVP iOS app. We need 12-15 screens including onboarding, KYC verification, wallet dashboard, and P2P transfers. Launch deadline is in 4 weeks. No brand guidelines exist yet, but we like the Clean Minimal look of Revolut.",
  },
  {
    label: "Brand Identity",
    text: "Rebranding our boutique coffee roasting business. We need a primary logo, secondary badge, coffee bag packaging die-lines, brand color palette, and social media templates. Looking for 3 concepts and unlimited revisions. Budget is tight ($800) but this will lead to long-term work.",
  },
  {
    label: "SaaS Landing Page",
    text: "Need a high-converting web landing page in Figma for our B2B AI analytics tool. Key deliverables: Hero section, interactive product demo layout, feature matrix, pricing table, customer testimonials, and mobile responsive variants. Target completion is 2 weeks.",
  },
];

export default function BriefInterpreter() {
  const router = useRouter();
  const [briefText, setBriefText] = useState("");
  const [result, setResult] = useState<BriefAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleInterpret() {
    if (!briefText.trim()) return;
    setLoading(true);
    try {
      const res = await interpretBrief(briefText);
      setResult(res);
    } catch {
      Alert.alert("Analysis Error", "Unable to interpret brief right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyQuestions() {
    if (!result) return;
    const text = result.clarifyingQuestions
      .map((q, i) => `${i + 1}. ${q}`)
      .join("\n\n");
    await Clipboard.setStringAsync(text);
    Alert.alert(
      "Questions Copied!",
      "5 strategic scoping questions have been copied to your clipboard. Paste them into your client email or chat."
    );
  }

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={10}>
          <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>AI Brief Interpreter</Text>
        <Text style={styles.subtitle}>
          Paste any messy client brief to instantly extract project deliverables, timeline flags, pricing brackets, and defensive scope questions.
        </Text>

        <Text style={styles.quickFillLabel}>Quick Test with Sample Briefs:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.samplesScroll}>
          <View style={styles.samplesRow}>
            {SAMPLE_BRIEFS.map((s, idx) => (
              <Pressable
                key={idx}
                style={styles.sampleChip}
                onPress={() => setBriefText(s.text)}
                hitSlop={6}
              >
                <MaterialIcons name="auto-awesome" size={14} color={colors.accentYellow} />
                <Text style={styles.sampleChipText}>{s.label}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <Text style={styles.label}>Paste Client Brief</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Paste client email, Slack message, or Upwork job description here…"
          placeholderTextColor={colors.textSecondary}
          value={briefText}
          onChangeText={setBriefText}
          multiline
          textAlignVertical="top"
        />

        <Pressable
          style={[styles.interpretBtn, (!briefText.trim() || loading) && { opacity: 0.6 }]}
          onPress={handleInterpret}
          disabled={!briefText.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.textDark} />
          ) : (
            <View style={styles.btnRow}>
              <MaterialIcons name="psychology" size={20} color={colors.textDark} />
              <Text style={styles.interpretBtnText}>Analyze Scope & Red Flags</Text>
            </View>
          )}
        </Pressable>

        {result ? (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <View style={styles.badgeRow}>
                <View style={styles.badgeGreen}>
                  <Text style={styles.badgeTextGreen}>{result.projectType}</Text>
                </View>
                <View style={styles.badgeDark}>
                  <Text style={styles.badgeTextDark}>{result.clientMaturity}</Text>
                </View>
              </View>
              <Text style={styles.resultSummary}>{result.executiveSummary}</Text>
            </View>

            {/* Scope & Pricing Metrics */}
            <View style={styles.metricGrid}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Estimated Effort</Text>
                <Text style={styles.metricValue}>{result.estimatedEffort}</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Fair Pricing Tier</Text>
                <Text style={styles.metricValueHighlight}>{result.recommendedPricingTier}</Text>
              </View>
            </View>

            {/* Deliverables */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📦 Core Deliverables</Text>
              {result.deliverables.map((item, i) => (
                <View key={i} style={styles.bulletRow}>
                  <MaterialIcons name="check" size={16} color={colors.accentGreen} style={{ marginTop: 2 }} />
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </View>

            {/* Red Flags & Risk Warnings */}
            {result.redFlags.length > 0 && (
              <View style={styles.riskCard}>
                <View style={styles.riskHeader}>
                  <MaterialIcons name="warning" size={18} color="#ff6b6b" />
                  <Text style={styles.riskTitle}>Identified Scope Risks & Red Flags</Text>
                </View>
                {result.redFlags.map((rf, i) => (
                  <View key={i} style={styles.riskItem}>
                    <Text style={styles.riskName}>⚠️ {rf.risk}</Text>
                    <Text style={styles.riskAdvice}>Recommendation: {rf.advice}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Suggested Questions to Ask */}
            <View style={styles.questionsSection}>
              <View style={styles.questionsHeaderRow}>
                <Text style={styles.questionsTitle}>💬 Clarifying Questions to Ask</Text>
                <Pressable onPress={handleCopyQuestions} style={styles.copyBtn} hitSlop={6}>
                  <MaterialIcons name="content-copy" size={16} color={colors.accentYellow} />
                  <Text style={styles.copyBtnText}>Copy All</Text>
                </Pressable>
              </View>
              {result.clarifyingQuestions.map((q, i) => (
                <View key={i} style={styles.questionRow}>
                  <Text style={styles.questionNum}>{i + 1}.</Text>
                  <Text style={styles.questionText}>{q}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  backBtn: { alignSelf: "flex-start", paddingVertical: spacing.sm },
  title: { color: colors.accentYellow, fontFamily: fonts.bold, fontSize: fonts.size.title },
  subtitle: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.md, lineHeight: 22 },
  quickFillLabel: { color: colors.textSecondary, fontFamily: fonts.semibold, fontSize: fonts.size.sm, marginTop: spacing.sm },
  samplesScroll: { marginHorizontal: -spacing.lg, paddingHorizontal: spacing.lg },
  samplesRow: { flexDirection: "row", gap: spacing.sm, paddingVertical: spacing.xs },
  sampleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  sampleChipText: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.xs },
  label: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.md, marginTop: spacing.sm },
  textArea: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.outline,
    padding: spacing.md,
    color: colors.textPrimary,
    fontFamily: fonts.regular,
    fontSize: fonts.size.md,
    minHeight: 140,
    lineHeight: 22,
  },
  interpretBtn: {
    backgroundColor: colors.accentGreen,
    borderRadius: radii.pill,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xs,
  },
  btnRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  interpretBtnText: { color: colors.textDark, fontFamily: fonts.bold, fontSize: fonts.size.md },
  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.outline,
    padding: spacing.lg,
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  resultHeader: { gap: spacing.sm },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  badgeGreen: { backgroundColor: colors.accentGreen, borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 4 },
  badgeTextGreen: { color: colors.textDark, fontFamily: fonts.bold, fontSize: fonts.size.xs },
  badgeDark: { backgroundColor: "#2b2b2b", borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 4 },
  badgeTextDark: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.xs },
  resultSummary: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.md, lineHeight: 22 },
  metricGrid: { flexDirection: "row", gap: spacing.md },
  metricBox: {
    flex: 1,
    backgroundColor: "#161616",
    borderRadius: radii.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  metricLabel: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.xs },
  metricValue: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.sm, marginTop: 4 },
  metricValueHighlight: { color: colors.accentYellow, fontFamily: fonts.bold, fontSize: fonts.size.sm, marginTop: 4 },
  section: { gap: spacing.sm },
  sectionTitle: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.md },
  bulletRow: { flexDirection: "row", gap: spacing.sm },
  bulletText: { flex: 1, color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm, lineHeight: 20 },
  riskCard: {
    backgroundColor: "#2a1717",
    borderRadius: radii.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "#6b2c2c",
    gap: spacing.sm,
  },
  riskHeader: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  riskTitle: { color: "#ff8585", fontFamily: fonts.bold, fontSize: fonts.size.sm },
  riskItem: { borderTopWidth: 1, borderTopColor: "#472020", paddingTop: 6, gap: 2 },
  riskName: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.sm },
  riskAdvice: { color: "#ffbaba", fontFamily: fonts.regular, fontSize: fonts.size.xs, lineHeight: 18 },
  questionsSection: { gap: spacing.sm },
  questionsHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  questionsTitle: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.md },
  copyBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#1e1e1e", paddingHorizontal: 10, paddingVertical: 6, borderRadius: radii.pill },
  copyBtnText: { color: colors.accentYellow, fontFamily: fonts.bold, fontSize: fonts.size.xs },
  questionRow: { flexDirection: "row", gap: spacing.sm },
  questionNum: { color: colors.accentGreen, fontFamily: fonts.bold, fontSize: fonts.size.md, width: 20 },
  questionText: { flex: 1, color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm, lineHeight: 22 },
});

