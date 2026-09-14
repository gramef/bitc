import { useAuth } from "@/contexts/AuthContext";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Slot, usePathname, useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type AdminNavItem = {
  label: string;
  route: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  badge?: string;
};

const NAV_ITEMS: AdminNavItem[] = [
  { label: "Overview", route: "/admin", icon: "dashboard" },
  { label: "Events & Roster", route: "/admin/events", icon: "confirmation-number" },
  { label: "Verifications", route: "/admin/verifications", icon: "verified" },
  { label: "Moderation", route: "/admin/moderation", icon: "security", badge: "Live" },
  { label: "Jobs & Market", route: "/admin/jobs", icon: "work" },
];

export default function AdminLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { profile } = useAuth();

  const isDesktop = width >= 840;
  const isAdmin = profile?.role === "admin" || __DEV__; // Allows preview in development

  return (
    <View style={[styles.container, { paddingTop: isDesktop ? 0 : insets.top }]}>
      {/* Dev Role Notice if not officially admin in database */}
      {profile?.role !== "admin" && (
        <View style={styles.devBanner}>
          <MaterialIcons name="info" size={16} color="#ffeaa7" />
          <Text style={styles.devBannerText}>
            Development Mode Preview • Viewing Super Admin Console as {profile?.fullName || "Guest"}
          </Text>
        </View>
      )}

      {isDesktop ? (
        // Desktop Layout: Left Sidebar + Top Bar + Content Canvas
        <View style={styles.desktopLayout}>
          {/* Left Navigation Sidebar */}
          <View style={styles.sidebar}>
            {/* Brand Header */}
            <View style={styles.sidebarBrand}>
              <View style={styles.logoBadge}>
                <Text style={styles.logoBadgeText}>B</Text>
              </View>
              <View>
                <Text style={styles.brandTitle}>BITC Console</Text>
                <Text style={styles.brandSubtitle}>Super Admin Portal</Text>
              </View>
            </View>

            {/* Nav Menu */}
            <View style={styles.navMenu}>
              <Text style={styles.navSectionHeader}>OPERATIONS & CONTROL</Text>
              {NAV_ITEMS.map((item) => {
                const isActive =
                  item.route === "/admin"
                    ? pathname === "/admin" || pathname === "/admin/"
                    : pathname.startsWith(item.route);

                return (
                  <Pressable
                    key={item.route}
                    style={[styles.navItem, isActive && styles.navItemActive]}
                    onPress={() => router.push(item.route as any)}
                  >
                    <MaterialIcons
                      name={item.icon}
                      size={20}
                      color={isActive ? colors.accentYellow : colors.textSecondary}
                    />
                    <Text style={[styles.navItemText, isActive && styles.navItemTextActive]}>
                      {item.label}
                    </Text>
                    {item.badge ? (
                      <View
                        style={[
                          styles.navBadge,
                          item.badge === "Live" ? styles.navBadgeLive : styles.navBadgeYellow,
                        ]}
                      >
                        <Text style={styles.navBadgeText}>{item.badge}</Text>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            {/* Admin Profile & App Exit Footer */}
            <View style={styles.sidebarFooter}>
              <View style={styles.adminUserRow}>
                <View style={styles.adminAvatarWrap}>
                  <MaterialIcons name="admin-panel-settings" size={20} color={colors.accentYellow} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.adminUserName} numberOfLines={1}>
                    {profile?.fullName || "Super Admin"}
                  </Text>
                  <Text style={styles.adminUserRole}>Platform Administrator</Text>
                </View>
              </View>

              <Pressable
                style={styles.exitBtn}
                onPress={() => router.push("/home")}
                hitSlop={6}
              >
                <MaterialIcons name="arrow-back" size={16} color={colors.textSecondary} />
                <Text style={styles.exitBtnText}>Exit to User App</Text>
              </Pressable>
            </View>
          </View>

          {/* Main Desktop Stage */}
          <View style={styles.mainStage}>
            {/* Desktop Top Header Bar */}
            <View style={styles.topHeader}>
              <View style={styles.topHeaderLeft}>
                <Text style={styles.topHeaderBreadcrumb}>BITC Network • Global Operations</Text>
              </View>
              <View style={styles.topHeaderRight}>
                <View style={styles.systemStatusPill}>
                  <View style={styles.statusDotGreen} />
                  <Text style={styles.statusText}>LiveKit Audio Active</Text>
                </View>
                <Pressable
                  style={styles.headerActionBtn}
                  onPress={() => router.push("/admin/events" as any)}
                  hitSlop={6}
                >
                  <MaterialIcons name="qr-code-scanner" size={16} color={colors.textDark} />
                  <Text style={styles.headerActionText}>Door Check-In</Text>
                </Pressable>
              </View>
            </View>

            {/* Routed Screen Content */}
            <View style={styles.contentCanvas}>
              <Slot />
            </View>
          </View>
        </View>
      ) : (
        // Mobile / Tablet Layout: Top Header + Scrollable Tabs + Content
        <View style={styles.mobileLayout}>
          <View style={styles.mobileTopBar}>
            <Pressable onPress={() => router.push("/home")} hitSlop={8} style={styles.mobileBackBtn}>
              <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
            </Pressable>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={styles.mobileTitle}>Super Admin Console</Text>
              <Text style={styles.mobileSubtitle}>{profile?.fullName || "Admin"}</Text>
            </View>
            <View style={styles.mobileRoleBadge}>
              <Text style={styles.mobileRoleText}>ADMIN</Text>
            </View>
          </View>

          {/* Horizontal Mobile Nav Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mobileNavScroll}>
            <View style={styles.mobileNavRow}>
              {NAV_ITEMS.map((item) => {
                const isActive =
                  item.route === "/admin"
                    ? pathname === "/admin" || pathname === "/admin/"
                    : pathname.startsWith(item.route);

                return (
                  <Pressable
                    key={item.route}
                    style={[styles.mobileChip, isActive && styles.mobileChipActive]}
                    onPress={() => router.push(item.route as any)}
                  >
                    <MaterialIcons
                      name={item.icon}
                      size={16}
                      color={isActive ? colors.textDark : colors.textSecondary}
                    />
                    <Text style={[styles.mobileChipText, isActive && styles.mobileChipTextActive]}>
                      {item.label}
                    </Text>
                    {item.badge ? (
                      <View style={styles.mobileChipBadge}>
                        <Text style={styles.mobileChipBadgeText}>{item.badge}</Text>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <View style={{ flex: 1 }}>
            <Slot />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  devBanner: {
    backgroundColor: "#4a3c18",
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#665220",
  },
  devBannerText: {
    color: "#ffeaa7",
    fontFamily: fonts.semibold,
    fontSize: fonts.size.xs,
  },
  desktopLayout: {
    flex: 1,
    flexDirection: "row",
  },
  sidebar: {
    width: 260,
    backgroundColor: "#111111",
    borderRightWidth: 1,
    borderRightColor: colors.outline,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    justifyContent: "space-between",
  },
  sidebarBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xl,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.accentYellow,
    alignItems: "center",
    justifyContent: "center",
  },
  logoBadgeText: {
    color: colors.textDark,
    fontFamily: fonts.bold,
    fontSize: 20,
  },
  brandTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: fonts.size.md,
  },
  brandSubtitle: {
    color: colors.accentYellow,
    fontFamily: fonts.semibold,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  navMenu: {
    gap: 4,
  },
  navSectionHeader: {
    color: colors.textMuted,
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 11,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
  },
  navItemActive: {
    backgroundColor: "#1e1e1e",
    borderLeftWidth: 3,
    borderLeftColor: colors.accentYellow,
  },
  navItemText: {
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    fontSize: fonts.size.sm,
    flex: 1,
  },
  navItemTextActive: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
  },
  navBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  navBadgeYellow: {
    backgroundColor: colors.accentYellow,
  },
  navBadgeLive: {
    backgroundColor: "#e74c3c",
  },
  navBadgeText: {
    color: colors.textDark,
    fontFamily: fonts.bold,
    fontSize: 10,
  },
  sidebarFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.outline,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  adminUserRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  adminAvatarWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#1e1e1e",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.accentYellow,
  },
  adminUserName: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: fonts.size.sm,
  },
  adminUserRole: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 11,
  },
  exitBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  exitBtnText: {
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    fontSize: fonts.size.xs,
  },
  mainStage: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topHeader: {
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
    paddingHorizontal: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#111111",
  },
  topHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  topHeaderBreadcrumb: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: fonts.size.sm,
  },
  topHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  systemStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#161616",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  statusDotGreen: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accentGreen,
  },
  statusText: {
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    fontSize: fonts.size.xs,
  },
  headerActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.accentYellow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  headerActionText: {
    color: colors.textDark,
    fontFamily: fonts.bold,
    fontSize: fonts.size.xs,
  },
  contentCanvas: {
    flex: 1,
  },
  mobileLayout: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mobileTopBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
  },
  mobileBackBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.outline,
    alignItems: "center",
    justifyContent: "center",
  },
  mobileTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: fonts.size.md,
  },
  mobileSubtitle: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: fonts.size.xs,
  },
  mobileRoleBadge: {
    backgroundColor: colors.accentYellow,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  mobileRoleText: {
    color: colors.textDark,
    fontFamily: fonts.bold,
    fontSize: 10,
  },
  mobileNavScroll: {
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
    backgroundColor: colors.surface,
  },
  mobileNavRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    gap: spacing.sm,
  },
  mobileChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#181818",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  mobileChipActive: {
    backgroundColor: colors.accentYellow,
    borderColor: colors.accentYellow,
  },
  mobileChipText: {
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    fontSize: fonts.size.xs,
  },
  mobileChipTextActive: {
    color: colors.textDark,
    fontFamily: fonts.bold,
  },
  mobileChipBadge: {
    backgroundColor: "#e74c3c",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  mobileChipBadgeText: {
    color: "#fff",
    fontFamily: fonts.bold,
    fontSize: 8,
  },
});
