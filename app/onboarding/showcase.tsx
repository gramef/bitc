 
import SafeScreen from "@/components/SafeScreen";
import { colors } from "@/theme/tokens";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";

const { width } = Dimensions.get("window");

export default function OnboardingThree() {
  const router = useRouter();

  return (
    <SafeScreen>
      <View style={styles.collage}>
        <View style={[styles.card, styles.cardGreen, styles.cardA]}>
          <Image
            source={require("../../images/designs.png")}
            style={styles.cardImage}
            contentFit="cover"
          />
          <Text style={[styles.cardLabel, styles.cardLabelDark]}>Designs</Text>
        </View>
        <View style={[styles.card, styles.cardYellow, styles.cardB]}>
          <Image
            source={require("../../images/services.png")}
            style={styles.cardImage}
            contentFit="cover"
          />
          <Text style={[styles.cardLabel, styles.cardLabelDark]}>Services</Text>
        </View>
        <View style={[styles.card, styles.cardPurple, styles.cardC]}>
          <Image
            source={require("../../images/automations.png")}
            style={styles.cardImage}
            contentFit="cover"
          />
          <Text style={[styles.cardLabel, styles.cardLabelDark]}>Automations</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Showcase Your Talent, Get{'\n'}Rewarded</Text>
        <Text style={styles.body}>
          Build your portfolio, sell your services, and{'\n'}grow your brand.
        </Text>

        <View style={styles.dots}>
          <View style={[styles.dot, styles.dotInactive]} />
          <View style={[styles.dot, styles.dotInactive]} />
          <View style={[styles.dot, styles.dotActive]} />
        </View>

        <Pressable onPress={() => router.push("/profile-setup")} style={styles.cta}>
          <Text style={styles.ctaText}>Get Started</Text>
        </Pressable>
      </View>
    </SafeScreen>
  );
}

const CARD_W = Math.min(0.6 * width, 280);
const CARD_H = CARD_W * 0.68;
const RADIUS = 22;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0b0b",
  },
  collage: {
    height: CARD_H * 2,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: RADIUS,
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    position: "absolute",
  },
  cardImage: {
    flex: 1,
    borderRadius: RADIUS - 6,
  },
  cardLabel: {
    position: "absolute",
    bottom: 12,
    left: 16,
    right: 16,
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
  },
  cardLabelDark: {
    color: "#141414",
  },
  cardGreen: {
    backgroundColor: "#1FD17A",
  },
  cardYellow: {
    backgroundColor: "#D6B226",
  },
  cardPurple: {
    backgroundColor: "#6F6AF8",
  },
  cardA: {
    transform: [{ rotate: "-9deg" }],
    top: 22,
    left: width * 0.08,
  },
  cardB: {
    transform: [{ rotate: "10deg" }],
    top: 82,
    right: width * 0.08,
  },
  cardC: {
    transform: [{ rotate: "-5deg" }],
    top: CARD_H + 20,
    left: width * 0.02,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  title: {
    color: "#fff",
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    letterSpacing: 0.3,
    lineHeight: 30,
    textAlign: "center",
    marginTop: 12,
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
    fontSize: 16,
  },
});
