import { Button } from "@/components/ui";
import { colors, fonts, spacing } from "@/theme/tokens";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { getSupabase } from "@/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string; token_hash?: string; error_description?: string }>();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const message = useMemo(() => {
    if (status === "success") return "Email confirmed";
    if (status === "error") return "Unable to confirm";
    return "Processing";
  }, [status]);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setStatus("error");
      return;
    }
    sb.auth.getUser().then(async ({ data, error }) => {
      if (error) {
        setStatus("error");
        return;
      }
      const user = data?.user;
      if (user?.id) {
        setStatus("success");
        const fullName =
          String(user.user_metadata?.full_name || user.user_metadata?.name || "").trim() || null;
        const avatarUrl =
          (user.user_metadata?.avatar_url as string) ||
          (user.user_metadata?.picture as string) ||
          null;
        try {
          await sb
            .from("profiles")
            .upsert({ id: user.id, full_name: fullName, avatar_url: avatarUrl }, { onConflict: "id" });
        } catch {}
        if (fullName) {
          router.replace("/(tabs)/home");
        } else {
          router.replace("/profile-setup");
        }
      } else {
        setStatus("idle");
      }
    });
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{message}</Text>
      <Text style={styles.body}>Continue to the app</Text>
      <View style={{ height: spacing.md }} />
      <Button title="Go to Login" onPress={() => router.replace("/login")} />
      <View style={{ height: spacing.sm }} />
      <Button title="Go to Profile Setup" onPress={() => router.replace("/profile-setup")} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: fonts.size.lg,
  },
  body: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: fonts.size.md,
    marginTop: 8,
  },
})
