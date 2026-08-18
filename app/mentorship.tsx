import SafeScreen from "@/components/SafeScreen";
import { Chip, EmptyState, SearchBar } from "@/components/ui";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

type Mentor = {
    id: string;
    name: string;
    specialization: string;
    bio: string;
    rating: number;
    sessions: number;
    price: string;
    avatarColor: string;
};

const CATEGORIES = ["All", "Design", "Development", "Business", "Marketing", "Photography"] as const;

const MENTORS: Mentor[] = [
    { id: "m1", name: "Sarah Chen", specialization: "UI/UX Design", bio: "10+ years designing products at top tech companies. Passionate about mentoring the next generation.", rating: 4.9, sessions: 234, price: "Free", avatarColor: "#6C5CE7" },
    { id: "m2", name: "James Okonkwo", specialization: "Brand Strategy", bio: "Former creative director at global agencies. Helping creatives build brands that stand out.", rating: 4.8, sessions: 189, price: "Free", avatarColor: "#00B894" },
    { id: "m3", name: "Priya Sharma", specialization: "Web Development", bio: "Full-stack developer and open source contributor. Teaching practical, career-ready skills.", rating: 4.7, sessions: 156, price: "Free", avatarColor: "#E17055" },
    { id: "m4", name: "David Miller", specialization: "Photography", bio: "Award-winning photographer with 15 years of experience. Specializing in portrait and commercial work.", rating: 4.9, sessions: 312, price: "Free", avatarColor: "#0984E3" },
    { id: "m5", name: "Amina Diallo", specialization: "Marketing", bio: "Growth marketing expert helping creatives build audiences and monetize their work.", rating: 4.6, sessions: 98, price: "Free", avatarColor: "#FDCB6E" },
    { id: "m6", name: "Marcus Williams", specialization: "Business", bio: "Serial entrepreneur and startup advisor. Helping creatives turn passion into profitable businesses.", rating: 4.8, sessions: 267, price: "Free", avatarColor: "#A29BFE" },
];

export default function Mentorship() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState<string>("All");

    function classifyCat(spec: string): string {
        const s = spec.toLowerCase();
        if (s.includes("design") || s.includes("ui") || s.includes("ux")) return "Design";
        if (s.includes("develop") || s.includes("web") || s.includes("code")) return "Development";
        if (s.includes("business") || s.includes("startup") || s.includes("entrepreneur")) return "Business";
        if (s.includes("market") || s.includes("growth")) return "Marketing";
        if (s.includes("photo")) return "Photography";
        return "Other";
    }

    const filtered = MENTORS.filter((m) => {
        const q = search.toLowerCase();
        if (q && !m.name.toLowerCase().includes(q) && !m.specialization.toLowerCase().includes(q)) return false;
        if (category !== "All" && classifyCat(m.specialization) !== category) return false;
        return true;
    });

    return (
        <SafeScreen>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={10}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
                </Pressable>
                <Text style={styles.title}>Mentorship</Text>
                <Text style={styles.subtitle}>Connect with experienced professionals who can guide your creative journey.</Text>

                <SearchBar value={search} onChangeText={setSearch} placeholder="Search mentors…" />

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                    {CATEGORIES.map((c) => (
                        <Chip key={c} label={c} selected={category === c} onPress={() => setCategory(c)} />
                    ))}
                </ScrollView>

                {filtered.length === 0 ? (
                    <EmptyState icon="person-search" title="No mentors found" subtitle="Try a different search or category" />
                ) : (
                    filtered.map((mentor) => (
                        <View key={mentor.id} style={styles.mentorCard}>
                            <View style={styles.mentorHeader}>
                                <View style={[styles.avatar, { backgroundColor: mentor.avatarColor }]}>
                                    <Text style={styles.avatarText}>{mentor.name.split(" ").map(n => n[0]).join("")}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.mentorName}>{mentor.name}</Text>
                                    <Text style={styles.mentorSpec}>{mentor.specialization}</Text>
                                </View>
                                <View style={styles.ratingBadge}>
                                    <MaterialIcons name="star" size={14} color={colors.accentYellow} />
                                    <Text style={styles.ratingText}>{mentor.rating}</Text>
                                </View>
                            </View>
                            <Text style={styles.mentorBio}>{mentor.bio}</Text>
                            <View style={styles.mentorFooter}>
                                <View style={styles.metaRow}>
                                    <MaterialIcons name="video-call" size={14} color={colors.textSecondary} />
                                    <Text style={styles.metaText}>{mentor.sessions} sessions</Text>
                                </View>
                                <Text style={styles.priceTag}>{mentor.price}</Text>
                            </View>
                            <Pressable style={styles.bookBtn}>
                                <Text style={styles.bookBtnText}>Book Session</Text>
                            </Pressable>
                        </View>
                    ))
                )}
            </ScrollView>
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
    bookBtn: { backgroundColor: colors.accentGreen, borderRadius: radii.pill, paddingVertical: 12, alignItems: "center" },
    bookBtnText: { color: colors.textDark, fontFamily: fonts.bold, fontSize: fonts.size.md },
});
