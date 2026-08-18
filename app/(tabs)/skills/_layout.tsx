import { colors, fonts } from "@/theme/tokens";
import { Tabs } from "expo-router";
import React from "react";

export default function SkillsTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.outline,
          borderTopWidth: 1,
          height: 68,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.semibold,
          fontSize: 12,
          marginTop: 4,
        },
        tabBarActiveTintColor: colors.textPrimary,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
      initialRouteName="dashboard"
    >
      <Tabs.Screen name="dashboard" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="tools" options={{ title: "Tools" }} />
      <Tabs.Screen name="learn" options={{ title: "Learn" }} />
    </Tabs>
  );
}

