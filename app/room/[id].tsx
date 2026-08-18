import SafeScreen from "@/components/SafeScreen";
import { useAuth } from "@/contexts/AuthContext";
import { connectToRoom as connectAudio, disconnectFromRoom as disconnectAudio, setMicrophoneEnabled, isConnected as isAudioConnected } from "@/lib/audio-provider";
import {
  demoteToListener,
  endRoom,
  fetchRoomById,
  fetchRoomParticipants,
  joinRoom,
  leaveRoom,
  makeCoHost,
  muteParticipant,
  promoteToSpeaker,
  raiseHand,
  removeParticipant,
  subscribeToRoomParticipants,
  toggleMute,
  type ParticipantWithProfile,
  type RoomWithMeta,
} from "@/services/rooms";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const PLACEHOLDER_AVATAR = require("../../assets/images/react-logo.png");

const TOPIC_COLORS: Record<string, string> = {
  Music: "#E17055",
  Tech: "#6C5CE7",
  Business: "#00B894",
  Design: "#FDCB6E",
  "Career Advice": "#74B9FF",
  "Open Mic": "#FF7675",
  Podcast: "#A29BFE",
};

export default function RoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [room, setRoom] = useState<RoomWithMeta | null>(null);
  const [participants, setParticipants] = useState<ParticipantWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [audioConnected, setAudioConnected] = useState(false);
  const [speakingUsers, setSpeakingUsers] = useState<Set<string>>(new Set());
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const myParticipant = participants.find((p) => p.user_id === user?.id);
  const isHost = room?.host_id === user?.id;
  const isCoHost = myParticipant?.role === "co_host";
  const isSpeaker = myParticipant?.role === "speaker" || myParticipant?.role === "host" || myParticipant?.role === "co_host";
  const canModerate = isHost || isCoHost;

  const speakers = participants.filter((p) => ["host", "co_host", "speaker"].includes(p.role));
  const listeners = participants.filter((p) => p.role === "listener");
  const handsRaised = listeners.filter((p) => p.hand_raised);

  // Pulse animation for live indicator
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const loadRoom = useCallback(async () => {
    if (!id) return;
    const [roomData, participantData] = await Promise.all([
      fetchRoomById(id),
      fetchRoomParticipants(id),
    ]);
    setRoom(roomData);
    setParticipants(participantData);
    setLoading(false);
  }, [id]);

  // Initial load + join room + connect audio
  useEffect(() => {
    if (!id || !user) return;
    (async () => {
      await joinRoom(id);
      await loadRoom();

      // Attempt LiveKit audio connection
      const roomData = await fetchRoomById(id);
      const iAmHost = roomData?.host_id === user.id;
      const connected = await connectAudio(
        id,
        user.id,
        user.user_metadata?.full_name ?? "Guest",
        iAmHost, // hosts can publish immediately
        {
          onSpeakingChanged: (identity, speaking) => {
            setSpeakingUsers((prev) => {
              const next = new Set(prev);
              speaking ? next.add(identity) : next.delete(identity);
              return next;
            });
          },
          onConnectionStateChanged: () => {
            setAudioConnected(isAudioConnected());
          },
          onDisconnected: () => {
            setAudioConnected(false);
          },
        }
      );
      setAudioConnected(connected);
    })();

    // Realtime subscription
    const channel = subscribeToRoomParticipants(id, () => loadRoom());

    return () => {
      channel?.unsubscribe();
      disconnectAudio();
    };
  }, [id, user, loadRoom]);

  async function handleLeave() {
    if (!id) return;
    disconnectAudio();
    if (isHost) {
      Alert.alert(
        "End Room?",
        "As the host, leaving will end the room for everyone.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "End Room",
            style: "destructive",
            onPress: async () => {
              await endRoom(id);
              router.back();
            },
          },
        ]
      );
    } else {
      await leaveRoom(id);
      router.back();
    }
  }

  async function handleToggleMute() {
    if (!id || !myParticipant) return;
    const newMuted = !myParticipant.is_muted;
    await toggleMute(id, newMuted);
    // Sync with LiveKit audio
    if (audioConnected) {
      await setMicrophoneEnabled(!newMuted);
    }
    await loadRoom();
  }

  async function handleRaiseHand() {
    if (!id || !myParticipant) return;
    await raiseHand(id, !myParticipant.hand_raised);
    await loadRoom();
  }

  function handleParticipantAction(participant: ParticipantWithProfile) {
    if (!canModerate || participant.user_id === user?.id) return;
    if (!id) return;

    const options: string[] = [];
    const actions: (() => Promise<void>)[] = [];

    if (participant.role === "listener") {
      options.push("Invite to Speak 🎤");
      actions.push(async () => { await promoteToSpeaker(id, participant.user_id); await loadRoom(); });

      if (participant.hand_raised) {
        options.push("Lower Hand");
        actions.push(async () => { await raiseHand(id, false); await loadRoom(); });
      }
    }

    if (["speaker", "co_host"].includes(participant.role) && participant.user_id !== room?.host_id) {
      options.push("Move to Audience");
      actions.push(async () => { await demoteToListener(id, participant.user_id); await loadRoom(); });

      if (!participant.is_muted) {
        options.push("Mute 🔇");
        actions.push(async () => { await muteParticipant(id, participant.user_id); await loadRoom(); });
      }
    }

    if (isHost && participant.role !== "co_host" && participant.user_id !== room?.host_id) {
      options.push("Make Co-host ⭐");
      actions.push(async () => { await makeCoHost(id, participant.user_id); await loadRoom(); });
    }

    if (participant.user_id !== room?.host_id) {
      options.push("Remove from Room");
      actions.push(async () => {
        Alert.alert("Remove?", `Remove ${participant.full_name} from the room?`, [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: async () => { await removeParticipant(id, participant.user_id); await loadRoom(); },
          },
        ]);
      });
    }

    options.push("Cancel");

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, destructiveButtonIndex: options.indexOf("Remove from Room"), cancelButtonIndex: options.length - 1, title: participant.full_name },
        (idx) => { if (idx < actions.length) actions[idx](); }
      );
    } else {
      // Android fallback
      Alert.alert(
        participant.full_name,
        "Choose an action",
        [
          ...options.slice(0, -1).map((label, idx) => ({
            text: label,
            onPress: () => actions[idx]?.(),
          })),
          { text: "Cancel", style: "cancel" as const },
        ]
      );
    }
  }

  if (loading) {
    return (
      <SafeScreen>
        <View style={styles.loadingWrap}>
          <MaterialIcons name="podcasts" size={48} color={colors.accentYellow} />
          <Text style={styles.loadingText}>Joining room…</Text>
        </View>
      </SafeScreen>
    );
  }

  if (!room || room.status === "ended") {
    return (
      <SafeScreen>
        <View style={styles.loadingWrap}>
          <MaterialIcons name="mic-off" size={48} color={colors.textSecondary} />
          <Text style={styles.loadingText}>This room has ended</Text>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <MaterialIcons name="keyboard-arrow-down" size={28} color="#fff" />
          </Pressable>
          <View style={styles.headerCenter}>
            <Animated.View style={[styles.liveIndicator, { opacity: pulseAnim }]} />
            <Text style={styles.headerLive}>LIVE</Text>
            {audioConnected && (
              <View style={styles.audioBadge}>
                <MaterialIcons name="volume-up" size={10} color={colors.accentGreen} />
              </View>
            )}
          </View>
          <Pressable onPress={handleLeave} hitSlop={8}>
            <MaterialIcons name="close" size={22} color="#FF4444" />
          </Pressable>
        </View>

        {/* Room Info */}
        <View style={styles.roomInfo}>
          {room.topic && (
            <View style={[styles.topicBadge, { backgroundColor: (TOPIC_COLORS[room.topic] ?? "#888") + "20" }]}>
              <Text style={[styles.topicText, { color: TOPIC_COLORS[room.topic] ?? "#888" }]}>{room.topic}</Text>
            </View>
          )}
          <Text style={styles.roomTitle}>{room.title}</Text>
          {room.description && <Text style={styles.roomDesc}>{room.description}</Text>}
        </View>

        {/* Speakers Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            <MaterialIcons name="mic" size={14} color={colors.accentYellow} /> Speakers
          </Text>
          <View style={styles.speakerGrid}>
            {speakers.map((p) => (
              <Pressable
                key={p.user_id}
                style={styles.speakerTile}
                onLongPress={() => handleParticipantAction(p)}
                delayLongPress={300}
              >
                <View style={[
                  styles.speakerAvatarWrap,
                  (!p.is_muted || speakingUsers.has(p.user_id)) && styles.speakerAvatarActive,
                  p.role === "host" && styles.speakerAvatarHost,
                  speakingUsers.has(p.user_id) && styles.speakerAvatarSpeaking,
                ]}>
                  <Image
                    source={p.avatar_url ? { uri: p.avatar_url } : PLACEHOLDER_AVATAR}
                    style={styles.speakerAvatar}
                    contentFit="cover"
                  />
                  {/* Mic indicator */}
                  <View style={[styles.micBadge, p.is_muted ? styles.micMuted : styles.micActive]}>
                    <MaterialIcons
                      name={p.is_muted ? "mic-off" : "mic"}
                      size={10}
                      color={p.is_muted ? "#FF4444" : "#fff"}
                    />
                  </View>
                </View>
                <Text style={styles.speakerName} numberOfLines={1}>{p.full_name}</Text>
                <View style={styles.roleTag}>
                  {p.role === "host" && <MaterialIcons name="star" size={10} color={colors.accentYellow} />}
                  {p.role === "co_host" && <MaterialIcons name="star-half" size={10} color={colors.accentGreen} />}
                  <Text style={[
                    styles.roleText,
                    p.role === "host" && { color: colors.accentYellow },
                    p.role === "co_host" && { color: colors.accentGreen },
                  ]}>
                    {p.role === "host" ? "Host" : p.role === "co_host" ? "Co-host" : "Speaker"}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Raised Hands */}
        {canModerate && handsRaised.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              ✋ Raised Hands ({handsRaised.length})
            </Text>
            <View style={styles.handsList}>
              {handsRaised.map((p) => (
                <Pressable
                  key={p.user_id}
                  style={styles.handCard}
                  onPress={() => handleParticipantAction(p)}
                >
                  <View style={styles.handAvatar}>
                    <Image
                      source={p.avatar_url ? { uri: p.avatar_url } : PLACEHOLDER_AVATAR}
                      style={{ width: 32, height: 32, borderRadius: 16 }}
                      contentFit="cover"
                    />
                  </View>
                  <Text style={styles.handName} numberOfLines={1}>{p.full_name}</Text>
                  <Pressable
                    style={styles.inviteBtn}
                    onPress={async () => { await promoteToSpeaker(id!, p.user_id); await loadRoom(); }}
                  >
                    <MaterialIcons name="mic" size={14} color={colors.textDark} />
                    <Text style={styles.inviteBtnText}>Invite</Text>
                  </Pressable>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Listeners */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            <MaterialIcons name="headset" size={14} color={colors.textSecondary} /> Listeners ({listeners.length})
          </Text>
          <View style={styles.listenerGrid}>
            {listeners.map((p) => (
              <Pressable
                key={p.user_id}
                style={styles.listenerTile}
                onLongPress={() => handleParticipantAction(p)}
                delayLongPress={300}
              >
                <View style={styles.listenerAvatarWrap}>
                  <Image
                    source={p.avatar_url ? { uri: p.avatar_url } : PLACEHOLDER_AVATAR}
                    style={styles.listenerAvatar}
                    contentFit="cover"
                  />
                  {p.hand_raised && (
                    <View style={styles.handBadge}>
                      <Text style={{ fontSize: 10 }}>✋</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.listenerName} numberOfLines={1}>{p.full_name}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Controls */}
      <View style={styles.controls}>
        {/* Leave */}
        <Pressable style={styles.leaveBtn} onPress={handleLeave}>
          <MaterialIcons name="call-end" size={20} color="#fff" />
          <Text style={styles.leaveBtnText}>{isHost ? "End" : "Leave"}</Text>
        </Pressable>

        <View style={styles.controlsRight}>
          {/* Raise Hand (listeners only) */}
          {!isSpeaker && (
            <Pressable
              style={[styles.controlBtn, myParticipant?.hand_raised && styles.controlBtnActive]}
              onPress={handleRaiseHand}
            >
              <Text style={{ fontSize: 20 }}>✋</Text>
            </Pressable>
          )}

          {/* Mic toggle (speakers only) */}
          {isSpeaker && (
            <Pressable
              style={[styles.controlBtn, !myParticipant?.is_muted && styles.controlBtnMicActive]}
              onPress={handleToggleMute}
            >
              <MaterialIcons
                name={myParticipant?.is_muted ? "mic-off" : "mic"}
                size={24}
                color={myParticipant?.is_muted ? "#FF4444" : "#fff"}
              />
            </Pressable>
          )}

          {/* Room settings for host */}
          {isHost && (
            <Pressable
              style={styles.controlBtn}
              onPress={() => {
                Alert.alert(
                  "Room Settings",
                  `${participants.length} participants\n${speakers.length} speakers\n${listeners.length} listeners`,
                  [
                    { text: "End Room", style: "destructive", onPress: async () => { await endRoom(id!); router.back(); } },
                    { text: "Close", style: "cancel" },
                  ]
                );
              }}
            >
              <MaterialIcons name="settings" size={22} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 120 },
  // Loading / Empty
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md },
  loadingText: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.lg },
  backBtn: { backgroundColor: colors.surface, borderRadius: radii.pill, paddingHorizontal: 24, paddingVertical: 12, borderWidth: 1, borderColor: colors.outline, marginTop: spacing.md },
  backBtnText: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.md },
  // Header
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.lg },
  headerCenter: { flexDirection: "row", alignItems: "center", gap: 6 },
  liveIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FF4444" },
  headerLive: { color: "#FF4444", fontFamily: fonts.bold, fontSize: 13, letterSpacing: 2 },
  // Room info
  roomInfo: { marginBottom: spacing.xl },
  topicBadge: { alignSelf: "flex-start", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginBottom: spacing.sm },
  topicText: { fontFamily: fonts.semibold, fontSize: 12 },
  roomTitle: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.title },
  roomDesc: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.md, marginTop: 4 },
  // Sections
  section: { marginBottom: spacing.xl },
  sectionLabel: { color: colors.textSecondary, fontFamily: fonts.semibold, fontSize: fonts.size.sm, marginBottom: spacing.md },
  // Speaker grid
  speakerGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.lg },
  speakerTile: { alignItems: "center", width: 90 },
  speakerAvatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: colors.outline,
    overflow: "hidden",
    marginBottom: 6,
  },
  speakerAvatarActive: { borderColor: colors.accentGreen },
  speakerAvatarSpeaking: { borderColor: "#4CAF50", borderWidth: 4 },
  speakerAvatarHost: { borderColor: colors.accentYellow },
  audioBadge: { marginLeft: 4, width: 18, height: 18, borderRadius: 9, backgroundColor: colors.accentGreen + "30", alignItems: "center", justifyContent: "center" },
  speakerAvatar: { width: 66, height: 66, borderRadius: 33 },
  micBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.surface,
  },
  micMuted: { backgroundColor: "#2a1a1a" },
  micActive: { backgroundColor: colors.accentGreen },
  speakerName: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.xs, textAlign: "center" },
  roleTag: { flexDirection: "row", alignItems: "center", gap: 2, marginTop: 2 },
  roleText: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 10 },
  // Raised hands
  handsList: { gap: spacing.sm },
  handCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.accentYellow + "10",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.accentYellow + "30",
    padding: spacing.md,
  },
  handAvatar: { width: 32, height: 32, borderRadius: 16, overflow: "hidden" },
  handName: { flex: 1, color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.sm },
  inviteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.accentYellow,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  inviteBtnText: { color: colors.textDark, fontFamily: fonts.bold, fontSize: fonts.size.xs },
  // Listener grid
  listenerGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  listenerTile: { alignItems: "center", width: 64 },
  listenerAvatarWrap: { width: 48, height: 48, borderRadius: 24, overflow: "hidden", marginBottom: 4 },
  listenerAvatar: { width: 48, height: 48, borderRadius: 24 },
  handBadge: { position: "absolute", top: -2, right: -2, width: 18, height: 18, borderRadius: 9, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  listenerName: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 10, textAlign: "center" },
  // Bottom controls
  controls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 36,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.outline,
  },
  leaveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FF4444",
    borderRadius: radii.pill,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  leaveBtnText: { color: "#fff", fontFamily: fonts.bold, fontSize: fonts.size.sm },
  controlsRight: { flexDirection: "row", gap: spacing.md },
  controlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.outline,
    alignItems: "center",
    justifyContent: "center",
  },
  controlBtnActive: { backgroundColor: colors.accentYellow + "30", borderColor: colors.accentYellow },
  controlBtnMicActive: { backgroundColor: colors.accentGreen + "30", borderColor: colors.accentGreen },
});
