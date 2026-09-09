import SafeScreen from "@/components/SafeScreen";
import { Button, Chip, Input } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { getSupabase } from "@/lib/supabase";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const INDUSTRY_OPTIONS = [
  "Design & Branding Studio",
  "Tech & SaaS",
  "Media & Entertainment",
  "Fashion & Lifestyle",
  "Venture & Web3",
  "Architecture & Interior",
  "Advertising & Marketing",
];

const BUSINESS_GOALS = [
  "Hire top creative talent",
  "Post job briefs & contracts",
  "Host branded events & summits",
  "Find agency design partners",
  "Build brand presence with creators",
];

const TEAM_SIZES = [
  { label: "1–5", sub: "Boutique / Seed", value: "1-5" },
  { label: "6–20", sub: "Growth Studio", value: "6-20" },
  { label: "21–50", sub: "Mid-size Agency", value: "21-50" },
  { label: "50+", sub: "Enterprise / Global", value: "50+" },
];

export default function OnboardingBusiness() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();

  const [companyName, setCompanyName] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState<string>("Design & Branding Studio");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([
    "Hire top creative talent",
    "Host branded events & summits",
  ]);
  const [teamSize, setTeamSize] = useState<string>("6-20");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleGoal(goal: string) {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((x) => x !== goal) : [...prev, goal]
    );
  }

  async function handleContinue() {
    if (!companyName.trim()) {
      setError("Please enter your Company or Studio name.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const sb = getSupabase();
      if (sb && user) {
        // 1. Update profiles table with company name as full_name and role as business
        await sb.from("profiles").upsert(
          {
            id: user.id,
            full_name: companyName.trim(),
            role: "business",
          },
          { onConflict: "id" }
        );

        // 2. Persist business metadata in auth user metadata
        await sb.auth.updateUser({
          data: {
            persona: "business",
            company_name: companyName.trim(),
            industry: selectedIndustry,
            goals: selectedGoals,
            team_size: teamSize,
            website_url: websiteUrl.trim() || null,
            onboarding_step: "business_completed",
          },
        });

        await refreshProfile();
      }

      router.push("/profile-setup" as any);
    } catch (e: any) {
      console.warn("Error saving business onboarding:", e);
      router.push("/profile-setup" as any);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeScreen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <View style={styles.badgeRow}>
            <View style={[styles.personaPill, { backgroundColor: "#6C5CE720" }]}>
              <MaterialIcons name="business" size={14} color="#6C5CE7" />
              <Text style={[styles.personaPillText, { color: "#6C5CE7" }]}>BUSINESS PERSONA</Text>
            </View>
            <Text style={styles.stepText}>Step 2 of 3</Text>
          </View>
          <Text style={styles.title}>Company & Hiring Goals</Text>
          <Text style={styles.subtitle}>
            Set up your studio identity to start posting briefs, hosting events, and reviewing candidates.
          </Text>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Company / Studio Name */}
          <Text style={styles.sectionTitle}>Company or Studio Name *</Text>
          <Input
            value={companyName}
            onChangeText={setCompanyName}
            placeholder="e.g. Acme Design Studio or Apex Labs"
          />

          {/* Industry Sector */}
          <Text style={[styles.sectionTitle, { marginTop: spacing.md }]}>Industry Sector</Text>
          <View style={styles.chipsRow}>
            {INDUSTRY_OPTIONS.map((ind) => (
              <Chip
                key={ind}
                label={ind}
                selected={selectedIndustry === ind}
                onPress={() => setSelectedIndustry(ind)}
              />
            ))}
          </View>

          {/* Business Objectives */}
          <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Primary Objectives</Text>
          <View style={styles.chipsRow}>
            {BUSINESS_GOALS.map((goal) => (
              <Chip
                key={goal}
                label={goal}
                selected={selectedGoals.includes(goal)}
                onPress={() => toggleGoal(goal)}
              />
            ))}
          </View>

          {/* Team Size */}
          <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Team Size</Text>
          <View style={styles.levelGrid}>
            {TEAM_SIZES.map((lvl) => {
              const active = teamSize === lvl.value;
              return (
                <Pressable
                  key={lvl.value}
                  style={[styles.levelCard, active && styles.levelCardActive]}
                  onPress={() => setTeamSize(lvl.value)}
                >
                  <Text style={[styles.levelLabel, active && styles.levelLabelActive]}>
                    {lvl.label}
                  </Text>
                  <Text style={styles.levelSub}>{lvl.sub}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Company Website */}
          <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Company Website</Text>
          <Text style={styles.sectionSubtitle}>Where talent and attendees can learn more about your brand.</Text>
          <Input
            value={websiteUrl}
            onChangeText={setWebsiteUrl}
            placeholder="https://acmestudio.com"
            autoCapitalize="none"
            keyboardType="url"
          />

          {error ? (
            <View style={styles.errorBox}>
              <MaterialIcons name="error-outline" size={16} color="#ff6b6b" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={{ height: spacing.lg }} />
          <Button
            title={saving ? "Saving Business Profile…" : "Continue to Profile Setup"}
            onPress={handleContinue}
            disabled={saving}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  backBtn: {
    alignSelf: "flex-start",
    marginBottom: spacing.xs,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  personaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  personaPillText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  stepText: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 11,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 24,
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: fonts.size.sm,
    lineHeight: 20,
    marginTop: 4,
  },
  progressTrack: {
    marginTop: spacing.md,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surface,
  },
  progressFill: {
    width: "66%",
    height: "100%",
    borderRadius: 2,
    backgroundColor: "#6C5CE7",
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.semibold,
    fontSize: 15,
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 12,
    marginBottom: spacing.sm,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  levelGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  levelCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.outline,
    borderRadius: radii.card,
    padding: spacing.md,
    alignItems: "center",
  },
  levelCardActive: {
    borderColor: "#6C5CE7",
    backgroundColor: "#6C5CE715",
  },
  levelLabel: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  levelLabelActive: {
    color: "#6C5CE7",
  },
  levelSub: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 11,
    marginTop: 2,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.md,
    backgroundColor: "#351515",
    padding: 10,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: "#ff6b6b50",
  },
  errorText: {
    color: "#ff6b6b",
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
});
