import SafeScreen from "@/components/SafeScreen";
import { colors, fonts, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function NotificationView() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const isApplicationViewed = id === "application-viewed";

  return (
    <SafeScreen>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={22} color="#fff" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {isApplicationViewed ? (
          <View>
            <Text style={styles.title}>Your application was viewed</Text>
            <Text style={styles.body}>
              TalentWave has reviewed your application for the role of UI Designer.
            </Text>
            <Text style={styles.body}>
              Their hiring team has opened your portfolio and assessed your experience. You’ll be notified once they take further action.
            </Text>

            <Text style={styles.section}>What happens next?</Text>
            <View style={styles.list}>
              <Text style={styles.item}>• If shortlisted, you’ll receive an interview invitation.</Text>
              <Text style={styles.item}>• If additional documents are needed, TalentWave will request them directly.</Text>
              <Text style={styles.item}>• You can still update your application before final review.</Text>
            </View>
          </View>
        ) : (
          <View>
            <Text style={styles.title}>More details</Text>
            <Text style={styles.body}>
              The full notification details for “{id}” can be presented here. Share any copy you want displayed and I’ll finalize this view.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  backBtn: {
    paddingVertical: spacing.sm,
    paddingRight: spacing.md,
    alignSelf: "flex-start",
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: fonts.size.title,
    marginTop: spacing.md,
  },
  body: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: fonts.size.md,
    lineHeight: 22,
    marginTop: spacing.md,
  },
  section: {
    color: colors.textPrimary,
    fontFamily: fonts.semibold,
    fontSize: fonts.size.lg,
    marginTop: spacing.lg,
  },
  list: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  item: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: fonts.size.md,
    lineHeight: 22,
  },
});
