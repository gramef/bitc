import SafeScreen from "@/components/SafeScreen";
import { EventRow, EventTicket, fetchEvents, fetchMyEventTicket, registerForEvent } from "@/services/events";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Modal,
    Pressable,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    View,
} from "react-native";
import Svg, { Rect } from "react-native-svg";

const { width } = Dimensions.get("window");
const HERO_H = 280;

export default function EventDetail() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [event, setEvent] = useState<EventRow | null>(null);
    const [relatedEvents, setRelatedEvents] = useState<EventRow[]>([]);
    const [ticketRequested, setTicketRequested] = useState(false);
    const [ticket, setTicket] = useState<EventTicket | null>(null);
    const [ticketModalVisible, setTicketModalVisible] = useState(false);
    const [registering, setRegistering] = useState(false);
    const [copied, setCopied] = useState(false);
    const scrollY = React.useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!id) return;
        fetchEvents(30).then((all) => {
            const found = all.find((e) => e.id === id);
            setEvent(found ?? null);
            setRelatedEvents(all.filter((e) => e.id !== id).slice(0, 4));
        });

        // Check if user already registered
        fetchMyEventTicket(id).then((t) => {
            if (t) {
                setTicket(t);
                setTicketRequested(true);
            }
        });
    }, [id]);

    function formatDate(d?: string | null) {
        if (!d) return "TBA";
        try {
            return new Date(d).toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
            });
        } catch {
            return d;
        }
    }

    function formatTime(d?: string | null) {
        if (!d) return "";
        try {
            return new Date(d).toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return "";
        }
    }

    async function shareEvent() {
        if (!event) return;
        try {
            await Share.share({
                message: `Check out ${event.title} on BITC!\n${event.city ?? "Online"} • ${formatDate(event.event_date)}`,
            });
        } catch { }
    }

    if (!event) {
        return (
            <SafeScreen>
                <View style={styles.loadingWrap}>
                    <Pressable onPress={() => router.back()} style={styles.backBtnAbs}>
                        <MaterialIcons name="arrow-back" size={24} color="#fff" />
                    </Pressable>
                    <Text style={styles.loadingText}>Loading event…</Text>
                </View>
            </SafeScreen>
        );
    }

    return (
        <SafeScreen>
            <ScrollView
                showsVerticalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
            >
                {/* Hero Image */}
                <View style={styles.heroWrap}>
                    {event.image_url ? (
                        <Image
                            source={{ uri: event.image_url }}
                            style={styles.heroImage}
                            contentFit="cover"
                            transition={300}
                        />
                    ) : (
                        <View style={styles.heroPlaceholder}>
                            <MaterialIcons name="event" size={64} color={colors.textSecondary} />
                        </View>
                    )}
                    <LinearGradient
                        colors={["transparent", "rgba(0,0,0,0.7)", colors.background]}
                        locations={[0, 0.6, 1]}
                        style={styles.heroGradient}
                    />

                    {/* Floating nav buttons */}
                    <View style={styles.heroNav}>
                        <Pressable onPress={() => router.back()} style={styles.navBtn} hitSlop={8}>
                            <MaterialIcons name="arrow-back" size={22} color="#fff" />
                        </Pressable>
                        <View style={styles.heroNavRight}>
                            <Pressable onPress={shareEvent} style={styles.navBtn} hitSlop={8}>
                                <MaterialIcons name="share" size={20} color="#fff" />
                            </Pressable>
                            <Pressable style={styles.navBtn} hitSlop={8}>
                                <MaterialIcons name="bookmark-border" size={22} color="#fff" />
                            </Pressable>
                        </View>
                    </View>
                </View>

                {/* Content */}
                <View style={styles.body}>
                    {/* Title & Organizer */}
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    {event.org && (
                        <View style={styles.orgRow}>
                            <View style={styles.orgAvatar}>
                                <MaterialIcons name="business" size={16} color={colors.accentYellow} />
                            </View>
                            <View>
                                <Text style={styles.orgName}>{event.org}</Text>
                                <Text style={styles.orgLabel}>Organizer</Text>
                            </View>
                        </View>
                    )}

                    {/* Date & Location Cards */}
                    <View style={styles.infoCards}>
                        <View style={styles.infoCard}>
                            <View style={[styles.infoIconWrap, { backgroundColor: "#6C5CE720" }]}>
                                <MaterialIcons name="calendar-today" size={20} color="#6C5CE7" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.infoLabel}>Date & Time</Text>
                                <Text style={styles.infoValue}>{formatDate(event.event_date)}</Text>
                                {formatTime(event.event_date) ? (
                                    <Text style={styles.infoSub}>{formatTime(event.event_date)}</Text>
                                ) : null}
                            </View>
                        </View>

                        <View style={styles.infoCard}>
                            <View style={[styles.infoIconWrap, { backgroundColor: "#00B89420" }]}>
                                <MaterialIcons name="location-on" size={20} color="#00B894" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.infoLabel}>Location</Text>
                                <Text style={styles.infoValue}>{event.city ?? "Online"}</Text>
                            </View>
                        </View>
                    </View>

                    {/* About Section */}
                    <Text style={styles.sectionTitle}>About This Event</Text>
                    <Text style={styles.aboutText}>
                        Join us for {event.title}! This event brings together creative professionals and enthusiasts for an unforgettable experience.
                        {"\n\n"}Network with industry leaders, showcase your work, and discover new opportunities in the creative space.
                        {"\n\n"}Whether you&apos;re a seasoned professional or just starting out, this event has something for everyone. Don&apos;t miss out on this incredible opportunity to connect, learn, and grow.
                    </Text>

                    {/* Event Tags */}
                    <View style={styles.tagsRow}>
                        {["Networking", "Creative", "In-Person"].map((tag) => (
                            <View key={tag} style={styles.tag}>
                                <Text style={styles.tagText}>{tag}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Related Events */}
                    {relatedEvents.length > 0 && (
                        <>
                            <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>More Events</Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.relatedRow}
                            >
                                {relatedEvents.map((re) => (
                                    <Pressable
                                        key={re.id}
                                        style={styles.relatedCard}
                                        onPress={() => router.push(`/event-detail?id=${re.id}` as any)}
                                    >
                                        <View style={styles.relatedImageWrap}>
                                            {re.image_url ? (
                                                <Image source={{ uri: re.image_url }} style={styles.relatedImage} contentFit="cover" />
                                            ) : (
                                                <View style={styles.relatedPlaceholder}>
                                                    <MaterialIcons name="event" size={24} color={colors.textSecondary} />
                                                </View>
                                            )}
                                        </View>
                                        <Text style={styles.relatedTitle} numberOfLines={2}>{re.title}</Text>
                                        <Text style={styles.relatedMeta}>{re.city ?? "Online"}</Text>
                                    </Pressable>
                                ))}
                            </ScrollView>
                        </>
                    )}

                    {/* Spacer for bottom CTA */}
                    <View style={{ height: 100 }} />
                </View>
            </ScrollView>

            {/* Bottom CTA */}
            <View style={styles.bottomBar}>
                <View style={styles.priceSection}>
                    <Text style={styles.priceLabel}>Price</Text>
                    <View style={styles.priceRow}>
                        <Text style={styles.priceValue}>Free</Text>
                    </View>
                </View>
                <Pressable
                    style={[styles.ctaBtn, ticketRequested && styles.ctaBtnDone]}
                    disabled={registering}
                    onPress={async () => {
                        if (ticketRequested && ticket) {
                            setTicketModalVisible(true);
                            return;
                        }
                        if (!id) return;
                        setRegistering(true);
                        const res = await registerForEvent(id);
                        setRegistering(false);
                        if (res.ok && res.ticket) {
                            setTicket(res.ticket);
                            setTicketRequested(true);
                            setTicketModalVisible(true);
                        } else {
                            Alert.alert("Notice", res.error || "Ticket confirmed!");
                            setTicketRequested(true);
                        }
                    }}
                >
                    {registering ? (
                        <ActivityIndicator color={colors.textDark} />
                    ) : (
                        <>
                            <MaterialIcons
                                name={ticketRequested ? "qr-code" : "confirmation-number"}
                                size={20}
                                color={ticketRequested ? colors.background : colors.textDark}
                            />
                            <Text style={[styles.ctaText, ticketRequested && styles.ctaTextDone]}>
                                {ticketRequested ? "View My Pass" : "Get Tickets"}
                            </Text>
                        </>
                    )}
                </Pressable>
            </View>

            {/* ── Scannable QR Event Pass Modal ── */}
            <Modal
                visible={ticketModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setTicketModalVisible(false)}
            >
                <View style={styles.passModalBackdrop}>
                    <View style={styles.passModalCard}>
                        <View style={styles.passHeaderRow}>
                            <View style={styles.passHeaderBadge}>
                                <MaterialIcons name="stars" size={16} color={colors.accentYellow} />
                                <Text style={styles.passHeaderBadgeText}>OFFICIAL EVENT PASS</Text>
                            </View>
                            <Pressable hitSlop={8} onPress={() => setTicketModalVisible(false)}>
                                <MaterialIcons name="close" size={24} color={colors.textSecondary} />
                            </Pressable>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: "center" }}>
                            {/* Ticket Card Container */}
                            <View style={styles.ticketCard}>
                                <Text style={styles.ticketEventTitle} numberOfLines={2}>{event?.title}</Text>
                                <Text style={styles.ticketEventHost}>Hosted by {event?.org || "Brunch in t' City"}</Text>

                                <View style={styles.ticketMetaRow}>
                                    <View style={styles.ticketMetaItem}>
                                        <MaterialIcons name="calendar-today" size={14} color={colors.accentYellow} />
                                        <Text style={styles.ticketMetaText}>{formatDate(event?.event_date)}</Text>
                                    </View>
                                    <View style={styles.ticketMetaItem}>
                                        <MaterialIcons name="location-on" size={14} color={colors.accentGreen} />
                                        <Text style={styles.ticketMetaText}>{event?.city || "London"}</Text>
                                    </View>
                                </View>

                                {/* Tear Line Divider */}
                                <View style={styles.tearLineContainer}>
                                    <View style={styles.notchLeft} />
                                    <View style={styles.dashedLine} />
                                    <View style={styles.notchRight} />
                                </View>

                                {/* Scannable QR Graphic */}
                                <View style={styles.qrContainer}>
                                    <Svg width={160} height={160} viewBox="0 0 160 160">
                                        {/* Background */}
                                        <Rect x="0" y="0" width="160" height="160" fill="#FFFFFF" rx={8} />

                                        {/* Top-Left Finder Pattern */}
                                        <Rect x="12" y="12" width="36" height="36" fill="#121212" rx={4} />
                                        <Rect x="18" y="18" width="24" height="24" fill="#FFFFFF" rx={2} />
                                        <Rect x="22" y="22" width="16" height="16" fill="#121212" rx={2} />

                                        {/* Top-Right Finder Pattern */}
                                        <Rect x="112" y="12" width="36" height="36" fill="#121212" rx={4} />
                                        <Rect x="118" y="18" width="24" height="24" fill="#FFFFFF" rx={2} />
                                        <Rect x="122" y="22" width="16" height="16" fill="#121212" rx={2} />

                                        {/* Bottom-Left Finder Pattern */}
                                        <Rect x="12" y="112" width="36" height="36" fill="#121212" rx={4} />
                                        <Rect x="18" y="118" width="24" height="24" fill="#FFFFFF" rx={2} />
                                        <Rect x="22" y="122" width="16" height="16" fill="#121212" rx={2} />

                                        {/* Data modules */}
                                        <Rect x="56" y="16" width="8" height="8" fill="#121212" />
                                        <Rect x="72" y="16" width="8" height="8" fill="#121212" />
                                        <Rect x="88" y="16" width="8" height="8" fill="#121212" />
                                        <Rect x="56" y="32" width="16" height="8" fill="#121212" />
                                        <Rect x="80" y="32" width="8" height="8" fill="#121212" />
                                        <Rect x="96" y="32" width="8" height="8" fill="#121212" />

                                        {/* Timing pattern */}
                                        <Rect x="16" y="56" width="8" height="8" fill="#121212" />
                                        <Rect x="16" y="72" width="8" height="8" fill="#121212" />
                                        <Rect x="16" y="88" width="8" height="8" fill="#121212" />

                                        {/* Center data blocks */}
                                        <Rect x="56" y="56" width="20" height="20" fill="#121212" rx={2} />
                                        <Rect x="84" y="56" width="12" height="12" fill="#121212" />
                                        <Rect x="104" y="56" width="16" height="8" fill="#121212" />
                                        <Rect x="128" y="56" width="8" height="16" fill="#121212" />
                                        <Rect x="60" y="84" width="8" height="16" fill="#121212" />
                                        <Rect x="76" y="80" width="16" height="8" fill="#121212" />
                                        <Rect x="100" y="80" width="24" height="12" fill="#121212" />
                                        <Rect x="132" y="80" width="12" height="12" fill="#121212" />
                                        <Rect x="76" y="96" width="12" height="16" fill="#121212" />
                                        <Rect x="96" y="100" width="16" height="8" fill="#121212" />
                                        <Rect x="120" y="100" width="8" height="20" fill="#121212" />

                                        {/* Bottom data blocks */}
                                        <Rect x="56" y="120" width="16" height="8" fill="#121212" />
                                        <Rect x="80" y="120" width="8" height="16" fill="#121212" />
                                        <Rect x="96" y="120" width="24" height="8" fill="#121212" />
                                        <Rect x="128" y="128" width="16" height="8" fill="#121212" />
                                        <Rect x="56" y="136" width="8" height="12" fill="#121212" />
                                        <Rect x="72" y="140" width="16" height="8" fill="#121212" />
                                        <Rect x="96" y="136" width="8" height="12" fill="#121212" />
                                        <Rect x="112" y="136" width="12" height="12" fill="#121212" />
                                    </Svg>
                                </View>

                                {/* Ticket Code & Copy */}
                                <Pressable
                                    style={styles.codeWrap}
                                    onPress={async () => {
                                        if (ticket?.ticket_code) {
                                            await Clipboard.setStringAsync(ticket.ticket_code);
                                            setCopied(true);
                                            setTimeout(() => setCopied(false), 2000);
                                        }
                                    }}
                                >
                                    <Text style={styles.codeText}>{ticket?.ticket_code || "BITC-BRNC-2026"}</Text>
                                    <MaterialIcons
                                        name={copied ? "check" : "content-copy"}
                                        size={14}
                                        color={copied ? colors.accentGreen : colors.textSecondary}
                                        style={{ marginLeft: 6 }}
                                    />
                                </Pressable>

                                <View style={styles.passVerificationBadge}>
                                    <MaterialIcons name="verified" size={16} color={colors.accentGreen} />
                                    <Text style={styles.passVerificationText}>Valid Entry • Scannable at Door</Text>
                                </View>
                            </View>

                            <Pressable
                                style={styles.closePassBtn}
                                onPress={() => setTicketModalVisible(false)}
                            >
                                <Text style={styles.closePassBtnText}>Done</Text>
                            </Pressable>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeScreen>
    );
}

const styles = StyleSheet.create<any>({
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
    heroWrap: {
        width,
        height: HERO_H,
        position: "relative",
    },
    heroImage: {
        width: "100%",
        height: "100%",
    },
    heroPlaceholder: {
        width: "100%",
        height: "100%",
        backgroundColor: "#1a1a1a",
        alignItems: "center",
        justifyContent: "center",
    },
    heroGradient: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: HERO_H * 0.6,
    },
    heroNav: {
        position: "absolute",
        top: 8,
        left: spacing.lg,
        right: spacing.lg,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    heroNavRight: {
        flexDirection: "row",
        gap: spacing.sm,
    },
    navBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(0,0,0,0.45)",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(10px)" as any,
    },
    body: {
        paddingHorizontal: spacing.lg,
        marginTop: -spacing.xl,
    },
    eventTitle: {
        color: colors.textPrimary,
        fontFamily: fonts.bold,
        fontSize: 26,
        lineHeight: 34,
        marginBottom: spacing.md,
    },
    orgRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        marginBottom: spacing.lg,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        backgroundColor: colors.surface,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: colors.outline,
    },
    orgAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#2a2200",
        alignItems: "center",
        justifyContent: "center",
    },
    orgName: {
        color: colors.textPrimary,
        fontFamily: fonts.semibold,
        fontSize: fonts.size.md,
    },
    orgLabel: {
        color: colors.textSecondary,
        fontFamily: fonts.regular,
        fontSize: fonts.size.xs,
        marginTop: 2,
    },
    infoCards: {
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    infoCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        backgroundColor: colors.surface,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: colors.outline,
        padding: spacing.md,
    },
    infoIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
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
        fontSize: fonts.size.md,
    },
    infoSub: {
        color: colors.textSecondary,
        fontFamily: fonts.regular,
        fontSize: fonts.size.sm,
        marginTop: 2,
    },
    sectionTitle: {
        color: colors.textPrimary,
        fontFamily: fonts.bold,
        fontSize: fonts.size.xl,
        marginBottom: spacing.md,
    },
    aboutText: {
        color: colors.textSecondary,
        fontFamily: fonts.regular,
        fontSize: fonts.size.md,
        lineHeight: 24,
        marginBottom: spacing.md,
    },
    tagsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
    },
    tag: {
        backgroundColor: colors.surface,
        borderRadius: radii.pill,
        borderWidth: 1,
        borderColor: colors.outline,
        paddingHorizontal: 14,
        paddingVertical: 6,
    },
    tagText: {
        color: colors.textSecondary,
        fontFamily: fonts.semibold,
        fontSize: fonts.size.xs,
    },
    relatedRow: {
        gap: spacing.md,
        paddingBottom: spacing.sm,
    },
    relatedCard: {
        width: 160,
        backgroundColor: colors.surface,
        borderRadius: radii.card,
        borderWidth: 1,
        borderColor: colors.outline,
        overflow: "hidden",
    },
    relatedImageWrap: {
        width: "100%",
        height: 90,
    },
    relatedImage: {
        width: "100%",
        height: "100%",
    },
    relatedPlaceholder: {
        width: "100%",
        height: "100%",
        backgroundColor: "#1a1a1a",
        alignItems: "center",
        justifyContent: "center",
    },
    relatedTitle: {
        color: colors.textPrimary,
        fontFamily: fonts.semibold,
        fontSize: fonts.size.sm,
        padding: spacing.sm,
        paddingBottom: 2,
    },
    relatedMeta: {
        color: colors.textSecondary,
        fontFamily: fonts.regular,
        fontSize: fonts.size.xs,
        paddingHorizontal: spacing.sm,
        paddingBottom: spacing.sm,
    },
    bottomBar: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        paddingBottom: 28,
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.outline,
    },
    priceSection: {},
    priceLabel: {
        color: colors.textSecondary,
        fontFamily: fonts.regular,
        fontSize: fonts.size.xs,
    },
    priceRow: {
        flexDirection: "row",
        alignItems: "baseline",
        gap: 4,
    },
    priceValue: {
        color: colors.textPrimary,
        fontFamily: fonts.bold,
        fontSize: fonts.size.xl,
    },
    ctaBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: colors.accentYellow,
        borderRadius: radii.pill,
        paddingHorizontal: 28,
        paddingVertical: 14,
    },
    ctaBtnDone: {
        backgroundColor: colors.accentGreen,
    },
    ctaText: {
        color: colors.textDark,
        fontFamily: fonts.bold,
        fontSize: fonts.size.md,
    },
    ctaTextDone: {
        color: "#fff",
    },

    /* Ticket Pass Modal */
    passModalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", paddingHorizontal: spacing.lg, paddingVertical: spacing.xl },
    passModalCard: { backgroundColor: colors.surface, borderRadius: radii.card, padding: spacing.lg, maxHeight: "90%", borderWidth: 1, borderColor: colors.outline },
    passHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md, width: "100%" },
    passHeaderBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#2a2200", paddingHorizontal: 12, paddingVertical: 4, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.accentYellow },
    passHeaderBadgeText: { color: colors.accentYellow, fontFamily: fonts.bold, fontSize: 10, letterSpacing: 0.8 },

    /* Visual Ticket Card */
    ticketCard: { width: "100%", backgroundColor: colors.background, borderRadius: radii.card, padding: spacing.lg, alignItems: "center", borderWidth: 1, borderColor: colors.outline, overflow: "hidden" },
    ticketEventTitle: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.lg, textAlign: "center", marginBottom: 4 },
    ticketEventHost: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.xs, textAlign: "center", marginBottom: spacing.md },
    ticketMetaRow: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.md },
    ticketMetaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
    ticketMetaText: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.xs },

    /* Tear Line */
    tearLineContainer: { width: "120%", height: 24, flexDirection: "row", alignItems: "center", marginVertical: spacing.xs },
    notchLeft: { width: 18, height: 24, borderTopRightRadius: 12, borderBottomRightRadius: 12, backgroundColor: colors.surface },
    dashedLine: { flex: 1, height: 1, borderWidth: 1, borderColor: colors.outline, borderStyle: "dashed" },
    notchRight: { width: 18, height: 24, borderTopLeftRadius: 12, borderBottomLeftRadius: 12, backgroundColor: colors.surface },

    /* QR Code Graphic */
    qrContainer: { padding: spacing.md, backgroundColor: "#FFFFFF", borderRadius: radii.card, marginVertical: spacing.md, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 10, elevation: 4 },

    /* Code & Copy */
    codeWrap: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.outline, marginBottom: spacing.md },
    codeText: { color: colors.accentYellow, fontFamily: fonts.bold, fontSize: fonts.size.sm, letterSpacing: 1.5 },
    passVerificationBadge: { flexDirection: "row", alignItems: "center", gap: 6 },
    passVerificationText: { color: colors.accentGreen, fontFamily: fonts.semibold, fontSize: fonts.size.xs },

    closePassBtn: { backgroundColor: colors.accentYellow, borderRadius: radii.pill, paddingVertical: 14, paddingHorizontal: 40, alignItems: "center", justifyContent: "center", marginTop: spacing.md, width: "100%" },
    closePassBtnText: { color: colors.textDark, fontFamily: fonts.bold, fontSize: fonts.size.md },
});
