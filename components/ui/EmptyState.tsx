import { colors, fonts, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

type Props = {
    icon?: keyof typeof MaterialIcons.glyphMap;
    title: string;
    subtitle?: string;
    style?: ViewStyle;
};

/**
 * Centered empty-state placeholder with icon, title, and optional subtitle.
 */
export default function EmptyState({
    icon = "inbox",
    title,
    subtitle,
    style,
}: Props) {
    return (
        <View style={[styles.container, style]}>
            <View style={styles.iconWrap}>
                <MaterialIcons name={icon} size={40} color={colors.textSecondary} />
            </View>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: spacing.xl * 2,
        paddingHorizontal: spacing.xl,
    },
    iconWrap: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: colors.surface,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: spacing.lg,
    },
    title: {
        color: colors.textPrimary,
        fontFamily: fonts.semibold,
        fontSize: fonts.size.lg,
        textAlign: "center",
        marginBottom: spacing.xs,
    },
    subtitle: {
        color: colors.textSecondary,
        fontFamily: fonts.regular,
        fontSize: fonts.size.md,
        textAlign: "center",
        lineHeight: 20,
    },
});
