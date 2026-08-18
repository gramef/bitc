import { colors } from "@/theme/tokens";
import { Stack } from "expo-router";
import React from "react";

export default function ToolsStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}

