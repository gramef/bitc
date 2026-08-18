import SafeScreen from "@/components/SafeScreen";
import { Chip, EmptyState, SearchBar } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { EventRow, fetchEvents } from "@/services/events";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const CATEGORIES = [
  "All",
  "Music",
  "Art",
  "Tech",
  "Food",
  "Night Life",
  "Wellness",
] as const;

export default function Events() {
  const router = useRouter();
  const { profile, hasRole } = useAuth();
  const avatarSrc = profile?.avatarUrl
    ? { uri: profile.avatarUrl }
    : require("../../assets/images/react-logo.png");

  const [events, setEvents] = useState<EventRow[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const data = await fetchEvents(30);
    setEvents(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const filtered = events.filter((ev) => {
    const q = search.toLowerCase();
    if (q && !ev.title.toLowerCase().includes(q) && !ev.city?.toLowerCase().includes(q)) {
      return false;
    }
    return true;
  });

  function formatDate(d?: string | null) {
    if (!d) return "";
    try {
      return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return d;
    }
  }

  return (
    <SafeScreen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentYellow} />
        }
      >
        {/* Header */}
        <View style={styles.topRow}>
          <View style={styles.topLeft}>
            <View style={styles.topAvatarWrap}>
              <Image source={avatarSrc} style={styles.topAvatar} contentFit="cover" />
            </View>
            <View>
              <Text style={styles.topGreeting}>Good day,</Text>
              <Text style={styles.topName}>{profile?.fullName ?? "Guest"}</Text>
            </View>
          </View>
          <Pressable style={styles.notifBtn} hitSlop={6} onPress={() => router.push("/notifications")}>
            <MaterialIcons name="notifications" size={20} color={colors.textPrimary} />
          </Pressable>
        </View>

        <Text style={styles.pageTitle}>Events</Text>

        <SearchBar value={search} onChangeText={setSearch} placeholder="Search events…" />

        {/* Category filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {CATEGORIES.map((c) => (
            <Chip key={c} label={c} selected={category === c} onPress={() => setCategory(c)} />
          ))}
        </ScrollView>

        {/* Event cards */}
        {filtered.length === 0 && !loading ? (
          <EmptyState icon="event" title="No events found" subtitle="Try a different search or category" />
        ) : (
          filtered.map((ev) => (
            <Pressable key={ev.id} onPress={() => router.push(`/event-detail?id=${ev.id}` as any)}>
              <View style={styles.eventCard}>
                <View style={styles.eventImageWrap}>
                  {ev.image_url ? (
                    <Image source={{ uri: ev.image_url }} style={styles.eventImage} contentFit="cover" />
                  ) : (
                    <View style={styles.eventImagePlaceholder}>
                      <MaterialIcons name="event" size={32} color={colors.textSecondary} />
                    </View>
                  )}
                </View>
                <View style={styles.eventBody}>
                  <Text style={styles.eventTitle} numberOfLines={2}>{ev.title}</Text>
                  <View style={styles.eventMeta}>
                    <MaterialIcons name="location-on" size={14} color={colors.textSecondary} />
                    <Text style={styles.eventMetaText}>{ev.city ?? "Online"}</Text>
                  </View>
                  <View style={styles.eventMeta}>
                    <MaterialIcons name="calendar-today" size={14} color={colors.textSecondary} />
                    <Text style={styles.eventMetaText}>{formatDate(ev.event_date)}</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>

      {/* Create Event FAB — only for business/admin */}
      {hasRole("business", "admin") && (
        <Pressable
          style={styles.fab}
          onPress={() => router.push("/create-event" as any)}
        >
          <MaterialIcons name="add" size={28} color={colors.textDark} />
        </Pressable>
      )}
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xl, gap: spacing.md },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  topLeft: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  topAvatarWrap: { width: 44, height: 44, borderRadius: 22, overflow: "hidden", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.outline },
  topAvatar: { width: 42, height: 42, borderRadius: 21 },
  topGreeting: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm },
  topName: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.lg },
  notifBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.accentGreen, alignItems: "center", justifyContent: "center" },
  pageTitle: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.title, marginTop: spacing.xs },
  chipRow: { gap: spacing.sm },
  eventCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.outline,
    overflow: "hidden",
  },
  eventImageWrap: { width: "100%", height: 140 },
  eventImage: { width: "100%", height: "100%" },
  eventImagePlaceholder: { width: "100%", height: "100%", backgroundColor: "#1a1a1a", alignItems: "center", justifyContent: "center" },
  eventBody: { padding: spacing.md },
  eventTitle: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.lg, marginBottom: spacing.xs },
  eventMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  eventMetaText: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm },
  fab: { position: "absolute", right: spacing.lg, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accentYellow, alignItems: "center", justifyContent: "center", elevation: 6, shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6 },
});
