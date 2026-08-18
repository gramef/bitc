import SafeScreen from "@/components/SafeScreen";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

type TemplateType = "Freelance" | "Retainer" | "NDA" | "Licensing";

const TEMPLATES: Record<TemplateType, { title: string; sections: { heading: string; body: string }[] }> = {
    Freelance: {
        title: "Freelance Service Agreement",
        sections: [
            { heading: "1. Scope of Work", body: "The Contractor agrees to provide [DESCRIBE SERVICES] for the Client as outlined in this agreement. All deliverables will be provided in [FORMAT] within the agreed timeline." },
            { heading: "2. Timeline", body: "Work shall commence on [START DATE] and all deliverables shall be completed by [END DATE]. Any extensions must be agreed upon in writing by both parties." },
            { heading: "3. Payment Terms", body: "The Client agrees to pay a total of [AMOUNT] for the services described. Payment schedule: [DEPOSIT AMOUNT] due upon signing, remaining balance due upon delivery of final deliverables." },
            { heading: "4. Revisions", body: "This agreement includes [NUMBER] rounds of revisions. Additional revisions will be billed at [HOURLY RATE] per hour." },
            { heading: "5. Intellectual Property", body: "Upon full payment, all intellectual property rights for the deliverables will transfer to the Client. The Contractor retains the right to display the work in their portfolio." },
            { heading: "6. Termination", body: "Either party may terminate this agreement with [NOTICE PERIOD] written notice. The Client will pay for all work completed up to the termination date." },
        ],
    },
    Retainer: {
        title: "Monthly Retainer Agreement",
        sections: [
            { heading: "1. Retainer Services", body: "The Contractor will provide up to [HOURS] hours of [SERVICE TYPE] services per month. Unused hours do not roll over to the following month." },
            { heading: "2. Monthly Fee", body: "The Client agrees to pay [MONTHLY AMOUNT] at the beginning of each month. Late payments may incur a [PERCENTAGE]% late fee." },
            { heading: "3. Scope", body: "Services covered under this retainer include: [LIST SERVICES]. Work outside this scope will be quoted separately." },
            { heading: "4. Communication", body: "The Contractor will be available during [BUSINESS HOURS] for communication. Response time for non-urgent requests is within [TIMEFRAME]." },
            { heading: "5. Duration", body: "This retainer is valid for [DURATION] and will auto-renew unless cancelled with [NOTICE PERIOD] written notice." },
        ],
    },
    NDA: {
        title: "Non-Disclosure Agreement",
        sections: [
            { heading: "1. Definition of Confidential Information", body: "\"Confidential Information\" includes all data, materials, documents, and information disclosed by the Disclosing Party that is marked confidential or that a reasonable person would consider confidential." },
            { heading: "2. Obligations", body: "The Receiving Party agrees to: (a) hold all Confidential Information in strict confidence; (b) not disclose to any third party; (c) use it only for the purpose of [PROJECT/RELATIONSHIP]." },
            { heading: "3. Exclusions", body: "This obligation does not apply to information that: (a) is publicly available; (b) was known before disclosure; (c) is independently developed; or (d) is required by law to be disclosed." },
            { heading: "4. Duration", body: "This NDA remains in effect for [DURATION] from the date of signing, or [DURATION] after the termination of the business relationship, whichever is longer." },
            { heading: "5. Remedies", body: "The Disclosing Party is entitled to seek injunctive relief for any breach. The Receiving Party will be liable for damages resulting from unauthorised disclosure." },
        ],
    },
    Licensing: {
        title: "Content Licensing Agreement",
        sections: [
            { heading: "1. Licensed Content", body: "The Licensor grants the Licensee a [EXCLUSIVE/NON-EXCLUSIVE] license to use [DESCRIBE CONTENT] for [PURPOSE]." },
            { heading: "2. License Fee", body: "The Licensee agrees to pay [AMOUNT] for the license described. Payment is due [PAYMENT TERMS]." },
            { heading: "3. Permitted Use", body: "The Licensee may use the licensed content for: [LIST PERMITTED USES]. The content may not be resold, redistributed, or sublicensed without written consent." },
            { heading: "4. Attribution", body: "The Licensee [MUST/IS NOT REQUIRED TO] provide attribution to the Licensor when using the licensed content." },
            { heading: "5. Duration & Territory", body: "This license is valid for [DURATION] and covers [TERRITORY/WORLDWIDE]. Upon expiration, all use must cease unless renewed." },
        ],
    },
};

export default function ContractTemplates() {
    const router = useRouter();
    const [selected, setSelected] = useState<TemplateType>("Freelance");
    const [editedSections, setEditedSections] = useState<Record<string, string>>({});

    const template = TEMPLATES[selected];

    function getBody(heading: string, defaultBody: string) {
        return editedSections[`${selected}-${heading}`] ?? defaultBody;
    }

    function setBody(heading: string, value: string) {
        setEditedSections((prev) => ({ ...prev, [`${selected}-${heading}`]: value }));
    }

    function copyAll() {
        const text = template.sections
            .map((s) => `${s.heading}\n\n${getBody(s.heading, s.body)}`)
            .join("\n\n---\n\n");
        const fullText = `${template.title}\n\n${text}`;
        Clipboard.setStringAsync(fullText);
        Alert.alert("Copied!", "The full contract has been copied to your clipboard.");
    }

    return (
        <SafeScreen>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={10}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
                </Pressable>
                <Text style={styles.title}>Contract Templates</Text>
                <Text style={styles.subtitle}>Select a contract type and customise the template for your project. Replace the bracketed placeholders with your own details.</Text>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                    {(Object.keys(TEMPLATES) as TemplateType[]).map((t) => (
                        <Pressable key={t} style={[styles.chip, selected === t && styles.chipActive]} onPress={() => setSelected(t)}>
                            <Text style={[styles.chipText, selected === t && styles.chipTextActive]}>{t}</Text>
                        </Pressable>
                    ))}
                </ScrollView>

                <View style={styles.templateCard}>
                    <View style={styles.templateHeader}>
                        <Text style={styles.templateTitle}>{template.title}</Text>
                        <Pressable style={styles.copyBtn} onPress={copyAll}>
                            <MaterialIcons name="content-copy" size={16} color={colors.textDark} />
                            <Text style={styles.copyBtnText}>Copy All</Text>
                        </Pressable>
                    </View>

                    {template.sections.map((section) => (
                        <View key={section.heading} style={styles.section}>
                            <Text style={styles.sectionHeading}>{section.heading}</Text>
                            <TextInput
                                style={styles.sectionBody}
                                value={getBody(section.heading, section.body)}
                                onChangeText={(v) => setBody(section.heading, v)}
                                multiline
                                textAlignVertical="top"
                            />
                        </View>
                    ))}
                </View>
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
    chipRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
    chip: { borderRadius: radii.pill, borderWidth: 1, borderColor: colors.outline, paddingVertical: 8, paddingHorizontal: spacing.md, backgroundColor: colors.surface },
    chipActive: { borderColor: colors.accentYellow, backgroundColor: "#2a2200" },
    chipText: { color: colors.textSecondary, fontFamily: fonts.semibold, fontSize: fonts.size.sm },
    chipTextActive: { color: colors.accentYellow },
    templateCard: { backgroundColor: colors.surface, borderRadius: radii.card, borderWidth: 1, borderColor: colors.outline, padding: spacing.lg },
    templateHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.lg },
    templateTitle: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.lg, flex: 1 },
    copyBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.accentYellow, borderRadius: radii.pill, paddingHorizontal: 12, paddingVertical: 6 },
    copyBtnText: { color: colors.textDark, fontFamily: fonts.semibold, fontSize: fonts.size.xs },
    section: { marginBottom: spacing.lg },
    sectionHeading: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.md, marginBottom: spacing.sm },
    sectionBody: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.md, lineHeight: 22, backgroundColor: "#1a1a1a", borderRadius: radii.sm, padding: spacing.md, borderWidth: 1, borderColor: colors.outline },
});
