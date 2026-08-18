import { colors } from "@/theme/tokens";
import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
    children: React.ReactNode;
    /** Extra top padding beyond the safe area inset (default 0) */
    extraTop?: number;
    /** Whether to add bottom safe area inset (default false) */
    safeBottom?: boolean;
};

/**
 * A screen wrapper that automatically accounts for the status-bar / notch.
 * Wrap every screen's root `<View>` with `<SafeScreen>` instead.
 */
export default function SafeScreen({
    children,
    extraTop = 0,
    safeBottom = false,
}: Props) {
    const insets = useSafeAreaInsets();

    return (
        <View
            style={[
                styles.container,
                {
                    paddingTop: insets.top + extraTop,
                    paddingBottom: safeBottom ? insets.bottom : 0,
                },
            ]}
        >
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
});
