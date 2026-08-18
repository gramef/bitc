import SafeScreen from "@/components/SafeScreen";
import { useAuth } from "@/contexts/AuthContext";
import { getSupabase } from "@/lib/supabase";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
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
    const { user, profile, hasRole } = useAuth();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState("");
    const [salary, setSalary] = useState("");
    const [type, setType] = useState<string>(JOB_TYPES[0]);
    const [experience, setExperience] = useState("");
    const [remote, setRemote] = useState(false);
    const [saving, setSaving] = useState(false);

    // Guard: only business/admin can post jobs
    if (!hasRole("business", "admin")) {
        return (
            <SafeScreen>
                <View style={styles.guardWrap}>
                    <MaterialIcons name="lock" size={48} color={colors.textSecondary} />
                    <Text style={styles.guardText}>Only Business accounts can post jobs.</Text>
                    <Pressable style={styles.guardBtn} onPress={() => router.back()}>
                        <Text style={styles.guardBtnText}>Go Back</Text>
                    </Pressable>
                </View>
            </SafeScreen>
        );
    }

    async function handlePost() {
        if (!title.trim()) {
            Alert.alert("Missing Title", "Please enter a job title.");
            return;
        }
        if (!user) return;
        setSaving(true);
        try {
            const sb = getSupabase();
            if (!sb) throw new Error("Service unavailable");
            const { error } = await sb.from("jobs").insert({
                title: title.trim(),
                org: profile?.fullName ?? "Company",
                location: location.trim() || null,
                salary: salary.trim() || null,
                type: type,
                experience: experience.trim() || null,
                remote: remote,
                posted_at: new Date().toISOString(),
                employer_id: user.id,
            });
            if (error) throw error;
            Alert.alert("Job Posted! 🚀", "Your job listing is now live.", [
                { text: "OK", onPress: () => router.back() },
            ]);
        } catch (e: any) {
            Alert.alert("Error", e?.message || "Failed to post job.");
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
                        <Text style={styles.headerTitle}>Post a Job</Text>
                        <View style={{ width: 22 }} />
                    </View>

                    <Text style={styles.label}>Job Title *</Text>
                    <TextInput
                        style={styles.input}
                        value={title}
                        onChangeText={setTitle}
                        placeholder="e.g. Senior UX Designer"
                        placeholderTextColor={colors.textSecondary}
                    />

                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Describe the role, responsibilities, and requirements…"
                        placeholderTextColor={colors.textSecondary}
                        multiline
                        textAlignVertical="top"
                    />

                    <Text style={styles.label}>Job Type</Text>
                    <View style={styles.chipRow}>
                        {JOB_TYPES.map((t) => (
                            <Pressable key={t} style={[styles.chip, type === t && styles.chipActive]} onPress={() => setType(t)}>
                                <Text style={[styles.chipText, type === t && styles.chipTextActive]}>{t}</Text>
                            </Pressable>
                        ))}
                    </View>

                    <Text style={styles.label}>Location</Text>
                    <TextInput
                        style={styles.input}
                        value={location}
                        onChangeText={setLocation}
                        placeholder="e.g. London, UK"
                        placeholderTextColor={colors.textSecondary}
                    />

                    {/* Remote toggle */}
                    <Pressable style={styles.remoteRow} onPress={() => setRemote(!remote)}>
                        <MaterialIcons
                            name={remote ? "check-box" : "check-box-outline-blank"}
                            size={24}
                            color={remote ? colors.accentGreen : colors.textSecondary}
                        />
                        <Text style={styles.remoteText}>This is a remote position</Text>
                    </Pressable>

                    <Text style={styles.label}>Salary (optional)</Text>
                    <TextInput
                        style={styles.input}
                        value={salary}
                        onChangeText={setSalary}
                        placeholder="e.g. £45,000 – £55,000"
                        placeholderTextColor={colors.textSecondary}
                    />

                    <Text style={styles.label}>Experience Level</Text>
                    <TextInput
                        style={styles.input}
                        value={experience}
                        onChangeText={setExperience}
                        placeholder="e.g. 3+ years"
                        placeholderTextColor={colors.textSecondary}
                    />

                    <Pressable
                        style={[styles.postBtn, saving && { opacity: 0.6 }]}
                        onPress={handlePost}
                        disabled={saving}
                    >
                        <MaterialIcons name="work" size={20} color={colors.textDark} />
                        <Text style={styles.postText}>{saving ? "Posting…" : "Post Job"}</Text>
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
    guardWrap: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background, padding: spacing.xl },
    guardText: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.md, textAlign: "center", marginTop: spacing.md },
    guardBtn: { marginTop: spacing.lg, backgroundColor: colors.surface, borderRadius: radii.pill, paddingHorizontal: 24, paddingVertical: 12, borderWidth: 1, borderColor: colors.outline },
    guardBtnText: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.md },
});
