import SafeScreen from "@/components/SafeScreen";
import * as Clipboard from "expo-clipboard";
import { useAuth } from "@/contexts/AuthContext";
import {
  connectToRoom as connectAudio,
  disconnectFromRoom as disconnectAudio,
  setMicrophoneEnabled,
  isConnected as isAudioConnected,
  resumeAudioPlayback,
  canPlaybackAudio,
} from "@/lib/audio-provider";
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
import React, { useCallback, useEffect, useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Avatar } from "@/components/ui/Avatar";

export default function RoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [room, setRoom] = useState<RoomWithMeta | null>(null);
  const [participants, setParticipants] = useState<ParticipantWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [audioConnected, setAudioConnected] = useState(false);
  const [canPlayback, setCanPlayback] = useState(true);
  const [speakingUsers, setSpeakingUsers] = useState<Set<string>>(new Set());
  const [showEndModal, setShowEndModal] = useState(false);
  const [isSpeakerOutput, setIsSpeakerOutput] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [handRaised, setHandRaised] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const myParticipant = participants.find((p) => p.user_id === user?.id);
  const isHost = room?.host_id === user?.id;
  const isCoHost = myParticipant?.role === "co_host" || (room?.moderator_ids?.includes(user?.id ?? ""));
  const canModerate = isHost || isCoHost;

  const speakers = participants.filter((p) => ["host", "co_host", "speaker"].includes(p.role));
  const listeners = participants.filter((p) => p.role === "listener");

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

      const connected = await connectAudio(
        id,
        user.id,
        user.user_metadata?.full_name ?? "Guest",
        true, // Allow all community room participants to speak when unmuted
        {
          onSpeakingChanged: (identity, speaking) => {
            setSpeakingUsers((prev) => {
              const next = new Set(prev);
              if (speaking) {
                next.add(identity);
              } else {
                next.delete(identity);
              }
              return next;
            });
          },
          onConnectionStateChanged: () => {
            setAudioConnected(isAudioConnected());
            setCanPlayback(canPlaybackAudio());
          },
          onAudioPlaybackChanged: (allowed) => {
            setCanPlayback(allowed);
          },
          onDisconnected: () => {
            setAudioConnected(false);
          },
        }
      );
      setAudioConnected(connected);
      setCanPlayback(canPlaybackAudio());
    })();

    const channel = subscribeToRoomParticipants(id, () => loadRoom());

    return () => {
      channel?.unsubscribe();
      disconnectAudio();
    };
  }, [id, user, loadRoom]);

  async function handleLeaveClick() {
    if (!id) return;
    if (isHost) {
      setShowEndModal(true);
    } else {
      disconnectAudio();
      await leaveRoom(id);
      router.back();
    }
  }

  async function handleConfirmEndRoom() {
    if (!id) return;
    setShowEndModal(false);
    disconnectAudio();
    await endRoom(id);
    router.back();
  }

  async function handleToggleMute() {
    const nextMic = !isMicOn;
    setIsMicOn(nextMic);
    if (id && myParticipant) {
      await toggleMute(id, !nextMic);
      await loadRoom();
    }
    if (audioConnected) {
      await setMicrophoneEnabled(nextMic);
    }
    await resumeAudioPlayback();
    setCanPlayback(canPlaybackAudio());
  }

  async function handleRaiseHand() {
    const nextHand = !handRaised;
    setHandRaised(nextHand);
    if (id && myParticipant) {
      await raiseHand(id, nextHand);
      await loadRoom();
    }
  }

  async function handleShareRoom() {
    try {
      const roomUrl = `http://localhost:8081/room/${id}`;
      await Clipboard.setStringAsync(roomUrl);
      Alert.alert("Link Copied!", "Room link copied to clipboard. Share it with your friends to join!");
    } catch {
      Alert.alert("Room Invite", `Share this link with others: http://localhost:8081/room/${id}`);
    }
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

  function formatShortName(fullName: string): string {
    const parts = fullName.trim().split(" ");
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[parts.length - 1][0]}.`;
  }

  if (loading) {
    return (
      <SafeScreen>
        <View style={styles.loadingWrap}>
          <MaterialIcons name="podcasts" size={48} color={colors.accentYellow} />
          <Text style={styles.loadingText}>Joining voice room…</Text>
        </View>
      </SafeScreen>
    );
  }

  if (!room || room.status === "ended") {
    return (
      <SafeScreen>
        <View style={styles.loadingWrap}>
          <MaterialIcons name="mic-off" size={48} color={colors.textSecondary} />
          <Text style={styles.loadingText}>This voice room has ended</Text>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen>
      <View style={styles.container}>
        {/* Figma Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.greenIconCircle}>
              <MaterialIcons name="mic" size={20} color="#fff" />
            </View>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.roomTitleText} numberOfLines={1}>{room.title}</Text>
              <Text style={styles.roomSubtext}>
                Voice chat • {listeners.length + speakers.length} listening
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <Pressable
              style={styles.iconBtn}
              onPress={() => {
                Alert.alert("Room Info", `${room.title}\nHost: ${room.host_name}`);
              }}
              hitSlop={8}
            >
              <MaterialIcons name="more-vert" size={22} color="#fff" />
            </Pressable>

            <Pressable style={styles.endBtn} onPress={handleLeaveClick}>
              <Text style={styles.endBtnText}>{isHost ? "End" : "Leave"}</Text>
            </Pressable>
          </View>
        </View>

        {/* Browser Autoplay Unlock Notice */}
        {!canPlayback && (
          <Pressable
            style={styles.playbackBanner}
            onPress={async () => {
              const ok = await resumeAudioPlayback();
              setCanPlayback(ok);
            }}
          >
            <MaterialIcons name="volume-up" size={16} color="#0b0b0b" />
            <Text style={styles.playbackBannerText}>
              Browser paused audio • Tap to enable sound 🔊
            </Text>
          </Pressable>
        )}

        {/* 3-Column Participant Grid */}
        <ScrollView contentContainerStyle={styles.gridContent} showsVerticalScrollIndicator={false}>
          <View style={styles.avatarGrid}>
            {participants.map((p) => {
              const isMe = p.user_id === user?.id;
              const isSpeakingNow = speakingUsers.has(p.user_id) || (isMicOn && isMe);
              const displayName = isMe ? "You" : formatShortName(p.full_name);

              return (
                <Pressable
                  key={p.user_id}
                  style={styles.gridItem}
                  onLongPress={() => handleParticipantAction(p)}
                  delayLongPress={300}
                >
                  <View style={[styles.avatarBorderWrap, isSpeakingNow && styles.activeSpeakerBorder]}>
                    <Avatar
                      uri={p.avatar_url}
                      name={p.full_name}
                      size={76}
                    />
                  </View>
                  <Text
                    style={[styles.gridName, isSpeakingNow && styles.gridNameActive]}
                    numberOfLines={1}
                  >
                    {displayName} {p.role === "host" ? "🎙️" : ""}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {/* Figma Floating Bottom Bar */}
        <View style={styles.floatingBarWrap}>
          <View style={styles.floatingBar}>
            {/* 1. Mic button */}
            <Pressable
              style={[styles.barIconBtn, isMicOn && styles.barIconBtnActive]}
              onPress={handleToggleMute}
            >
              <MaterialIcons
                name={isMicOn ? "mic" : "mic-off"}
                size={22}
                color={isMicOn ? "#228B6D" : "#5F6C7B"}
              />
            </Pressable>

            {/* 2. Speaker output toggle */}
            <Pressable
              style={styles.barIconBtn}
              onPress={() => {
                const nextState = !isSpeakerOutput;
                setIsSpeakerOutput(nextState);
                Alert.alert("Audio Mode", nextState ? "Output set to Speaker 🔊" : "Output set to Earpiece/Headset 🎧");
              }}
            >
              <MaterialIcons
                name={isSpeakerOutput ? "volume-up" : "headset"}
                size={22}
                color="#228B6D"
              />
            </Pressable>

            {/* 3. Hand raise button */}
            <Pressable
              style={[styles.barIconBtn, handRaised && styles.barIconBtnActive]}
              onPress={handleRaiseHand}
            >
              <MaterialIcons
                name="pan-tool"
                size={22}
                color={handRaised ? colors.accentYellow : "#5F6C7B"}
              />
            </Pressable>

            {/* 4. Presentation/Screen Share */}
            <Pressable
              style={[styles.barIconBtn, screenSharing && styles.barIconBtnActive]}
              onPress={() => {
                const nextState = !screenSharing;
                setScreenSharing(nextState);
                Alert.alert("Screen Presentation", nextState ? "Presentation mode enabled 💻" : "Presentation mode turned off");
              }}
            >
              <MaterialIcons
                name="desktop-mac"
                size={22}
                color={screenSharing ? colors.accentYellow : "#5F6C7B"}
              />
            </Pressable>

            {/* 5. Add user / Invite */}
            <Pressable
              style={styles.barIconBtn}
              onPress={() => setShowInviteModal(true)}
            >
              <MaterialIcons name="person-add" size={22} color="#5F6C7B" />
            </Pressable>
          </View>
        </View>

        {/* Invite & Share Modal */}
        <Modal
          visible={showInviteModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowInviteModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Invite Members</Text>
              <Text style={styles.modalSubtitle}>
                Copy the room link below or share it to bring others into this voice conversation.
              </Text>

              <Pressable style={styles.modalEndBtn} onPress={handleShareRoom}>
                <Text style={styles.modalEndBtnText}>Copy Room Link 🔗</Text>
              </Pressable>

              <Pressable style={styles.modalCancelBtn} onPress={() => setShowInviteModal(false)}>
                <Text style={styles.modalCancelBtnText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* Figma End Voice Chat Confirmation Modal */}
        <Modal
          visible={showEndModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowEndModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>End voice chat</Text>
              <Text style={styles.modalSubtitle}>
                The voice chat will end for everyone in this room.
              </Text>

              <Pressable style={styles.modalEndBtn} onPress={handleConfirmEndRoom}>
                <Text style={styles.modalEndBtnText}>End for Everyone</Text>
              </Pressable>

              <Pressable style={styles.modalCancelBtn} onPress={() => setShowEndModal(false)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b0b" },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md },
  loadingText: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.lg },
  backBtn: { backgroundColor: colors.surface, borderRadius: radii.pill, paddingHorizontal: 24, paddingVertical: 12, borderWidth: 1, borderColor: colors.outline, marginTop: spacing.md },
  backBtnText: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.md },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  playbackBanner: {
    backgroundColor: colors.accentYellow,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
  },
  playbackBannerText: {
    color: "#0b0b0b",
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 },
  greenIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#228B6D",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleWrap: { flex: 1 },
  roomTitleText: { color: "#fff", fontFamily: fonts.bold, fontSize: 16 },
  roomSubtext: { color: "#888", fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  iconBtn: { padding: 4 },
  endBtn: {
    backgroundColor: "#FF4444",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  endBtnText: { color: "#fff", fontFamily: fonts.bold, fontSize: 13 },
  // Grid
  gridContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: 120 },
  avatarGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-start", gap: spacing.lg },
  gridItem: { alignItems: "center", width: "29%", marginBottom: spacing.lg },
  avatarBorderWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    borderColor: "#4A2E1C",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  activeSpeakerBorder: { borderColor: "#228B6D", borderWidth: 3 },
  gridAvatar: { width: 76, height: 76, borderRadius: 38 },
  gridName: { color: "#D0D0D0", fontFamily: fonts.semibold, fontSize: 13, textAlign: "center" },
  gridNameActive: { color: "#228B6D", fontFamily: fonts.bold },
  // Floating Bottom Bar
  floatingBarWrap: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  floatingBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#1c1d21",
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 10,
    width: "88%",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  barIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#282a30",
    alignItems: "center",
    justifyContent: "center",
  },
  barIconBtnActive: { backgroundColor: "#1d382e" },
  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#25262a",
    borderRadius: radii.xl,
    padding: spacing.xl,
    alignItems: "center",
  },
  modalTitle: { color: "#fff", fontFamily: fonts.bold, fontSize: 20, marginBottom: 8, textAlign: "center" },
  modalSubtitle: { color: "#aaa", fontFamily: fonts.regular, fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: spacing.xl },
  modalEndBtn: {
    width: "100%",
    backgroundColor: "#FF4444",
    borderRadius: radii.md,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  modalEndBtnText: { color: "#fff", fontFamily: fonts.bold, fontSize: 15 },
  modalCancelBtn: {
    width: "100%",
    backgroundColor: "#35373d",
    borderRadius: radii.md,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelBtnText: { color: "#fff", fontFamily: fonts.bold, fontSize: 15 },
});
