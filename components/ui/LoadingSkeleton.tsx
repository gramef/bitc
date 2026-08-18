import { colors, radii } from "@/theme/tokens";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, ViewStyle } from "react-native";

type Props = {
    width?: number | `${number}%`;
    height?: number;
    borderRadius?: number;
    style?: ViewStyle;
};

/**
 * Pulse-animated skeleton placeholder.
 * Use width/height props for quick sizing, or pass `style` for full control.
 */
export default function LoadingSkeleton({
    width = "100%",
    height = 16,
    borderRadius = radii.sm,
    style,
}: Props) {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [opacity]);

    return (
        <Animated.View
            style={[
                styles.base,
                { width: width as any, height, borderRadius, opacity },
                style,
            ]}
        />
    );
}

const styles = StyleSheet.create({
    base: {
        backgroundColor: colors.divider,
    },
});
