import SafeScreen from "@/components/SafeScreen";
import { createRoom, fetchSuggestedModerators, type ModeratorUser } from "@/services/rooms";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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

const CATEGORIES = [
  "UI/UX Design",
  "Graphic Design",
  "Music & Production",
  "Tech & Development",
  "Business & Freelancing",
  "Career & Mentorship",
  "Content Creation",
  "Open Mic & Chill",
];

const ROOM_ICONS = ["groups", "sentiment-satisfied-alt", "photo-camera", "bolt", "near-me"] as const;

const ROOM_COLORS = [
  "#228B6D", // Green (Default selected)
  "#F1C40F", // Yellow
  "#E74C3C", // Red
  "#E84393", // Pink
  "#9B59B6", // Purple
  "#3498DB", // Blue
  "#00CEC9", // Cyan
];

const DEFAULT_RULES = [
  "Be respectful and kind to everyone",
  "No harassment or hate speech",
  "No spam or self-promotion",
  "Stay on topic",
  "Respect everyone's privacy",
];

export default function CreateRoom() {
  const router = useRouter();

  // Wizard Step (1 to 6)
  const [step, setStep] = useState(1);

  // Step 1 Form
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // Step 2 Form
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [selectedIcon, setSelectedIcon] = useState<string>("groups");
  const [selectedColor, setSelectedColor] = useState<string>("#228B6D");

  // Step 3 Form (Access)
  const [accessMode, setAccessMode] = useState<"public" | "social" | "private">("public");

  // Step 4 Form (Add Moderators)
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestedMods, setSuggestedMods] = useState<ModeratorUser[]>([]);
  const [selectedMods, setSelectedMods] = useState<ModeratorUser[]>([]);
  const [loadingMods, setLoadingMods] = useState(false);

  // Step 5 Form (Community Guidelines - Figma Image 1)
  const [selectedRules, setSelectedRules] = useState<string[]>([...DEFAULT_RULES]);
  const [customRule, setCustomRule] = useState("");

  // Submission State
  const [creating, setCreating] = useState(false);

  // Load real profiles for moderator selection
  useEffect(() => {
    let active = true;
    (async () => {
      setLoadingMods(true);
      const realProfiles = await fetchSuggestedModerators(searchQuery);
      if (active) {
        setSuggestedMods(realProfiles);
        setLoadingMods(false);
      }
    })();
    return () => { active = false; };
  }, [searchQuery]);

  async function handlePickCoverImage() {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        setCoverImage(res.assets[0].uri);
      }
    } catch (e) {
      console.warn("Image picker error:", e);
    }
  }

  function toggleModerator(user: ModeratorUser) {
    if (selectedMods.some((m) => m.id === user.id)) {
      setSelectedMods(selectedMods.filter((m) => m.id !== user.id));
    } else {
      setSelectedMods([...selectedMods, user]);
    }
  }

  function toggleRule(ruleText: string) {
    if (selectedRules.includes(ruleText)) {
      setSelectedRules(selectedRules.filter((r) => r !== ruleText));
    } else {
      setSelectedRules([...selectedRules, ruleText]);
    }
  }

  function handleNext() {
    if (step === 1) {
      if (!title.trim()) {
        Alert.alert("Missing Room Name", "Please enter a name for your room.");
        return;
      }
    }
    if (step < 6) {
      setStep(step + 1);
    } else {
      handleFinalSubmit();
    }
  }

  function handleBack() {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  }

  async function handleFinalSubmit() {
    setCreating(true);
    try {
      const roomId = await createRoom({
        title: title.trim(),
        description: description.trim() || undefined,
        category: category || "General",
        coverImageUrl: coverImage ?? undefined,
        roomIcon: selectedIcon,
        roomColor: selectedColor,
        moderatorIds: selectedMods.map((m) => m.id),
      });

      const finalId = roomId || `demo-room-${Date.now()}`;
      router.replace(`/room/${finalId}` as any);
    } catch {
      router.replace(`/room/demo-room-${Date.now()}` as any);
    } finally {
      setCreating(false);
    }
  }

  function formatFollowers(num: number): string {
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    }
    return String(num);
  }

  return (
    <SafeScreen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <Pressable onPress={handleBack} hitSlop={12} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Create Room</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Step Progress Line */}
        <View style={styles.progressWrap}>
          <View style={styles.progressLineTrack}>
            <View style={[styles.progressLineFill, { width: `${(step / 6) * 100}%` }]} />
          </View>
          <View style={styles.dotsRow}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  i <= step && styles.progressDotActive,
                ]}
              />
            ))}
          </View>
          <Text style={styles.stepText}>Step {step} of 6</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* STEP 1: BASICS */}
          {step === 1 && (
            <View>
              <Text style={styles.stepTitle}>Let&apos;s start with the basics</Text>
              <Text style={styles.stepSubtitle}>
                Give your room a name and describe what it&apos;s all about.
              </Text>

              {/* Room Name */}
              <Text style={styles.fieldLabel}>Room Name</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Enter room name"
                  placeholderTextColor="#666"
                  maxLength={40}
                />
                <Text style={styles.counterText}>{title.length}/40</Text>
              </View>

              {/* Category */}
              <Text style={styles.fieldLabel}>Category</Text>
              <Pressable
                style={styles.dropdownBtn}
                onPress={() => setShowCategoryPicker(!showCategoryPicker)}
              >
                <Text style={[styles.dropdownText, !category && { color: "#666" }]}>
                  {category || "Select category"}
                </Text>
                <MaterialIcons
                  name={showCategoryPicker ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                  size={20}
                  color="#888"
                />
              </Pressable>

              {showCategoryPicker && (
                <View style={styles.categoryDropdownList}>
                  {CATEGORIES.map((cat) => (
                    <Pressable
                      key={cat}
                      style={[styles.categoryOption, category === cat && styles.categoryOptionActive]}
                      onPress={() => {
                        setCategory(cat);
                        setShowCategoryPicker(false);
                      }}
                    >
                      <Text style={[styles.categoryOptionText, category === cat && { color: colors.accentYellow }]}>
                        {cat}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {/* Description */}
              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                style={styles.textArea}
                value={description}
                onChangeText={setDescription}
                placeholder="Tell people what this group is about..."
                placeholderTextColor="#666"
                multiline
                textAlignVertical="top"
              />

              {/* Tip Banner */}
              <View style={styles.tipCard}>
                <MaterialIcons name="info-outline" size={20} color={colors.accentYellow} />
                <Text style={styles.tipText}>
                  <Text style={{ fontFamily: fonts.bold, color: colors.accentYellow }}>Tip: </Text>
                  A clear description helps the right people find and join your room.
                </Text>
              </View>
            </View>
          )}

          {/* STEP 2: CUSTOMIZE */}
          {step === 2 && (
            <View>
              <Text style={styles.stepTitle}>Customize your room</Text>
              <Text style={styles.stepSubtitle}>
                Add an image, icon and color to make your room stand out.
              </Text>

              {/* Cover Image */}
              <Text style={styles.fieldLabel}>Cover Image</Text>
              <Pressable style={styles.coverUploadBox} onPress={handlePickCoverImage}>
                {coverImage ? (
                  <Image source={{ uri: coverImage }} style={styles.coverPreviewImage} contentFit="cover" />
                ) : (
                  <View style={styles.coverPlaceholderContent}>
                    <View style={styles.uploadIconWrap}>
                      <MaterialIcons name="photo-camera" size={24} color="#6C7A9C" />
                    </View>
                    <Text style={styles.uploadTitle}>Upload Cover Image</Text>
                    <Text style={styles.uploadSubtext}>Recommended 1080 x 1080px</Text>
                  </View>
                )}
              </Pressable>

              {/* Room Icon */}
              <Text style={styles.fieldLabel}>Room Icon</Text>
              <View style={styles.iconRow}>
                {ROOM_ICONS.map((ic) => (
                  <Pressable
                    key={ic}
                    style={[styles.iconChip, selectedIcon === ic && styles.iconChipActive]}
                    onPress={() => setSelectedIcon(ic)}
                  >
                    <MaterialIcons
                      name={ic as any}
                      size={20}
                      color={selectedIcon === ic ? colors.accentGreen : colors.textSecondary}
                    />
                  </Pressable>
                ))}
              </View>

              {/* Room Color */}
              <Text style={styles.fieldLabel}>Room Color</Text>
              <View style={styles.colorRow}>
                {ROOM_COLORS.map((c) => {
                  const isSelected = selectedColor === c;
                  return (
                    <Pressable
                      key={c}
                      style={[styles.colorRing, isSelected && { borderColor: c }]}
                      onPress={() => setSelectedColor(c)}
                    >
                      <View style={[styles.colorCircle, { backgroundColor: c }]} />
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* STEP 3: AUDIENCE & ACCESS */}
          {step === 3 && (
            <View>
              <Text style={styles.stepTitle}>Audience & Access</Text>
              <Text style={styles.stepSubtitle}>
                Choose who can discover and participate in your voice room.
              </Text>

              <Pressable
                style={[styles.accessCard, accessMode === "public" && styles.accessCardActive]}
                onPress={() => setAccessMode("public")}
              >
                <MaterialIcons name="public" size={24} color={accessMode === "public" ? colors.accentYellow : colors.textSecondary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.accessTitle}>Open Room (Public)</Text>
                  <Text style={styles.accessSub}>Anyone on BITC can discover, listen, and participate.</Text>
                </View>
                {accessMode === "public" && <MaterialIcons name="check-circle" size={20} color={colors.accentYellow} />}
              </Pressable>

              <Pressable
                style={[styles.accessCard, accessMode === "social" && styles.accessCardActive]}
                onPress={() => setAccessMode("social")}
              >
                <MaterialIcons name="people" size={24} color={accessMode === "social" ? colors.accentYellow : colors.textSecondary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.accessTitle}>Social Room</Text>
                  <Text style={styles.accessSub}>Open to your followers and connections.</Text>
                </View>
                {accessMode === "social" && <MaterialIcons name="check-circle" size={20} color={colors.accentYellow} />}
              </Pressable>

              <Pressable
                style={[styles.accessCard, accessMode === "private" && styles.accessCardActive]}
                onPress={() => setAccessMode("private")}
              >
                <MaterialIcons name="lock" size={24} color={accessMode === "private" ? colors.accentYellow : colors.textSecondary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.accessTitle}>Closed Room (Private)</Text>
                  <Text style={styles.accessSub}>Only invited members can enter.</Text>
                </View>
                {accessMode === "private" && <MaterialIcons name="check-circle" size={20} color={colors.accentYellow} />}
              </Pressable>
            </View>
          )}

          {/* STEP 4: ADD MODERATORS */}
          {step === 4 && (
            <View>
              <Text style={styles.stepTitle}>Add Moderators</Text>
              <Text style={styles.stepSubtitle}>
                Invite trusted members to help manage your community.
              </Text>

              {/* Search input */}
              <View style={styles.searchBar}>
                <MaterialIcons name="search" size={20} color="#888" />
                <TextInput
                  style={styles.searchInputText}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search users by name"
                  placeholderTextColor="#888"
                />
              </View>

              <Text style={styles.sectionHeading}>Suggested Moderators</Text>

              {loadingMods ? (
                <ActivityIndicator color={colors.accentYellow} style={{ marginVertical: 20 }} />
              ) : suggestedMods.length === 0 ? (
                <Text style={{ color: "#888", fontFamily: fonts.regular, fontSize: 14, marginVertical: 12 }}>
                  No members found matching your search.
                </Text>
              ) : (
                <View style={styles.modList}>
                  {suggestedMods.map((mod) => {
                    const isSelected = selectedMods.some((m) => m.id === mod.id);
                    return (
                      <View key={mod.id} style={styles.modRow}>
                        <Image
                          source={mod.avatar_url ? { uri: mod.avatar_url } : require("../assets/images/react-logo.png")}
                          style={styles.modAvatar}
                          contentFit="cover"
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.modName}>{mod.full_name}</Text>
                          <Text style={styles.modFollowers}>{formatFollowers(mod.followers_count)} Followers</Text>
                        </View>
                        <Pressable
                          style={[styles.modActionBtn, isSelected ? styles.modActionRemove : styles.modActionAdd]}
                          onPress={() => toggleModerator(mod)}
                        >
                          <MaterialIcons
                            name={isSelected ? "close" : "add"}
                            size={18}
                            color={isSelected ? "#141414" : "#228B6D"}
                          />
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Selected Moderators Bottom Panel */}
              {selectedMods.length > 0 && (
                <View style={styles.selectedPanel}>
                  <Text style={styles.selectedPanelTitle}>
                    Selected Moderators ({selectedMods.length})
                  </Text>
                  <View style={styles.selectedChipsRow}>
                    {selectedMods.map((m) => (
                      <View key={m.id} style={styles.selectedChip}>
                        <Image
                          source={m.avatar_url ? { uri: m.avatar_url } : require("../assets/images/react-logo.png")}
                          style={styles.chipAvatar}
                          contentFit="cover"
                        />
                        <Text style={styles.chipName}>{m.full_name}</Text>
                        <Pressable onPress={() => toggleModerator(m)} hitSlop={6}>
                          <MaterialIcons name="close" size={14} color="#aaa" />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* STEP 5: SET COMMUNITY GUIDELINES (FIGMA IMAGE 1) */}
          {step === 5 && (
            <View>
              <Text style={styles.stepTitle}>Set community guidelines</Text>
              <Text style={styles.stepSubtitle}>
                Set clear rules to keep your community positive and productive.
              </Text>

              {/* Default Rules */}
              <Text style={styles.fieldLabel}>Default Rules</Text>
              <View style={styles.rulesList}>
                {DEFAULT_RULES.map((rule) => {
                  const isChecked = selectedRules.includes(rule);
                  return (
                    <Pressable
                      key={rule}
                      style={[styles.ruleCard, isChecked && styles.ruleCardChecked]}
                      onPress={() => toggleRule(rule)}
                    >
                      <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                        {isChecked && <MaterialIcons name="check" size={14} color="#fff" />}
                      </View>
                      <Text style={styles.ruleText}>{rule}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Add Custom Rule */}
              <Text style={styles.fieldLabel}>Add Custom Rule (Optional)</Text>
              <View style={styles.customRuleContainer}>
                <TextInput
                  style={styles.customRuleInput}
                  value={customRule}
                  onChangeText={setCustomRule}
                  placeholder="Enter custom rule..."
                  placeholderTextColor="#666"
                  maxLength={100}
                  multiline
                  textAlignVertical="top"
                />
                <Text style={styles.customRuleCounter}>{customRule.length}/100</Text>
              </View>
            </View>
          )}

          {/* STEP 6: REVIEW & GO LIVE */}
          {step === 6 && (
            <View>
              <Text style={styles.stepTitle}>Ready to Go Live!</Text>
              <Text style={styles.stepSubtitle}>
                Review your room settings and start your voice conversation.
              </Text>

              <View style={[styles.summaryCard, { borderColor: selectedColor }]}>
                {coverImage ? (
                  <Image source={{ uri: coverImage }} style={styles.summaryCover} contentFit="cover" />
                ) : (
                  <View style={[styles.summaryCoverPlaceholder, { backgroundColor: selectedColor + "20" }]}>
                    <MaterialIcons name={selectedIcon as any} size={48} color={selectedColor} />
                  </View>
                )}

                <View style={styles.summaryContent}>
                  <View style={styles.summaryTag}>
                    <Text style={[styles.summaryTagText, { color: selectedColor }]}>{category || "General"}</Text>
                  </View>
                  <Text style={styles.summaryTitle}>{title || "Untitled Room"}</Text>
                  {description ? <Text style={styles.summaryDesc}>{description}</Text> : null}

                  <View style={styles.summaryMetaRow}>
                    <MaterialIcons name="security" size={16} color="#888" />
                    <Text style={styles.summaryMetaText}>{selectedMods.length} Moderators Assigned</Text>
                  </View>
                  <View style={[styles.summaryMetaRow, { marginTop: 6 }]}>
                    <MaterialIcons name="gavel" size={16} color="#888" />
                    <Text style={styles.summaryMetaText}>{selectedRules.length} Guidelines Active</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Fixed Bottom Primary Button */}
        <View style={styles.bottomBar}>
          <Pressable
            style={[styles.continueBtn, creating && { opacity: 0.6 }]}
            onPress={handleNext}
            disabled={creating}
          >
            {creating ? (
              <ActivityIndicator color={colors.textDark} />
            ) : (
              <Text style={styles.continueBtnText}>
                {step === 6 ? "Go Live 🔴" : "Continue"}
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: 18 },
  // Progress
  progressWrap: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  progressLineTrack: { height: 2, backgroundColor: "#2A2A2A", borderRadius: 1, position: "relative", marginBottom: -10 },
  progressLineFill: { height: 2, backgroundColor: colors.accentYellow, borderRadius: 1 },
  dotsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  progressDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#333" },
  progressDotActive: { backgroundColor: colors.accentYellow },
  stepText: { color: "#888", fontFamily: fonts.regular, fontSize: 12, marginTop: 8 },
  // Scroll Content
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  stepTitle: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: 24, marginBottom: 4 },
  stepSubtitle: { color: "#9E9E9E", fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, marginBottom: spacing.xl },
  fieldLabel: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: 15, marginTop: spacing.md, marginBottom: spacing.xs },
  // Step 1
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e1e1e",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "#4a2424",
    paddingHorizontal: spacing.md,
  },
  textInput: { flex: 1, height: 50, color: "#fff", fontFamily: fonts.regular, fontSize: 15 },
  counterText: { color: "#888", fontFamily: fonts.regular, fontSize: 12 },
  dropdownBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1e1e1e",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "#4a2424",
    paddingHorizontal: spacing.md,
    height: 50,
  },
  dropdownText: { color: "#fff", fontFamily: fonts.regular, fontSize: 15 },
  categoryDropdownList: {
    backgroundColor: "#1e1e1e",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "#4a2424",
    marginTop: 4,
    overflow: "hidden",
  },
  categoryOption: { paddingHorizontal: spacing.md, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#2a2a2a" },
  categoryOptionActive: { backgroundColor: colors.accentYellow + "15" },
  categoryOptionText: { color: "#ccc", fontFamily: fonts.regular, fontSize: 14 },
  textArea: {
    backgroundColor: "#1e1e1e",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "#4a2424",
    padding: spacing.md,
    color: "#fff",
    fontFamily: fonts.regular,
    fontSize: 15,
    minHeight: 120,
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: "#1f1b0d",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "#4a3c10",
    padding: spacing.md,
    marginTop: spacing.xl,
  },
  tipText: { flex: 1, color: "#d1c28c", fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  // Step 2
  coverUploadBox: {
    height: 160,
    backgroundColor: "#1e1e1e",
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "#4a2424",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  coverPreviewImage: { width: "100%", height: "100%" },
  coverPlaceholderContent: { alignItems: "center" },
  uploadIconWrap: { width: 48, height: 48, borderRadius: 12, backgroundColor: "#262e3d", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  uploadTitle: { color: "#fff", fontFamily: fonts.semibold, fontSize: 14 },
  uploadSubtext: { color: "#888", fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },
  iconRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.xs },
  iconChip: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#1e1e1e",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  iconChipActive: { borderColor: colors.accentGreen, backgroundColor: colors.accentGreen + "20" },
  colorRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: spacing.xs },
  colorRing: { width: 44, height: 44, borderRadius: 22, borderWidth: 3, borderColor: "transparent", alignItems: "center", justifyContent: "center" },
  colorCircle: { width: 36, height: 36, borderRadius: 18 },
  // Step 3
  accessCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: "#1e1e1e",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "#333",
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  accessCardActive: { borderColor: colors.accentYellow, backgroundColor: colors.accentYellow + "10" },
  accessTitle: { color: "#fff", fontFamily: fonts.bold, fontSize: 15 },
  accessSub: { color: "#888", fontFamily: fonts.regular, fontSize: 13, marginTop: 2 },
  // Step 4
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "#1e1e1e",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "#4a2424",
    paddingHorizontal: spacing.md,
    height: 48,
    marginBottom: spacing.lg,
  },
  searchInputText: { flex: 1, color: "#fff", fontFamily: fonts.regular, fontSize: 14 },
  sectionHeading: { color: "#fff", fontFamily: fonts.bold, fontSize: 16, marginBottom: spacing.md },
  modList: { gap: spacing.md },
  modRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: "#141414", paddingVertical: 4 },
  modAvatar: { width: 48, height: 48, borderRadius: 24 },
  modName: { color: "#fff", fontFamily: fonts.semibold, fontSize: 15 },
  modFollowers: { color: "#888", fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },
  modActionBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  modActionAdd: { backgroundColor: "#0b2e24" },
  modActionRemove: { backgroundColor: colors.accentYellow },
  selectedPanel: {
    backgroundColor: "#121212",
    borderRadius: radii.lg,
    padding: spacing.md,
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: "#222",
  },
  selectedPanelTitle: { color: "#fff", fontFamily: fonts.semibold, fontSize: 14, marginBottom: spacing.sm },
  selectedChipsRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  selectedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#222",
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipAvatar: { width: 20, height: 20, borderRadius: 10 },
  chipName: { color: "#fff", fontFamily: fonts.regular, fontSize: 12 },
  // Step 5 (Figma Community Guidelines)
  rulesList: { gap: spacing.md, marginTop: spacing.xs, marginBottom: spacing.md },
  ruleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: "#282627",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "#4a2424",
    padding: spacing.md,
    minHeight: 52,
  },
  ruleCardChecked: { borderColor: "#5a2d2d" },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: "#1c1c1c",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#555",
  },
  checkboxChecked: { backgroundColor: "#228B6D", borderColor: "#228B6D" },
  ruleText: { flex: 1, color: "#fff", fontFamily: fonts.semibold, fontSize: 14 },
  customRuleContainer: {
    backgroundColor: "#282627",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "#4a2424",
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  customRuleInput: {
    color: "#fff",
    fontFamily: fonts.regular,
    fontSize: 14,
    minHeight: 80,
  },
  customRuleCounter: { color: "#888", fontFamily: fonts.regular, fontSize: 12, alignSelf: "flex-end", marginTop: 4 },
  // Step 6 Summary
  summaryCard: {
    backgroundColor: "#161616",
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: "hidden",
    marginTop: spacing.md,
  },
  summaryCover: { width: "100%", height: 160 },
  summaryCoverPlaceholder: { height: 140, alignItems: "center", justifyContent: "center" },
  summaryContent: { padding: spacing.lg },
  summaryTag: { alignSelf: "flex-start", backgroundColor: "#222", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, marginBottom: 8 },
  summaryTagText: { fontFamily: fonts.bold, fontSize: 12 },
  summaryTitle: { color: "#fff", fontFamily: fonts.bold, fontSize: 20, marginBottom: 6 },
  summaryDesc: { color: "#aaa", fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, marginBottom: 12 },
  summaryMetaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  summaryMetaText: { color: "#888", fontFamily: fonts.regular, fontSize: 13 },
  // Bottom Bar
  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  continueBtn: {
    backgroundColor: colors.accentYellow,
    borderRadius: radii.pill,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  continueBtnText: { color: colors.textDark, fontFamily: fonts.bold, fontSize: 16 },
});
