import SafeScreen from "@/components/SafeScreen";
import { Button } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { getSupabase } from "@/lib/supabase";
import { UserRole } from "@/services/permissions";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function OnboardingIdentity() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();

  const [persona, setPersona] = useState<UserRole>("creative");
  const [saving, setSaving] = useState(false);

  async function handleContinue() {
    setSaving(true);
    try {
      const sb = getSupabase();
      if (sb && user) {
        await sb
          .from("profiles")
          .upsert({ id: user.id, role: persona }, { onConflict: "id" });
        await refreshProfile();
      }
    } catch (e) {
      console.warn("Failed to save role:", e);
    } finally {
      setSaving(false);
    }

    // Branch into persona-specific onboarding setup
    if (persona === "creative") {
      router.push("/onboarding/creative" as any);
    } else if (persona === "business") {
      router.push("/onboarding/business" as any);
    } else {
      router.push("/onboarding/user" as any);
    }
  }

  return (
    <SafeScreen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.title}>Tell us who you are</Text>
        <Text style={styles.subtitle}>Choose your profile persona to personalize your BITC experience.</Text>
        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.cards}>
          {/* Creative Persona */}
          <Pressable
            style={[styles.personaCard, persona === "creative" && styles.personaCardActive]}
            onPress={() => setPersona("creative")}
          >
            <View style={[styles.iconWrap, { backgroundColor: "#00B89420" }]}>
              <MaterialIcons name="brush" size={26} color="#00B894" />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <View style={styles.badgeRow}>
                <Text style={styles.cardTitle}>Creative</Text>
                <View style={[styles.rolePill, { backgroundColor: "#00B89430" }]}>
                  <Text style={[styles.rolePillText, { color: "#00B894" }]}>CREATOR</Text>
                </View>
              </View>
              <Text style={styles.cardBody}>
                Showcase your portfolio, apply to gigs, book mentorship, and host creative meetups.
              </Text>
            </View>
            <View style={[styles.checkCircle, persona === "creative" && styles.checkCircleActive]}>
              {persona === "creative" && <MaterialIcons name="check" size={16} color={colors.textDark} />}
            </View>
          </Pressable>

          {/* Business Persona */}
          <Pressable
            style={[styles.personaCard, persona === "business" && styles.personaCardActive]}
            onPress={() => setPersona("business")}
          >
            <View style={[styles.iconWrap, { backgroundColor: "#6C5CE720" }]}>
              <MaterialIcons name="business" size={26} color="#6C5CE7" />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <View style={styles.badgeRow}>
                <Text style={styles.cardTitle}>Business / Studio</Text>
                <View style={[styles.rolePill, { backgroundColor: "#6C5CE730" }]}>
                  <Text style={[styles.rolePillText, { color: "#6C5CE7" }]}>HIRING</Text>
                </View>
              </View>
              <Text style={styles.cardBody}>
                Post job opportunities, review portfolios, hire top creative talent, and host branded events.
              </Text>
            </View>
            <View style={[styles.checkCircle, persona === "business" && styles.checkCircleActive]}>
              {persona === "business" && <MaterialIcons name="check" size={16} color={colors.textDark} />}
            </View>
          </Pressable>

          {/* User / Attendee Persona */}
          <Pressable
            style={[styles.personaCard, persona === "user" && styles.personaCardActive]}
            onPress={() => setPersona("user")}
          >
            <View style={[styles.iconWrap, { backgroundColor: "#FDCB6E20" }]}>
              <MaterialIcons name="local-activity" size={26} color="#FDCB6E" />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <View style={styles.badgeRow}>
                <Text style={styles.cardTitle}>Community Member</Text>
                <View style={[styles.rolePill, { backgroundColor: "#FDCB6E30" }]}>
                  <Text style={[styles.rolePillText, { color: "#FDCB6E" }]}>ATTENDEE</Text>
                </View>
              </View>
              <Text style={styles.cardBody}>
                Discover weekend brunches, buy tickets, join live audio rooms, and explore creative work.
              </Text>
            </View>
            <View style={[styles.checkCircle, persona === "user" && styles.checkCircleActive]}>
              {persona === "user" && <MaterialIcons name="check" size={16} color={colors.textDark} />}
            </View>
          </Pressable>
        </View>

        <View style={{ height: spacing.lg }} />
        <Button title={saving ? "Saving…" : "Continue"} onPress={handleContinue} />
      </ScrollView>
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
    width: "35%",
    height: "100%",
    borderRadius: 2,
    backgroundColor: colors.accentYellow,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  cards: {
    gap: spacing.md,
  },
  personaCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.outline,
    borderRadius: radii.card,
    padding: spacing.md,
    gap: spacing.md,
  },
  personaCardActive: {
    borderColor: colors.accentYellow,
    backgroundColor: "#1E1C15",
  },
  iconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  rolePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rolePillText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  cardBody: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.outline,
    alignItems: "center",
    justifyContent: "center",
  },
  checkCircleActive: {
    backgroundColor: colors.accentYellow,
    borderColor: colors.accentYellow,
  },
});
