import TabIcon from "@/components/ui/TabIcon";
import { colors, fonts } from "@/theme/tokens";
import { Tabs } from "expo-router";
import React from "react";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.outline,
          borderTopWidth: 1,
          height: 72,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.semibold,
          fontSize: 12,
          marginTop: 4,
        },
        tabBarActiveTintColor: colors.textPrimary,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
      initialRouteName="home"
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <TabIcon routeKey="home" iconName="home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: "Events",
          tabBarIcon: ({ focused }) => (
            <TabIcon routeKey="events" iconName="event" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: "Jobs",
          tabBarIcon: ({ focused }) => (
            <TabIcon routeKey="jobs" iconName="work" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="skills"
        options={{
          title: "Skills",
          tabBarIcon: ({ focused }) => (
            <TabIcon routeKey="skills" iconName="school" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: "Community",
          tabBarIcon: ({ focused }) => (
            <TabIcon routeKey="community" iconName="groups" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <TabIcon routeKey="profile" iconName="person" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
