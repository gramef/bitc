import SafeScreen from "@/components/SafeScreen";
import { useAuth } from "@/contexts/AuthContext";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View,
} from "react-native";

type SettingItem = {
    icon: keyof typeof MaterialIcons.glyphMap;
    label: string;
    subtitle?: string;
    color?: string;
    isSwitch?: boolean;
    isDestructive?: boolean;
    onPress?: () => void;
};

export default function Settings() {
    const router = useRouter();
    const { profile, user, signOut } = useAuth();
    const [pushNotifs, setPushNotifs] = useState(true);
    const [emailNotifs, setEmailNotifs] = useState(true);
    const [darkMode, setDarkMode] = useState(true);

    const avatarSrc = profile?.avatarUrl
        ? { uri: profile.avatarUrl }
        : require("../assets/images/react-logo.png");

    function handleSignOut() {
        Alert.alert(
            "Sign Out",
            "Are you sure you want to sign out of your account?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Sign Out",
                    style: "destructive",
                    onPress: async () => {
                        await signOut();
                        router.replace("/login");
                    },
                },
            ]
        );
    }

    function handleDeleteAccount() {
        Alert.alert(
            "Delete Account",
            "This action cannot be undone. All your data will be permanently removed.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        Alert.alert("Contact Support", "Please contact support@bitc.app to delete your account.");
                    },
                },
            ]
        );
    }

    const accountSettings: SettingItem[] = [
        {
            icon: "person",
            label: "Edit Profile",
            subtitle: "Update your name, bio, and photo",
            onPress: () => router.push("/profile-setup"),
        },
        {
            icon: "email",
            label: "Email",
            subtitle: user?.email ?? "Not set",
        },
        {
            icon: "lock",
            label: "Change Password",
            subtitle: "Update your password",
            onPress: () => Alert.alert("Coming Soon", "Password change will be available in the next update."),
        },
        {
            icon: "verified-user",
            label: "Verification",
            subtitle: "Verify your identity",
            color: colors.accentGreen,
            onPress: () => Alert.alert("Coming Soon", "Identity verification will be available soon."),
        },
    ];

    const notifSettings: SettingItem[] = [
        {
            icon: "notifications",
            label: "Push Notifications",
            subtitle: "Receive push notifications",
            isSwitch: true,
        },
        {
            icon: "email",
            label: "Email Notifications",
            subtitle: "Receive email updates",
            isSwitch: true,
        },
    ];

    const appSettings: SettingItem[] = [
        {
            icon: "dark-mode",
            label: "Dark Mode",
            subtitle: "Always on",
            isSwitch: true,
        },
        {
            icon: "language",
            label: "Language",
            subtitle: "English",
            onPress: () => Alert.alert("Language", "English is currently the only supported language."),
        },
    ];

    const supportSettings: SettingItem[] = [
        {
            icon: "help",
            label: "Help & FAQ",
            onPress: () => Alert.alert("Help", "Visit help.bitc.app for FAQs and support articles."),
        },
        {
            icon: "flag",
            label: "Report a Problem",
            onPress: () => Alert.alert("Report", "Send your report to support@bitc.app"),
        },
        {
            icon: "description",
            label: "Terms of Service",
            onPress: () => Alert.alert("Terms", "Terms of Service can be viewed at bitc.app/terms"),
        },
        {
            icon: "privacy-tip",
            label: "Privacy Policy",
            onPress: () => Alert.alert("Privacy", "Privacy Policy can be viewed at bitc.app/privacy"),
        },
    ];

    function renderSettingRow(item: SettingItem, idx: number, switchState?: boolean, onSwitch?: (v: boolean) => void) {
        return (
            <Pressable
                key={idx}
                style={styles.settingRow}
                onPress={item.isSwitch ? undefined : item.onPress}
                disabled={item.isSwitch}
            >
                <View style={[styles.settingIconWrap, { backgroundColor: (item.color ?? colors.accentYellow) + "15" }]}>
                    <MaterialIcons name={item.icon} size={20} color={item.color ?? colors.accentYellow} />
                </View>
                <View style={styles.settingContent}>
                    <Text style={[styles.settingLabel, item.isDestructive && { color: "#ff4444" }]}>{item.label}</Text>
                    {item.subtitle && <Text style={styles.settingSub}>{item.subtitle}</Text>}
                </View>
                {item.isSwitch ? (
                    <Switch
                        value={switchState}
                        onValueChange={onSwitch}
                        trackColor={{ false: "#3A3A3A", true: colors.accentGreen }}
                        thumbColor="#fff"
                    />
                ) : (
                    <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
                )}
            </Pressable>
        );
    }

    return (
        <SafeScreen>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
                        <MaterialIcons name="arrow-back" size={22} color="#fff" />
                    </Pressable>
                    <Text style={styles.headerTitle}>Settings</Text>
                    <View style={{ width: 48 }} />
                </View>

                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <View style={styles.profileAvatarWrap}>
                        <Image source={avatarSrc} style={styles.profileAvatar} contentFit="cover" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.profileName}>{profile?.fullName ?? "Guest"}</Text>
                        <Text style={styles.profileEmail}>{user?.email ?? "Not signed in"}</Text>
                    </View>
                    <Pressable
                        style={styles.editProfileBtn}
                        onPress={() => router.push("/profile-setup")}
                    >
                        <MaterialIcons name="edit" size={16} color={colors.accentYellow} />
                    </Pressable>
                </View>

                {/* Account */}
                <Text style={styles.sectionTitle}>Account</Text>
                <View style={styles.sectionCard}>
                    {accountSettings.map((s, i) => renderSettingRow(s, i))}
                </View>

                {/* Notifications */}
                <Text style={styles.sectionTitle}>Notifications</Text>
                <View style={styles.sectionCard}>
                    {renderSettingRow(notifSettings[0], 0, pushNotifs, setPushNotifs)}
                    {renderSettingRow(notifSettings[1], 1, emailNotifs, setEmailNotifs)}
                </View>

                {/* Appearance */}
                <Text style={styles.sectionTitle}>Appearance</Text>
                <View style={styles.sectionCard}>
                    {renderSettingRow(appSettings[0], 0, darkMode, setDarkMode)}
                    {renderSettingRow(appSettings[1], 1)}
                </View>

                {/* Support */}
                <Text style={styles.sectionTitle}>Support</Text>
                <View style={styles.sectionCard}>
                    {supportSettings.map((s, i) => renderSettingRow(s, i))}
                </View>

                {/* Danger Zone */}
                <View style={styles.dangerSection}>
                    <Pressable style={styles.signOutBtn} onPress={handleSignOut}>
                        <MaterialIcons name="logout" size={20} color="#ff4444" />
                        <Text style={styles.signOutText}>Sign Out</Text>
                    </Pressable>

                    <Pressable style={styles.deleteBtn} onPress={handleDeleteAccount}>
                        <MaterialIcons name="delete-forever" size={20} color="#ff6666" />
                        <Text style={styles.deleteText}>Delete Account</Text>
                    </Pressable>
                </View>

                {/* App Info */}
                <View style={styles.appInfo}>
                    <Text style={styles.appInfoText}>BITC v1.0.0</Text>
                    <Text style={styles.appInfoText}>Made with ❤️ for creatives</Text>
                </View>
            </ScrollView>
        </SafeScreen>
    );
}

const styles = StyleSheet.create({
    content: {
        paddingBottom: spacing.xl,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.lg,
    },
    backBtn: {
        paddingVertical: spacing.sm,
        paddingRight: spacing.md,
    },
    headerTitle: {
        color: colors.textPrimary,
        fontFamily: fonts.bold,
        fontSize: fonts.size.title,
    },
    profileCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        marginHorizontal: spacing.lg,
        backgroundColor: colors.surface,
        borderRadius: radii.card,
        borderWidth: 1,
        borderColor: colors.outline,
        padding: spacing.md,
        marginBottom: spacing.lg,
    },
    profileAvatarWrap: {
        width: 52,
        height: 52,
        borderRadius: 26,
        overflow: "hidden",
        borderWidth: 2,
        borderColor: colors.accentYellow,
    },
    profileAvatar: {
        width: "100%",
        height: "100%",
    },
    profileName: {
        color: colors.textPrimary,
        fontFamily: fonts.bold,
        fontSize: fonts.size.lg,
    },
    profileEmail: {
        color: colors.textSecondary,
        fontFamily: fonts.regular,
        fontSize: fonts.size.sm,
        marginTop: 2,
    },
    editProfileBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#2a2200",
        alignItems: "center",
        justifyContent: "center",
    },
    sectionTitle: {
        color: colors.textSecondary,
        fontFamily: fonts.semibold,
        fontSize: fonts.size.xs,
        letterSpacing: 1,
        textTransform: "uppercase",
        marginHorizontal: spacing.lg,
        marginTop: spacing.md,
        marginBottom: spacing.sm,
    },
    sectionCard: {
        marginHorizontal: spacing.lg,
        backgroundColor: colors.surface,
        borderRadius: radii.card,
        borderWidth: 1,
        borderColor: colors.outline,
        overflow: "hidden",
    },
    settingRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        paddingHorizontal: spacing.md,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.outline,
    },
    settingIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    settingContent: {
        flex: 1,
    },
    settingLabel: {
        color: colors.textPrimary,
        fontFamily: fonts.semibold,
        fontSize: fonts.size.md,
    },
    settingSub: {
        color: colors.textSecondary,
        fontFamily: fonts.regular,
        fontSize: fonts.size.xs,
        marginTop: 2,
    },
    dangerSection: {
        marginHorizontal: spacing.lg,
        marginTop: spacing.lg,
        gap: spacing.sm,
    },
    signOutBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.sm,
        backgroundColor: colors.surface,
        borderRadius: radii.card,
        borderWidth: 1,
        borderColor: "#ff444430",
        paddingVertical: 14,
    },
    signOutText: {
        color: "#ff4444",
        fontFamily: fonts.bold,
        fontSize: fonts.size.md,
    },
    deleteBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.sm,
        paddingVertical: 14,
    },
    deleteText: {
        color: "#ff6666",
        fontFamily: fonts.regular,
        fontSize: fonts.size.sm,
    },
    appInfo: {
        alignItems: "center",
        marginTop: spacing.xl,
        paddingBottom: spacing.xl,
        gap: 4,
    },
    appInfoText: {
        color: colors.textSecondary,
        fontFamily: fonts.regular,
        fontSize: fonts.size.xs,
        opacity: 0.6,
    },
});
