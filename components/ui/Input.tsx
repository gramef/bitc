import React, { useState } from "react";
import { Pressable, StyleSheet, TextInput, View, ViewStyle } from "react-native";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

type Props = {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  showToggle?: boolean;
  multiline?: boolean;
  style?: ViewStyle;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
};

export default function Input({
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  showToggle,
  multiline,
  style,
  keyboardType,
  autoCapitalize,
}: Props) {
  const [hidden, setHidden] = useState(secureTextEntry);
  return (
    <View style={[styles.wrap, style]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={[styles.input, multiline ? styles.textarea : undefined]}
        placeholder={placeholder}
        placeholderTextColor="#9E9E9E"
        secureTextEntry={secureTextEntry ? hidden : false}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
      {showToggle ? (
        <Pressable onPress={() => setHidden((v) => !v)} style={styles.eyeBtn} hitSlop={8}>
          <MaterialIcons name="visibility" size={20} color="#BDBDBD" />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.outline,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginBottom: spacing.sm,
    position: "relative",
  },
  input: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: fonts.size.md,
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  eyeBtn: {
    position: "absolute",
    right: spacing.md,
    top: spacing.sm + 2,
  },
});

