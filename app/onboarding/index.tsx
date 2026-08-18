 
import { colors } from "@/theme/tokens";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";

const { width, height } = Dimensions.get("window");

export default function OnboardingOne() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Image
        source={require("../../images/image 1.png")}
        style={styles.hero}
        contentFit="cover"
        transition={200}
      />

      <View style={styles.topBar}>
        <Pressable onPress={() => router.replace("/")} hitSlop={10}>
          <Text style={styles.skip}>skip</Text>
        </Pressable>
      </View>

      <LinearGradient
        colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.55)", "rgba(0,0,0,0.95)"]}
        locations={[0, 0.5, 1]}
        style={styles.gradient}
      />

      <View style={styles.content}>
        <Text style={styles.title}>Discover Opportunities,{'\n'}All in One Place</Text>
        <Text style={styles.body}>
          Find events, jobs, and creative gigs{'\n'}tailored to you.
        </Text>

        <View style={styles.dots}>
          <View style={[styles.dot, styles.dotInactive]} />
          <View style={[styles.dot, styles.dotActive]} />
        </View>

        <Pressable onPress={() => router.push("/onboarding/skills")} style={styles.cta}>
          <Text style={styles.ctaText}>NEXT</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  hero: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width,
    height,
  },
  topBar: {
    position: "absolute",
    top: 44,
    right: 16,
  },
  skip: {
    color: "#ffffff",
    opacity: 0.9,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: height * 0.44,
  },
  content: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  title: {
    color: "#fff",
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    letterSpacing: 0.3,
    lineHeight: 30,
    textAlign: "center",
  },
  body: {
    color: "#cfd8dc",
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    marginTop: 10,
    lineHeight: 20,
    textAlign: "center",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    marginBottom: 14,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotInactive: {
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  dotActive: {
    backgroundColor: colors.accentGreen,
  },
  cta: {
    backgroundColor: "#D6B226",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  ctaText: {
    color: "#141414",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    letterSpacing: 1.2,
  },
});
