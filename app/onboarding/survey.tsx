 
import SafeScreen from "@/components/SafeScreen";
import { colors } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Button, Chip } from "@/components/ui";

export default function OnboardingSurvey() {
  const router = useRouter();

  const [skills, setSkills] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [workStyle, setWorkStyle] = useState<string[]>([]);
  const [experience, setExperience] = useState<string[]>([]);

  const toggle = (set: React.Dispatch<React.SetStateAction<string[]>>, v: string) =>
    set((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));

  const progress = useMemo(() => 0.35, []);

  return (
    <SafeScreen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.title}>Skills & Goals</Text>
        <Text style={styles.subtitle}>Help Us tailor your experience.</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>1. What’s your main skill?</Text>
        <View style={styles.chipsRow}>
          {["Design", "Writing", "Finance", "UI/UX", "Photography", "Music", "Videography"].map(
            (c) => (
              <Chip
                key={c}
                label={c}
                selected={skills.includes(c)}
                onPress={() => toggle(setSkills, c)}
              />
            )
          )}
        </View>

        <Text style={styles.sectionTitle}>2. What do you want to achieve?</Text>
        <View style={styles.chipsRow}>
          {["Find Clients", "Learn New Skills", "Network", "Collaborate", "Mentor"].map((c) => (
            <Chip
              key={c}
              label={c}
              selected={goals.includes(c)}
              onPress={() => toggle(setGoals, c)}
            />
          ))}
        </View>

        <Text style={styles.sectionTitle}>3. Preferred Work Style?</Text>
        <View style={styles.chipsRow}>
          {["Freelancer", "Full-time", "Part-time"].map((c) => (
            <Chip
              key={c}
              label={c}
              selected={workStyle.includes(c)}
              onPress={() => toggle(setWorkStyle, c)}
            />
          ))}
        </View>

        <Text style={styles.sectionTitle}>4. Experience Level</Text>
        <View style={styles.chipsRow}>
          {["Beginner", "Intermediate", "Expert", "Advanced"].map((c) => (
            <Chip
              key={c}
              label={c}
              selected={experience.includes(c)}
              onPress={() => toggle(setExperience, c)}
            />
          ))}
        </View>

        <Button title="Continue" onPress={() => router.push("/onboarding/identity")} />
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
  sectionTitle: {
    color: "#fff",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    marginTop: 16,
    marginBottom: 10,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  cta: {},
});
