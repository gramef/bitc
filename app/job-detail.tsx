import SafeScreen from "@/components/SafeScreen";
import { fetchJobs, JobRow } from "@/services/jobs";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Dimensions,
    Pressable,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function JobDetail() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [job, setJob] = useState<JobRow | null>(null);
    const [similarJobs, setSimilarJobs] = useState<JobRow[]>([]);
    const [saved, setSaved] = useState(false);
    const [applied, setApplied] = useState(false);

    useEffect(() => {
        fetchJobs(30).then((all) => {
            const found = all.find((j) => j.id === id);
            setJob(found ?? null);
            setSimilarJobs(all.filter((j) => j.id !== id).slice(0, 4));
        });
    }, [id]);

    function formatPosted(d?: string | null) {
        if (!d) return "Recently";
        try {
            const diff = Date.now() - new Date(d).getTime();
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            if (days === 0) return "Today";
            if (days === 1) return "Yesterday";
            if (days < 7) return `${days} days ago`;
            if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
            return `${Math.floor(days / 30)} months ago`;
        } catch {
            return d;
        }
    }

    async function shareJob() {
        if (!job) return;
        try {
            await Share.share({
                message: `Check out this role: ${job.title} at ${job.org} on BITC!`,
            });
        } catch { }
    }

    if (!job) {
        return (
            <SafeScreen>
                <View style={styles.loadingWrap}>
                    <Pressable onPress={() => router.back()} style={styles.backBtnAbs}>
                        <MaterialIcons name="arrow-back" size={24} color="#fff" />
                    </Pressable>
                    <Text style={styles.loadingText}>Loading job…</Text>
                </View>
            </SafeScreen>
        );
    }

    return (
        <SafeScreen>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
                        <MaterialIcons name="arrow-back" size={22} color="#fff" />
                    </Pressable>
                    <Text style={styles.headerTitle}>Job Details</Text>
                    <View style={styles.headerRight}>
                        <Pressable onPress={shareJob} hitSlop={8}>
                            <MaterialIcons name="share" size={20} color={colors.textPrimary} />
                        </Pressable>
                        <Pressable onPress={() => setSaved(!saved)} hitSlop={8}>
                            <MaterialIcons
                                name={saved ? "bookmark" : "bookmark-border"}
                                size={22}
                                color={saved ? colors.accentYellow : colors.textPrimary}
                            />
                        </Pressable>
                    </View>
                </View>

                {/* Company Card */}
                <View style={styles.companyCard}>
                    <View style={styles.companyLogoWrap}>
                        {job.image_url ? (
                            <Image source={{ uri: job.image_url }} style={styles.companyLogo} contentFit="cover" />
                        ) : (
                            <View style={styles.companyLogoPlaceholder}>
                                <Text style={styles.companyLogoText}>
                                    {job.org.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.jobTitle}>{job.title}</Text>
                    <Text style={styles.companyName}>{job.org}</Text>

                    <View style={styles.badges}>
                        {job.type && (
                            <View style={[styles.badge, { backgroundColor: "#6C5CE720" }]}>
                                <MaterialIcons name="schedule" size={14} color="#6C5CE7" />
                                <Text style={[styles.badgeText, { color: "#6C5CE7" }]}>{job.type}</Text>
                            </View>
                        )}
                        {job.remote && (
                            <View style={[styles.badge, { backgroundColor: "#00B89420" }]}>
                                <MaterialIcons name="wifi" size={14} color="#00B894" />
                                <Text style={[styles.badgeText, { color: "#00B894" }]}>Remote</Text>
                            </View>
                        )}
                        {job.experience && (
                            <View style={[styles.badge, { backgroundColor: "#E1705520" }]}>
                                <MaterialIcons name="trending-up" size={14} color="#E17055" />
                                <Text style={[styles.badgeText, { color: "#E17055" }]}>{job.experience}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Info Grid */}
                <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                        <View style={[styles.infoIconWrap, { backgroundColor: "#6C5CE720" }]}>
                            <MaterialIcons name="location-on" size={18} color="#6C5CE7" />
                        </View>
                        <Text style={styles.infoLabel}>Location</Text>
                        <Text style={styles.infoValue}>{job.location ?? "Not specified"}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <View style={[styles.infoIconWrap, { backgroundColor: "#00B89420" }]}>
                            <MaterialIcons name="payments" size={18} color="#00B894" />
                        </View>
                        <Text style={styles.infoLabel}>Salary</Text>
                        <Text style={styles.infoValue}>{job.salary ?? "Competitive"}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <View style={[styles.infoIconWrap, { backgroundColor: "#E1705520" }]}>
                            <MaterialIcons name="access-time" size={18} color="#E17055" />
                        </View>
                        <Text style={styles.infoLabel}>Posted</Text>
                        <Text style={styles.infoValue}>{formatPosted(job.posted_at)}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <View style={[styles.infoIconWrap, { backgroundColor: "#D6B22620" }]}>
                            <MaterialIcons name="people" size={18} color={colors.accentYellow} />
                        </View>
                        <Text style={styles.infoLabel}>Applicants</Text>
                        <Text style={styles.infoValue}>{Math.floor(Math.random() * 50 + 5)}+</Text>
                    </View>
                </View>

                {/* Description */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Job Description</Text>
                    <Text style={styles.descText}>
                        We're looking for a talented {job.title} to join our team at {job.org}.
                        {"\n\n"}
                        As a {job.title}, you'll be responsible for leading creative initiatives, collaborating with cross-functional teams, and delivering exceptional work that pushes boundaries.
                    </Text>
                </View>

                {/* Requirements */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Requirements</Text>
                    {[
                        `${job.experience ?? "2+"} years of relevant experience`,
                        "Strong portfolio demonstrating creative excellence",
                        "Proficiency with industry-standard tools",
                        "Excellent communication and collaboration skills",
                        "Self-motivated with attention to detail",
                    ].map((req, i) => (
                        <View key={i} style={styles.reqRow}>
                            <View style={styles.reqBullet}>
                                <MaterialIcons name="check" size={14} color={colors.accentGreen} />
                            </View>
                            <Text style={styles.reqText}>{req}</Text>
                        </View>
                    ))}
                </View>

                {/* Benefits */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Benefits</Text>
                    <View style={styles.benefitsGrid}>
                        {[
                            { icon: "laptop-mac" as const, label: "Remote Friendly" },
                            { icon: "school" as const, label: "Learning Budget" },
                            { icon: "fitness-center" as const, label: "Health & Wellness" },
                            { icon: "event" as const, label: "Flexible Hours" },
                        ].map((b, i) => (
                            <View key={i} style={styles.benefitItem}>
                                <MaterialIcons name={b.icon} size={20} color={colors.accentYellow} />
                                <Text style={styles.benefitLabel}>{b.label}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Similar Jobs */}
                {similarJobs.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Similar Jobs</Text>
                        {similarJobs.map((sj) => (
                            <Pressable
                                key={sj.id}
                                style={styles.similarCard}
                                onPress={() => router.push(`/job-detail?id=${sj.id}` as any)}
                            >
                                <View style={styles.similarLogoWrap}>
                                    <Text style={styles.similarLogoText}>
                                        {sj.org.charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.similarTitle} numberOfLines={1}>{sj.title}</Text>
                                    <Text style={styles.similarOrg}>{sj.org}</Text>
                                    <Text style={styles.similarMeta}>
                                        {sj.type ?? "Full-time"} • {sj.location ?? "Remote"}
                                    </Text>
                                </View>
                                <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
                            </Pressable>
                        ))}
                    </View>
                )}

                {/* Spacer for bottom bar */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Bottom CTA */}
            <View style={styles.bottomBar}>
                <Pressable
                    style={[styles.applyBtn, applied && styles.applyBtnDone]}
                    onPress={() => setApplied(true)}
                >
                    <MaterialIcons
                        name={applied ? "check-circle" : "send"}
                        size={20}
                        color={applied ? "#fff" : colors.textDark}
                    />
                    <Text style={[styles.applyText, applied && styles.applyTextDone]}>
                        {applied ? "Applied!" : "Apply Now"}
                    </Text>
                </Pressable>
            </View>
        </SafeScreen>
    );
}

const styles = StyleSheet.create({
    loadingWrap: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.background,
    },
    loadingText: {
        color: colors.textSecondary,
        fontFamily: fonts.regular,
        fontSize: fonts.size.md,
        marginTop: 16,
    },
    backBtnAbs: {
        position: "absolute",
        top: 16,
        left: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.15)",
        alignItems: "center",
        justifyContent: "center",
    },
    scrollContent: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.xl,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: spacing.lg,
    },
    backBtn: {
        paddingVertical: spacing.sm,
        paddingRight: spacing.md,
    },
    headerTitle: {
        color: colors.textPrimary,
        fontFamily: fonts.bold,
        fontSize: fonts.size.xl,
    },
    headerRight: {
        flexDirection: "row",
        gap: spacing.md,
        alignItems: "center",
    },
    companyCard: {
        backgroundColor: colors.surface,
        borderRadius: radii.card,
        borderWidth: 1,
        borderColor: colors.outline,
        padding: spacing.xl,
        alignItems: "center",
        marginBottom: spacing.lg,
    },
    companyLogoWrap: {
        width: 72,
        height: 72,
        borderRadius: 20,
        overflow: "hidden",
        marginBottom: spacing.md,
        backgroundColor: "#2a2200",
    },
    companyLogo: {
        width: "100%",
        height: "100%",
    },
    companyLogoPlaceholder: {
        width: "100%",
        height: "100%",
        backgroundColor: "#2a2200",
        alignItems: "center",
        justifyContent: "center",
    },
    companyLogoText: {
        color: colors.accentYellow,
        fontFamily: fonts.bold,
        fontSize: 28,
    },
    jobTitle: {
        color: colors.textPrimary,
        fontFamily: fonts.bold,
        fontSize: 22,
        textAlign: "center",
        marginBottom: 4,
    },
    companyName: {
        color: colors.textSecondary,
        fontFamily: fonts.regular,
        fontSize: fonts.size.md,
        marginBottom: spacing.md,
    },
    badges: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: spacing.sm,
    },
    badge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: radii.pill,
    },
    badgeText: {
        fontFamily: fonts.semibold,
        fontSize: fonts.size.xs,
    },
    infoGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    infoItem: {
        width: (width - spacing.lg * 2 - spacing.sm) / 2,
        backgroundColor: colors.surface,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: colors.outline,
        padding: spacing.md,
        alignItems: "center",
    },
    infoIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: spacing.xs,
    },
    infoLabel: {
        color: colors.textSecondary,
        fontFamily: fonts.regular,
        fontSize: fonts.size.xs,
        marginBottom: 2,
    },
    infoValue: {
        color: colors.textPrimary,
        fontFamily: fonts.semibold,
        fontSize: fonts.size.sm,
        textAlign: "center",
    },
    section: {
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        color: colors.textPrimary,
        fontFamily: fonts.bold,
        fontSize: fonts.size.xl,
        marginBottom: spacing.md,
    },
    descText: {
        color: colors.textSecondary,
        fontFamily: fonts.regular,
        fontSize: fonts.size.md,
        lineHeight: 24,
    },
    reqRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: spacing.md,
        marginBottom: spacing.sm,
    },
    reqBullet: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: "#00B89420",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 2,
    },
    reqText: {
        flex: 1,
        color: colors.textSecondary,
        fontFamily: fonts.regular,
        fontSize: fonts.size.md,
        lineHeight: 22,
    },
    benefitsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
    },
    benefitItem: {
        width: (width - spacing.lg * 2 - spacing.sm) / 2,
        backgroundColor: colors.surface,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: colors.outline,
        padding: spacing.md,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },
    benefitLabel: {
        color: colors.textSecondary,
        fontFamily: fonts.semibold,
        fontSize: fonts.size.sm,
        flex: 1,
    },
    similarCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        backgroundColor: colors.surface,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: colors.outline,
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    similarLogoWrap: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: "#2a2200",
        alignItems: "center",
        justifyContent: "center",
    },
    similarLogoText: {
        color: colors.accentYellow,
        fontFamily: fonts.bold,
        fontSize: 18,
    },
    similarTitle: {
        color: colors.textPrimary,
        fontFamily: fonts.semibold,
        fontSize: fonts.size.md,
    },
    similarOrg: {
        color: colors.textSecondary,
        fontFamily: fonts.regular,
        fontSize: fonts.size.sm,
        marginTop: 2,
    },
    similarMeta: {
        color: colors.textSecondary,
        fontFamily: fonts.regular,
        fontSize: fonts.size.xs,
        marginTop: 2,
    },
    bottomBar: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        paddingBottom: 28,
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.outline,
    },
    applyBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: colors.accentYellow,
        borderRadius: radii.pill,
        paddingVertical: 16,
    },
    applyBtnDone: {
        backgroundColor: colors.accentGreen,
    },
    applyText: {
        color: colors.textDark,
        fontFamily: fonts.bold,
        fontSize: fonts.size.lg,
        letterSpacing: 0.5,
    },
    applyTextDone: {
        color: "#fff",
    },
});
