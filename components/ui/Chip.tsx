import React from "react";
import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { colors, fonts, radii, spacing } from "@/theme/tokens";

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
};

export default function Chip({ label, selected, onPress, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.base,
        selected ? styles.selected : styles.unselected,
        style,
      ]}
    >
      <Text style={[styles.text, selected ? styles.textSelected : styles.textUnselected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md + 2,
    borderRadius: radii.xl,
    borderWidth: 1,
  },
  unselected: {
    backgroundColor: colors.surface,
    borderColor: colors.outline,
  },
  selected: {
    backgroundColor: "#1E1E1E",
    borderColor: colors.accentGreen,
  },
  text: {
    fontFamily: fonts.semibold,
    fontSize: fonts.size.sm,
  },
  textUnselected: {
    color: colors.textMuted,
  },
  textSelected: {
    color: "#E8FFE8",
  },
});

