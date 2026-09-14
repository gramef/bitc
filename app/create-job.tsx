import SafeScreen from "@/components/SafeScreen";
import { useAuth } from "@/contexts/AuthContext";
import { createJob } from "@/services/jobs";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Freelance"] as const;

export default function CreateJob() {
    const router = useRouter();
    const { user, profile, hasRole, loading: authLoading } = useAuth();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState("");
    const [salary, setSalary] = useState("");
    const [type, setType] = useState<string>(JOB_TYPES[0]);
    const [experience, setExperience] = useState("");
    const [remote, setRemote] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Auth loading state
    if (authLoading) {
        return (
            <SafeScreen>
                <View style={styles.guardWrap}>
                    <ActivityIndicator size="large" color={colors.accentGreen} />
                    <Text style={[styles.guardText, { marginTop: spacing.md }]}>Verifying business account…</Text>
                </View>
            </SafeScreen>
        );
    }

    // Guard: only business/admin can post jobs
    if (!hasRole("business", "admin") && profile?.role !== "business" && profile?.role !== "admin") {
        return (
            <SafeScreen>
                <View style={styles.guardWrap}>
                    <MaterialIcons name="lock" size={48} color={colors.textSecondary} />
                    <Text style={styles.guardText}>Only Business & Studio accounts can post jobs.</Text>
                    <Pressable style={styles.guardBtn} onPress={() => router.back()}>
                        <Text style={styles.guardBtnText}>Go Back</Text>
                    </Pressable>
                </View>
            </SafeScreen>
        );
    }

    async function handlePost() {
        setError(null);
        if (!title.trim()) {
            setError("Please enter a job title.");
            return;
        }
        if (!user) {
            setError("Please sign in to post a job.");
            return;
        }

        setSaving(true);
        try {
            const res = await createJob({
                title: title.trim(),
                org: profile?.fullName || "Company",
                description: description.trim() || undefined,
                location: location.trim() || undefined,
                salary: salary.trim() || undefined,
                type: type,
                experience: experience.trim() || undefined,
                remote: remote,
            });

            if (!res.ok) {
                setError(res.error || "Failed to post job. Please try again.");
                setSaving(false);
                return;
            }

            setSuccess(true);
            setTimeout(() => {
                router.replace("/(tabs)/jobs" as any);
            }, 1200);
        } catch (e: any) {
            setError(e?.message || "An unexpected error occurred while posting the job.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <SafeScreen>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={0}>
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    <View style={styles.header}>
                        <Pressable onPress={() => router.back()} hitSlop={8}>
                            <MaterialIcons name="arrow-back" size={22} color="#fff" />
                        </Pressable>
                        <Text style={styles.headerTitle}>Post an Opportunity</Text>
                        <View style={{ width: 22 }} />
                    </View>

                    {/* Feedback Banners */}
                    {error ? (
                        <View style={styles.alertBoxError}>
                            <MaterialIcons name="error-outline" size={18} color="#ff6b6b" />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    {success ? (
                        <View style={styles.alertBoxSuccess}>
                            <MaterialIcons name="check-circle" size={24} color="#00B894" />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.successTitle}>Job Posted Successfully! 🚀</Text>
                                <Text style={styles.successSub}>"{title}" is now live on the BITC platform. Redirecting…</Text>
                            </View>
                        </View>
                    ) : null}

                    <Text style={styles.label}>Job Title *</Text>
                    <TextInput
                        style={styles.input}
                        value={title}
                        onChangeText={(t) => { setTitle(t); if (error) setError(null); }}
                        placeholder="e.g. Senior UX Designer"
                        placeholderTextColor={colors.textSecondary}
                        editable={!saving && !success}
                    />

                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Describe the role, responsibilities, culture, and candidate requirements…"
                        placeholderTextColor={colors.textSecondary}
                        multiline
                        textAlignVertical="top"
                        editable={!saving && !success}
                    />

                    <Text style={styles.label}>Job Type</Text>
                    <View style={styles.chipRow}>
                        {JOB_TYPES.map((t) => (
                            <Pressable
                                key={t}
                                style={[styles.chip, type === t && styles.chipActive]}
                                onPress={() => setType(t)}
                                disabled={saving || success}
                            >
                                <Text style={[styles.chipText, type === t && styles.chipTextActive]}>{t}</Text>
                            </Pressable>
                        ))}
                    </View>

                    <Text style={styles.label}>Location / City</Text>
                    <TextInput
                        style={styles.input}
                        value={location}
                        onChangeText={setLocation}
                        placeholder="e.g. London, UK or Birmingham"
                        placeholderTextColor={colors.textSecondary}
                        editable={!saving && !success}
                    />

                    {/* Remote toggle */}
                    <Pressable
                        style={styles.remoteRow}
                        onPress={() => setRemote(!remote)}
                        disabled={saving || success}
                    >
                        <MaterialIcons
                            name={remote ? "check-box" : "check-box-outline-blank"}
                            size={24}
                            color={remote ? colors.accentGreen : colors.textSecondary}
                        />
                        <Text style={styles.remoteText}>This is a remote position</Text>
                    </Pressable>

                    <Text style={styles.label}>Salary / Compensation (optional)</Text>
                    <TextInput
                        style={styles.input}
                        value={salary}
                        onChangeText={setSalary}
                        placeholder="e.g. £45,000 – £55,000 or £350/day"
                        placeholderTextColor={colors.textSecondary}
                        editable={!saving && !success}
                    />

                    <Text style={styles.label}>Experience Level</Text>
                    <TextInput
                        style={styles.input}
                        value={experience}
                        onChangeText={setExperience}
                        placeholder="e.g. 3+ years, Mid-Senior"
                        placeholderTextColor={colors.textSecondary}
                        editable={!saving && !success}
                    />

                    <Pressable
                        style={[
                            styles.postBtn,
                            saving && { opacity: 0.7 },
                            success && { backgroundColor: "#00B894" },
                        ]}
                        onPress={handlePost}
                        disabled={saving || success}
                    >
                        {saving ? (
                            <ActivityIndicator size="small" color={colors.textDark} />
                        ) : success ? (
                            <MaterialIcons name="check-circle" size={20} color={colors.textDark} />
                        ) : (
                            <MaterialIcons name="work" size={20} color={colors.textDark} />
                        )}
                        <Text style={styles.postText}>
                            {saving ? "Posting Opportunity…" : success ? "Opportunity Posted!" : "Post Job"}
                        </Text>
                    </Pressable>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeScreen>
    );
}

const styles = StyleSheet.create({
    content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xl },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.lg },
    headerTitle: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.xl },
    label: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.md, marginTop: spacing.md, marginBottom: spacing.xs },
    input: {
        backgroundColor: colors.surface,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: colors.outline,
        padding: spacing.md,
        color: colors.textPrimary,
        fontFamily: fonts.regular,
        fontSize: fonts.size.md,
    },
    textArea: { minHeight: 120, lineHeight: 22 },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
    chip: { borderRadius: radii.pill, borderWidth: 1, borderColor: colors.outline, paddingVertical: 8, paddingHorizontal: spacing.md, backgroundColor: colors.surface },
    chipActive: { borderColor: colors.accentGreen, backgroundColor: "#1a2e24" },
    chipText: { color: colors.textSecondary, fontFamily: fonts.semibold, fontSize: fonts.size.sm },
    chipTextActive: { color: colors.accentGreen },
    remoteRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.md },
    remoteText: { color: colors.textPrimary, fontFamily: fonts.regular, fontSize: fonts.size.md },
    postBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: colors.accentGreen,
        borderRadius: radii.pill,
        paddingVertical: 16,
        marginTop: spacing.xl,
    },
    postText: { color: colors.textDark, fontFamily: fonts.bold, fontSize: fonts.size.lg },
    alertBoxError: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: "#351515",
        borderWidth: 1,
        borderColor: "#ff6b6b50",
        borderRadius: radii.card,
        paddingHorizontal: spacing.md,
        paddingVertical: 12,
        marginBottom: spacing.md,
        width: "100%",
    },
    errorText: {
        color: "#ff6b6b",
        fontFamily: fonts.semibold,
        fontSize: fonts.size.sm,
        flex: 1,
    },
    alertBoxSuccess: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: "#0F281E",
        borderWidth: 1,
        borderColor: "#00B89460",
        borderRadius: radii.card,
        paddingHorizontal: spacing.md,
        paddingVertical: 14,
        marginBottom: spacing.md,
        width: "100%",
    },
    successTitle: {
        color: "#00B894",
        fontFamily: fonts.bold,
        fontSize: fonts.size.md,
    },
    successSub: {
        color: colors.textSecondary,
        fontFamily: fonts.regular,
        fontSize: fonts.size.xs,
        marginTop: 2,
    },
    guardWrap: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background, padding: spacing.xl },
    guardText: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.md, textAlign: "center", marginTop: spacing.md },
    guardBtn: { marginTop: spacing.lg, backgroundColor: colors.surface, borderRadius: radii.pill, paddingHorizontal: 24, paddingVertical: 12, borderWidth: 1, borderColor: colors.outline },
    guardBtnText: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.md },
});
