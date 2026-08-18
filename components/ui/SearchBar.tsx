import React from "react";
import { StyleSheet, TextInput, View, ViewStyle } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { colors, radii, spacing, fonts } from "@/theme/tokens";

type Props = {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  style?: ViewStyle;
};

export default function SearchBar({ value, onChangeText, placeholder, style }: Props) {
  return (
    <View style={[styles.wrap, style]}>
      <MaterialIcons name="search" size={18} color={colors.textSecondary} style={styles.icon} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
        placeholder={placeholder || "Search"}
        placeholderTextColor="#9E9E9E"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.outline,
    backgroundColor: colors.surface,
    paddingLeft: spacing.md + 24,
    paddingRight: spacing.md,
    paddingVertical: spacing.sm + 2,
    alignItems: "center",
    position: "relative",
  },
  icon: {
    position: "absolute",
    left: spacing.md,
    top: spacing.sm + 4,
  },
  input: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: fonts.size.md,
  },
});

