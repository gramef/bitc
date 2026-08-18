import SafeScreen from "@/components/SafeScreen";
import { useAuth } from "@/contexts/AuthContext";
import { createRoom } from "@/services/rooms";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const TOPICS = [
  { label: "Music", icon: "music-note" },
  { label: "Tech", icon: "computer" },
  { label: "Business", icon: "business-center" },
  { label: "Design", icon: "palette" },
  { label: "Career Advice", icon: "school" },
  { label: "Open Mic", icon: "mic" },
  { label: "Podcast", icon: "podcasts" },
] as const;

const TOPIC_COLORS: Record<string, string> = {
  Music: "#E17055",
  Tech: "#6C5CE7",
  Business: "#00B894",
  Design: "#FDCB6E",
  "Career Advice": "#74B9FF",
  "Open Mic": "#FF7675",
  Podcast: "#A29BFE",
};

export default function CreateRoom() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (!title.trim()) {
      Alert.alert("Missing Title", "Give your room a name.");
      return;
    }
    if (!user) {
      Alert.alert("Sign In", "You need to be signed in to start a room.");
      return;
    }
    setCreating(true);
    try {
      const roomId = await createRoom(title.trim(), description.trim() || undefined, selectedTopic ?? undefined);
      if (!roomId) throw new Error("Failed to create room");
      router.replace(`/room/${roomId}` as any);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to create room.");
      setCreating(false);
    }
  }

  return (
    <SafeScreen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <MaterialIcons name="close" size={24} color="#fff" />
            </Pressable>
            <Text style={styles.headerTitle}>Start a Room</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Illustration */}
          <View style={styles.illustration}>
            <View style={styles.micCircle}>
              <MaterialIcons name="mic" size={48} color={colors.textDark} />
            </View>
            <Text style={styles.illustrationText}>
              Start a live conversation with the BITC community
            </Text>
          </View>

          {/* Room Title */}
          <Text style={styles.label}>Room Name *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Music Industry Chat 🎵"
            placeholderTextColor={colors.textSecondary}
            maxLength={80}
          />
          <Text style={styles.charCount}>{title.length}/80</Text>

          {/* Description */}
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="What will you be talking about?"
            placeholderTextColor={colors.textSecondary}
            multiline
            textAlignVertical="top"
            maxLength={250}
          />
          <Text style={styles.charCount}>{description.length}/250</Text>

          {/* Topic Selector */}
          <Text style={styles.label}>Topic</Text>
          <View style={styles.topicGrid}>
            {TOPICS.map((topic) => {
              const isSelected = selectedTopic === topic.label;
              const topicColor = TOPIC_COLORS[topic.label] ?? "#888";
              return (
                <Pressable
                  key={topic.label}
                  style={[
                    styles.topicChip,
                    isSelected && { backgroundColor: topicColor + "30", borderColor: topicColor },
                  ]}
                  onPress={() => setSelectedTopic(isSelected ? null : topic.label)}
                >
                  <MaterialIcons name={topic.icon as any} size={16} color={isSelected ? topicColor : colors.textSecondary} />
                  <Text style={[styles.topicChipText, isSelected && { color: topicColor }]}>
                    {topic.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Host info */}
          <View style={styles.hostInfo}>
            <MaterialIcons name="info-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.hostInfoText}>
              You'll be the host with full control. You can mute, promote, and remove participants.
            </Text>
          </View>

          {/* Start Button */}
          <Pressable
            style={[styles.startBtn, creating && { opacity: 0.6 }]}
            onPress={handleCreate}
            disabled={creating}
          >
            <MaterialIcons name="podcasts" size={22} color={colors.textDark} />
            <Text style={styles.startBtnText}>{creating ? "Going Live…" : "Go Live 🔴"}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 60 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.xl },
  headerTitle: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.xl },
  // Illustration
  illustration: { alignItems: "center", marginBottom: spacing.xl },
  micCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.accentYellow,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  illustrationText: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.md, textAlign: "center", maxWidth: 260 },
  // Form
  label: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.md, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.outline,
    padding: spacing.md,
    color: colors.textPrimary,
    fontFamily: fonts.regular,
    fontSize: fonts.size.md,
  },
  textArea: { minHeight: 80, lineHeight: 22 },
  charCount: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.xs, alignSelf: "flex-end", marginTop: 4, marginBottom: spacing.md },
  // Topics
  topicGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.xl },
  topicChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.outline,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  topicChipText: { color: colors.textSecondary, fontFamily: fonts.semibold, fontSize: fonts.size.sm },
  // Host info
  hostInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: colors.accentYellow + "10",
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  hostInfoText: { flex: 1, color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm, lineHeight: 20 },
  // Start button
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: colors.accentYellow,
    borderRadius: radii.pill,
    paddingVertical: 18,
  },
  startBtnText: { color: colors.textDark, fontFamily: fonts.bold, fontSize: fonts.size.lg },
});
