import SafeScreen from "@/components/SafeScreen";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

type Milestone = {
    title: string;
    description: string;
    timeframe: string;
    skills: string[];
};

type CareerRoadmap = {
    currentRole: string;
    targetRole: string;
    milestones: Milestone[];
};

const CURRENT_ROLES = [
    "Junior Designer",
    "Graphic Designer",
    "Web Developer",
    "Photographer",
    "Content Creator",
    "Marketing Coordinator",
    "Freelancer",
] as const;

const GOALS = [
    "Lead Creative",
    "Creative Director",
    "Senior Developer",
    "Studio Head",
    "Brand Strategist",
    "Product Designer",
    "Tech Lead",
] as const;

function generateRoadmap(from: string, to: string): Milestone[] {
    const fromLower = from.toLowerCase();
    const toLower = to.toLowerCase();

    const isDesignPath = fromLower.includes("design") || toLower.includes("design") || toLower.includes("creative");
    const isDevPath = fromLower.includes("develop") || toLower.includes("develop") || toLower.includes("tech");
    const isLeaderPath = toLower.includes("director") || toLower.includes("head") || toLower.includes("lead");
    const isStrategyPath = toLower.includes("strategist") || toLower.includes("product");

    const milestones: Milestone[] = [];

    // Phase 1 - Foundation (always present)
    milestones.push({
        title: "Strengthen Core Skills",
        description: isDesignPath
            ? `Master advanced ${from.includes("Junior") ? "design fundamentals" : "creative techniques"}. Build a portfolio that showcases ${toLower.includes("product") ? "end-to-end product thinking" : "diverse creative projects"}.`
            : isDevPath
                ? `Deepen your technical expertise. Master modern frameworks, design patterns, and ${toLower.includes("senior") ? "system architecture" : "full-stack development"}.`
                : `Refine your core competencies. Take on challenging projects that push your boundaries and document your growth journey.`,
        timeframe: "0 – 6 months",
        skills: isDesignPath
            ? ["Advanced Typography", "Design Systems", "User Research"]
            : isDevPath
                ? ["System Design", "Clean Code", "Testing Strategies"]
                : ["Portfolio Development", "Tool Mastery", "Industry Standards"],
    });

    // Phase 2 - Expansion
    milestones.push({
        title: isDevPath ? "Build Full-Stack Expertise" : "Expand Your Toolkit",
        description: isDesignPath
            ? "Learn UX research, prototyping tools, and motion design. Start leading design critiques and presenting to stakeholders."
            : isDevPath
                ? "Master DevOps, cloud infrastructure, and CI/CD pipelines. Contribute to open-source projects and write technical content."
                : `Learn complementary skills that bridge ${from} and ${to}. Start taking on collaborative, cross-functional projects.`,
        timeframe: "6 – 12 months",
        skills: isDesignPath
            ? ["Prototyping", "UX Research", "Design Operations"]
            : isDevPath
                ? ["Cloud Architecture", "DevOps", "Technical Writing"]
                : ["Cross-discipline Skills", "Client Communication", "Project Management"],
    });

    // Phase 3 - Network & Reputation
    milestones.push({
        title: isLeaderPath ? "Develop Leadership Presence" : "Build Your Network",
        description: isLeaderPath
            ? "Start managing a small team or leading a significant initiative. Develop emotional intelligence, conflict resolution, and strategic communication skills."
            : isStrategyPath
                ? "Position yourself as a thought leader. Speak at events, publish case studies, and develop a personal brand in your niche."
                : "Attend industry events, join communities like BITC, and start mentoring others. Build a reputation through quality work and visibility.",
        timeframe: "12 – 18 months",
        skills: isLeaderPath
            ? ["People Management", "Strategic Communication", "Conflict Resolution"]
            : isStrategyPath
                ? ["Personal Branding", "Public Speaking", "Case Study Writing"]
                : ["Public Speaking", "Networking", "Mentorship"],
    });

    // Phase 4 - Final push
    milestones.push({
        title: `Transition to ${to}`,
        description: `Apply for ${to} roles or transition within your current organisation. Leverage your expanded skill set, network, and portfolio to make the move from ${from} to ${to}.`,
        timeframe: "18 – 24 months",
        skills: isLeaderPath
            ? ["Team Leadership", "Strategic Thinking", "Business Development"]
            : isStrategyPath
                ? ["Market Analysis", "Brand Strategy", "Product Thinking"]
                : isDevPath
                    ? ["Architecture Reviews", "Tech Strategy", "Team Mentoring"]
                    : ["Creative Direction", "Stakeholder Management", "Innovation"],
    });

    return milestones;
}

export default function CareerPath() {
    const router = useRouter();
    const [currentRole, setCurrentRole] = useState<string>(CURRENT_ROLES[0]);
    const [goal, setGoal] = useState<string>(GOALS[0]);
    const [loading, setLoading] = useState(false);
    const [roadmap, setRoadmap] = useState<CareerRoadmap | null>(null);

    function generate() {
        setLoading(true);
        setTimeout(() => {
            setRoadmap({
                currentRole,
                targetRole: goal,
                milestones: generateRoadmap(currentRole, goal),
            });
            setLoading(false);
        }, 1000);
    }

    return (
        <SafeScreen>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={10}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
                </Pressable>
                <Text style={styles.title}>Career Path Generator</Text>
                <Text style={styles.subtitle}>Select your current role and goal to get a personalised career roadmap with milestones.</Text>

                <Text style={styles.label}>Current Role</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                    {CURRENT_ROLES.map((r) => (
                        <Pressable key={r} style={[styles.chip, currentRole === r && styles.chipActive]} onPress={() => setCurrentRole(r)}>
                            <Text style={[styles.chipText, currentRole === r && styles.chipTextActive]}>{r}</Text>
                        </Pressable>
                    ))}
                </ScrollView>

                <Text style={styles.label}>Career Goal</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                    {GOALS.map((g) => (
                        <Pressable key={g} style={[styles.chip, goal === g && styles.chipActive]} onPress={() => setGoal(g)}>
                            <Text style={[styles.chipText, goal === g && styles.chipTextActive]}>{g}</Text>
                        </Pressable>
                    ))}
                </ScrollView>

                <Pressable style={styles.generateBtn} onPress={generate} disabled={loading}>
                    {loading ? <ActivityIndicator color={colors.textDark} /> : <Text style={styles.generateBtnText}>Generate Roadmap</Text>}
                </Pressable>

                {roadmap ? (
                    <View style={styles.roadmapCard}>
                        <Text style={styles.roadmapTitle}>{roadmap.currentRole} → {roadmap.targetRole}</Text>

                        {roadmap.milestones.map((m, idx) => (
                            <View key={idx} style={styles.milestone}>
                                <View style={styles.milestoneTimeline}>
                                    <View style={styles.milestoneCircle}>
                                        <Text style={styles.milestoneNum}>{idx + 1}</Text>
                                    </View>
                                    {idx < roadmap.milestones.length - 1 ? <View style={styles.milestoneLine} /> : null}
                                </View>
                                <View style={styles.milestoneBody}>
                                    <View style={styles.milestoneHeader}>
                                        <Text style={styles.milestoneTitle}>{m.title}</Text>
                                        <Text style={styles.milestoneTime}>{m.timeframe}</Text>
                                    </View>
                                    <Text style={styles.milestoneDesc}>{m.description}</Text>
                                    <View style={styles.skillTags}>
                                        {m.skills.map((s) => (
                                            <View key={s} style={styles.skillTag}>
                                                <Text style={styles.skillTagText}>{s}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                ) : null}
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
    label: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.md, marginTop: spacing.md },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xs },
    chip: { borderRadius: radii.pill, borderWidth: 1, borderColor: colors.outline, paddingVertical: 8, paddingHorizontal: spacing.md, backgroundColor: colors.surface },
    chipActive: { borderColor: colors.accentYellow, backgroundColor: "#2a2200" },
    chipText: { color: colors.textSecondary, fontFamily: fonts.semibold, fontSize: fonts.size.sm },
    chipTextActive: { color: colors.accentYellow },
    generateBtn: { backgroundColor: colors.accentGreen, borderRadius: radii.pill, paddingVertical: 14, alignItems: "center", marginTop: spacing.lg },
    generateBtnText: { color: colors.textDark, fontFamily: fonts.bold, fontSize: fonts.size.md },
    roadmapCard: { backgroundColor: colors.surface, borderRadius: radii.card, borderWidth: 1, borderColor: colors.outline, padding: spacing.lg },
    roadmapTitle: { color: colors.accentYellow, fontFamily: fonts.bold, fontSize: fonts.size.lg, marginBottom: spacing.lg },
    milestone: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.md },
    milestoneTimeline: { alignItems: "center", width: 32 },
    milestoneCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.accentGreen, alignItems: "center", justifyContent: "center" },
    milestoneNum: { color: colors.textDark, fontFamily: fonts.bold, fontSize: fonts.size.sm },
    milestoneLine: { width: 2, flex: 1, backgroundColor: colors.outline, marginVertical: 4 },
    milestoneBody: { flex: 1 },
    milestoneHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
    milestoneTitle: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.md },
    milestoneTime: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.xs },
    milestoneDesc: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm, lineHeight: 20, marginBottom: spacing.sm },
    skillTags: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
    skillTag: { backgroundColor: "#1a2e24", borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 4 },
    skillTagText: { color: colors.accentGreen, fontFamily: fonts.semibold, fontSize: 11 },
});
