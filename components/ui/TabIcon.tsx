import { getTabIconSource } from "@/icons/tab-icons";
import { colors } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import React from "react";
import { View } from "react-native";

type Props = {
  routeKey: "home" | "events" | "jobs" | "skills" | "community" | "profile";
  iconName: React.ComponentProps<typeof MaterialIcons>["name"];
  focused: boolean;
};

export default function TabIcon({ routeKey, iconName, focused }: Props) {
  const src = getTabIconSource(routeKey);
  return (
    <View style={{ alignItems: "center" }}>
      {focused ? (
        <View
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: colors.accentYellow,
            marginBottom: 6,
          }}
        />
      ) : (
        <View style={{ height: 12 }} />
      )}
      {src ? (() => {
        const renderable = focused ? src.active ?? src.inactive : src.inactive ?? src.active;
        if (typeof renderable === "function") {
          const Cmp = renderable as any;
          return <Cmp width={22} height={22} />;
        }
        if (renderable) {
          return (
            <Image
              source={renderable as any}
              style={{ width: 22, height: 22 }}
              contentFit="contain"
            />
          );
        }
        return (
          <MaterialIcons
            name={iconName}
            size={22}
            color={focused ? colors.textPrimary : colors.textSecondary}
          />
        );
      })() : (
        <MaterialIcons
          name={iconName}
          size={22}
          color={focused ? colors.textPrimary : colors.textSecondary}
        />
      )}
    </View>
  );
}
