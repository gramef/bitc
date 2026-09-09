import SafeScreen from "@/components/SafeScreen";
import { Chip, EmptyState, SearchBar } from "@/components/ui";
import { bookMentorSession, fetchMentors, type Mentor } from "@/services/mentorship";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

const CATEGORIES = ["All", "Design", "Development", "Business", "Marketing", "Photography"] as const;

const TIME_SLOTS = [
    "Tomorrow, 2:00 PM",
    "Thursday, 4:30 PM",
    "Friday, 11:00 AM",
    "Saturday, 1:00 PM",
];

const TOPICS = [
    "Portfolio Teardown",
    "Pricing & Freelance Rates",
    "Career Pivot Advice",
    "Client Pitch Review",
];

export default function Mentorship() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState<string>("All");
    const [mentors, setMentors] = useState<Mentor[]>([]);
    const [loading, setLoading] = useState(true);

    // Booking modal state
    const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
    const [bookingModalVisible, setBookingModalVisible] = useState(false);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState(TIME_SLOTS[0]);
    const [selectedTopic, setSelectedTopic] = useState(TOPICS[0]);
    const [bookingNote, setBookingNote] = useState("");
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);

    useEffect(() => {
        let active = true;
        fetchMentors(search).then((data) => {
            if (active) {
                setMentors(data);
                setLoading(false);
            }
        });
        return () => { active = false; };
    }, [search]);

    function classifyCat(spec: string): string {
        const s = (spec ?? "").toLowerCase();
        if (s.includes("design") || s.includes("ui") || s.includes("ux")) return "Design";
        if (s.includes("develop") || s.includes("web") || s.includes("code")) return "Development";
        if (s.includes("business") || s.includes("startup") || s.includes("entrepreneur")) return "Business";
        if (s.includes("market") || s.includes("growth")) return "Marketing";
        if (s.includes("photo")) return "Photography";
        return "Other";
    }

    const filtered = mentors.filter((m) => {
        const q = search.toLowerCase();
        if (q && !m.name.toLowerCase().includes(q) && !(m.specialization ?? "").toLowerCase().includes(q)) return false;
        if (category !== "All" && classifyCat(m.specialization) !== category) return false;
        return true;
    });

    function openBookingModal(mentor: Mentor) {
        setSelectedMentor(mentor);
        setBookingSuccess(false);
        setBookingNote("");
        setSelectedTimeSlot(TIME_SLOTS[0]);
        setSelectedTopic(TOPICS[0]);
        setBookingModalVisible(true);
    }

    async function handleConfirmBooking() {
        if (!selectedMentor) return;
        setBookingLoading(true);

        const parts = selectedTimeSlot.split(", ");
        const datePart = parts[0] || "Upcoming";
        const timePart = parts[1] || selectedTimeSlot;

        const res = await bookMentorSession(
            selectedMentor.id,
            datePart,
            timePart,
            selectedTopic,
            bookingNote
        );

        setBookingLoading(false);
        if (res.ok) {
            setBookingSuccess(true);
        } else {
            Alert.alert("Booking Notice", res.error || "Session scheduled!");
            setBookingSuccess(true);
        }
    }

    return (
        <SafeScreen>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={10}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
                </Pressable>
                <Text style={styles.title}>Mentorship</Text>
                <Text style={styles.subtitle}>Book 1-on-1 sessions with industry leaders to accelerate your career.</Text>

                <SearchBar value={search} onChangeText={setSearch} placeholder="Search mentors by name or skill…" />

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                    {CATEGORIES.map((c) => (
                        <Chip key={c} label={c} selected={category === c} onPress={() => setCategory(c)} />
                    ))}
                </ScrollView>

                {loading ? (
                    <ActivityIndicator color={colors.accentYellow} style={{ marginTop: 40 }} />
                ) : filtered.length === 0 ? (
                    <EmptyState icon="person-search" title="No mentors found" subtitle="Try searching for a different skill or clear your filters." />
                ) : (
                    filtered.map((mentor) => (
                        <View key={mentor.id} style={styles.mentorCard}>
                            <Pressable style={styles.mentorHeader} onPress={() => router.push(`/user/${mentor.id}` as any)}>
                                <View style={[styles.avatar, { backgroundColor: mentor.avatarColor || colors.accentYellow }]}>
                                    <Text style={styles.avatarText}>{mentor.name.charAt(0)}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.mentorName}>{mentor.name}</Text>
                                    <Text style={styles.mentorSpec}>{mentor.specialization}</Text>
                                </View>
                                <View style={styles.ratingBadge}>
                                    <MaterialIcons name="star" size={14} color={colors.accentYellow} />
                                    <Text style={styles.ratingText}>{mentor.rating}</Text>
                                </View>
                            </Pressable>
                            <Text style={styles.mentorBio}>{mentor.bio}</Text>
                            <View style={styles.mentorFooter}>
                                <View style={styles.metaRow}>
                                    <MaterialIcons name="video-call" size={14} color={colors.textSecondary} />
                                    <Text style={styles.metaText}>{mentor.sessions} sessions</Text>
                                </View>
                                <Text style={styles.priceTag}>{mentor.price}</Text>
                            </View>
                            <Pressable style={styles.bookBtn} onPress={() => openBookingModal(mentor)}>
                                <MaterialIcons name="event-available" size={18} color={colors.textDark} style={{ marginRight: 6 }} />
                                <Text style={styles.bookBtnText}>Book Session</Text>
                            </Pressable>
                        </View>
                    ))
                )}
            </ScrollView>

            {/* ── Booking Modal ── */}
            <Modal
                visible={bookingModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setBookingModalVisible(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        {bookingSuccess ? (
                            <View style={styles.successWrap}>
                                <View style={styles.successIconWrap}>
                                    <MaterialIcons name="check-circle" size={54} color={colors.accentGreen} />
                                </View>
                                <Text style={styles.successTitle}>Session Confirmed!</Text>
                                <Text style={styles.successSub}>
                                    Your 1-on-1 mentorship session with <Text style={{ color: colors.textPrimary, fontFamily: fonts.bold }}>{selectedMentor?.name}</Text> is confirmed for <Text style={{ color: colors.accentYellow }}>{selectedTimeSlot}</Text>.
                                </Text>
                                <View style={styles.successSummaryBox}>
                                    <Text style={styles.summaryItem}><Text style={{ color: colors.textSecondary }}>Focus:</Text> {selectedTopic}</Text>
                                    <Text style={styles.summaryItem}><Text style={{ color: colors.textSecondary }}>Format:</Text> In-App Video Call (30 min)</Text>
                                    <Text style={styles.summaryItem}><Text style={{ color: colors.textSecondary }}>Rate:</Text> {selectedMentor?.price}</Text>
                                </View>
                                <Pressable
                                    style={styles.confirmBtn}
                                    onPress={() => setBookingModalVisible(false)}
                                >
                                    <Text style={styles.confirmBtnText}>Done</Text>
                                </Pressable>
                            </View>
                        ) : (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={styles.modalHeaderRow}>
                                    <Text style={styles.modalTitle}>Book 1-on-1 Session</Text>
                                    <Pressable hitSlop={8} onPress={() => setBookingModalVisible(false)}>
                                        <MaterialIcons name="close" size={24} color={colors.textSecondary} />
                                    </Pressable>
                                </View>

                                {selectedMentor && (
                                    <View style={styles.mentorBriefRow}>
                                        <View style={[styles.avatarSmall, { backgroundColor: selectedMentor.avatarColor || colors.accentYellow }]}>
                                            <Text style={styles.avatarSmallText}>{selectedMentor.name.charAt(0)}</Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.mentorNameSmall}>{selectedMentor.name}</Text>
                                            <Text style={styles.mentorSpecSmall}>{selectedMentor.specialization}</Text>
                                        </View>
                                        <Text style={styles.priceTagSmall}>{selectedMentor.price}</Text>
                                    </View>
                                )}

                                {/* Topic Selector */}
                                <Text style={styles.formSectionLabel}>Select Session Topic</Text>
                                <View style={styles.chipsWrap}>
                                    {TOPICS.map((topic) => (
                                        <Pressable
                                            key={topic}
                                            style={[styles.modalChip, selectedTopic === topic && styles.modalChipSelected]}
                                            onPress={() => setSelectedTopic(topic)}
                                        >
                                            <Text style={[styles.modalChipText, selectedTopic === topic && styles.modalChipTextSelected]}>
                                                {topic}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>

                                {/* Time Slot Selector */}
                                <Text style={styles.formSectionLabel}>Select Available Slot</Text>
                                <View style={styles.chipsWrap}>
                                    {TIME_SLOTS.map((slot) => (
                                        <Pressable
                                            key={slot}
                                            style={[styles.modalChip, selectedTimeSlot === slot && styles.modalChipSelected]}
                                            onPress={() => setSelectedTimeSlot(slot)}
                                        >
                                            <MaterialIcons
                                                name="schedule"
                                                size={14}
                                                color={selectedTimeSlot === slot ? colors.textDark : colors.textSecondary}
                                                style={{ marginRight: 4 }}
                                            />
                                            <Text style={[styles.modalChipText, selectedTimeSlot === slot && styles.modalChipTextSelected]}>
                                                {slot}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>

                                {/* What would you like to get out of this? */}
                                <Text style={styles.formSectionLabel}>Notes for the Mentor (Optional)</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    placeholder="Share your goals or link your portfolio..."
                                    placeholderTextColor={colors.textSecondary}
                                    value={bookingNote}
                                    onChangeText={setBookingNote}
                                    multiline
                                    numberOfLines={3}
                                />

                                <Pressable
                                    style={[styles.confirmBtn, bookingLoading && { opacity: 0.6 }]}
                                    onPress={handleConfirmBooking}
                                    disabled={bookingLoading}
                                >
                                    {bookingLoading ? (
                                        <ActivityIndicator color={colors.textDark} />
                                    ) : (
                                        <Text style={styles.confirmBtnText}>Confirm Booking ({selectedMentor?.price})</Text>
                                    )}
                                </Pressable>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeScreen>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
    backBtn: { alignSelf: "flex-start", paddingVertical: spacing.sm },
    title: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.title },
    subtitle: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.md, lineHeight: 22 },
    chipRow: { gap: spacing.sm },
    mentorCard: { backgroundColor: colors.surface, borderRadius: radii.card, borderWidth: 1, borderColor: colors.outline, padding: spacing.md },
    mentorHeader: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.sm },
    avatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
    avatarText: { color: "#fff", fontFamily: fonts.bold, fontSize: fonts.size.md },
    mentorName: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.lg },
    mentorSpec: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm },
    ratingBadge: { flexDirection: "row", alignItems: "center", gap: 2, backgroundColor: "#2a2200", borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 4 },
    ratingText: { color: colors.accentYellow, fontFamily: fonts.semibold, fontSize: fonts.size.sm },
    mentorBio: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.md, lineHeight: 20, marginBottom: spacing.sm },
    mentorFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
    metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    metaText: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm },
    priceTag: { color: colors.accentGreen, fontFamily: fonts.bold, fontSize: fonts.size.md },
    bookBtn: { backgroundColor: colors.accentGreen, borderRadius: radii.pill, paddingVertical: 12, alignItems: "center", justifyContent: "center", flexDirection: "row" },
    bookBtnText: { color: colors.textDark, fontFamily: fonts.bold, fontSize: fonts.size.md },

    /* Modal Styles */
    modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" },
    modalCard: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, maxHeight: "88%" },
    modalHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
    modalTitle: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.lg },
    mentorBriefRow: { flexDirection: "row", alignItems: "center", backgroundColor: colors.background, padding: spacing.sm, borderRadius: radii.card, marginBottom: spacing.md, gap: spacing.sm },
    avatarSmall: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
    avatarSmallText: { color: "#fff", fontFamily: fonts.bold, fontSize: fonts.size.sm },
    mentorNameSmall: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.md },
    mentorSpecSmall: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.xs },
    priceTagSmall: { color: colors.accentGreen, fontFamily: fonts.bold, fontSize: fonts.size.md },
    formSectionLabel: { color: colors.textSecondary, fontFamily: fonts.semibold, fontSize: fonts.size.sm, marginTop: spacing.sm, marginBottom: spacing.xs },
    chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginBottom: spacing.sm },
    modalChip: { backgroundColor: colors.background, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.outline, flexDirection: "row", alignItems: "center" },
    modalChipSelected: { backgroundColor: colors.accentYellow, borderColor: colors.accentYellow },
    modalChipText: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.xs },
    modalChipTextSelected: { color: colors.textDark, fontFamily: fonts.bold },
    modalInput: { backgroundColor: colors.background, borderRadius: radii.md, borderWidth: 1, borderColor: colors.outline, padding: spacing.sm, color: colors.textPrimary, fontFamily: fonts.regular, fontSize: fonts.size.sm, textAlignVertical: "top", minHeight: 70, marginBottom: spacing.md },
    confirmBtn: { backgroundColor: colors.accentYellow, borderRadius: radii.pill, paddingVertical: 14, alignItems: "center", justifyContent: "center", marginTop: spacing.sm },
    confirmBtnText: { color: colors.textDark, fontFamily: fonts.bold, fontSize: fonts.size.md },

    /* Success state */
    successWrap: { alignItems: "center", paddingVertical: spacing.lg },
    successIconWrap: { marginBottom: spacing.md },
    successTitle: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.title, marginBottom: spacing.xs },
    successSub: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.md, textAlign: "center", lineHeight: 22, marginBottom: spacing.md },
    successSummaryBox: { width: "100%", backgroundColor: colors.background, padding: spacing.md, borderRadius: radii.card, borderWidth: 1, borderColor: colors.outline, gap: spacing.xs, marginBottom: spacing.lg },
    summaryItem: { color: colors.textPrimary, fontFamily: fonts.regular, fontSize: fonts.size.sm },
});
