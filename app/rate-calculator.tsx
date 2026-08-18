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
    View
} from "react-native";

type ExperienceLevel = "Junior" | "Mid" | "Senior" | "Expert";
type ProjectScope = "Small" | "Medium" | "Large" | "Enterprise";

const SKILL_TYPES = [
    "UI/UX Design",
    "Web Development",
    "Mobile Development",
    "Brand Design",
    "Motion Graphics",
    "Illustration",
    "Photography",
    "Content Writing",
    "Social Media",
    "Consulting",
] as const;

const RATE_DATA: Record<string, Record<ExperienceLevel, { hourly: [number, number]; project: [number, number] }>> = {
    "UI/UX Design": { Junior: { hourly: [25, 45], project: [500, 1500] }, Mid: { hourly: [50, 80], project: [1500, 4000] }, Senior: { hourly: [80, 130], project: [4000, 10000] }, Expert: { hourly: [130, 200], project: [10000, 25000] } },
    "Web Development": { Junior: { hourly: [30, 50], project: [800, 2000] }, Mid: { hourly: [55, 90], project: [2000, 6000] }, Senior: { hourly: [90, 150], project: [6000, 15000] }, Expert: { hourly: [150, 250], project: [15000, 40000] } },
    "Mobile Development": { Junior: { hourly: [35, 55], project: [1000, 3000] }, Mid: { hourly: [60, 100], project: [3000, 8000] }, Senior: { hourly: [100, 160], project: [8000, 20000] }, Expert: { hourly: [160, 280], project: [20000, 50000] } },
    "Brand Design": { Junior: { hourly: [20, 40], project: [400, 1200] }, Mid: { hourly: [40, 70], project: [1200, 3500] }, Senior: { hourly: [70, 120], project: [3500, 8000] }, Expert: { hourly: [120, 180], project: [8000, 20000] } },
    "Motion Graphics": { Junior: { hourly: [30, 50], project: [600, 2000] }, Mid: { hourly: [50, 85], project: [2000, 5000] }, Senior: { hourly: [85, 140], project: [5000, 12000] }, Expert: { hourly: [140, 220], project: [12000, 30000] } },
    "Illustration": { Junior: { hourly: [20, 35], project: [300, 800] }, Mid: { hourly: [35, 65], project: [800, 2500] }, Senior: { hourly: [65, 110], project: [2500, 7000] }, Expert: { hourly: [110, 175], project: [7000, 18000] } },
    "Photography": { Junior: { hourly: [25, 40], project: [200, 600] }, Mid: { hourly: [40, 75], project: [600, 2000] }, Senior: { hourly: [75, 120], project: [2000, 5000] }, Expert: { hourly: [120, 200], project: [5000, 15000] } },
    "Content Writing": { Junior: { hourly: [15, 30], project: [200, 500] }, Mid: { hourly: [30, 55], project: [500, 1500] }, Senior: { hourly: [55, 90], project: [1500, 4000] }, Expert: { hourly: [90, 150], project: [4000, 10000] } },
    "Social Media": { Junior: { hourly: [15, 30], project: [300, 800] }, Mid: { hourly: [30, 55], project: [800, 2000] }, Senior: { hourly: [55, 90], project: [2000, 5000] }, Expert: { hourly: [90, 150], project: [5000, 12000] } },
    "Consulting": { Junior: { hourly: [40, 70], project: [1000, 3000] }, Mid: { hourly: [70, 120], project: [3000, 8000] }, Senior: { hourly: [120, 200], project: [8000, 20000] }, Expert: { hourly: [200, 350], project: [20000, 50000] } },
};

const SCOPE_MULTIPLIER: Record<ProjectScope, number> = { Small: 0.85, Medium: 1.0, Large: 1.2, Enterprise: 1.5 };

export default function RateCalculator() {
    const router = useRouter();
    const [skill, setSkill] = useState<string>(SKILL_TYPES[0]);
    const [experience, setExperience] = useState<ExperienceLevel>("Mid");
    const [scope, setScope] = useState<ProjectScope>("Medium");
    const [result, setResult] = useState<{ hourly: [number, number]; project: [number, number] } | null>(null);

    function calculate() {
        const base = RATE_DATA[skill]?.[experience];
        if (!base) return;
        const m = SCOPE_MULTIPLIER[scope];
        setResult({
            hourly: [Math.round(base.hourly[0] * m), Math.round(base.hourly[1] * m)],
            project: [Math.round(base.project[0] * m), Math.round(base.project[1] * m)],
        });
    }

    return (
        <SafeScreen>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={10}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
                </Pressable>
                <Text style={styles.title}>AI Rate Calculator</Text>
                <Text style={styles.subtitle}>Get fair pricing for your services based on industry data, experience, and scope.</Text>

                {/* Skill Type */}
                <Text style={styles.label}>Your Skill</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                    {SKILL_TYPES.map((s) => (
                        <Pressable key={s} style={[styles.chip, skill === s && styles.chipActive]} onPress={() => setSkill(s)}>
                            <Text style={[styles.chipText, skill === s && styles.chipTextActive]}>{s}</Text>
                        </Pressable>
                    ))}
                </ScrollView>

                {/* Experience Level */}
                <Text style={styles.label}>Experience Level</Text>
                <View style={styles.chipRow}>
                    {(["Junior", "Mid", "Senior", "Expert"] as ExperienceLevel[]).map((l) => (
                        <Pressable key={l} style={[styles.chip, experience === l && styles.chipActive]} onPress={() => setExperience(l)}>
                            <Text style={[styles.chipText, experience === l && styles.chipTextActive]}>{l}</Text>
                        </Pressable>
                    ))}
                </View>

                {/* Project Scope */}
                <Text style={styles.label}>Project Scope</Text>
                <View style={styles.chipRow}>
                    {(["Small", "Medium", "Large", "Enterprise"] as ProjectScope[]).map((s) => (
                        <Pressable key={s} style={[styles.chip, scope === s && styles.chipActive]} onPress={() => setScope(s)}>
                            <Text style={[styles.chipText, scope === s && styles.chipTextActive]}>{s}</Text>
                        </Pressable>
                    ))}
                </View>

                <Pressable style={styles.calculateBtn} onPress={calculate}>
                    <Text style={styles.calculateBtnText}>Calculate Rate</Text>
                </Pressable>

                {result ? (
                    <View style={styles.resultCard}>
                        <Text style={styles.resultTitle}>Recommended Rates</Text>
                        <View style={styles.resultRow}>
                            <View style={styles.resultBlock}>
                                <Text style={styles.resultLabel}>Hourly Rate</Text>
                                <Text style={styles.resultValue}>${result.hourly[0]} – ${result.hourly[1]}</Text>
                            </View>
                            <View style={styles.resultBlock}>
                                <Text style={styles.resultLabel}>Project Rate</Text>
                                <Text style={styles.resultValue}>${result.project[0].toLocaleString()} – ${result.project[1].toLocaleString()}</Text>
                            </View>
                        </View>
                        <View style={styles.tipCard}>
                            <MaterialIcons name="lightbulb" size={18} color={colors.accentYellow} />
                            <Text style={styles.tipText}>
                                These rates are based on global market data for {skill} professionals at the {experience} level. Adjust for your local market.
                            </Text>
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
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xs },
    chip: { borderRadius: radii.pill, borderWidth: 1, borderColor: colors.outline, paddingVertical: 8, paddingHorizontal: spacing.md, backgroundColor: colors.surface },
    chipActive: { borderColor: colors.accentYellow, backgroundColor: "#2a2200" },
    chipText: { color: colors.textSecondary, fontFamily: fonts.semibold, fontSize: fonts.size.sm },
    chipTextActive: { color: colors.accentYellow },
    calculateBtn: { backgroundColor: colors.accentGreen, borderRadius: radii.pill, paddingVertical: 14, alignItems: "center", marginTop: spacing.lg },
    calculateBtnText: { color: colors.textDark, fontFamily: fonts.bold, fontSize: fonts.size.md },
    resultCard: { backgroundColor: colors.surface, borderRadius: radii.card, borderWidth: 1, borderColor: colors.outline, padding: spacing.lg, marginTop: spacing.md },
    resultTitle: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.lg, marginBottom: spacing.md },
    resultRow: { flexDirection: "row", gap: spacing.md },
    resultBlock: { flex: 1, backgroundColor: "#1a1a1a", borderRadius: radii.sm, padding: spacing.md },
    resultLabel: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm },
    resultValue: { color: colors.accentYellow, fontFamily: fonts.bold, fontSize: fonts.size.lg, marginTop: 4 },
    tipCard: { flexDirection: "row", gap: spacing.sm, backgroundColor: "#2a2200", borderRadius: radii.sm, padding: spacing.md, marginTop: spacing.md },
    tipText: { flex: 1, color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm, lineHeight: 20 },
});
