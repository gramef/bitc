import { colors, fonts, spacing } from "@/theme/tokens";
import React, { Component, ErrorInfo, ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = { children: ReactNode };
type State = { hasError: boolean; error: Error | null };

export default class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error("ErrorBoundary caught:", error, info);
    }

    handleRetry = () => this.setState({ hasError: false, error: null });

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <Text style={styles.emoji}>⚠️</Text>
                    <Text style={styles.title}>Something went wrong</Text>
                    <Text style={styles.message}>
                        {this.state.error?.message || "An unexpected error occurred."}
                    </Text>
                    <Pressable style={styles.button} onPress={this.handleRetry}>
                        <Text style={styles.buttonText}>Try Again</Text>
                    </Pressable>
                </View>
            );
        }
        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: spacing.xl,
    },
    emoji: { fontSize: 48, marginBottom: spacing.lg },
    title: {
        color: colors.textPrimary,
        fontFamily: fonts.bold,
        fontSize: fonts.size.title,
        textAlign: "center",
        marginBottom: spacing.sm,
    },
    message: {
        color: colors.textSecondary,
        fontFamily: fonts.regular,
        fontSize: fonts.size.md,
        textAlign: "center",
        lineHeight: 22,
        marginBottom: spacing.xl,
    },
    button: {
        backgroundColor: colors.accentYellow,
        borderRadius: 18,
        paddingVertical: 14,
        paddingHorizontal: 32,
    },
    buttonText: {
        color: colors.textDark,
        fontFamily: fonts.semibold,
        fontSize: fonts.size.md,
    },
});
