import SafeScreen from "@/components/SafeScreen";
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

type Resource = {
    id: string;
    title: string;
    category: string;
    description: string;
    duration: string;
    icon: keyof typeof MaterialIcons.glyphMap;
    color: string;
    completed: boolean;
};

const RESOURCES: Resource[] = [
    { id: "w1", title: "Managing Creative Burnout", category: "Stress", description: "Learn practical strategies to recognise, prevent, and recover from creative burnout.", duration: "8 min read", icon: "local-fire-department", color: "#E17055", completed: false },
    { id: "w2", title: "Mindful Breaks for Creatives", category: "Mindfulness", description: "Quick mindfulness exercises you can do between tasks to refresh your focus.", duration: "5 min practice", icon: "self-improvement", color: "#00B894", completed: false },
    { id: "w3", title: "Setting Healthy Boundaries", category: "Work-Life", description: "How to set clear boundaries with clients while maintaining professional relationships.", duration: "6 min read", icon: "shield", color: "#6C5CE7", completed: true },
    { id: "w4", title: "Sleep Hygiene for Night Owls", category: "Sleep", description: "Evidence-based tips for improving sleep quality when your creative peak is after midnight.", duration: "7 min read", icon: "bedtime", color: "#0984E3", completed: false },
    { id: "w5", title: "Financial Stress Relief", category: "Finance", description: "Manage the unique financial anxiety that comes with freelancing and creative careers.", duration: "10 min read", icon: "account-balance-wallet", color: "#FDCB6E", completed: false },
    { id: "w6", title: "Creative Community Support", category: "Social", description: "Build a support network of fellow creatives. You're not alone in this journey.", duration: "5 min read", icon: "groups", color: "#A29BFE", completed: true },
];

export default function Wellbeing() {
    const router = useRouter();
    const [resources, setResources] = useState(RESOURCES);

    const completed = resources.filter((r) => r.completed).length;
    const total = resources.length;
    const progress = total > 0 ? (completed / total) * 100 : 0;

    function toggleComplete(id: string) {
        setResources((prev) => prev.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r)));
    }

    return (
        <SafeScreen>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={10}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
                </Pressable>
                <Text style={styles.title}>Wellbeing Hub</Text>
                <Text style={styles.subtitle}>Resources to help you thrive as a creative professional — mind, body, and career.</Text>

                {/* Progress card */}
                <View style={styles.progressCard}>
                    <View style={styles.progressHeader}>
                        <Text style={styles.progressTitle}>Your Wellbeing Journey</Text>
                        <Text style={styles.progressCount}>{completed}/{total}</Text>
                    </View>
                    <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${progress}%` }]} />
                    </View>
                    <Text style={styles.progressLabel}>{Math.round(progress)}% complete — keep going!</Text>
                </View>

                {/* Quick check-in */}
                <View style={styles.checkinCard}>
                    <Text style={styles.checkinTitle}>How are you feeling today?</Text>
                    <View style={styles.moodRow}>
                        {["😊", "😐", "😰", "😴", "🔥"].map((emoji) => (
                            <Pressable key={emoji} style={styles.moodBtn}>
                                <Text style={styles.moodEmoji}>{emoji}</Text>
                            </Pressable>
                        ))}
                    </View>
                </View>

                {/* Resources */}
                <Text style={styles.sectionTitle}>Resources</Text>

                {resources.map((resource) => (
                    <View key={resource.id} style={styles.resourceCard}>
                        <View style={styles.resourceHeader}>
                            <View style={[styles.resourceIcon, { backgroundColor: resource.color + "20" }]}>
                                <MaterialIcons name={resource.icon} size={22} color={resource.color} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.resourceTitle}>{resource.title}</Text>
                                <View style={styles.resourceMeta}>
                                    <Text style={styles.resourceCategory}>{resource.category}</Text>
                                    <Text style={styles.resourceDuration}>{resource.duration}</Text>
                                </View>
                            </View>
                            <Pressable style={styles.checkBtn} onPress={() => toggleComplete(resource.id)} hitSlop={8}>
                                <MaterialIcons
                                    name={resource.completed ? "check-circle" : "radio-button-unchecked"}
                                    size={24}
                                    color={resource.completed ? colors.accentGreen : colors.textSecondary}
                                />
                            </Pressable>
                        </View>
                        <Text style={styles.resourceDesc}>{resource.description}</Text>
                    </View>
                ))}
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
    sectionTitle: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.lg, marginTop: spacing.sm },
    // Progress
    progressCard: { backgroundColor: colors.surface, borderRadius: radii.card, borderWidth: 1, borderColor: colors.outline, padding: spacing.lg },
    progressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
    progressTitle: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.md },
    progressCount: { color: colors.accentYellow, fontFamily: fonts.bold, fontSize: fonts.size.md },
    progressTrack: { height: 8, borderRadius: 4, backgroundColor: "#1e1e1e", overflow: "hidden", marginBottom: spacing.xs },
    progressFill: { height: "100%", borderRadius: 4, backgroundColor: colors.accentGreen },
    progressLabel: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm },
    // Check-in
    checkinCard: { backgroundColor: "#1a2e24", borderRadius: radii.card, borderWidth: 1, borderColor: "#2f5b42", padding: spacing.lg },
    checkinTitle: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.md, marginBottom: spacing.md, textAlign: "center" },
    moodRow: { flexDirection: "row", justifyContent: "space-around" },
    moodBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
    moodEmoji: { fontSize: 24 },
    // Resources
    resourceCard: { backgroundColor: colors.surface, borderRadius: radii.card, borderWidth: 1, borderColor: colors.outline, padding: spacing.md },
    resourceHeader: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.sm },
    resourceIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    resourceTitle: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.md },
    resourceMeta: { flexDirection: "row", gap: spacing.md, marginTop: 2 },
    resourceCategory: { color: colors.accentYellow, fontFamily: fonts.semibold, fontSize: fonts.size.xs },
    resourceDuration: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.xs },
    checkBtn: { padding: 4 },
    resourceDesc: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm, lineHeight: 18 },
});
