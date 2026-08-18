import SafeScreen from "@/components/SafeScreen";
import { EventRow, fetchEvents } from "@/services/events";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Animated,
    Dimensions,
    Pressable,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    View,
} from "react-native";

const { width } = Dimensions.get("window");
const HERO_H = 280;

export default function EventDetail() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [event, setEvent] = useState<EventRow | null>(null);
    const [relatedEvents, setRelatedEvents] = useState<EventRow[]>([]);
    const [ticketRequested, setTicketRequested] = useState(false);
    const scrollY = React.useRef(new Animated.Value(0)).current;

    useEffect(() => {
        fetchEvents(30).then((all) => {
            const found = all.find((e) => e.id === id);
            setEvent(found ?? null);
            setRelatedEvents(all.filter((e) => e.id !== id).slice(0, 4));
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
                        {"\n\n"}Whether you're a seasoned professional or just starting out, this event has something for everyone. Don't miss out on this incredible opportunity to connect, learn, and grow.
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
                    onPress={() => setTicketRequested(true)}
                >
                    <MaterialIcons
                        name={ticketRequested ? "check-circle" : "confirmation-number"}
                        size={20}
                        color={ticketRequested ? colors.background : colors.textDark}
                    />
                    <Text style={[styles.ctaText, ticketRequested && styles.ctaTextDone]}>
                        {ticketRequested ? "Registered!" : "Get Tickets"}
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
});
