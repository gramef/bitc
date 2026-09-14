import SafeScreen from "@/components/SafeScreen";
import { Button, Input } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { getSupabase } from "@/lib/supabase";
import { UserRole } from "@/services/permissions";
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

interface PersonaOption {
  role: UserRole;
  title: string;
  badge: string;
  color: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  description: string;
  highlights: string[];
}

const PERSONAS: PersonaOption[] = [
  {
    role: "creative",
    title: "Creative",
    badge: "CREATOR",
    color: "#00B894",
    icon: "brush",
    description:
      "Showcase your portfolio, apply to gigs, book mentorship, and host creative meetups.",
    highlights: ["Portfolio Showcase", "Paid Gigs & Jobs", "AI Skills Vault"],
  },
  {
    role: "business",
    title: "Business / Studio",
    badge: "HIRING",
    color: "#6C5CE7",
    icon: "business",
    description:
      "Post job opportunities, review applicant portfolios, hire top creative talent, and host summits.",
    highlights: ["Post Jobs & Briefs", "Review Candidates", "Branded Summits"],
  },
  {
    role: "user",
    title: "Community Member",
    badge: "ATTENDEE",
    color: "#FDCB6E",
    icon: "local-activity",
    description:
      "Discover weekend brunches, buy tickets, join live audio rooms, and explore creative work.",
    highlights: ["Weekend Brunches", "Live Audio Rooms", "Creator Network"],
  },
];

export default function Signup() {
  const router = useRouter();
  const { refreshProfile } = useAuth();

  const [persona, setPersona] = useState<UserRole>("creative");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const activePersona = PERSONAS.find((p) => p.role === persona) || PERSONAS[0];

  async function handleSignup() {
    if (loading) return;
    setError(null);
    setInfo(null);

    const sb = getSupabase();
    if (!sb) {
      setError("Service unavailable — please try again later");
      return;
    }
    if (!fullName.trim()) {
      setError(
        persona === "business"
          ? "Please enter your company or studio name"
          : "Please enter your name"
      );
      return;
    }
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);
    try {
      const { data, error: authError } = await sb.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            role: persona,
            full_name: fullName.trim(),
          },
          emailRedirectTo: "bitc://auth/callback",
        },
      });

      if (authError) {
        setError(authError.message || "Signup failed");
        return;
      }

      const userId = data.user?.id;
      if (userId) {
        await sb.from("profiles").upsert(
          {
            id: userId,
            role: persona,
            full_name: fullName.trim(),
          },
          { onConflict: "id" }
        );
      }

      await refreshProfile();

      // If Supabase returned an immediate active session (email confirmation off)
      if (data.session) {
        if (persona === "creative") {
          router.replace("/onboarding/creative" as any);
        } else if (persona === "business") {
          router.replace("/onboarding/business" as any);
        } else {
          router.replace("/onboarding/user" as any);
        }
        return;
      }

      // If email verification is required, forward to verify screen with persona context
      router.replace({
        pathname: "/verify-email",
        params: { email: email.trim(), persona },
      } as any);
    } catch (e: any) {
      setError(e?.message || "Network error — check your connection");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeScreen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              style={styles.backBtn}
              hitSlop={10}
            >
              <MaterialIcons name="arrow-back" size={24} color="#fff" />
            </Pressable>
            <View style={styles.brandBadge}>
              <MaterialIcons name="auto-awesome" size={18} color={colors.accentYellow} />
              <Text style={styles.brandText}>BITC MEMBERSHIP</Text>
            </View>
            <Text style={styles.title}>Create Your Account</Text>
            <Text style={styles.subtitle}>
              Select your persona below to personalize your opportunities and tools.
            </Text>
          </View>

          {/* Persona Selector Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>1. Choose Your Persona</Text>
            <Text style={styles.sectionHint}>Select the role that fits you best</Text>
          </View>

          <View style={styles.personaList}>
            {PERSONAS.map((p) => {
              const isSelected = persona === p.role;
              return (
                <Pressable
                  key={p.role}
                  style={[
                    styles.personaCard,
                    isSelected && {
                      borderColor: p.color,
                      backgroundColor: `${p.color}12`,
                    },
                  ]}
                  onPress={() => setPersona(p.role)}
                >
                  <View style={[styles.iconWrap, { backgroundColor: `${p.color}25` }]}>
                    <MaterialIcons name={p.icon} size={24} color={p.color} />
                  </View>

                  <View style={styles.personaInfo}>
                    <View style={styles.badgeRow}>
                      <Text style={styles.personaTitle}>{p.title}</Text>
                      <View style={[styles.rolePill, { backgroundColor: `${p.color}30` }]}>
                        <Text style={[styles.rolePillText, { color: p.color }]}>
                          {p.badge}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.personaDesc}>{p.description}</Text>

                    {/* Feature Chips */}
                    <View style={styles.highlightsRow}>
                      {p.highlights.map((h) => (
                        <View key={h} style={styles.highlightChip}>
                          <Text style={styles.highlightText}>{h}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View
                    style={[
                      styles.radioCircle,
                      isSelected && {
                        borderColor: p.color,
                        backgroundColor: p.color,
                      },
                    ]}
                  >
                    {isSelected && (
                      <MaterialIcons name="check" size={14} color="#141414" />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Persona Banner confirmation */}
          <View style={[styles.personaBanner, { borderColor: `${activePersona.color}40` }]}>
            <MaterialIcons name="verified-user" size={18} color={activePersona.color} />
            <Text style={styles.personaBannerText}>
              Signing up as a{" "}
              <Text style={{ color: activePersona.color, fontFamily: fonts.bold }}>
                {activePersona.title}
              </Text>
            </Text>
          </View>

          {/* Step 2: Account Details */}
          <View style={[styles.sectionHeader, { marginTop: spacing.lg }]}>
            <Text style={styles.sectionTitle}>2. Account Details</Text>
          </View>

          <Text style={styles.label}>
            {persona === "business" ? "Company / Studio Name *" : "Full Name / Alias *"}
          </Text>
          <Input
            value={fullName}
            onChangeText={setFullName}
            placeholder={
              persona === "business"
                ? "e.g. Acme Design Studio"
                : persona === "creative"
                ? "e.g. Alex Morgan"
                : "e.g. Jordan Lee"
            }
            autoCapitalize="words"
          />

          <Text style={styles.label}>Email Address *</Text>
          <Input
            value={email}
            onChangeText={setEmail}
            placeholder="name@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password *</Text>
          <Input
            value={password}
            onChangeText={setPassword}
            placeholder="At least 6 characters"
            secureTextEntry
            showToggle
            autoCapitalize="none"
          />

          <Text style={styles.label}>Confirm Password *</Text>
          <Input
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter password"
            secureTextEntry
            showToggle
            autoCapitalize="none"
          />

          {error ? (
            <View style={styles.alertBox}>
              <MaterialIcons name="error-outline" size={16} color="#ff6b6b" />
              <Text style={styles.error}>{error}</Text>
            </View>
          ) : null}

          {info ? <Text style={styles.info}>{info}</Text> : null}

          <View style={{ height: spacing.sm }} />

          <Button
            title={
              loading
                ? "Creating Account…"
                : `Sign Up as ${activePersona.title}`
            }
            onPress={handleSignup}
          />

          <View style={styles.bottomRow}>
            <Text style={styles.bottomText}>Already have an account? </Text>
            <Pressable onPress={() => router.replace("/login")} hitSlop={6}>
              <Text style={styles.bottomLink}>Login</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl * 2,
    alignItems: "stretch",
  },
  header: {
    marginBottom: spacing.md,
  },
  backBtn: {
    alignSelf: "flex-start",
    marginBottom: spacing.xs,
    padding: 4,
  },
  brandBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: spacing.xs,
  },
  brandText: {
    color: colors.accentYellow,
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1.2,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 24,
    marginBottom: 4,
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: fonts.size.sm,
    lineHeight: 20,
  },
  sectionHeader: {
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  sectionHint: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 12,
    marginTop: 2,
  },
  personaList: {
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  personaCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.outline,
    borderRadius: radii.card,
    padding: spacing.md,
    gap: spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  personaInfo: {
    flex: 1,
    gap: 4,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  personaTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 15,
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
  personaDesc: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
  },
  highlightsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  highlightChip: {
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  highlightText: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 10,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.outline,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  personaBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#161616",
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  personaBannerText: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  label: {
    color: colors.textPrimary,
    fontFamily: fonts.semibold,
    fontSize: fonts.size.sm,
    marginTop: 12,
    marginBottom: 6,
  },
  alertBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,107,107,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,107,107,0.3)",
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginVertical: 8,
  },
  error: {
    color: "#ff6b6b",
    fontFamily: fonts.semibold,
    fontSize: fonts.size.sm,
    flex: 1,
  },
  info: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: fonts.size.sm,
    marginBottom: 8,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.lg,
  },
  bottomText: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: fonts.size.sm,
  },
  bottomLink: {
    color: colors.accentYellow,
    fontFamily: fonts.semibold,
    fontSize: fonts.size.sm,
  },
});

