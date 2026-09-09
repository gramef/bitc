import SafeScreen from "@/components/SafeScreen";
import { useAuth } from "@/contexts/AuthContext";
import { getSupabase, getSupabaseUrl } from "@/lib/supabase";
import { getRoleBadge, hasPermission } from "@/services/permissions";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
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

export default function CreateEvent() {
    const router = useRouter();
    const { user, profile } = useAuth();
    const role = profile?.role ?? "user";
    const badge = getRoleBadge(role);
    const canCreate = hasPermission(role, "canCreateEvent");

    const [title, setTitle] = useState("");
    const [eventType, setEventType] = useState(
        role === "creative" ? "Community Meetup" : "Branded Event"
    );
    const [description, setDescription] = useState("");
    const [org, setOrg] = useState(profile?.fullName ?? "");
    const [city, setCity] = useState("");

    // Date & Time
    const [eventDate, setEventDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    // Image
    const [imageUri, setImageUri] = useState<string | null>(null);

    const [saving, setSaving] = useState(false);

    // Guard: Attendees can switch persona to host events
    if (!canCreate) {
        return (
            <SafeScreen>
                <View style={styles.guardWrap}>
                    <View style={styles.guardIconRing}>
                        <MaterialIcons name="event-available" size={42} color={colors.accentYellow} />
                    </View>
                    <Text style={styles.guardTitle}>Host Events on BITC</Text>
                    <Text style={styles.guardText}>
                        Event hosting is available for Creatives, Studios, and Business accounts. Switch your account persona to start hosting community meetups or branded summits.
                    </Text>
                    <Pressable
                        style={styles.guardBtn}
                        onPress={() => router.push("/onboarding/identity" as any)}
                    >
                        <Text style={styles.guardBtnText}>Switch Account Persona</Text>
                    </Pressable>
                    <Pressable style={styles.guardBackBtn} onPress={() => router.back()}>
                        <Text style={styles.guardBackBtnText}>Go Back</Text>
                    </Pressable>
                </View>
            </SafeScreen>
        );
    }

    async function pickImage() {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
            Alert.alert("Permission Required", "Please allow access to your photo library.");
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            quality: 0.8,
            allowsEditing: true,
            aspect: [16, 9],
            mediaTypes: ["images"] as any,
        });
        if (!result.canceled && result.assets?.[0]?.uri) {
            setImageUri(result.assets[0].uri);
        }
    }

    async function uploadImage(uri: string): Promise<string | null> {
        const sb = getSupabase();
        const baseUrl = getSupabaseUrl();
        if (!sb || !baseUrl || !user) return null;
        const { data: sessionRes } = await sb.auth.getSession();
        const token = sessionRes?.session?.access_token;
        if (!token) return null;
        const ext = uri.split(".").pop()?.toLowerCase().split("?")[0] ?? "jpg";
        const fileName = `event_${Date.now()}.${ext}`;
        const path = `events/${fileName}`;
        const form = new FormData();
        form.append("file", { uri, name: fileName, type: `image/${ext}` } as any);
        const res = await fetch(`${baseUrl}/storage/v1/object/avatars/${path}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "x-upsert": "true" },
            body: form,
        });
        if (!res.ok) return null;
        const pub = sb.storage.from("avatars").getPublicUrl(path);
        return pub.data.publicUrl ?? null;
    }

    function formatDate(d: Date) {
        return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
    }

    function formatTime(d: Date) {
        return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    }

    function toISODate(d: Date) {
        return d.toISOString().split("T")[0];
    }

    async function handlePublish() {
        if (!title.trim()) {
            Alert.alert("Missing Title", "Please enter an event title.");
            return;
        }
        if (!user) return;
        setSaving(true);
        try {
            const sb = getSupabase();
            if (!sb) throw new Error("Service unavailable");

            let imageUrl: string | null = null;
            if (imageUri) {
                imageUrl = await uploadImage(imageUri);
            }

            const { error } = await sb.from("events").insert({
                title: title.trim(),
                org: org.trim() || profile?.fullName || null,
                city: city.trim() || null,
                event_date: toISODate(eventDate),
                image_url: imageUrl,
            });
            if (error) throw error;
            Alert.alert("Event Published! 🎉", "Your event is now live.", [
                { text: "OK", onPress: () => router.back() },
            ]);
        } catch (e: any) {
            Alert.alert("Error", e?.message || "Failed to create event.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <SafeScreen>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    {/* Header */}
                    <View style={styles.header}>
                        <Pressable onPress={() => router.back()} hitSlop={8}>
                            <MaterialIcons name="arrow-back" size={22} color="#fff" />
                        </Pressable>
                        <Text style={styles.headerTitle}>Create Event</Text>
                        <View style={{ width: 22 }} />
                    </View>

                    {/* Cover Image Picker */}
                    <Pressable style={styles.imagePicker} onPress={pickImage}>
                        {imageUri ? (
                            <Image source={{ uri: imageUri }} style={styles.imagePreview} contentFit="cover" />
                        ) : (
                            <View style={styles.imagePlaceholder}>
                                <MaterialIcons name="add-photo-alternate" size={40} color={colors.textSecondary} />
                                <Text style={styles.imagePlaceholderText}>Tap to add cover image</Text>
                            </View>
                        )}
                        {imageUri && (
                            <View style={styles.imageEditBadge}>
                                <MaterialIcons name="edit" size={16} color={colors.textDark} />
                            </View>
                        )}
                    </Pressable>

                    {/* Host Persona Indicator */}
                    <View style={[styles.hostBadgeCard, { borderColor: badge.color + "40" }]}>
                        <View style={[styles.hostBadgeIcon, { backgroundColor: badge.bgColor }]}>
                            <MaterialIcons name={badge.icon as any} size={18} color={badge.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.hostBadgeTitle, { color: badge.color }]}>
                                {role === "creative" ? "Creative Community Host" : "Official Business Host"}
                            </Text>
                            <Text style={styles.hostBadgeSub}>
                                {role === "creative"
                                    ? "Hosting as a creator: Community meetups, portfolio jams & workshops."
                                    : "Hosting as an organization: Branded summits, panels & ticketed experiences."}
                            </Text>
                        </View>
                    </View>

                    {/* Event Format Selector */}
                    <Text style={styles.label}>Event Format</Text>
                    <View style={styles.formatRow}>
                        {(role === "creative"
                            ? ["Community Meetup", "Portfolio Jam", "Design Workshop", "Live Demo", "Brunch & Chat"]
                            : ["Official Summit", "Industry Panel", "Exclusive Mixer", "Product Demo Day"]
                        ).map((fmt) => {
                            const isSel = eventType === fmt;
                            return (
                                <Pressable
                                    key={fmt}
                                    style={[styles.formatChip, isSel && styles.formatChipActive]}
                                    onPress={() => setEventType(fmt)}
                                >
                                    <Text style={[styles.formatChipText, isSel && styles.formatChipTextActive]}>
                                        {fmt}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>

                    {/* Title */}
                    <Text style={styles.label}>Event Title *</Text>
                    <TextInput
                        style={styles.input}
                        value={title}
                        onChangeText={setTitle}
                        placeholder={role === "creative" ? "e.g. Saturday Portfolio Walkthrough & Coffee" : "e.g. Brunch in the City Vol. 5"}
                        placeholderTextColor={colors.textSecondary}
                    />

                    {/* Description */}
                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Describe your event…"
                        placeholderTextColor={colors.textSecondary}
                        multiline
                        textAlignVertical="top"
                    />

                    {/* Organiser */}
                    <Text style={styles.label}>Organiser</Text>
                    <TextInput
                        style={styles.input}
                        value={org}
                        onChangeText={setOrg}
                        placeholder="e.g. BITC Events"
                        placeholderTextColor={colors.textSecondary}
                    />

                    {/* City */}
                    <Text style={styles.label}>City</Text>
                    <TextInput
                        style={styles.input}
                        value={city}
                        onChangeText={setCity}
                        placeholder="e.g. Leeds, UK"
                        placeholderTextColor={colors.textSecondary}
                    />

                    {/* Date Picker */}
                    <Text style={styles.label}>Date</Text>
                    <Pressable style={styles.pickerBtn} onPress={() => setShowDatePicker(true)}>
                        <MaterialIcons name="calendar-today" size={20} color={colors.accentYellow} />
                        <Text style={styles.pickerText}>{formatDate(eventDate)}</Text>
                        <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
                    </Pressable>
                    {showDatePicker && (
                        <DateTimePicker
                            value={eventDate}
                            mode="date"
                            display="spinner"
                            minimumDate={new Date()}
                            themeVariant="dark"
                            onChange={(_e, date) => {
                                setShowDatePicker(Platform.OS === "android" ? false : true);
                                if (date) setEventDate(date);
                            }}
                        />
                    )}
                    {showDatePicker && Platform.OS === "ios" && (
                        <Pressable style={styles.pickerDone} onPress={() => setShowDatePicker(false)}>
                            <Text style={styles.pickerDoneText}>Done</Text>
                        </Pressable>
                    )}

                    {/* Time Picker */}
                    <Text style={styles.label}>Time</Text>
                    <Pressable style={styles.pickerBtn} onPress={() => setShowTimePicker(true)}>
                        <MaterialIcons name="access-time" size={20} color={colors.accentYellow} />
                        <Text style={styles.pickerText}>{formatTime(eventDate)}</Text>
                        <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
                    </Pressable>
                    {showTimePicker && (
                        <DateTimePicker
                            value={eventDate}
                            mode="time"
                            display="spinner"
                            themeVariant="dark"
                            onChange={(_e, date) => {
                                setShowTimePicker(Platform.OS === "android" ? false : true);
                                if (date) setEventDate(date);
                            }}
                        />
                    )}
                    {showTimePicker && Platform.OS === "ios" && (
                        <Pressable style={styles.pickerDone} onPress={() => setShowTimePicker(false)}>
                            <Text style={styles.pickerDoneText}>Done</Text>
                        </Pressable>
                    )}

                    {/* Publish */}
                    <Pressable
                        style={[styles.publishBtn, saving && { opacity: 0.6 }]}
                        onPress={handlePublish}
                        disabled={saving}
                    >
                        <MaterialIcons name="publish" size={20} color={colors.textDark} />
                        <Text style={styles.publishText}>{saving ? "Publishing…" : "Publish Event"}</Text>
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
    imagePicker: {
        width: "100%",
        height: 180,
        borderRadius: radii.card,
        overflow: "hidden",
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.outline,
        borderStyle: "dashed",
        marginBottom: spacing.md,
    },
    imagePreview: { width: "100%", height: "100%" },
    imagePlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
    imagePlaceholderText: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm },
    imageEditBadge: {
        position: "absolute",
        top: 10,
        right: 10,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.accentYellow,
        alignItems: "center",
        justifyContent: "center",
    },
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
    textArea: { minHeight: 100, lineHeight: 22 },
    pickerBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        backgroundColor: colors.surface,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: colors.outline,
        padding: spacing.md,
    },
    pickerText: { flex: 1, color: colors.textPrimary, fontFamily: fonts.regular, fontSize: fonts.size.md },
    pickerDone: { alignSelf: "flex-end", paddingVertical: 8, paddingHorizontal: spacing.md },
    pickerDoneText: { color: colors.accentYellow, fontFamily: fonts.bold, fontSize: fonts.size.md },
    publishBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: colors.accentYellow,
        borderRadius: radii.pill,
        paddingVertical: 16,
        marginTop: spacing.xl,
    },
    publishText: { color: colors.textDark, fontFamily: fonts.bold, fontSize: fonts.size.lg },
    hostBadgeCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        backgroundColor: colors.surface,
        borderRadius: radii.card,
        borderWidth: 1,
        padding: spacing.md,
        marginBottom: spacing.xs,
    },
    hostBadgeIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
    },
    hostBadgeTitle: {
        fontFamily: fonts.bold,
        fontSize: 14,
    },
    hostBadgeSub: {
        color: colors.textSecondary,
        fontFamily: fonts.regular,
        fontSize: 12,
        lineHeight: 16,
        marginTop: 2,
    },
    formatRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 2,
    },
    formatChip: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.outline,
        borderRadius: radii.pill,
        paddingHorizontal: 12,
        paddingVertical: 7,
    },
    formatChipActive: {
        borderColor: colors.accentYellow,
        backgroundColor: "#201E15",
    },
    formatChipText: {
        color: colors.textSecondary,
        fontFamily: fonts.regular,
        fontSize: 12,
    },
    formatChipTextActive: {
        color: colors.accentYellow,
        fontFamily: fonts.semibold,
    },
    guardWrap: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background, padding: spacing.xl },
    guardIconRing: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: "#EAD05415",
        borderWidth: 1.5,
        borderColor: colors.accentYellow,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: spacing.md,
    },
    guardTitle: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: 20, textAlign: "center", marginBottom: 6 },
    guardText: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm, textAlign: "center", lineHeight: 20 },
    guardBtn: { marginTop: spacing.lg, backgroundColor: colors.accentYellow, borderRadius: radii.pill, paddingHorizontal: 24, paddingVertical: 14, width: "100%", alignItems: "center" },
    guardBtnText: { color: colors.textDark, fontFamily: fonts.bold, fontSize: fonts.size.md },
    guardBackBtn: { marginTop: spacing.md, paddingVertical: 8 },
    guardBackBtnText: { color: colors.textSecondary, fontFamily: fonts.semibold, fontSize: fonts.size.sm },
});
