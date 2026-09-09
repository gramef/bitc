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

const CRAFT_OPTIONS = [
  "UI/UX Design",
  "Brand Identity",
  "Motion & 3D",
  "Web & Mobile Dev",
  "Photography & Film",
  "Sound & Music",
  "Creative Direction",
  "Content & Copy",
  "Product Design",
];

const GOAL_OPTIONS = [
  "Land freelance client gigs",
  "Find a full-time studio role",
  "Host creative meetups & reviews",
  "Find creative collaborators",
  "Book design mentorship",
];

const EXPERIENCE_LEVELS = [
  { label: "Emerging", sub: "1–2 years", value: "emerging" },
  { label: "Mid-level", sub: "3–5 years", value: "mid" },
  { label: "Senior / Lead", sub: "5–8 years", value: "senior" },
  { label: "Director", sub: "8+ years", value: "director" },
];

export default function OnboardingCreative() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();

  const [selectedCrafts, setSelectedCrafts] = useState<string[]>(["UI/UX Design"]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([
    "Land freelance client gigs",
    "Host creative meetups & reviews",
  ]);
  const [experience, setExperience] = useState<string>("mid");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleCraft(item: string) {
    setSelectedCrafts((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  }

  function toggleGoal(item: string) {
    setSelectedGoals((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  }

  async function handleContinue() {
    if (selectedCrafts.length === 0) {
      setError("Please select at least one creative discipline.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const sb = getSupabase();
      if (sb && user) {
        // 1. Ensure profile role is 'creative'
        await sb
          .from("profiles")
          .upsert({ id: user.id, role: "creative" }, { onConflict: "id" });

        // 2. Persist creative onboarding metadata to Supabase auth user
        await sb.auth.updateUser({
          data: {
            persona: "creative",
            crafts: selectedCrafts,
            goals: selectedGoals,
            experience_level: experience,
            portfolio_url: portfolioUrl.trim() || null,
            onboarding_step: "creative_completed",
          },
        });

        await refreshProfile();
      }

      router.push("/profile-setup" as any);
    } catch (e: any) {
      console.warn("Error saving creative onboarding:", e);
      // Non-blocking navigation
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
            <View style={[styles.personaPill, { backgroundColor: "#00B89420" }]}>
              <MaterialIcons name="brush" size={14} color="#00B894" />
              <Text style={[styles.personaPillText, { color: "#00B894" }]}>CREATIVE PERSONA</Text>
            </View>
            <Text style={styles.stepText}>Step 2 of 3</Text>
          </View>
          <Text style={styles.title}>Your Craft & Ambitions</Text>
          <Text style={styles.subtitle}>
            Personalize your creative profile to unlock matching briefs, community events, and reviews.
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
          {/* Section 1: Disciplines */}
          <Text style={styles.sectionTitle}>What is your creative craft?</Text>
          <Text style={styles.sectionSubtitle}>Select all that apply to your work.</Text>
          <View style={styles.chipsRow}>
            {CRAFT_OPTIONS.map((craft) => (
              <Chip
                key={craft}
                label={craft}
                selected={selectedCrafts.includes(craft)}
                onPress={() => toggleCraft(craft)}
              />
            ))}
          </View>

          {/* Section 2: Goals */}
          <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>What do you want to achieve on BITC?</Text>
          <View style={styles.chipsRow}>
            {GOAL_OPTIONS.map((goal) => (
              <Chip
                key={goal}
                label={goal}
                selected={selectedGoals.includes(goal)}
                onPress={() => toggleGoal(goal)}
              />
            ))}
          </View>

          {/* Section 3: Experience Level */}
          <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Experience Level</Text>
          <View style={styles.levelGrid}>
            {EXPERIENCE_LEVELS.map((lvl) => {
              const active = experience === lvl.value;
              return (
                <Pressable
                  key={lvl.value}
                  style={[styles.levelCard, active && styles.levelCardActive]}
                  onPress={() => setExperience(lvl.value)}
                >
                  <Text style={[styles.levelLabel, active && styles.levelLabelActive]}>
                    {lvl.label}
                  </Text>
                  <Text style={styles.levelSub}>{lvl.sub}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Section 4: Portfolio URL */}
          <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Portfolio or Social Link</Text>
          <Text style={styles.sectionSubtitle}>Dribbble, ReadCV, Behance, GitHub, or personal site.</Text>
          <Input
            value={portfolioUrl}
            onChangeText={setPortfolioUrl}
            placeholder="https://yourportfolio.design"
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
            title={saving ? "Saving Craft Profile…" : "Continue to Profile Setup"}
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
    backgroundColor: "#00B894",
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
    borderColor: "#00B894",
    backgroundColor: "#00B89415",
  },
  levelLabel: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  levelLabelActive: {
    color: "#00B894",
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
