import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

export interface ProfileCoverProps {
  uri?: string | null;
  role?: string | null;
  height?: number;
  borderRadius?: number;
  editable?: boolean;
  onPressEdit?: () => void;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export function ProfileCover({
  uri,
  role = "creative",
  height = 160,
  borderRadius = radii.card,
  editable = false,
  onPressEdit,
  style,
  children,
}: ProfileCoverProps) {
  const [imgFailed, setImgFailed] = useState(false);

  React.useEffect(() => {
    setImgFailed(false);
  }, [uri]);

  const hasValidUri = Boolean(
    uri && typeof uri === "string" && uri.trim().length > 0 && !imgFailed
  );

  // Curated theme gradients by user persona
  const getGradientColors = (): [string, string, ...string[]] => {
    switch (role) {
      case "business":
        return ["#0D0E13", "#171924", "#231F17", "#0E0E12"];
      case "creative":
        return ["#120D1B", "#231433", "#2C1D18", "#12100E"];
      case "admin":
        return ["#170F11", "#2B161B", "#221915", "#130E0F"];
      case "user":
      default:
        return ["#14130E", "#252014", "#2E2613", "#14130E"];
    }
  };

  const getRoleAccentColor = (): string => {
    switch (role) {
      case "business":
        return "#74B9FF";
      case "creative":
        return "#A29BFE";
      case "admin":
        return "#FF7675";
      case "user":
      default:
        return colors.accentYellow;
    }
  };

  const gradientColors = getGradientColors();
  const accentColor = getRoleAccentColor();

  const content = (
    <View
      style={[
        styles.container,
        {
          height,
          borderRadius,
        },
        style,
      ]}
    >
      {hasValidUri ? (
        <>
          <Image
            source={{ uri: uri!.trim() }}
            style={[StyleSheet.absoluteFill, { borderRadius }]}
            contentFit="cover"
            transition={150}
            onError={() => setImgFailed(true)}
          />
          {/* Subtle bottom scrim for text and avatar contrast */}
          <LinearGradient
            colors={["rgba(0,0,0,0.05)", "rgba(0,0,0,0.65)"]}
            style={[StyleSheet.absoluteFill, { borderRadius }]}
            start={{ x: 0.5, y: 0.3 }}
            end={{ x: 0.5, y: 1.0 }}
          />
        </>
      ) : (
        /* High-aesthetic dynamic gradient backdrop */
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0.0, y: 0.0 }}
          end={{ x: 1.0, y: 1.0 }}
          style={[StyleSheet.absoluteFill, { borderRadius }]}
        >
          {/* Subtle ambient decorative lighting */}
          <View
            style={[
              styles.ambientGlow,
              {
                backgroundColor: accentColor,
                opacity: 0.12,
              },
            ]}
          />
          <View
            style={[
              styles.ambientGlowSecondary,
              {
                backgroundColor: colors.accentYellow,
                opacity: 0.08,
              },
            ]}
          />

          {/* Persona banner watermark badge */}
          <View style={styles.personaBannerTag}>
            <View
              style={[
                styles.personaDot,
                { backgroundColor: accentColor },
              ]}
            />
            <Text style={[styles.personaBannerText, { color: accentColor }]}>
              {role ? `${role.toUpperCase()} BANNER` : "BITC BANNER"}
            </Text>
          </View>
        </LinearGradient>
      )}

      {/* Editable Pill Overlay */}
      {editable && (
        <Pressable
          style={styles.editPill}
          onPress={onPressEdit}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Change cover photo"
        >
          <MaterialIcons name="camera-alt" size={13} color="#FFFFFF" />
          <Text style={styles.editPillText}>
            {hasValidUri ? "Edit Cover" : "Add Cover"}
          </Text>
        </Pressable>
      )}

      {children}
    </View>
  );

  if (editable && onPressEdit) {
    return (
      <Pressable onPress={onPressEdit} style={{ width: "100%" }}>
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#161616",
  },
  ambientGlow: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  ambientGlowSecondary: {
    position: "absolute",
    bottom: -30,
    left: 20,
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  personaBannerTag: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  personaDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  personaBannerText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  editPill: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: "rgba(0,0,0,0.65)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    zIndex: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 3,
  },
  editPillText: {
    color: "#FFFFFF",
    fontFamily: fonts.semibold,
    fontSize: 11,
  },
});
