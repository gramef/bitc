import SafeScreen from "@/components/SafeScreen";
import { Conversation, fetchConversations } from "@/services/messages";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function MessagesInbox() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useFocusEffect(
    useCallback(() => {
      fetchConversations().then((data) => {
        setConversations(data);
        setLoading(false);
      });
    }, [])
  );

  const filtered = conversations.filter(
    (c) =>
      c.participant_name.toLowerCase().includes(search.toLowerCase()) ||
      c.last_message.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeScreen>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <Text style={styles.pageTitle}>Messages</Text>
            <Text style={styles.pageSubtitle}>Direct creative collaborations & inquiries</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations…"
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <Pressable onPress={() => setSearch("")} hitSlop={6}>
              <MaterialIcons name="close" size={16} color={colors.textSecondary} />
            </Pressable>
          ) : null}
        </View>

        {/* List */}
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.accentYellow} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {filtered.length === 0 ? (
              <View style={styles.emptyWrap}>
                <MaterialIcons name="chat-bubble-outline" size={40} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No Conversations Yet</Text>
                <Text style={styles.emptyText}>
                  Reach out to creatives, recruiters, or mentors on their profile to start chatting!
                </Text>
              </View>
            ) : (
              filtered.map((conv) => (
                <Pressable
                  key={conv.id}
                  style={styles.convCard}
                  onPress={() => router.push(`/messages/${conv.participant_id}` as any)}
                  hitSlop={4}
                >
                  <Image
                    source={
                      conv.participant_avatar
                        ? { uri: conv.participant_avatar }
                        : require("../../assets/images/react-logo.png")
                    }
                    style={styles.avatar}
                  />

                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={styles.convNameRow}>
                      <Text style={styles.name}>{conv.participant_name}</Text>
                      <Text style={styles.timeText}>{conv.last_message_time}</Text>
                    </View>

                    <Text style={styles.roleText} numberOfLines={1}>
                      {conv.participant_role}
                    </Text>

                    <View style={styles.lastMsgRow}>
                      <Text
                        style={[
                          styles.lastMsg,
                          conv.unread_count > 0 && styles.lastMsgUnread,
                        ]}
                        numberOfLines={1}
                      >
                        {conv.last_message}
                      </Text>

                      {conv.unread_count > 0 && (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadBadgeText}>{conv.unread_count}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </Pressable>
              ))
            )}
          </ScrollView>
        )}
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
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
  pageTitle: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.lg },
  pageSubtitle: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.xs },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  searchInput: { flex: 1, color: colors.textPrimary, fontFamily: fonts.regular, fontSize: fonts.size.sm, padding: 0 },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.sm },
  emptyWrap: { alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.sm, marginTop: spacing.xl },
  emptyTitle: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.md },
  emptyText: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm, textAlign: "center", lineHeight: 20 },
  convCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.outline,
    padding: spacing.md,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#1e1e1e" },
  convNameRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.md },
  timeText: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 11 },
  roleText: { color: colors.accentYellow, fontFamily: fonts.semibold, fontSize: 11 },
  lastMsgRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm, marginTop: 2 },
  lastMsg: { flex: 1, color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm },
  lastMsgUnread: { color: colors.textPrimary, fontFamily: fonts.bold },
  unreadBadge: { backgroundColor: colors.accentGreen, paddingHorizontal: 7, paddingVertical: 2, borderRadius: radii.pill },
  unreadBadgeText: { color: colors.textDark, fontFamily: fonts.bold, fontSize: 10 },
});
