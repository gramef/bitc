import SafeScreen from "@/components/SafeScreen";
import { Avatar } from "@/components/ui/Avatar";
import {
  Conversation,
  DirectMessage,
  fetchConversationDetails,
  sendDirectMessage,
} from "@/services/messages";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function ChatThread() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  const loadThread = useCallback(async () => {
    if (!id) return;
    try {
      const details = await fetchConversationDetails(id);
      setConversation(details.conversation);
      setMessages(details.messages);
    } catch (err) {
      console.warn("Failed loading thread", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadThread();
  }, [loadThread]);

  async function handleSend() {
    if (!input.trim() || !id || sending) return;
    const textToSend = input.trim();
    setInput("");
    setSending(true);

    try {
      const sent = await sendDirectMessage({
        recipientId: id,
        recipientName: conversation?.participant_name,
        recipientAvatar: conversation?.participant_avatar,
        recipientRole: conversation?.participant_role,
        isVerified: conversation?.is_verified,
        text: textToSend,
      });

      setMessages((prev) => [...prev, sent]);
    } catch {
      console.warn("Failed to send message");
    } finally {
      setSending(false);
    }
  }

  if (loading || !conversation) {
    return (
      <SafeScreen>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.accentYellow} />
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Chat Top Header */}
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>

          <Avatar
            uri={conversation.participant_avatar}
            name={conversation.participant_name}
            size={38}
          />

          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{conversation.participant_name}</Text>
              {conversation.is_verified && <MaterialIcons name="verified" size={14} color="#00B894" />}
            </View>
            <Text style={styles.roleText} numberOfLines={1}>
              {conversation.participant_role}
            </Text>
          </View>

          <Pressable
            style={styles.profileBtn}
            onPress={() => router.push(`/user/${id}` as any)}
            hitSlop={6}
          >
            <MaterialIcons name="person" size={18} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            const isMe = item.sender_id === "me";
            return (
              <View
                style={[
                  styles.messageBubbleWrap,
                  isMe ? styles.bubbleRight : styles.bubbleLeft,
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    isMe ? styles.bubbleMe : styles.bubbleOther,
                  ]}
                >
                  <Text style={[styles.messageText, isMe && styles.messageTextMe]}>
                    {item.text}
                  </Text>
                  <Text style={[styles.timeText, isMe && styles.timeTextMe]}>
                    {item.created_at}
                  </Text>
                </View>
              </View>
            );
          }}
        />

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Type a message…"
            placeholderTextColor={colors.textSecondary}
            value={input}
            onChangeText={setInput}
            multiline
          />
          <Pressable
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || sending}
            hitSlop={6}
          >
            <MaterialIcons name="send" size={18} color={colors.textDark} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
    gap: spacing.sm,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.outline,
  },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#1e1e1e" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  name: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.sm },
  roleText: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.xs },
  profileBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  messageList: { padding: spacing.md, gap: spacing.sm },
  messageBubbleWrap: { flexDirection: "row", marginBottom: 4 },
  bubbleLeft: { justifyContent: "flex-start" },
  bubbleRight: { justifyContent: "flex-end" },
  messageBubble: {
    maxWidth: "80%",
    borderRadius: radii.card,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
  },
  bubbleMe: {
    backgroundColor: colors.accentYellow,
    borderBottomRightRadius: 2,
  },
  bubbleOther: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outline,
    borderBottomLeftRadius: 2,
  },
  messageText: {
    color: colors.textPrimary,
    fontFamily: fonts.regular,
    fontSize: fonts.size.sm,
    lineHeight: 20,
  },
  messageTextMe: {
    color: colors.textDark,
    fontFamily: fonts.semibold,
  },
  timeText: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: 9,
    alignSelf: "flex-end",
  },
  timeTextMe: {
    color: "#6b5810",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.outline,
    backgroundColor: "#111111",
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontFamily: fonts.regular,
    fontSize: fonts.size.sm,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentYellow,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { opacity: 0.4 },
});
