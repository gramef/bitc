import { useAuth } from "@/contexts/AuthContext";
import { colors, fonts } from "@/theme/tokens";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function Index() {
  const router = useRouter();
  const { loading, user } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.replace("/(tabs)/home");
    } else {
      router.replace("/login");
    }
  }, [loading, user, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.accentYellow} />
      <Text style={styles.text}>Loading…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    gap: 12,
  },
  text: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: fonts.size.md,
  },
});
