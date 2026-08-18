import SafeScreen from "@/components/SafeScreen";
import { fetchNotifications } from "@/services/notifications";
import { colors, fonts, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type Notice = {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  unread?: boolean;
  group: "TODAY" | "YESTERDAY";
  routeId: string;
};

export default function Notifications() {
  const router = useRouter();

  const [list, setList] = useState<Notice[]>([]);
  useEffect(() => {
    fetchNotifications().then((rows) => {
      const mapped: Notice[] = rows.map((r) => {
        const dt = new Date(r.created_at);
        const now = new Date();
        const isToday =
          dt.getFullYear() === now.getFullYear() &&
          dt.getMonth() === now.getMonth() &&
          dt.getDate() === now.getDate();
        return {
          id: r.id,
          title: r.title,
          subtitle: r.subtitle,
          time: dt.toTimeString().slice(0, 5),
          unread: r.unread,
          group: isToday ? "TODAY" : "YESTERDAY",
          routeId: r.route_id,
        };
      });
      setList(mapped);
    });
  }, []);
  const today = list.filter((n) => n.group === "TODAY");
  const yesterday = list.filter((n) => n.group === "YESTERDAY");

  function markAllRead() {
    setList((prev) => prev.map((n) => ({ ...n, unread: false })));
  }

  return (
    <SafeScreen>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Notification</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.groupHeader}>
          <Text style={styles.groupLabel}>TODAY</Text>
          <Pressable hitSlop={6} onPress={markAllRead}>
            <Text style={styles.groupAction}>Mark all as read</Text>
          </Pressable>
        </View>

        {today.map((n, idx) => (
          <View key={n.id} style={{}}>
            <View style={styles.row}>
              <View style={[styles.dot, n.unread ? styles.dotActive : styles.dotInactive]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{n.title}</Text>
                <Text style={styles.subtitle}>{n.subtitle}</Text>
                <View style={styles.footerRow}>
                  <Text style={styles.time}>{n.time}</Text>
                  <Pressable style={styles.viewMore} hitSlop={6} onPress={() => router.push(`/notifications/${n.routeId}`)}>
                    <Text style={styles.viewText}>View More</Text>
                    <MaterialIcons name="arrow-forward" size={16} color={colors.accentYellow} />
                  </Pressable>
                </View>
              </View>
            </View>
            <View style={styles.divider} />
          </View>
        ))}

        <Text style={[styles.groupLabel, { marginTop: spacing.lg }]}>YESTERDAY</Text>

        {yesterday.map((n) => (
          <View key={n.id} style={{}}>
            <View style={styles.row}>
              <View style={[styles.dot, styles.dotInactive]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{n.title}</Text>
                <Text style={styles.subtitle}>{n.subtitle}</Text>
                <View style={styles.footerRow}>
                  <Text style={styles.time}>{n.time}</Text>
                  <Pressable style={styles.viewMore} hitSlop={6} onPress={() => router.push(`/notifications/${n.routeId}`)}>
                    <Text style={styles.viewText}>View More</Text>
                    <MaterialIcons name="arrow-forward" size={16} color={colors.accentYellow} />
                  </Pressable>
                </View>
              </View>
            </View>
            <View style={styles.divider} />
          </View>
        ))}

      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    paddingVertical: spacing.sm,
    paddingRight: spacing.md,
  },
  headerTitle: {
    color: "#fff",
    fontFamily: fonts.bold,
    fontSize: fonts.size.title,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
  groupLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    fontSize: fonts.size.sm,
  },
  groupAction: {
    color: colors.accentYellow,
    fontFamily: fonts.semibold,
    fontSize: fonts.size.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.outline,
    marginTop: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
  },
  dotActive: {
    backgroundColor: colors.accentGreen,
  },
  dotInactive: {
    backgroundColor: "#3A3A3A",
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.semibold,
    fontSize: fonts.size.lg,
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: fonts.size.sm,
    marginTop: 4,
  },
  footerRow: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  time: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: fonts.size.sm,
  },
  viewMore: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  viewText: {
    color: colors.accentYellow,
    fontFamily: fonts.semibold,
    fontSize: fonts.size.sm,
  },
});
