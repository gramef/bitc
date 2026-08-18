import React, { ReactNode } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { colors, radii, shadow } from "@/theme/tokens";

type Props = {
  children: ReactNode;
  selected?: boolean;
  style?: ViewStyle;
};

export default function Card({ children, selected, style }: Props) {
  return (
    <View
      style={[
        styles.base,
        selected ? styles.active : styles.inactive,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.card,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    ...shadow.card,
  },
  inactive: {
    backgroundColor: colors.surface,
    borderColor: colors.outline,
  },
  active: {
    backgroundColor: "#1E1E1E",
    borderColor: colors.accentGreen,
  },
});

