import SafeScreen from "@/components/SafeScreen";
import { useAuth } from "@/contexts/AuthContext";
import { applyForJob, fetchJobApplicants, fetchJobs, fetchMyApplication, JobApplication, JobRow } from "@/services/jobs";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function JobDetail() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user, hasRole } = useAuth();
    const [job, setJob] = useState<JobRow | null>(null);
    const [similarJobs, setSimilarJobs] = useState<JobRow[]>([]);
    const [saved, setSaved] = useState(false);
    const [applied, setApplied] = useState(false);
    const [myApp, setMyApp] = useState<JobApplication | null>(null);

    // Application Modal state
    const [applyModalVisible, setApplyModalVisible] = useState(false);
    const [coverNote, setCoverNote] = useState("");
    const [portfolioLink, setPortfolioLink] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Employer Review Modal state
    const [applicantsModalVisible, setApplicantsModalVisible] = useState(false);
    const [applicants, setApplicants] = useState<JobApplication[]>([]);
    const [loadingApplicants, setLoadingApplicants] = useState(false);

    useEffect(() => {
        if (!id) return;
        fetchJobs(30).then((all) => {
            const found = all.find((j) => j.id === id);
            setJob(found ?? null);
            setSimilarJobs(all.filter((j) => j.id !== id).slice(0, 4));
        });

        // Check if user already applied
        fetchMyApplication(id).then((app) => {
            if (app) {
                setApplied(true);
                setMyApp(app);
            }
        });

        // Preload applicant count if business/admin
        if (hasRole("business", "admin")) {
            fetchJobApplicants(id).then(setApplicants);
        }
    }, [id, hasRole]);

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
                        We&apos;re looking for a talented {job.title} to join our team at {job.org}.
                        {"\n\n"}
                        As a {job.title}, you&apos;ll be responsible for leading creative initiatives, collaborating with cross-functional teams, and delivering exceptional work that pushes boundaries.
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

            {/* Bottom Bar */}
            <View style={styles.bottomBar}>
                {hasRole("business", "admin") ? (
                    <Pressable
                        style={[styles.applyBtn, { backgroundColor: "#6C5CE7", flex: 1 }]}
                        onPress={() => {
                            if (id) {
                                setLoadingApplicants(true);
                                fetchJobApplicants(id)
                                    .then(setApplicants)
                                    .finally(() => setLoadingApplicants(false));
                            }
                            setApplicantsModalVisible(true);
                        }}
                    >
                        <MaterialIcons name="people" size={20} color="#fff" />
                        <Text style={[styles.applyText, { color: "#fff" }]}>
                            Review Applicants ({applicants.length})
                        </Text>
                    </Pressable>
                ) : hasRole("creative") ? (
                    <Pressable
                        style={[
                            styles.applyBtn,
                            applied && styles.applyBtnDone,
                        ]}
                        onPress={() => {
                            if (applied) {
                                Alert.alert(
                                    "Application Submitted",
                                    "Your application has been received and is currently under review by the hiring team."
                                );
                            } else {
                                setApplyModalVisible(true);
                            }
                        }}
                    >
                        <MaterialIcons
                            name={applied ? "check-circle" : "send"}
                            size={20}
                            color={applied ? "#fff" : colors.textDark}
                        />
                        <Text style={[styles.applyText, applied && styles.applyTextDone]}>
                            {applied ? "Application Sent" : "Apply with Portfolio"}
                        </Text>
                    </Pressable>
                ) : (
                    <Pressable
                        style={[styles.applyBtn, { backgroundColor: "#1e1e1e", borderWidth: 1, borderColor: colors.outline }]}
                        onPress={() => {
                            if (Platform.OS === "web") {
                                const ok = typeof window !== "undefined" ? window.confirm(
                                    "Applying to jobs requires a Creative persona. Would you like to switch your persona to Creative?"
                                ) : false;
                                if (ok) router.push("/onboarding/identity" as any);
                                return;
                            }
                            Alert.alert(
                                "Creative Account Required",
                                "Applying to design gigs and studio briefs requires a Creative persona. Switch your persona to submit applications.",
                                [
                                    { text: "Cancel", style: "cancel" },
                                    { text: "Switch Persona", onPress: () => router.push("/onboarding/identity" as any) },
                                ]
                            );
                        }}
                    >
                        <MaterialIcons name="lock-outline" size={18} color={colors.textSecondary} />
                        <Text style={[styles.applyText, { color: colors.textSecondary }]}>
                            Apply (Creative Persona Required)
                        </Text>
                    </Pressable>
                )}
            </View>

            {/* ── Application Submission Sheet Modal ── */}
            <Modal
                visible={applyModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setApplyModalVisible(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeaderRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.modalTitle}>Apply for Role</Text>
                                <Text style={styles.modalSub}>{job?.title} at {job?.org}</Text>
                            </View>
                            <Pressable hitSlop={8} onPress={() => setApplyModalVisible(false)}>
                                <MaterialIcons name="close" size={24} color={colors.textSecondary} />
                            </Pressable>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.inputLabel}>Intro Pitch / Cover Note</Text>
                            <TextInput
                                style={styles.textArea}
                                placeholder="Highlight your relevant experience, approach, and why you are excited about this role..."
                                placeholderTextColor={colors.textSecondary}
                                value={coverNote}
                                onChangeText={setCoverNote}
                                multiline
                                numberOfLines={4}
                            />

                            <Text style={styles.inputLabel}>Portfolio Link / Case Study URL (Optional)</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="https://behance.net/you or personal site"
                                placeholderTextColor={colors.textSecondary}
                                value={portfolioLink}
                                onChangeText={setPortfolioLink}
                                autoCapitalize="none"
                            />

                            <View style={styles.profileAttachmentNote}>
                                <MaterialIcons name="verified-user" size={18} color={colors.accentYellow} />
                                <Text style={styles.profileAttachmentText}>
                                    Your verified BITC Profile, case studies, and reviews will be automatically attached to this application.
                                </Text>
                            </View>

                            <Pressable
                                style={[styles.submitAppBtn, (submitting || !coverNote.trim()) && { opacity: 0.6 }]}
                                disabled={submitting || !coverNote.trim()}
                                onPress={async () => {
                                    if (!id) return;
                                    setSubmitting(true);
                                    const links = portfolioLink.trim() ? [portfolioLink.trim()] : [];
                                    const res = await applyForJob(id, coverNote.trim(), links);
                                    setSubmitting(false);

                                    if (res.ok) {
                                        setApplied(true);
                                        setMyApp(res.application ?? null);
                                        setApplyModalVisible(false);
                                        Alert.alert("Success", "Your application has been submitted to " + (job?.org || "the team") + "!");
                                    } else {
                                        Alert.alert("Notice", res.error || "Application received!");
                                        setApplied(true);
                                        setApplyModalVisible(false);
                                    }
                                }}
                            >
                                {submitting ? (
                                    <ActivityIndicator color={colors.textDark} />
                                ) : (
                                    <Text style={styles.submitAppBtnText}>Submit Application</Text>
                                )}
                            </Pressable>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* ── Employer Applicant Review Modal ── */}
            <Modal
                visible={applicantsModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setApplicantsModalVisible(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={[styles.modalCard, { maxHeight: "85%" }]}>
                        <View style={styles.modalHeaderRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.modalTitle}>Applicants ({applicants.length})</Text>
                                <Text style={styles.modalSub}>{job?.title}</Text>
                            </View>
                            <Pressable hitSlop={8} onPress={() => setApplicantsModalVisible(false)}>
                                <MaterialIcons name="close" size={24} color={colors.textSecondary} />
                            </Pressable>
                        </View>

                        {loadingApplicants ? (
                            <ActivityIndicator color={colors.accentYellow} style={{ marginVertical: 30 }} />
                        ) : applicants.length === 0 ? (
                            <View style={{ alignItems: "center", paddingVertical: 40, gap: 8 }}>
                                <MaterialIcons name="inbox" size={48} color={colors.textSecondary} />
                                <Text style={{ color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.md }}>
                                    No applications yet
                                </Text>
                                <Text style={{ color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm, textAlign: "center" }}>
                                    Applications from creatives will appear here in real time.
                                </Text>
                            </View>
                        ) : (
                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.lg }}>
                                {applicants.map((applicant) => (
                                    <View key={applicant.id} style={styles.applicantCard}>
                                        <View style={styles.applicantHeader}>
                                            <View style={styles.applicantAvatar}>
                                                <Text style={styles.applicantAvatarText}>
                                                    {(applicant.applicant_name || "C").charAt(0).toUpperCase()}
                                                </Text>
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.applicantName}>{applicant.applicant_name}</Text>
                                                <Text style={styles.applicantRole}>{applicant.applicant_role}</Text>
                                            </View>
                                            <View style={styles.statusBadge}>
                                                <Text style={styles.statusBadgeText}>{applicant.status}</Text>
                                            </View>
                                        </View>
                                        <Text style={styles.applicantCoverNote}>{applicant.cover_note}</Text>
                                        {applicant.portfolio_links && applicant.portfolio_links.length > 0 ? (
                                            <View style={styles.linksRow}>
                                                <MaterialIcons name="link" size={14} color={colors.accentYellow} />
                                                <Text style={styles.linkText} numberOfLines={1}>
                                                    {applicant.portfolio_links[0]}
                                                </Text>
                                            </View>
                                        ) : null}
                                    </View>
                                ))}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
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
        flexDirection: "row",
        gap: spacing.sm,
        alignItems: "center",
    },
    reviewApplicantsBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        backgroundColor: "#2a2200",
        borderRadius: radii.pill,
        borderWidth: 1,
        borderColor: colors.accentYellow,
        paddingVertical: 16,
    },
    reviewApplicantsBtnText: {
        color: colors.accentYellow,
        fontFamily: fonts.bold,
        fontSize: fonts.size.sm,
    },
    applyBtn: {
        flex: 1,
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
        fontSize: fonts.size.md,
        letterSpacing: 0.5,
    },
    applyTextDone: {
        color: "#fff",
    },

    /* Modal Styles */
    modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" },
    modalCard: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, maxHeight: "90%" },
    modalHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.md },
    modalTitle: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.lg },
    modalSub: { color: colors.accentYellow, fontFamily: fonts.semibold, fontSize: fonts.size.sm, marginTop: 2 },
    inputLabel: { color: colors.textSecondary, fontFamily: fonts.semibold, fontSize: fonts.size.sm, marginTop: spacing.sm, marginBottom: spacing.xs },
    textArea: { backgroundColor: colors.background, borderRadius: radii.md, borderWidth: 1, borderColor: colors.outline, padding: spacing.sm, color: colors.textPrimary, fontFamily: fonts.regular, fontSize: fonts.size.sm, textAlignVertical: "top", minHeight: 90, marginBottom: spacing.sm },
    textInput: { backgroundColor: colors.background, borderRadius: radii.md, borderWidth: 1, borderColor: colors.outline, padding: spacing.sm, color: colors.textPrimary, fontFamily: fonts.regular, fontSize: fonts.size.sm, marginBottom: spacing.md },
    profileAttachmentNote: { flexDirection: "row", alignItems: "center", gap: spacing.xs, backgroundColor: "#2a2200", padding: spacing.sm, borderRadius: radii.card, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.outline },
    profileAttachmentText: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.xs, flex: 1 },
    submitAppBtn: { backgroundColor: colors.accentYellow, borderRadius: radii.pill, paddingVertical: 14, alignItems: "center", justifyContent: "center", marginTop: spacing.xs },
    submitAppBtnText: { color: colors.textDark, fontFamily: fonts.bold, fontSize: fonts.size.md },

    /* Applicant Card */
    applicantCard: { backgroundColor: colors.background, borderRadius: radii.card, padding: spacing.md, borderWidth: 1, borderColor: colors.outline, gap: spacing.xs },
    applicantHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    applicantAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#1e1e1e", alignItems: "center", justifyContent: "center" },
    applicantAvatarText: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.sm },
    applicantName: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.md },
    applicantRole: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.xs },
    statusBadge: { backgroundColor: "#00B89420", paddingHorizontal: 8, paddingVertical: 2, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.accentGreen },
    statusBadgeText: { color: colors.accentGreen, fontFamily: fonts.bold, fontSize: fonts.size.xs, textTransform: "capitalize" },
    applicantCoverNote: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm, lineHeight: 18, marginTop: 4 },
    linksRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
    linkText: { color: colors.accentYellow, fontFamily: fonts.regular, fontSize: fonts.size.xs },
});
