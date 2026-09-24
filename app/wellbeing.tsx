import SafeScreen from "@/components/SafeScreen";
import { useAuth } from "@/contexts/AuthContext";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    Alert,
    Animated,
    Linking,
    Modal,
    Pressable,
    ScrollView,
    Share,
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
    sections: { heading: string; body: string }[];
    actionType?: "breathing" | "scripts" | "hotlines" | "standard";
    scripts?: { label: string; text: string }[];
    hotlines?: { name: string; number: string; region: string }[];
};

const BASE_RESOURCES: Omit<Resource, "completed">[] = [
    {
        id: "w1",
        title: "Managing Creative Burnout",
        category: "Stress",
        description: "Learn practical strategies to recognise, prevent, and recover from creative burnout.",
        duration: "8 min read",
        icon: "local-fire-department",
        color: "#E17055",
        actionType: "standard",
        sections: [
            {
                heading: "Why Creative Burnout is Unique",
                body: "Creative work demands emotional vulnerability and lateral thinking. Unlike mechanical fatigue, burnout feels like losing your creative identity. Recognizing the early flags—such as cynicism toward briefs, creative paralysis, and constant dread of client revisions—is the first step toward recovery.",
            },
            {
                heading: "The 3-Phase Recharge Protocol",
                body: "1. Digital Sunset: Disconnect Slack, Figma notifications, and work email at least 2 hours before bed.\n2. Non-Commercial Play: Dedicate 30 minutes weekly to unstructured sketching, sound design, or writing with zero intent to sell or post online.\n3. Micro-Sabbaticals: Protect a recurring 24-hour screen-free weekend block once every two weeks.",
            },
            {
                heading: "Actionable Daily Boundaries",
                body: "Limit deep creative work sessions to 90-minute sprints. Creativity operates on ultradian rhythms; forcing a 6th consecutive hour at the canvas degrades output quality and drains cognitive reserves.",
            },
        ],
    },
    {
        id: "w2",
        title: "Mindful Breaks for Creatives",
        category: "Mindfulness",
        description: "Interactive 4-4-4-4 Box Breathing exercise to reset your nervous system between creative sprints.",
        duration: "5 min practice",
        icon: "self-improvement",
        color: "#00B894",
        actionType: "breathing",
        sections: [
            {
                heading: "The Science of Box Breathing",
                body: "Box breathing (equal-part breath control) is utilized by elite performers and designers to stimulate the parasympathetic nervous system, lowering heart rate and clearing mental blocks in under 3 minutes.",
            },
            {
                heading: "When to Use This Tool",
                body: "Practice right before pitching a high-stakes proposal, after receiving tough client feedback, or whenever you find yourself endlessly looping without shipping.",
            },
        ],
    },
    {
        id: "w3",
        title: "Setting Healthy Boundaries",
        category: "Work-Life",
        description: "Ready-to-use scripts for saying 'No' to scope creep while keeping client relationships warm.",
        duration: "6 min read",
        icon: "shield",
        color: "#6C5CE7",
        actionType: "scripts",
        sections: [
            {
                heading: "The Golden Rule of Creative Agency",
                body: "Clients do not respect unclear boundaries. When you establish crisp communication windows and defined change-request procedures up front, clients perceive you as a professional partner rather than an ad-hoc vendor.",
            },
            {
                heading: "Battle-Tested Client Email Scripts",
                body: "Tap any script below to review and copy it directly to your clipboard for instant client correspondence.",
            },
        ],
        scripts: [
            {
                label: "Handling Scope Creep Politely",
                text: "Hi [Client], I love this direction! Since this new feature sits outside our initial project brief, I can prepare an addendum quote and timeline estimate for Phase 2 so we keep our current launch date on schedule. Let me know if you'd like me to send that over!",
            },
            {
                label: "Weekend / Evening Work Boundary",
                text: "Hi [Client], thanks for your message! I'm offline for the weekend recharging with family. I have added this to my top priorities for Monday morning and will update you by 11:00 AM.",
            },
            {
                label: "Firm Revision Limit Notice",
                text: "Hi [Client], we have now completed the 2 included revision rounds per our agreement. I'm happy to execute additional changes at our standard studio hourly rate of [Rate]. Shall I proceed with these updates?",
            },
        ],
    },
    {
        id: "w4",
        title: "Sleep Hygiene for Night Owls",
        category: "Sleep",
        description: "Evidence-based tips for improving sleep quality when your creative peak hits after midnight.",
        duration: "7 min read",
        icon: "bedtime",
        color: "#0984E3",
        actionType: "standard",
        sections: [
            {
                heading: "The 10-3-2-1-0 Framework for Creators",
                body: "• 10 Hours before bed: Cut caffeine and energy drinks.\n• 3 Hours before bed: Finish heavy food and alcohol.\n• 2 Hours before bed: Cease active client work and project deliverables.\n• 1 Hour before bed: Eliminate blue-light screens (monitors, iPads, phones).\n• 0: Number of times you hit snooze tomorrow morning.",
            },
            {
                heading: "Optimizing the Late-Night Studio Environment",
                body: "If your inspiration strikes late, warm your display temperature to 2700K (Night Shift / f.lux). Keep ambient room lamps at low Kelvin warm light rather than harsh overhead LEDs to protect melatonin secretion.",
            },
        ],
    },
    {
        id: "w5",
        title: "Financial Stress Relief",
        category: "Finance",
        description: "Manage the unique financial anxiety that comes with freelancing and unpredictable income cycles.",
        duration: "10 min read",
        icon: "account-balance-wallet",
        color: "#FDCB6E",
        actionType: "standard",
        sections: [
            {
                heading: "The 3-Month Runway Rule",
                body: "Calculate your absolute 'Survival Burn Rate' (rent, groceries, basic utilities, software subscriptions). Build a liquid emergency fund covering exactly 3 months before investing in new gear or equipment upgrades. Having this cushion eliminates the panic that leads to underpricing yourself.",
            },
            {
                heading: "The 50/30/20 Freelance Profit System",
                body: "Whenever client invoices clear into your bank account, immediately allocate:\n• 50% to your personal compensation account\n• 30% to dedicated taxes and business operating reserves\n• 20% to retained studio profit and emergency buffer.",
            },
            {
                heading: "Standardizing Upfront Deposits",
                body: "Never start work without a minimum 50% upfront deposit on projects under $5,000, or a 40/30/30 milestone structure on larger projects. Milestone locking guarantees you are never left holding unpaid hours.",
            },
        ],
    },
    {
        id: "w6",
        title: "Creative Community & Crisis Support",
        category: "Social",
        description: "Build a support network of fellow creatives and access verified emergency crisis helplines.",
        duration: "5 min read",
        icon: "groups",
        color: "#A29BFE",
        actionType: "hotlines",
        sections: [
            {
                heading: "Isolation is the Enemy of Creativity",
                body: "Working as a solitary freelancer or remote designer often leads to severe imposter syndrome. Join weekly BITC live audio rooms and community threads to share work-in-progress, vent frustrations, and gain peer perspective.",
            },
            {
                heading: "Emergency Helpline Directory",
                body: "If you or someone you know is experiencing acute crisis, panic, or depression, trained professionals are available 24/7. Tap any service below to call or connect immediately.",
            },
        ],
        hotlines: [
            { name: "Nigeria Mental Health Helpline", number: "08008002000", region: "Nigeria (Toll-Free)" },
            { name: "She Writes Woman Crisis Line", number: "07086462943", region: "Nigeria (Confidential)" },
            { name: "UK Shout Crisis Text Line", number: "85258", region: "UK (Text 'SHOUT')" },
            { name: "International Crisis Directory", number: "https://findahelpline.com", region: "Global Web Portal" },
        ],
    },
];

export default function Wellbeing() {
    const router = useRouter();
    const { user } = useAuth();
    const storageKey = `@bitc_wellbeing_completed_${user?.id || "guest"}`;
    const moodKey = `@bitc_wellbeing_mood_${user?.id || "guest"}`;

    const [completedMap, setCompletedMap] = useState<Record<string, boolean>>({});
    const [selectedMood, setSelectedMood] = useState<string | null>(null);
    const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    // Interactive breathing exercise state
    const [breathingActive, setBreathingActive] = useState(false);
    const [breathPhase, setBreathPhase] = useState<"Inhale" | "Hold" | "Exhale" | "Pause">("Inhale");
    const [breathSeconds, setBreathSeconds] = useState(4);
    const breathAnim = useRef(new Animated.Value(1)).current;

    // Load user's real progress and selected mood from storage
    useEffect(() => {
        AsyncStorage.getItem(storageKey).then((raw) => {
            if (raw) {
                try {
                    setCompletedMap(JSON.parse(raw));
                } catch {}
            } else {
                setCompletedMap({});
            }
        });

        AsyncStorage.getItem(moodKey).then((raw) => {
            if (raw) setSelectedMood(raw);
        });
    }, [storageKey, moodKey]);

    const resources: Resource[] = BASE_RESOURCES.map((r) => ({
        ...r,
        completed: Boolean(completedMap[r.id]),
    }));

    const completed = resources.filter((r) => r.completed).length;
    const total = resources.length;
    const progress = total > 0 ? (completed / total) * 100 : 0;

    async function toggleComplete(id: string) {
        const next = { ...completedMap, [id]: !completedMap[id] };
        if (!next[id]) delete next[id];
        setCompletedMap(next);
        await AsyncStorage.setItem(storageKey, JSON.stringify(next));
    }

    async function handleSelectMood(emoji: string) {
        setSelectedMood(emoji);
        await AsyncStorage.setItem(moodKey, emoji);
    }

    function openResource(res: Resource) {
        setSelectedResource(res);
        setModalVisible(true);
        setBreathingActive(false);
    }

    // Breathing timer effect
    useEffect(() => {
        if (!breathingActive) return;

        let currentPhase: "Inhale" | "Hold" | "Exhale" | "Pause" = "Inhale";
        let count = 4;

        const interval = setInterval(() => {
            count -= 1;
            if (count <= 0) {
                if (currentPhase === "Inhale") {
                    currentPhase = "Hold";
                    setBreathPhase("Hold");
                    count = 4;
                } else if (currentPhase === "Hold") {
                    currentPhase = "Exhale";
                    setBreathPhase("Exhale");
                    count = 4;
                    Animated.timing(breathAnim, {
                        toValue: 1,
                        duration: 4000,
                        useNativeDriver: true,
                    }).start();
                } else if (currentPhase === "Exhale") {
                    currentPhase = "Pause";
                    setBreathPhase("Pause");
                    count = 4;
                } else {
                    currentPhase = "Inhale";
                    setBreathPhase("Inhale");
                    count = 4;
                    Animated.timing(breathAnim, {
                        toValue: 1.45,
                        duration: 4000,
                        useNativeDriver: true,
                    }).start();
                }
            }
            setBreathSeconds(count);
        }, 1000);

        // Initial inhale expansion
        Animated.timing(breathAnim, {
            toValue: 1.45,
            duration: 4000,
            useNativeDriver: true,
        }).start();

        return () => {
            clearInterval(interval);
            breathAnim.setValue(1);
        };
    }, [breathingActive, breathAnim]);

    async function copyScriptText(text: string) {
        try {
            await Share.share({ message: text });
        } catch {
            Alert.alert("Script", text);
        }
    }

    function handleCallHotline(number: string) {
        if (number.startsWith("http")) {
            Linking.openURL(number);
        } else {
            Linking.openURL(`tel:${number}`);
        }
    }

    return (
        <SafeScreen>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={10}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
                </Pressable>
                <Text style={styles.title}>Wellbeing Hub</Text>
                <Text style={styles.subtitle}>
                    Evidence-based guides, mindful practices, and boundary tools tailored for creative professionals.
                </Text>

                {/* Progress card */}
                <View style={styles.progressCard}>
                    <View style={styles.progressHeader}>
                        <Text style={styles.progressTitle}>Your Wellbeing Journey</Text>
                        <Text style={styles.progressCount}>{completed}/{total}</Text>
                    </View>
                    <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${progress}%` }]} />
                    </View>
                    <Text style={styles.progressLabel}>
                        {completed === 0
                            ? "0% complete — tap any guide or mindful break below to begin."
                            : `${Math.round(progress)}% complete — great job taking care of your craft & mind.`}
                    </Text>
                </View>

                {/* Quick check-in */}
                <View style={styles.checkinCard}>
                    <Text style={styles.checkinTitle}>How is your creative energy today?</Text>
                    <View style={styles.moodRow}>
                        {[
                            { emoji: "😊", label: "Thriving" },
                            { emoji: "😐", label: "Balanced" },
                            { emoji: "😰", label: "Anxious" },
                            { emoji: "😴", label: "Fatigued" },
                            { emoji: "🔥", label: "Burned Out" },
                        ].map((m) => (
                            <Pressable
                                key={m.emoji}
                                style={[styles.moodBtn, selectedMood === m.emoji && styles.moodBtnActive]}
                                onPress={() => handleSelectMood(m.emoji)}
                            >
                                <Text style={styles.moodEmoji}>{m.emoji}</Text>
                                <Text style={styles.moodLabel}>{m.label}</Text>
                            </Pressable>
                        ))}
                    </View>
                </View>

                {/* Resources */}
                <Text style={styles.sectionTitle}>Interactive Resources</Text>

                {resources.map((resource) => (
                    <Pressable
                        key={resource.id}
                        style={styles.resourceCard}
                        onPress={() => openResource(resource)}
                    >
                        <View style={styles.resourceHeader}>
                            <View style={[styles.resourceIcon, { backgroundColor: resource.color + "20" }]}>
                                <MaterialIcons name={resource.icon} size={22} color={resource.color} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.resourceTitle}>{resource.title}</Text>
                                <View style={styles.resourceMeta}>
                                    <Text style={[styles.resourceCategory, { color: resource.color }]}>
                                        {resource.category}
                                    </Text>
                                    <Text style={styles.resourceDuration}>{resource.duration}</Text>
                                </View>
                            </View>
                            <Pressable
                                style={styles.checkBtn}
                                onPress={() => toggleComplete(resource.id)}
                                hitSlop={8}
                            >
                                <MaterialIcons
                                    name={resource.completed ? "check-circle" : "radio-button-unchecked"}
                                    size={24}
                                    color={resource.completed ? colors.accentGreen : colors.textSecondary}
                                />
                            </Pressable>
                        </View>
                        <Text style={styles.resourceDesc}>{resource.description}</Text>
                        <View style={styles.cardFooterRow}>
                            <Text style={[styles.tapToOpen, { color: resource.color }]}>Tap to open guide</Text>
                            <MaterialIcons name="arrow-forward" size={16} color={resource.color} />
                        </View>
                    </Pressable>
                ))}
            </ScrollView>

            {/* ── Resource Reader & Practice Modal ── */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        {selectedResource && (
                            <>
                                <View style={styles.modalHeaderRow}>
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                                        <View style={[styles.modalIconWrap, { backgroundColor: selectedResource.color + "25" }]}>
                                            <MaterialIcons name={selectedResource.icon} size={22} color={selectedResource.color} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.modalTitle} numberOfLines={1}>
                                                {selectedResource.title}
                                            </Text>
                                            <Text style={styles.modalCategory}>
                                                {selectedResource.category} • {selectedResource.duration}
                                            </Text>
                                        </View>
                                    </View>
                                    <Pressable hitSlop={8} onPress={() => setModalVisible(false)}>
                                        <MaterialIcons name="close" size={24} color={colors.textSecondary} />
                                    </Pressable>
                                </View>

                                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
                                    {/* Action Type: Interactive Box Breathing */}
                                    {selectedResource.actionType === "breathing" && (
                                        <View style={styles.breathingContainer}>
                                            <Text style={styles.breathingTitle}>4-4-4-4 Box Breathing</Text>
                                            <Text style={styles.breathingSub}>Inhale, hold, exhale, and pause for 4 seconds each.</Text>

                                            <View style={styles.breathCircleWrap}>
                                                <Animated.View
                                                    style={[
                                                        styles.breathCircle,
                                                        {
                                                            borderColor: selectedResource.color,
                                                            transform: [{ scale: breathAnim }],
                                                        },
                                                    ]}
                                                >
                                                    <Text style={[styles.breathPhaseText, { color: selectedResource.color }]}>
                                                        {breathingActive ? breathPhase : "Ready"}
                                                    </Text>
                                                    <Text style={styles.breathTimerText}>
                                                        {breathingActive ? `${breathSeconds}s` : "4s"}
                                                    </Text>
                                                </Animated.View>
                                            </View>

                                            <Pressable
                                                style={[styles.breathingActionBtn, { backgroundColor: selectedResource.color }]}
                                                onPress={() => setBreathingActive((prev) => !prev)}
                                            >
                                                <MaterialIcons
                                                    name={breathingActive ? "pause" : "play-arrow"}
                                                    size={22}
                                                    color="#fff"
                                                />
                                                <Text style={styles.breathingActionBtnText}>
                                                    {breathingActive ? "Pause Exercise" : "Start Box Breathing"}
                                                </Text>
                                            </Pressable>
                                        </View>
                                    )}

                                    {/* Action Type: Scripts to Copy */}
                                    {selectedResource.scripts && (
                                        <View style={styles.scriptsSection}>
                                            <Text style={styles.scriptSectionTitle}>Tap any script to copy & share:</Text>
                                            {selectedResource.scripts.map((script, idx) => (
                                                <View key={idx} style={styles.scriptCard}>
                                                    <View style={styles.scriptHeader}>
                                                        <Text style={styles.scriptLabel}>{script.label}</Text>
                                                        <Pressable
                                                            style={styles.copyBtn}
                                                            onPress={() => copyScriptText(script.text)}
                                                        >
                                                            <MaterialIcons name="content-copy" size={16} color={colors.accentYellow} />
                                                            <Text style={styles.copyBtnText}>Copy</Text>
                                                        </Pressable>
                                                    </View>
                                                    <Text style={styles.scriptText}>{script.text}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}

                                    {/* Action Type: Emergency Hotlines */}
                                    {selectedResource.hotlines && (
                                        <View style={styles.hotlinesSection}>
                                            <Text style={styles.hotlinesHeaderTitle}>Direct Crisis Numbers:</Text>
                                            {selectedResource.hotlines.map((h, idx) => (
                                                <Pressable
                                                    key={idx}
                                                    style={styles.hotlineCard}
                                                    onPress={() => handleCallHotline(h.number)}
                                                >
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={styles.hotlineName}>{h.name}</Text>
                                                        <Text style={styles.hotlineRegion}>{h.region}</Text>
                                                    </View>
                                                    <View style={styles.callPill}>
                                                        <MaterialIcons
                                                            name={h.number.startsWith("http") ? "open-in-browser" : "phone"}
                                                            size={16}
                                                            color={colors.textDark}
                                                        />
                                                        <Text style={styles.callPillText}>
                                                            {h.number.startsWith("http") ? "Visit" : "Call"}
                                                        </Text>
                                                    </View>
                                                </Pressable>
                                            ))}
                                        </View>
                                    )}

                                    {/* Guide Sections */}
                                    {selectedResource.sections.map((sec, idx) => (
                                        <View key={idx} style={styles.sectionWrap}>
                                            <Text style={styles.sectionHeading}>{sec.heading}</Text>
                                            <Text style={styles.sectionBody}>{sec.body}</Text>
                                        </View>
                                    ))}

                                    {/* Complete Toggle Button */}
                                    <Pressable
                                        style={[
                                            styles.completeModalBtn,
                                            selectedResource.completed && styles.completeModalBtnActive,
                                        ]}
                                        onPress={async () => {
                                            await toggleComplete(selectedResource.id);
                                            setSelectedResource((prev) =>
                                                prev ? { ...prev, completed: !prev.completed } : null
                                            );
                                        }}
                                    >
                                        <MaterialIcons
                                            name={selectedResource.completed ? "check-circle" : "check"}
                                            size={20}
                                            color={selectedResource.completed ? colors.accentGreen : colors.textDark}
                                        />
                                        <Text
                                            style={[
                                                styles.completeModalBtnText,
                                                selectedResource.completed && { color: colors.accentGreen },
                                            ]}
                                        >
                                            {selectedResource.completed
                                                ? "Completed ✓ Tap to unmark"
                                                : "Mark Guide as Completed"}
                                        </Text>
                                    </Pressable>
                                </ScrollView>
                            </>
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
    checkinCard: { backgroundColor: "#13231b", borderRadius: radii.card, borderWidth: 1, borderColor: "#204632", padding: spacing.lg },
    checkinTitle: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.md, marginBottom: spacing.md, textAlign: "center" },
    moodRow: { flexDirection: "row", justifyContent: "space-between" },
    moodBtn: { width: 56, height: 60, borderRadius: 16, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.outline },
    moodBtnActive: { backgroundColor: colors.accentYellow + "25", borderColor: colors.accentYellow, transform: [{ scale: 1.05 }] },
    moodEmoji: { fontSize: 22, marginBottom: 2 },
    moodLabel: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 9 },

    // Resources
    resourceCard: { backgroundColor: colors.surface, borderRadius: radii.card, borderWidth: 1, borderColor: colors.outline, padding: spacing.md },
    resourceHeader: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.sm },
    resourceIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    resourceTitle: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.md },
    resourceMeta: { flexDirection: "row", gap: spacing.md, marginTop: 2 },
    resourceCategory: { fontFamily: fonts.semibold, fontSize: fonts.size.xs },
    resourceDuration: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.xs },
    checkBtn: { padding: 4 },
    resourceDesc: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm, lineHeight: 18, marginBottom: 8 },
    cardFooterRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
    tapToOpen: { fontFamily: fonts.semibold, fontSize: fonts.size.xs },

    // Modal
    modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "flex-end" },
    modalCard: { backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: spacing.lg, maxHeight: "88%", minHeight: "65%" },
    modalHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.outline, paddingBottom: spacing.sm },
    modalIconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    modalTitle: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.lg },
    modalCategory: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.xs, marginTop: 2 },
    modalScroll: { paddingBottom: 40, gap: spacing.md },

    // Sections
    sectionWrap: { backgroundColor: colors.background, borderRadius: radii.card, padding: spacing.md, borderWidth: 1, borderColor: colors.outline },
    sectionHeading: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.md, marginBottom: 6 },
    sectionBody: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm, lineHeight: 22 },

    // Breathing Widget
    breathingContainer: { backgroundColor: "#0b201a", borderRadius: radii.card, padding: spacing.lg, borderWidth: 1, borderColor: "#00B89440", alignItems: "center" },
    breathingTitle: { color: "#55efc4", fontFamily: fonts.bold, fontSize: fonts.size.lg },
    breathingSub: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.xs, textAlign: "center", marginTop: 4, marginBottom: spacing.lg },
    breathCircleWrap: { width: 140, height: 140, alignItems: "center", justifyContent: "center", marginVertical: spacing.md },
    breathCircle: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, backgroundColor: "#00B89415", alignItems: "center", justifyContent: "center" },
    breathPhaseText: { fontFamily: fonts.bold, fontSize: fonts.size.md },
    breathTimerText: { color: "#fff", fontFamily: fonts.bold, fontSize: fonts.size.xl, marginTop: 2 },
    breathingActionBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 20, paddingVertical: 10, borderRadius: radii.pill, marginTop: spacing.md },
    breathingActionBtnText: { color: "#fff", fontFamily: fonts.bold, fontSize: fonts.size.sm },

    // Scripts
    scriptsSection: { gap: spacing.sm },
    scriptSectionTitle: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.sm },
    scriptCard: { backgroundColor: colors.background, borderRadius: radii.card, padding: spacing.md, borderWidth: 1, borderColor: colors.outline },
    scriptHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
    scriptLabel: { color: colors.accentYellow, fontFamily: fonts.bold, fontSize: fonts.size.xs },
    copyBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.surface, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    copyBtnText: { color: colors.accentYellow, fontFamily: fonts.semibold, fontSize: fonts.size.xs },
    scriptText: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.xs, lineHeight: 18 },

    // Hotlines
    hotlinesSection: { gap: spacing.sm },
    hotlinesHeaderTitle: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.sm },
    hotlineCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.background, borderRadius: radii.card, padding: spacing.md, borderWidth: 1, borderColor: colors.outline },
    hotlineName: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.sm },
    hotlineRegion: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.xs, marginTop: 2 },
    callPill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.accentYellow, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.pill },
    callPillText: { color: colors.textDark, fontFamily: fonts.bold, fontSize: fonts.size.xs },

    // Modal Complete Button
    completeModalBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.accentYellow, paddingVertical: 14, borderRadius: radii.pill, marginTop: spacing.sm },
    completeModalBtnActive: { backgroundColor: "#00B89420", borderWidth: 1, borderColor: colors.accentGreen },
    completeModalBtnText: { color: colors.textDark, fontFamily: fonts.bold, fontSize: fonts.size.md },
});
