import {
  AttendeeTicket,
  checkInTicket,
  fetchAllEventStats,
  fetchEventRoster,
  fetchEvents,
} from "@/services/events";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

export default function AdminEvents() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 840;

  const [roster, setRoster] = useState<AttendeeTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [scanCodeInput, setScanCodeInput] = useState("");
  const [checkingIn, setCheckingIn] = useState(false);
  const [cameraModalVisible, setCameraModalVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalTicketsIssued: 0,
    checkedInCount: 0,
    checkInRatePercent: 0,
  });

  const loadData = useCallback(async () => {
    try {
      const [r, s] = await Promise.all([
        fetchEventRoster("default"),
        fetchAllEventStats(),
      ]);
      setRoster(r);
      setStats(s);
    } catch (err) {
      console.warn("Failed loading roster", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleQuickCheckIn(code: string) {
    if (!code.trim()) return;
    setCheckingIn(true);
    try {
      const res = await checkInTicket(code);
      Alert.alert(res.ok ? "Guest Check-In" : "Check-In Notice", res.message);
      if (res.ok) {
        setScanCodeInput("");
        await loadData();
      }
    } catch {
      Alert.alert("Error", "Check-in processing error.");
    } finally {
      setCheckingIn(false);
    }
  }

  async function copyTicketCode(code: string) {
    await Clipboard.setStringAsync(code);
    Alert.alert("Copied", `Ticket code ${code} copied to clipboard!`);
  }

  const filteredRoster = roster.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.attendee_name.toLowerCase().includes(q) ||
      item.ticket_code.toLowerCase().includes(q) ||
      item.attendee_role.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={colors.accentYellow} />
        <Text style={styles.loadingText}>Loading guest rosters and check-in database…</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.content, isDesktop && styles.desktopContent]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.pageTitle}>Event Operations & Door Scanner</Text>
          <Text style={styles.pageSubtitle}>
            Live attendee rosters, ticket code validation, and venue door check-in.
          </Text>
        </View>
        <Pressable
          style={styles.createEventBtn}
          onPress={() => router.push("/create-event")}
        >
          <MaterialIcons name="add" size={18} color={colors.textDark} />
          <Text style={styles.createEventBtnText}>Create Brunch Event</Text>
        </Pressable>
      </View>

      {/* Door Check-In Scanner Input Box */}
      <View style={styles.scannerBox}>
        <View style={styles.scannerHeader}>
          <MaterialIcons name="qr-code-scanner" size={20} color={colors.accentYellow} />
          <Text style={styles.scannerTitle}>Quick Ticket Check-In (Door Entry)</Text>
        </View>
        <Text style={styles.scannerHelp}>
          Scan with barcode scanner or type attendee's ticket code (e.g., BITC-BRNC-7291, BITC-DSGN-4819):
        </Text>
        <View style={styles.scannerInputRow}>
          <TextInput
            style={styles.scannerInput}
            placeholder="Type ticket code..."
            placeholderTextColor={colors.textSecondary}
            value={scanCodeInput}
            onChangeText={setScanCodeInput}
            autoCapitalize="characters"
          />
          <Pressable
            style={[styles.scannerSubmitBtn, (!scanCodeInput.trim() || checkingIn) && { opacity: 0.6 }]}
            onPress={() => handleQuickCheckIn(scanCodeInput)}
            disabled={!scanCodeInput.trim() || checkingIn}
          >
            {checkingIn ? (
              <ActivityIndicator color={colors.textDark} size="small" />
            ) : (
              <Text style={styles.scannerSubmitText}>Check In</Text>
            )}
          </Pressable>
          <Pressable
            style={styles.cameraTriggerBtn}
            onPress={async () => {
              if (Platform.OS === "web") {
                const code = typeof window !== "undefined" ? window.prompt("Enter or scan ticket barcode:") : null;
                if (code) handleQuickCheckIn(code);
                return;
              }
              if (!permission?.granted) {
                const res = await requestPermission();
                if (!res.granted) {
                  Alert.alert("Camera Permission Required", "Please allow camera access to scan attendee QR passes.");
                  return;
                }
              }
              setScanned(false);
              setCameraModalVisible(true);
            }}
          >
            <MaterialIcons name="photo-camera" size={18} color={colors.textDark} />
            <Text style={styles.cameraTriggerText}>Scan QR</Text>
          </Pressable>
        </View>
      </View>

      {/* Camera QR Scanner Modal */}
      <Modal visible={cameraModalVisible} animationType="slide" transparent>
        <View style={styles.cameraOverlay}>
          <View style={styles.cameraContainer}>
            <View style={styles.cameraHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <MaterialIcons name="qr-code-scanner" size={20} color={colors.accentYellow} />
                <Text style={styles.cameraHeaderTitle}>Door Ticket Scanner</Text>
              </View>
              <Pressable
                style={styles.cameraCloseBtn}
                onPress={() => setCameraModalVisible(false)}
                hitSlop={8}
              >
                <MaterialIcons name="close" size={20} color="#fff" />
              </Pressable>
            </View>

            <View style={styles.cameraViewport}>
              <CameraView
                style={StyleSheet.absoluteFillObject}
                barcodeScannerSettings={{
                  barcodeTypes: ["qr"],
                }}
                onBarcodeScanned={scanned ? undefined : ({ data }) => {
                  setScanned(true);
                  setCameraModalVisible(false);
                  handleQuickCheckIn(data);
                }}
              />
              <View style={styles.reticleWrap}>
                <View style={styles.reticle} />
                <Text style={styles.reticleHelp}>Align guest ticket QR code within frame</Text>
              </View>
            </View>

            <View style={styles.cameraFooter}>
              <Text style={styles.cameraFooterText}>
                Supported formats: Scannable BITC Ticket Passes & QR codes
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Attendance Stats Cards */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{stats.totalTicketsIssued}</Text>
          <Text style={styles.statLabel}>Tickets Issued</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: colors.accentGreen }]}>
            {stats.checkedInCount}
          </Text>
          <Text style={styles.statLabel}>Checked In at Door</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: colors.accentYellow }]}>
            {stats.checkInRatePercent}%
          </Text>
          <Text style={styles.statLabel}>Door Turnout Rate</Text>
        </View>
      </View>

      {/* Search & Filter Header */}
      <View style={styles.rosterSectionHeader}>
        <Text style={styles.rosterTitle}>
          Master Guest List ({filteredRoster.length} Attendees)
        </Text>
        <View style={styles.searchWrap}>
          <MaterialIcons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search attendee by name or code…"
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery("")} hitSlop={6}>
              <MaterialIcons name="close" size={16} color={colors.textSecondary} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Attendee Roster Table / List */}
      <View style={styles.rosterList}>
        {filteredRoster.length === 0 ? (
          <View style={styles.emptyRosterCard}>
            <MaterialIcons name="person-off" size={36} color={colors.textMuted} />
            <Text style={styles.emptyRosterText}>No attendees matching your search</Text>
          </View>
        ) : (
          filteredRoster.map((item) => {
            const isCheckedIn = item.status === "checked_in";
            return (
              <View key={item.id} style={styles.attendeeCard}>
                <View style={styles.attendeeLeft}>
                  <Image
                    source={
                      item.attendee_avatar
                        ? { uri: item.attendee_avatar }
                        : require("../../assets/images/react-logo.png")
                    }
                    style={styles.avatar}
                  />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.attendeeName}>{item.attendee_name}</Text>
                    <Text style={styles.attendeeRole}>{item.attendee_role}</Text>
                    <Pressable
                      onPress={() => copyTicketCode(item.ticket_code)}
                      style={styles.codePill}
                      hitSlop={4}
                    >
                      <MaterialIcons name="qr-code" size={12} color={colors.accentYellow} />
                      <Text style={styles.codePillText}>{item.ticket_code}</Text>
                      <MaterialIcons name="content-copy" size={10} color={colors.textMuted} />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.attendeeRight}>
                  {isCheckedIn ? (
                    <View style={styles.checkedInBadge}>
                      <MaterialIcons name="check-circle" size={16} color={colors.accentGreen} />
                      <Text style={styles.checkedInBadgeText}>Checked In</Text>
                    </View>
                  ) : (
                    <Pressable
                      style={styles.checkInBtn}
                      onPress={() => handleQuickCheckIn(item.ticket_code)}
                      hitSlop={6}
                    >
                      <MaterialIcons name="how-to-reg" size={16} color={colors.textDark} />
                      <Text style={styles.checkInBtnText}>Check In</Text>
                    </Pressable>
                  )}
                  {item.checked_in_at ? (
                    <Text style={styles.checkedInTimeText}>At {item.checked_in_at}</Text>
                  ) : null}
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md },
  loadingText: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.md },
  content: { padding: spacing.lg, gap: spacing.lg },
  desktopContent: { padding: spacing.xl, maxWidth: 1200, alignSelf: "center", width: "100%" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: spacing.md },
  pageTitle: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.title },
  pageSubtitle: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm, marginTop: 4 },
  createEventBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.accentYellow,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.pill,
  },
  createEventBtnText: { color: colors.textDark, fontFamily: fonts.bold, fontSize: fonts.size.sm },
  scannerBox: {
    backgroundColor: "#161616",
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.accentYellow,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  scannerHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  scannerTitle: { color: colors.accentYellow, fontFamily: fonts.bold, fontSize: fonts.size.md },
  scannerHelp: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm },
  scannerInputRow: { flexDirection: "row", gap: spacing.sm, marginTop: 4 },
  scannerInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.outline,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: fonts.size.md,
    letterSpacing: 1,
  },
  scannerSubmitBtn: {
    backgroundColor: colors.accentGreen,
    borderRadius: radii.md,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  scannerSubmitText: { color: colors.textDark, fontFamily: fonts.bold, fontSize: fonts.size.sm },
  statsGrid: { flexDirection: "row", gap: spacing.md },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.outline,
    padding: spacing.md,
    alignItems: "center",
  },
  statNum: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: 26 },
  statLabel: { color: colors.textSecondary, fontFamily: fonts.semibold, fontSize: fonts.size.xs, marginTop: 2 },
  rosterSectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: spacing.md, marginTop: spacing.md },
  rosterTitle: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.lg },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.outline,
    minWidth: 260,
  },
  searchInput: { flex: 1, color: colors.textPrimary, fontFamily: fonts.regular, fontSize: fonts.size.xs, padding: 0 },
  rosterList: { gap: spacing.sm },
  emptyRosterCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    gap: spacing.sm,
  },
  emptyRosterText: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm },
  attendeeCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.outline,
    padding: spacing.md,
    gap: spacing.md,
  },
  attendeeLeft: { flexDirection: "row", alignItems: "center", gap: spacing.md, flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#1e1e1e" },
  attendeeName: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.sm },
  attendeeRole: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.xs },
  codePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#161616",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  codePillText: { color: colors.accentYellow, fontFamily: fonts.semibold, fontSize: 10 },
  attendeeRight: { alignItems: "flex-end", gap: 4 },
  checkedInBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#112a1c",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.accentGreen,
  },
  checkedInBadgeText: { color: colors.accentGreen, fontFamily: fonts.bold, fontSize: fonts.size.xs },
  checkInBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.accentYellow,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
  },
  checkInBtnText: { color: colors.textDark, fontFamily: fonts.bold, fontSize: fonts.size.xs },
  checkedInTimeText: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 10 },
  cameraTriggerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#00B894",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radii.pill,
    justifyContent: "center",
  },
  cameraTriggerText: { color: colors.textDark, fontFamily: fonts.bold, fontSize: fonts.size.xs },
  cameraOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.md,
  },
  cameraContainer: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.outline,
  },
  cameraHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: "#161616",
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
  },
  cameraHeaderTitle: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.md },
  cameraCloseBtn: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: "#2a2a2a",
  },
  cameraViewport: {
    width: "100%",
    height: 320,
    backgroundColor: "#000",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  reticleWrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  reticle: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: colors.accentYellow,
    borderRadius: 16,
    backgroundColor: "rgba(214, 178, 38, 0.05)",
  },
  reticleHelp: {
    color: "#fff",
    fontFamily: fonts.semibold,
    fontSize: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cameraFooter: {
    padding: spacing.md,
    backgroundColor: "#161616",
    alignItems: "center",
  },
  cameraFooterText: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 11,
    textAlign: "center",
  },
});
