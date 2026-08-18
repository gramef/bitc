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
    TextInput,
    View,
} from "react-native";

type ParsedSection = { title: string; items: string[] };

function parseBrief(text: string): ParsedSection[] {
    const sections: ParsedSection[] = [];
    const lines = text.split(/[.\n]/).map((l) => l.trim()).filter(Boolean);

    const goals: string[] = [];
    const deliverables: string[] = [];
    const timeline: string[] = [];
    const redFlags: string[] = [];
    const requirements: string[] = [];

    for (const line of lines) {
        const lower = line.toLowerCase();
        if (lower.includes("deadline") || lower.includes("week") || lower.includes("month") || lower.includes("day") || lower.includes("timeline") || lower.includes("asap") || lower.includes("urgent")) {
            timeline.push(line);
        } else if (lower.includes("goal") || lower.includes("objective") || lower.includes("aim") || lower.includes("want") || lower.includes("need") || lower.includes("looking for")) {
            goals.push(line);
        } else if (lower.includes("deliver") || lower.includes("output") || lower.includes("provide") || lower.includes("create") || lower.includes("design") || lower.includes("build") || lower.includes("develop")) {
            deliverables.push(line);
        } else if (lower.includes("budget") || lower.includes("free") || lower.includes("cheap") || lower.includes("unlimited revision") || lower.includes("no pay") || lower.includes("exposure")) {
            redFlags.push(`⚠️ ${line}`);
        } else {
            requirements.push(line);
        }
    }

    if (goals.length > 0) sections.push({ title: "🎯 Goals & Objectives", items: goals });
    if (requirements.length > 0) sections.push({ title: "📋 Requirements", items: requirements });
    if (deliverables.length > 0) sections.push({ title: "📦 Deliverables", items: deliverables });
    if (timeline.length > 0) sections.push({ title: "⏰ Timeline Indicators", items: timeline });
    if (redFlags.length > 0) sections.push({ title: "🚩 Red Flags", items: redFlags });

    if (sections.length === 0) {
        sections.push({ title: "📋 Key Points", items: lines.slice(0, 10) });
    }

    return sections;
}

function generateQuestions(text: string, sections: ParsedSection[]): string[] {
    const lower = text.toLowerCase();
    const questions: string[] = [];
    const sectionTitles = sections.map((s) => s.title);

    if (!sectionTitles.some((t) => t.includes("Timeline"))) {
        questions.push("What is the deadline for this project? Are there any intermediate milestones?");
    }
    if (!lower.includes("budget") && !lower.includes("pay") && !lower.includes("cost")) {
        questions.push("What is the budget range for this project?");
    }
    if (!lower.includes("revision") && !lower.includes("feedback")) {
        questions.push("How many rounds of revisions are included?");
    }
    if (!lower.includes("format") && !lower.includes("file")) {
        questions.push("What file formats do you need the deliverables in?");
    }
    if (!lower.includes("brand") && !lower.includes("style") && !lower.includes("guideline")) {
        questions.push("Do you have existing brand guidelines or style preferences?");
    }
    if (!lower.includes("audience") && !lower.includes("target")) {
        questions.push("Who is the target audience for this project?");
    }
    if (sectionTitles.some((t) => t.includes("Red Flags"))) {
        questions.push("Can we clarify the scope boundaries to avoid scope creep?");
    }
    if (questions.length === 0) {
        questions.push("Are there any reference examples or inspiration you'd like to share?");
        questions.push("What does success look like for this project?");
    }
    return questions.slice(0, 5);
}

export default function BriefInterpreter() {
    const router = useRouter();
    const [briefText, setBriefText] = useState("");
    const [result, setResult] = useState<ParsedSection[] | null>(null);
    const [loading, setLoading] = useState(false);

    function handleInterpret() {
        if (!briefText.trim()) return;
        setLoading(true);
        // Simulate processing delay
        setTimeout(() => {
            setResult(parseBrief(briefText));
            setLoading(false);
        }, 800);
    }

    return (
        <SafeScreen>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={10}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
                </Pressable>
                <Text style={styles.title}>Brief Interpreter</Text>
                <Text style={styles.subtitle}>
                    Paste a client brief and get an instant breakdown of requirements, goals, deliverables, and potential red flags.
                </Text>

                <Text style={styles.label}>Paste Brief</Text>
                <TextInput
                    style={styles.textArea}
                    placeholder="Paste your client brief here…"
                    placeholderTextColor={colors.textSecondary}
                    value={briefText}
                    onChangeText={setBriefText}
                    multiline
                    textAlignVertical="top"
                />

                <Pressable style={[styles.interpretBtn, !briefText.trim() && { opacity: 0.5 }]} onPress={handleInterpret} disabled={!briefText.trim() || loading}>
                    {loading ? (
                        <ActivityIndicator color={colors.textDark} />
                    ) : (
                        <Text style={styles.interpretBtnText}>Interpret Brief</Text>
                    )}
                </Pressable>

                {result ? (
                    <View style={styles.resultCard}>
                        <Text style={styles.resultTitle}>Analysis</Text>
                        {result.map((section, idx) => (
                            <View key={idx} style={styles.section}>
                                <Text style={styles.sectionTitle}>{section.title}</Text>
                                {section.items.map((item, i) => (
                                    <View key={i} style={styles.bulletRow}>
                                        <Text style={styles.bullet}>•</Text>
                                        <Text style={styles.bulletText}>{item}</Text>
                                    </View>
                                ))}
                            </View>
                        ))}

                        {/* Suggested Questions */}
                        <View style={styles.questionsSection}>
                            <Text style={styles.questionsTitle}>💬 Suggested Questions to Ask</Text>
                            {generateQuestions(briefText, result).map((q, i) => (
                                <View key={i} style={styles.questionRow}>
                                    <Text style={styles.questionNum}>{i + 1}.</Text>
                                    <Text style={styles.questionText}>{q}</Text>
                                </View>
                            ))}
                        </View>
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
    textArea: {
        backgroundColor: colors.surface,
        borderRadius: radii.card,
        borderWidth: 1,
        borderColor: colors.outline,
        padding: spacing.md,
        color: colors.textPrimary,
        fontFamily: fonts.regular,
        fontSize: fonts.size.md,
        minHeight: 160,
        lineHeight: 22,
    },
    interpretBtn: { backgroundColor: colors.accentGreen, borderRadius: radii.pill, paddingVertical: 14, alignItems: "center", marginTop: spacing.md },
    interpretBtnText: { color: colors.textDark, fontFamily: fonts.bold, fontSize: fonts.size.md },
    resultCard: { backgroundColor: colors.surface, borderRadius: radii.card, borderWidth: 1, borderColor: colors.outline, padding: spacing.lg },
    resultTitle: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.lg, marginBottom: spacing.md },
    section: { marginBottom: spacing.lg },
    sectionTitle: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.md, marginBottom: spacing.sm },
    bulletRow: { flexDirection: "row", gap: spacing.sm, marginBottom: 6 },
    bullet: { color: colors.accentYellow, fontFamily: fonts.bold, fontSize: fonts.size.md },
    bulletText: { flex: 1, color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.md, lineHeight: 20 },
    questionsSection: { marginTop: spacing.lg, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.outline },
    questionsTitle: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.lg, marginBottom: spacing.md },
    questionRow: { flexDirection: "row" as const, gap: spacing.sm, marginBottom: spacing.sm },
    questionNum: { color: colors.accentGreen, fontFamily: fonts.bold, fontSize: fonts.size.md, width: 20 },
    questionText: { flex: 1, color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.md, lineHeight: 22 },
});
