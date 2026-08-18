import SafeScreen from "@/components/SafeScreen";
import { Button, Input } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { getSupabase } from "@/lib/supabase";
import { colors, fonts } from "@/theme/tokens";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function Signup() {
  const router = useRouter();
  const { refreshProfile } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSignup() {
    if (loading) return;
    setError(null);
    setInfo(null);
    const sb = getSupabase();
    if (!sb) {
      setError("Service unavailable — please try again later");
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
        options: { emailRedirectTo: "bitc://auth/callback" },
      });
      if (authError) {
        setError(authError.message || "Signup failed");
        return;
      }
      const userId = data.user?.id;
      if (userId) {
        await sb.from("profiles").upsert({ id: userId }, { onConflict: "id" });
      }
      await refreshProfile();
      router.replace("/profile-setup");
    } catch (e: any) {
      setError(e?.message || "Network error — check your connection");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeScreen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.avatarWrap}>
          <Image
            source={require("../assets/images/react-logo.png")}
            style={styles.avatar}
            contentFit="cover"
          />
        </View>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Sign up to continue</Text>

        <Text style={styles.label}>Email</Text>
        <Input
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Password</Text>
        <Input
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          showToggle
          autoCapitalize="none"
        />

        <Text style={styles.label}>Confirm Password</Text>
        <Input
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm Password"
          secureTextEntry
          showToggle
          autoCapitalize="none"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {info ? <Text style={styles.info}>{info}</Text> : null}

        <Button
          title={loading ? "Signing up…" : "Sign Up"}
          onPress={handleSignup}
        />

        <View style={styles.bottomRow}>
          <Text style={styles.bottomText}>Already have an account? </Text>
          <Pressable onPress={() => router.replace("/login")} hitSlop={6}>
            <Text style={styles.bottomLink}>Login</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingBottom: 24, alignItems: "stretch" },
  avatarWrap: {
    alignSelf: "center",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: colors.outline,
    marginTop: 24,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  avatar: { width: 90, height: 90, borderRadius: 45 },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: fonts.size.xl,
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: fonts.size.sm,
    textAlign: "center",
    marginBottom: 16,
  },
  label: {
    color: colors.textPrimary,
    fontFamily: fonts.semibold,
    fontSize: fonts.size.md,
    marginTop: 8,
    marginBottom: 8,
  },
  error: {
    color: "#ff6b6b",
    fontFamily: fonts.semibold,
    fontSize: fonts.size.sm,
    marginBottom: 8,
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
    marginTop: 12,
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
