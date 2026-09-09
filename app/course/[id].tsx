import SafeScreen from "@/components/SafeScreen";
import {
  Course,
  fetchCourseById,
  Lesson,
  toggleLessonCompleted,
} from "@/services/courses";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function CourseView() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"Lessons" | "Requirements" | "Reviews">("Lessons");

  const loadCourse = useCallback(async () => {
    try {
      const data = await fetchCourseById(id || "r1");
      setCourse(data);
    } catch (err) {
      console.warn("Error loading course", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  async function handleToggleLesson(lesson: Lesson) {
    if (!course) return;
    try {
      const { course: updated, completed } = await toggleLessonCompleted(course.id, lesson.id);
      setCourse(updated);
      if (completed && updated.progressPercent === 100) {
        Alert.alert(
          "🎉 Course Completed!",
          `Congratulations! You finished all lessons in "${updated.title}". Your learning streak has been updated.`
        );
      }
    } catch {
      Alert.alert("Error", "Could not update lesson progress.");
    }
  }

  function handleStartOrContinue() {
    if (!course) return;
    const nextIncomplete = course.lessons.find((l) => !l.completed);
    if (nextIncomplete) {
      handleToggleLesson(nextIncomplete);
    } else {
      Alert.alert("Course Completed", "You have already completed all lessons in this course!");
    }
  }

  if (loading || !course) {
    return (
      <SafeScreen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accentGreen} />
          <Text style={styles.loadingText}>Loading course syllabus…</Text>
        </View>
      </SafeScreen>
    );
  }

  const completedCount = course.lessons.filter((l) => l.completed).length;

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={6} style={styles.iconBtn}>
            <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.pageTitle}>Course View</Text>
          <View style={{ width: 32 }} />
        </View>

        <Image source={course.image} style={styles.heroImage} contentFit="cover" />

        <Text style={styles.courseTitle}>{course.title}</Text>
        <View style={styles.metaRow}>
          <MaterialIcons name="view-module" size={16} color={colors.textMuted} />
          <Text style={styles.metaText}>{course.lessonsCount} Lessons</Text>
          <MaterialIcons name="schedule" size={16} color={colors.textMuted} style={{ marginLeft: spacing.md }} />
          <Text style={styles.metaText}>{course.duration}</Text>
          <MaterialIcons name="person" size={16} color={colors.textMuted} style={{ marginLeft: spacing.md }} />
          <Text style={styles.metaText}>{course.level}</Text>
          <MaterialIcons name="star" size={16} color={colors.accentYellow} style={{ marginLeft: spacing.md }} />
          <Text style={styles.metaText}>{course.rating}</Text>
        </View>

        {/* Dynamic Progress Indicator */}
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>
            Progress ({completedCount}/{course.lessonsCount} Completed)
          </Text>
          <Text style={styles.progressPercent}>{course.progressPercent}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${course.progressPercent}%` }]} />
        </View>

        <Text style={styles.summary}>{course.summary}</Text>

        <View style={styles.learnBox}>
          <Text style={styles.learnTitle}>You’ll learn how to:</Text>
          <View style={{ gap: 6, marginTop: spacing.sm }}>
            {course.bullets.map((b, i) => (
              <Text key={i} style={styles.learnItem}>• {b}</Text>
            ))}
          </View>
        </View>

        {/* Tab Selection */}
        <View style={styles.tabsRow}>
          {(["Lessons", "Requirements", "Reviews"] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                hitSlop={6}
                style={{ alignItems: "center" }}
              >
                <Text style={[styles.tabText, isActive ? styles.tabTextActive : null]}>
                  {tab}
                </Text>
                {isActive ? <View style={styles.tabUnderline} /> : <View style={{ height: 8 }} />}
              </Pressable>
            );
          })}
        </View>

        {/* Tab 1: Interactive Lessons */}
        {activeTab === "Lessons" && (
          <View style={styles.lessonsContainer}>
            {course.modules.map((moduleName, modIdx) => {
              const moduleLessons = course.lessons.filter((l) => l.module === moduleName);
              return (
                <View key={modIdx} style={styles.moduleGroup}>
                  <Text style={styles.moduleTitle}>{moduleName}</Text>
                  <View style={styles.moduleLessonsList}>
                    {moduleLessons.map((lesson) => (
                      <Pressable
                        key={lesson.id}
                        style={[
                          styles.lessonCard,
                          lesson.completed && styles.lessonCardCompleted,
                        ]}
                        onPress={() => handleToggleLesson(lesson)}
                        hitSlop={4}
                      >
                        <MaterialIcons
                          name={lesson.completed ? "check-circle" : "radio-button-unchecked"}
                          size={22}
                          color={lesson.completed ? colors.accentGreen : colors.textMuted}
                        />
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text
                            style={[
                              styles.lessonItemTitle,
                              lesson.completed && styles.lessonItemTitleDone,
                            ]}
                          >
                            {lesson.title}
                          </Text>
                          <Text style={styles.lessonItemSummary}>{lesson.summary}</Text>
                        </View>
                        <View style={styles.durationBadge}>
                          <MaterialIcons name="schedule" size={12} color={colors.textSecondary} />
                          <Text style={styles.durationText}>{lesson.duration}</Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Tab 2: Requirements */}
        {activeTab === "Requirements" && (
          <View style={styles.tabCard}>
            <Text style={styles.tabCardTitle}>Course Requirements & Prerequisites</Text>
            {course.requirements.map((req, idx) => (
              <View key={idx} style={styles.reqRow}>
                <MaterialIcons name="check-circle-outline" size={18} color={colors.accentGreen} />
                <Text style={styles.reqText}>{req}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Tab 3: Reviews */}
        {activeTab === "Reviews" && (
          <View style={styles.tabCard}>
            <Text style={styles.tabCardTitle}>Learner Community Reviews</Text>
            {course.reviews.map((rev, idx) => (
              <View key={idx} style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <View>
                    <Text style={styles.reviewerName}>{rev.name}</Text>
                    <Text style={styles.reviewerRole}>{rev.role}</Text>
                  </View>
                  <View style={styles.ratingRow}>
                    <MaterialIcons name="star" size={16} color={colors.accentYellow} />
                    <Text style={styles.ratingText}>{rev.rating}.0</Text>
                  </View>
                </View>
                <Text style={styles.reviewComment}>"{rev.comment}"</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: spacing.lg }} />
        <Pressable style={styles.ctaMain} hitSlop={8} onPress={handleStartOrContinue}>
          <Text style={styles.ctaText}>
            {course.progressPercent === 100
              ? "Revisit Course"
              : course.progressPercent > 0
              ? `Continue Learning (${course.progressPercent}%)`
              : "Start Course"}
          </Text>
        </Pressable>
        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md },
  loadingText: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.md },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, paddingTop: spacing.lg, gap: spacing.md },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.outline,
  },
  pageTitle: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.title },
  heroImage: { width: "100%", height: 180, borderRadius: radii.card, marginTop: spacing.md, overflow: "hidden" },
  courseTitle: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.lg, marginTop: spacing.md },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.xs, flexWrap: "wrap" },
  metaText: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm },
  progressHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.md },
  progressLabel: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm },
  progressPercent: { color: colors.accentYellow, fontFamily: fonts.semibold, fontSize: fonts.size.sm },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#1e1e1e",
    overflow: "hidden",
  },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: colors.accentGreen },
  summary: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.md, lineHeight: 22 },
  learnBox: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.outline,
    padding: spacing.md,
  },
  learnTitle: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.md },
  learnItem: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm, lineHeight: 20 },
  tabsRow: {
    flexDirection: "row",
    gap: spacing.xl,
    marginTop: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
  },
  tabText: { color: colors.textSecondary, fontFamily: fonts.semibold, fontSize: fonts.size.md, paddingBottom: 6 },
  tabTextActive: { color: colors.accentYellow },
  tabUnderline: { height: 3, width: "100%", backgroundColor: colors.accentYellow, borderRadius: 2 },
  lessonsContainer: { gap: spacing.lg, marginTop: spacing.sm },
  moduleGroup: { gap: spacing.sm },
  moduleTitle: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.md },
  moduleLessonsList: { gap: spacing.sm },
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
  lessonCardCompleted: {
    borderColor: "#26422f",
    backgroundColor: "#111a14",
  },
  lessonItemTitle: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.sm },
  lessonItemTitleDone: { color: colors.textSecondary, textDecorationLine: "line-through" },
  lessonItemSummary: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.xs, lineHeight: 16 },
  durationBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#181818", paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4 },
  durationText: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 10 },
  tabCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.outline,
    padding: spacing.md,
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  tabCardTitle: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.md },
  reqRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  reqText: { flex: 1, color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm, lineHeight: 20 },
  reviewItem: { borderTopWidth: 1, borderTopColor: colors.outline, paddingTop: spacing.sm, gap: 4 },
  reviewHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  reviewerName: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.sm },
  reviewerRole: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.xs },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  ratingText: { color: colors.accentYellow, fontFamily: fonts.semibold, fontSize: fonts.size.sm },
  reviewComment: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm, fontStyle: "italic", lineHeight: 20 },
  ctaMain: {
    backgroundColor: colors.accentGreen,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
  },
  ctaText: { color: colors.textDark, fontFamily: fonts.bold, fontSize: fonts.size.lg },
});
