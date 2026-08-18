import SafeScreen from "@/components/SafeScreen";
import { Button, Card } from "@/components/ui";

import { useAuth } from "@/contexts/AuthContext";
import { getSupabase } from "@/lib/supabase";
import { colors } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type Persona = "Creative" | "Business" | "User";

const ROLE_MAP: Record<Persona, string> = {
  Creative: "creative",
  Business: "business",
  User: "user",
};

export default function OnboardingIdentity() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();

  const [persona, setPersona] = useState<Persona | null>(null);
  const [saving, setSaving] = useState(false);
  const progress = useMemo(() => 0.4, []);

  async function handleContinue() {
    if (!persona) {
      Alert.alert("Select a role", "Please tell us how you want to use BITC.");
      return;
    }
    if (!user) {
      router.replace("/profile-setup");
      return;
    }
    setSaving(true);
    try {
      const sb = getSupabase();
      if (sb) {
        await sb
          .from("profiles")
          .upsert({ id: user.id, role: ROLE_MAP[persona] }, { onConflict: "id" });
        await refreshProfile();
      }
    } catch (e) {
      console.warn("Failed to save role:", e);
    } finally {
      setSaving(false);
    }
    router.replace("/profile-setup");
  }

  return (
    <SafeScreen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.title}>Tell us who you are</Text>
        <Text style={styles.subtitle}>Tell us how you want to use BITC.</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.cards}>
          <Pressable onPress={() => setPersona("Creative")}>
            <Card selected={persona === "Creative"}>
              <View style={styles.cardIcon}>
                <MaterialIcons name="brush" size={22} color="#fff" />
              </View>
              <Text style={styles.cardTitle}>Creative</Text>
              <Text style={styles.cardBody}>I want to showcase my work & find opportunities.</Text>
            </Card>
          </Pressable>

          <Pressable onPress={() => setPersona("Business")}>
            <Card selected={persona === "Business"}>
              <View style={styles.cardIcon}>
                <MaterialIcons name="work" size={22} color="#fff" />
              </View>
              <Text style={styles.cardTitle}>Business</Text>
              <Text style={styles.cardBody}>
                I'm looking to hire creatives & grow my brand.
              </Text>
            </Card>
          </Pressable>

          <Pressable onPress={() => setPersona("User")}>
            <Card selected={persona === "User"}>
              <View style={styles.cardIcon}>
                <MaterialIcons name="person" size={22} color="#fff" />
              </View>
              <Text style={styles.cardTitle}>User</Text>
              <Text style={styles.cardBody}>
                I want to attend events & join the community.
              </Text>
            </Card>
          </Pressable>
        </View>

        <Button title={saving ? "Saving…" : "Continue"} onPress={handleContinue} />
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0b0b",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  backBtn: {
    alignSelf: "flex-start",
    paddingVertical: 8,
  },
  title: {
    color: "#fff",
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    marginTop: 4,
  },
  subtitle: {
    color: "#cfd8dc",
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    marginTop: 2,
  },
  progressTrack: {
    marginTop: 10,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#9E9E9E",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.accentGreen,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  cards: {
    gap: 12,
  },
  cardIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#333",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  cardTitle: {
    color: "#fff",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    marginBottom: 6,
  },
  cardBody: {
    color: "#cfd8dc",
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    lineHeight: 20,
  },
  cta: {},
});
