import { colors, fonts } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import React, { useState } from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

export interface AvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: number;
  style?: ViewStyle | ViewStyle[];
  bordered?: boolean;
  borderColor?: string;
  badge?: React.ReactNode;
}

export function Avatar({
  uri,
  name,
  size = 40,
  style,
  bordered = false,
  borderColor = colors.accentYellow,
  badge,
}: AvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);

  React.useEffect(() => {
    setImgFailed(false);
  }, [uri]);

  // Derive up to 2 uppercase initials from name (e.g. "FM Adekanye" -> "FA", "Kofi" -> "K")
  const initials = (name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");

  const radius = Math.round(size / 2);
  const fontSize = Math.max(10, Math.round(size * 0.38));
  const iconSize = Math.max(14, Math.round(size * 0.55));

  const hasValidUri = Boolean(
    uri &&
      typeof uri === "string" &&
      uri.trim().length > 0 &&
      !imgFailed
  );

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: radius,
        },
        bordered && {
          borderWidth: 2,
          borderColor,
        },
        style,
      ]}
    >
      {hasValidUri ? (
        <Image
          source={{ uri: uri!.trim() }}
          style={{ width: "100%", height: "100%", borderRadius: radius }}
          contentFit="cover"
          transition={150}
          onError={() => setImgFailed(true)}
        />
      ) : (
        <View
          style={[
            styles.placeholderWrap,
            {
              borderRadius: radius,
              backgroundColor: "#201E15",
              borderColor: "#EAD05440",
              borderWidth: 1,
            },
          ]}
        >
          {initials ? (
            <Text
              style={[
                styles.initialsText,
                {
                  fontSize,
                  color: colors.accentYellow,
                },
              ]}
              numberOfLines={1}
            >
              {initials}
            </Text>
          ) : (
            <MaterialIcons
              name="person"
              size={iconSize}
              color={colors.accentYellow}
            />
          )}
        </View>
      )}

      {badge ? <View style={styles.badgeWrap}>{badge}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderWrap: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  initialsText: {
    fontFamily: fonts.bold,
    letterSpacing: 0.5,
    textAlign: "center",
  },
  badgeWrap: {
    position: "absolute",
    bottom: 0,
    right: 0,
  },
});
