import SafeScreen from "@/components/SafeScreen";
import { Button, Chip } from "@/components/ui";
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

const EVENT_VIBES = [
  "Networking Brunches",
  "Design Talks & Panels",
  "Portfolio Reviews",
  "Tech & Pitch Days",
  "Cocktails & Mixers",
  "Creative Hackathons",
  "Music & Art Popups",
  "Masterclasses",
];

const CITIES = [
  "London",
  "Lagos",
  "New York",
  "Berlin",
  "Toronto",
  "Accra",
  "Remote / Global",
];

const MEMBER_GOALS = [
  "Discover premier creative events",
  "Meet inspiring creators & founders",
  "Learn from industry leaders",
  "Enjoy weekend brunches & cocktails",
  "Access exclusive BITC club perks",
];

export default function OnboardingUser() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();

  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleVibe(vibe: string) {
    setSelectedVibes((prev) =>
      prev.includes(vibe) ? prev.filter((x) => x !== vibe) : [...prev, vibe]
    );
  }

  function toggleGoal(goal: string) {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((x) => x !== goal) : [...prev, goal]
    );
  }

  async function handleContinue() {
    if (selectedVibes.length === 0) {
      setError("Please select at least one event type you enjoy.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const sb = getSupabase();
      if (sb && user) {
        // 1. Ensure profile role is 'user'
        await sb
          .from("profiles")
          .upsert({ id: user.id, role: "user" }, { onConflict: "id" });

        // 2. Persist attendee metadata to auth user
        await sb.auth.updateUser({
          data: {
            persona: "user",
            event_vibes: selectedVibes,
            preferred_city: selectedCity,
            goals: selectedGoals,
            onboarding_step: "attendee_completed",
          },
        });

        await refreshProfile();
      }

      router.push("/profile-setup" as any);
    } catch (e: any) {
      console.warn("Error saving user onboarding:", e);
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
            <View style={[styles.personaPill, { backgroundColor: "#FDCB6E20" }]}>
              <MaterialIcons name="local-activity" size={14} color="#FDCB6E" />
              <Text style={[styles.personaPillText, { color: "#FDCB6E" }]}>COMMUNITY MEMBER</Text>
            </View>
            <Text style={styles.stepText}>Step 2 of 3</Text>
          </View>
          <Text style={styles.title}>Event Vibes & Interests</Text>
          <Text style={styles.subtitle}>
            Tell us what experiences you want to discover across our creative community.
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
          {/* Section 1: Event Vibes */}
          <Text style={styles.sectionTitle}>What kind of events excite you?</Text>
          <Text style={styles.sectionSubtitle}>Select what you like attending most.</Text>
          <View style={styles.chipsRow}>
            {EVENT_VIBES.map((vibe) => (
              <Chip
                key={vibe}
                label={vibe}
                selected={selectedVibes.includes(vibe)}
                onPress={() => toggleVibe(vibe)}
              />
            ))}
          </View>

          {/* Section 2: Preferred City */}
          <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Your Primary Hub / City</Text>
          <Text style={styles.sectionSubtitle}>We will highlight gatherings happening near you.</Text>
          <View style={styles.chipsRow}>
            {CITIES.map((city) => (
              <Chip
                key={city}
                label={city}
                selected={selectedCity === city}
                onPress={() => setSelectedCity(city)}
              />
            ))}
          </View>

          {/* Section 3: Goals */}
          <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>What do you hope to get from BITC?</Text>
          <View style={styles.chipsRow}>
            {MEMBER_GOALS.map((goal) => (
              <Chip
                key={goal}
                label={goal}
                selected={selectedGoals.includes(goal)}
                onPress={() => toggleGoal(goal)}
              />
            ))}
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <MaterialIcons name="error-outline" size={16} color="#ff6b6b" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={{ height: spacing.lg }} />
          <Button
            title={saving ? "Saving Community Preferences…" : "Continue to Profile Setup"}
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
    backgroundColor: "#FDCB6E",
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
