import React from "react";
import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { colors, fonts, radii, shadow, spacing } from "@/theme/tokens";

type Props = {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  variant?: "primary" | "secondary" | "outline";
};

export default function Button({ title, onPress, disabled, style, variant = "primary" }: Props) {
  const v =
    variant === "primary"
      ? styles.primary
      : variant === "secondary"
      ? styles.secondary
      : styles.outline;

  return (
    <Pressable onPress={onPress} disabled={disabled} style={[styles.base, v, style]}>
      <Text
        style={[
          styles.text,
          variant === "outline" || variant === "secondary" ? styles.textLight : styles.textDark,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.pill,
    paddingVertical: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.button,
  },
  primary: {
    backgroundColor: colors.accentYellow,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.outline,
  },
  text: {
    fontFamily: fonts.semibold,
    fontSize: fonts.size.lg,
    letterSpacing: 1.0,
  },
  textDark: {
    color: colors.textDark,
  },
  textLight: {
    color: colors.textPrimary,
  },
});

