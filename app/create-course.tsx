import SafeScreen from "@/components/SafeScreen";
import { Button, Input, ProfileCover } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { createCourse } from "@/services/courses";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const CATEGORIES = [
  "Mobile UI",
  "Brand Design",
  "Product Design",
  "Motion & 3D",
  "Creative Direction",
  "AI Tools",
] as const;

const LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;

export default function CreateCourseScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();

  const isAllowed = profile?.role === "business" || profile?.role === "admin";

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<typeof CATEGORIES[number]>("Mobile UI");
  const [level, setLevel] = useState<typeof LEVELS[number]>("Beginner");
  const [duration, setDuration] = useState("3-4 Hours");
  const [summary, setSummary] = useState("");
  const [coverUri, setCoverUri] = useState<string | null>(null);

  // Bullets ("You'll learn how to:")
  const [bullets, setBullets] = useState<string[]>([
    "Master core production workflows and modern principles",
    "Build real-world client-ready case studies and deliverables",
  ]);
  const [newBullet, setNewBullet] = useState("");

  // Lessons builder
  const [lessons, setLessons] = useState<
    { title: string; duration: string; summary: string; module?: string }[]
  >([
    {
      title: "Introduction & Industry Overview",
      duration: "15 mins",
      module: "Module 1: Foundations",
      summary: "Understand the core concepts, industry background, and course goals.",
    },
    {
      title: "Core Frameworks & Tools Setup",
      duration: "25 mins",
      module: "Module 1: Foundations",
      summary: "Step-by-step setup of design files, tools, and best practice templates.",
    },
  ]);
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonDuration, setNewLessonDuration] = useState("20 mins");
  const [newLessonSummary, setNewLessonSummary] = useState("");

  // Requirements
  const [requirements, setRequirements] = useState<string[]>([
    "Curiosity and willingness to learn creative workflows",
    "Computer or tablet with internet access",
  ]);
  const [newReq, setNewReq] = useState("");

  const [publishing, setPublishing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function pickCover() {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission Required", "Please allow photo library access to upload a course cover.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        quality: 0.75,
        allowsEditing: true,
        aspect: [16, 9],
        base64: true,
        mediaTypes: ["images"] as any,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        const asset = result.assets[0];
        const uri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        setCoverUri(uri);
      }
    } catch {
      // ignore
    }
  }

  function addBullet() {
    if (!newBullet.trim()) return;
    setBullets((prev) => [...prev, newBullet.trim()]);
    setNewBullet("");
  }

  function removeBullet(idx: number) {
    setBullets((prev) => prev.filter((_, i) => i !== idx));
  }

  function addLesson() {
    if (!newLessonTitle.trim()) {
      Alert.alert("Missing Info", "Please enter a lesson title.");
      return;
    }
    setLessons((prev) => [
      ...prev,
      {
        title: newLessonTitle.trim(),
        duration: newLessonDuration.trim() || "20 mins",
        module: `Module ${Math.floor(prev.length / 4) + 1}: Practical Application`,
        summary: newLessonSummary.trim() || "Hands-on walkthrough with actionable takeaways.",
      },
    ]);
    setNewLessonTitle("");
    setNewLessonSummary("");
  }

  function removeLesson(idx: number) {
    if (lessons.length <= 1) {
      Alert.alert("Requirement", "A course must have at least 1 lesson.");
      return;
    }
    setLessons((prev) => prev.filter((_, i) => i !== idx));
  }

  function addRequirement() {
    if (!newReq.trim()) return;
    setRequirements((prev) => [...prev, newReq.trim()]);
    setNewReq("");
  }

  function removeRequirement(idx: number) {
    setRequirements((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handlePublish() {
    if (!title.trim()) {
      setErrorMsg("Please enter a course title.");
      return;
    }
    if (!summary.trim()) {
      setErrorMsg("Please provide an overview summary of the course.");
      return;
    }
    if (lessons.length === 0) {
      setErrorMsg("Please add at least 1 lesson to your syllabus.");
      return;
    }

    setPublishing(true);
    setErrorMsg(null);

    try {
      const authorId = user?.id || "business_creator";
      const authorName = profile?.fullName && profile.fullName !== "Guest"
        ? profile.fullName
        : "Studio Masterclass";

      const created = await createCourse(
        {
          title: title.trim(),
          category,
          level,
          duration: duration.trim() || `${Math.max(1, Math.round(lessons.length * 0.4))} Hours`,
          summary: summary.trim(),
          imageUri: coverUri,
          bullets,
          requirements,
          lessons,
        },
        authorId,
        authorName
      );

      const titleAlert = "Course Published! 🚀";
      const msgAlert = `"${created.title}" is now live in the Skills Vault for creators to enroll in.`;

      if (Platform.OS === "web") {
        if (typeof window !== "undefined") window.alert(`${titleAlert}\n\n${msgAlert}`);
        router.replace(`/course/${created.id}`);
      } else {
        Alert.alert(titleAlert, msgAlert, [
          {
            text: "View Course",
            onPress: () => router.replace(`/course/${created.id}`),
          },
        ]);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Could not publish course. Please try again.");
    } finally {
      setPublishing(false);
    }
  }

  if (!isAllowed) {
    return (
      <SafeScreen>
        <View style={styles.restrictedWrap}>
          <MaterialIcons name="lock" size={48} color={colors.accentYellow} />
          <Text style={styles.restrictedTitle}>Business & Studio Feature</Text>
          <Text style={styles.restrictedSub}>
            Course creation is reserved for verified businesses, studios, and network partners to publish professional masterclasses for creatives.
          </Text>
          <Button
            title="Go Back"
            onPress={() => router.back()}
            style={{ marginTop: spacing.md, minWidth: 160 }}
          />
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <Text style={styles.topTitle}>Create Masterclass</Text>
            <Text style={styles.topSubtitle}>Publish an educational course for creatives</Text>
          </View>
          <View style={styles.businessBadge}>
            <MaterialIcons name="business" size={12} color="#74B9FF" />
            <Text style={styles.businessBadgeText}>STUDIO</Text>
          </View>
        </View>

        {errorMsg ? (
          <View style={styles.errorBanner}>
            <MaterialIcons name="error-outline" size={18} color="#FF7675" />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Cover Photo */}
        <Text style={styles.label}>Cover Banner</Text>
        <View style={styles.coverWrapper}>
          <ProfileCover
            uri={coverUri}
            role="business"
            height={140}
            borderRadius={radii.card}
            editable
            onPressEdit={pickCover}
          />
        </View>
        <Text style={styles.hintText}>Tap banner to upload high-res cover graphic (16:9 recommended)</Text>

        {/* Course Title */}
        <Text style={styles.label}>Course Title *</Text>
        <Input
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Advanced Design Systems & Token Architecture"
        />

        {/* Category Selection */}
        <Text style={styles.label}>Discipline / Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
          <View style={styles.chipsRow}>
            {CATEGORIES.map((cat) => {
              const active = category === cat;
              return (
                <Pressable
                  key={cat}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setCategory(cat)}
                  hitSlop={4}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{cat}</Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {/* Difficulty Level */}
        <Text style={styles.label}>Experience Level</Text>
        <View style={styles.levelRow}>
          {LEVELS.map((lvl) => {
            const active = level === lvl;
            return (
              <Pressable
                key={lvl}
                style={[styles.levelBtn, active && styles.levelBtnActive]}
                onPress={() => setLevel(lvl)}
              >
                <Text style={[styles.levelBtnText, active && styles.levelBtnTextActive]}>
                  {lvl}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Estimated Duration */}
        <Text style={styles.label}>Estimated Completion Time</Text>
        <Input
          value={duration}
          onChangeText={setDuration}
          placeholder="e.g. 3-4 Hours"
        />

        {/* Course Overview */}
        <Text style={styles.label}>Course Overview / Summary *</Text>
        <Input
          value={summary}
          onChangeText={setSummary}
          placeholder="Describe what students will accomplish and why this masterclass is valuable…"
          multiline
          numberOfLines={4}
          style={styles.textArea}
        />

        {/* Key Takeaways Builder */}
        <Text style={styles.label}>What You'll Learn (Key Takeaways)</Text>
        <View style={styles.listContainer}>
          {bullets.map((b, i) => (
            <View key={i} style={styles.bulletItem}>
              <MaterialIcons name="check-circle" size={16} color={colors.accentGreen} />
              <Text style={styles.bulletText}>{b}</Text>
              <Pressable hitSlop={6} onPress={() => removeBullet(i)}>
                <MaterialIcons name="close" size={16} color={colors.textSecondary} />
              </Pressable>
            </View>
          ))}
          <View style={styles.addInlineRow}>
            <View style={{ flex: 1 }}>
              <Input
                value={newBullet}
                onChangeText={setNewBullet}
                placeholder="Add a key skill or outcome…"
              />
            </View>
            <Pressable style={styles.addMiniBtn} onPress={addBullet}>
              <MaterialIcons name="add" size={20} color="#121212" />
            </Pressable>
          </View>
        </View>

        {/* Syllabus / Lessons Builder */}
        <View style={styles.sectionDivider} />
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Syllabus Lessons ({lessons.length})</Text>
          <Text style={styles.sectionSubtitle}>Interactive lesson modules</Text>
        </View>

        <View style={styles.lessonsList}>
          {lessons.map((lesson, idx) => (
            <View key={idx} style={styles.lessonCard}>
              <View style={styles.lessonIndexBadge}>
                <Text style={styles.lessonIndexText}>{idx + 1}</Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.lessonTitle}>{lesson.title}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={styles.lessonModuleTag}>{lesson.module}</Text>
                  <Text style={styles.lessonDurationTag}>⏱ {lesson.duration}</Text>
                </View>
                <Text style={styles.lessonSummary}>{lesson.summary}</Text>
              </View>
              <Pressable hitSlop={6} onPress={() => removeLesson(idx)}>
                <MaterialIcons name="delete-outline" size={20} color="#FF7675" />
              </Pressable>
            </View>
          ))}

          {/* Add Lesson Form */}
          <View style={styles.addLessonBox}>
            <Text style={styles.addLessonHeader}>+ Add New Lesson</Text>
            <Input
              value={newLessonTitle}
              onChangeText={setNewLessonTitle}
              placeholder="Lesson title (e.g. Setting Up 8pt Spatial Tokens)"
            />
            <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm }}>
              <View style={{ width: 120 }}>
                <Input
                  value={newLessonDuration}
                  onChangeText={setNewLessonDuration}
                  placeholder="20 mins"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  value={newLessonSummary}
                  onChangeText={setNewLessonSummary}
                  placeholder="Key summary or takeaway…"
                />
              </View>
            </View>
            <Pressable style={styles.addLessonBtn} onPress={addLesson}>
              <MaterialIcons name="playlist-add" size={18} color="#121212" />
              <Text style={styles.addLessonBtnText}>Add to Syllabus</Text>
            </Pressable>
          </View>
        </View>

        {/* Prerequisites */}
        <Text style={[styles.label, { marginTop: spacing.lg }]}>Prerequisites & Requirements</Text>
        <View style={styles.listContainer}>
          {requirements.map((req, i) => (
            <View key={i} style={styles.bulletItem}>
              <MaterialIcons name="info-outline" size={16} color={colors.accentYellow} />
              <Text style={styles.bulletText}>{req}</Text>
              <Pressable hitSlop={6} onPress={() => removeRequirement(i)}>
                <MaterialIcons name="close" size={16} color={colors.textSecondary} />
              </Pressable>
            </View>
          ))}
          <View style={styles.addInlineRow}>
            <View style={{ flex: 1 }}>
              <Input
                value={newReq}
                onChangeText={setNewReq}
                placeholder="Add equipment or skill prerequisite…"
              />
            </View>
            <Pressable style={styles.addMiniBtn} onPress={addRequirement}>
              <MaterialIcons name="add" size={20} color="#121212" />
            </Pressable>
          </View>
        </View>

        {/* Submit Button */}
        <View style={{ marginTop: spacing.xl, marginBottom: spacing.xl }}>
          <Button
            title={publishing ? "Publishing Masterclass…" : "Publish Course to Network"}
            onPress={handlePublish}
            disabled={publishing}
            style={{ backgroundColor: colors.accentGreen }}
          />
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl * 2,
    gap: spacing.sm,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outline,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: fonts.size.lg,
  },
  topSubtitle: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: fonts.size.xs,
  },
  businessBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#74B9FF18",
    borderWidth: 1,
    borderColor: "#74B9FF40",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  businessBadgeText: {
    color: "#74B9FF",
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 0.6,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FF767520",
    borderWidth: 1,
    borderColor: "#FF767550",
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
  },
  errorText: {
    color: "#FF7675",
    fontFamily: fonts.semibold,
    fontSize: fonts.size.sm,
    flex: 1,
  },
  label: {
    color: colors.textPrimary,
    fontFamily: fonts.semibold,
    fontSize: fonts.size.sm,
    marginTop: spacing.sm,
  },
  hintText: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: fonts.size.xs,
    marginBottom: spacing.xs,
  },
  coverWrapper: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  chipsScroll: {
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  chipsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  chipActive: {
    backgroundColor: colors.accentYellow + "20",
    borderColor: colors.accentYellow,
  },
  chipText: {
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    fontSize: fonts.size.xs,
  },
  chipTextActive: {
    color: colors.accentYellow,
  },
  levelRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  levelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outline,
    alignItems: "center",
  },
  levelBtnActive: {
    backgroundColor: colors.accentGreen + "20",
    borderColor: colors.accentGreen,
  },
  levelBtnText: {
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    fontSize: fonts.size.sm,
  },
  levelBtnTextActive: {
    color: colors.accentGreen,
  },
  textArea: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  listContainer: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  bulletItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  bulletText: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: fonts.regular,
    fontSize: fonts.size.sm,
  },
  addInlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  addMiniBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.accentYellow,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.md,
  },
  sectionHeaderRow: {
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: fonts.size.lg,
  },
  sectionSubtitle: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: fonts.size.xs,
  },
  lessonsList: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  lessonCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.outline,
    padding: spacing.md,
  },
  lessonIndexBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accentGreen + "20",
    borderWidth: 1,
    borderColor: colors.accentGreen,
    alignItems: "center",
    justifyContent: "center",
  },
  lessonIndexText: {
    color: colors.accentGreen,
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  lessonTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.semibold,
    fontSize: fonts.size.md,
  },
  lessonModuleTag: {
    color: colors.accentYellow,
    fontFamily: fonts.semibold,
    fontSize: 11,
  },
  lessonDurationTag: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 11,
  },
  lessonSummary: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: fonts.size.xs,
    marginTop: 2,
  },
  addLessonBox: {
    backgroundColor: "#161616",
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.outline,
    padding: spacing.md,
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  addLessonHeader: {
    color: colors.accentYellow,
    fontFamily: fonts.semibold,
    fontSize: fonts.size.sm,
    marginBottom: spacing.xs,
  },
  addLessonBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.accentYellow,
    borderRadius: radii.md,
    paddingVertical: 10,
    marginTop: spacing.sm,
  },
  addLessonBtnText: {
    color: "#121212",
    fontFamily: fonts.bold,
    fontSize: fonts.size.sm,
  },
  restrictedWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  restrictedTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: fonts.size.xl,
  },
  restrictedSub: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: fonts.size.md,
    textAlign: "center",
    lineHeight: 22,
  },
});
