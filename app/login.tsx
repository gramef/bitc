import SafeScreen from "@/components/SafeScreen";
import { Button, Input } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { getSupabase } from "@/lib/supabase";
import { colors, fonts } from "@/theme/tokens";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function Login() {
  const router = useRouter();
  const { refreshProfile } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleLogin() {
    if (loading) return;
    setError(null);
    setInfo(null);
    const sb = getSupabase();
    if (!sb) {
      setError("Service unavailable — please try again later");
      return;
    }
    if (!email.trim() || !password) {
      setError("Enter your email and password");
      return;
    }
    setLoading(true);
    try {
      const { error: authError } = await sb.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError) {
        setError(authError.message || "Login failed");
        return;
      }
      await refreshProfile();
      router.replace("/(tabs)/home");
    } catch (e: any) {
      setError(e?.message || "Network error — check your connection");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot() {
    if (loading) return;
    setError(null);
    setInfo(null);
    const sb = getSupabase();
    if (!sb) {
      setError("Service unavailable");
      return;
    }
    if (!email.trim()) {
      setError("Enter your email to reset");
      return;
    }
    setLoading(true);
    try {
      const { error: resetError } = await sb.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: "bitc://auth/callback" }
      );
      if (resetError) {
        setError(resetError.message || "Failed to send reset email");
        return;
      }
      setInfo("Password reset email sent — check your inbox");
    } catch (e: any) {
      setError(e?.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle() {
    const sb = getSupabase();
    await sb?.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: "bitc://auth/callback" },
    });
  }

  async function signInWithFacebook() {
    const sb = getSupabase();
    await sb?.auth.signInWithOAuth({
      provider: "facebook",
      options: { redirectTo: "bitc://auth/callback" },
    });
  }

  async function signInWithLinkedIn() {
    const sb = getSupabase();
    await sb?.auth.signInWithOAuth({
      provider: "linkedin",
      options: { redirectTo: "bitc://auth/callback" },
    });
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
        <Text style={styles.welcome}>Welcome back</Text>

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

        <Pressable onPress={handleForgot} style={styles.forgotWrap} hitSlop={6}>
          <Text style={styles.forgot}>Forgot password?</Text>
        </Pressable>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {info ? <Text style={styles.info}>{info}</Text> : null}

        <Button
          title={loading ? "Logging in…" : "Login"}
          onPress={handleLogin}
        />

        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.orLine} />
        </View>

        <View style={styles.socialRow}>
          <Pressable
            style={styles.socialBtn}
            hitSlop={6}
            onPress={signInWithGoogle}
          >
            <FontAwesome name="google" size={20} color="#fff" />
          </Pressable>
          <Pressable
            style={styles.socialBtn}
            hitSlop={6}
            onPress={signInWithFacebook}
          >
            <FontAwesome name="facebook" size={20} color="#fff" />
          </Pressable>
          <Pressable
            style={styles.socialBtn}
            hitSlop={6}
            onPress={signInWithLinkedIn}
          >
            <FontAwesome name="linkedin" size={20} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.bottomRow}>
          <Text style={styles.bottomText}>Don't have an account? </Text>
          <Pressable onPress={() => router.push("/signup")} hitSlop={6}>
            <Text style={styles.bottomLink}>Sign Up</Text>
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
  welcome: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: fonts.size.md,
    textAlign: "center",
  },
  label: {
    color: colors.textPrimary,
    fontFamily: fonts.semibold,
    fontSize: fonts.size.md,
    marginTop: 8,
    marginBottom: 8,
  },
  forgotWrap: { alignSelf: "flex-end", marginTop: 4, marginBottom: 12 },
  forgot: {
    color: colors.accentYellow,
    fontFamily: fonts.semibold,
    fontSize: fonts.size.sm,
  },
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 18,
    gap: 10,
  },
  orLine: { height: 1, flex: 1, backgroundColor: colors.divider },
  orText: {
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  socialRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },
  socialBtn: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.outline,
    backgroundColor: "#1E1E1E",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
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
});
