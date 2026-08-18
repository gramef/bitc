import SafeScreen from "@/components/SafeScreen";
import { EmptyState } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { fetchLiveRooms, type RoomWithMeta, subscribeToLiveRooms } from "@/services/rooms";
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

const PLACEHOLDER_AVATAR = require("../assets/images/react-logo.png");

const TOPIC_COLORS: Record<string, string> = {
  Music: "#E17055",
  Tech: "#6C5CE7",
  Business: "#00B894",
  Design: "#FDCB6E",
  "Career Advice": "#74B9FF",
  "Open Mic": "#FF7675",
  Podcast: "#A29BFE",
};

export default function Rooms() {
  const router = useRouter();
  const { user } = useAuth();
  const [rooms, setRooms] = useState<RoomWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await fetchLiveRooms();
    setRooms(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = subscribeToLiveRooms(() => load());
    return () => { channel?.unsubscribe(); };
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  function getTimeSince(startedAt: string) {
    const diff = Date.now() - new Date(startedAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m`;
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
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <MaterialIcons name="arrow-back" size={22} color="#fff" />
          </Pressable>
          <View style={styles.headerCenter}>
            <View style={styles.liveDot} />
            <Text style={styles.headerTitle}>BITC Live</Text>
          </View>
          <View style={{ width: 22 }} />
        </View>

        {/* Start a Room CTA */}
        {user && (
          <Pressable
            style={styles.startRoomBtn}
            onPress={() => router.push("/create-room" as any)}
          >
            <View style={styles.startRoomIcon}>
              <MaterialIcons name="mic" size={22} color={colors.textDark} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.startRoomTitle}>Start a Room</Text>
              <Text style={styles.startRoomSub}>Host a live conversation</Text>
            </View>
            <MaterialIcons name="arrow-forward-ios" size={16} color={colors.textSecondary} />
          </Pressable>
        )}

        {/* Section label */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Happening Now</Text>
          <View style={styles.roomCountBadge}>
            <Text style={styles.roomCountText}>{rooms.length}</Text>
          </View>
        </View>

        {/* Room Cards */}
        {rooms.length === 0 && !loading ? (
          <EmptyState
            icon="mic-off"
            title="No live rooms"
            subtitle="Be the first to start a conversation!"
          />
        ) : (
          rooms.map((room) => (
            <Pressable
              key={room.id}
              style={styles.roomCard}
              onPress={() => router.push(`/room/${room.id}` as any)}
            >
              {/* Topic + Live badge */}
              <View style={styles.cardTopRow}>
                {room.topic && (
                  <View style={[styles.topicBadge, { backgroundColor: (TOPIC_COLORS[room.topic] ?? "#888") + "20" }]}>
                    <Text style={[styles.topicText, { color: TOPIC_COLORS[room.topic] ?? "#888" }]}>
                      {room.topic}
                    </Text>
                  </View>
                )}
                <View style={styles.liveBadge}>
                  <View style={styles.liveBadgeDot} />
                  <Text style={styles.liveBadgeText}>LIVE</Text>
                </View>
              </View>

              {/* Title */}
              <Text style={styles.roomTitle} numberOfLines={2}>{room.title}</Text>
              {room.description && (
                <Text style={styles.roomDesc} numberOfLines={2}>{room.description}</Text>
              )}

              {/* Speakers */}
              <View style={styles.speakersRow}>
                <View style={styles.avatarStack}>
                  {room.speakers.slice(0, 4).map((speaker, i) => (
                    <View key={speaker.id} style={[styles.stackAvatar, { marginLeft: i > 0 ? -10 : 0, zIndex: 10 - i }]}>
                      <Image
                        source={speaker.avatar ? { uri: speaker.avatar } : PLACEHOLDER_AVATAR}
                        style={styles.stackAvatarImg}
                        contentFit="cover"
                      />
                      {speaker.role === "host" && (
                        <View style={styles.hostCrown}>
                          <MaterialIcons name="star" size={8} color={colors.accentYellow} />
                        </View>
                      )}
                    </View>
                  ))}
                </View>
                <View style={styles.speakerNames}>
                  {room.speakers.slice(0, 2).map((s) => (
                    <Text key={s.id} style={styles.speakerName} numberOfLines={1}>
                      {s.name} {s.role === "host" ? "🎙️" : ""}
                    </Text>
                  ))}
                </View>
              </View>

              {/* Stats */}
              <View style={styles.cardStats}>
                <View style={styles.statItem}>
                  <MaterialIcons name="mic" size={14} color={colors.accentYellow} />
                  <Text style={styles.statText}>{room.speaker_count} speaking</Text>
                </View>
                <View style={styles.statItem}>
                  <MaterialIcons name="headset" size={14} color={colors.textSecondary} />
                  <Text style={styles.statText}>{room.listener_count} listening</Text>
                </View>
                <View style={styles.statItem}>
                  <MaterialIcons name="schedule" size={14} color={colors.textSecondary} />
                  <Text style={styles.statText}>{getTimeSince(room.started_at)}</Text>
                </View>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 100 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.lg },
  headerCenter: { flexDirection: "row", alignItems: "center", gap: 8 },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#FF4444" },
  headerTitle: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.xl },
  // Start room CTA
  startRoomBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.accentYellow + "40",
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  startRoomIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accentYellow,
    alignItems: "center",
    justifyContent: "center",
  },
  startRoomTitle: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.lg },
  startRoomSub: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm, marginTop: 2 },
  // Section
  sectionRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md },
  sectionTitle: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.lg },
  roomCountBadge: { backgroundColor: "#FF4444", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  roomCountText: { color: "#fff", fontFamily: fonts.bold, fontSize: 11 },
  // Room card
  roomCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.outline,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm },
  topicBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  topicText: { fontFamily: fonts.semibold, fontSize: 11 },
  liveBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#FF444420", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  liveBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#FF4444" },
  liveBadgeText: { color: "#FF4444", fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1 },
  roomTitle: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.lg, marginBottom: 4 },
  roomDesc: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm, marginBottom: spacing.md },
  // Speakers
  speakersRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.md },
  avatarStack: { flexDirection: "row" },
  stackAvatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: colors.surface, overflow: "hidden" },
  stackAvatarImg: { width: 32, height: 32, borderRadius: 16 },
  hostCrown: { position: "absolute", bottom: -2, right: -2, width: 14, height: 14, borderRadius: 7, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  speakerNames: { flex: 1 },
  speakerName: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.sm },
  // Stats
  cardStats: { flexDirection: "row", gap: spacing.lg, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.divider },
  statItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  statText: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.xs },
});
