/**
 * Courses Service for BITC
 * 
 * Manages courses catalogue, modules, syllabus lessons, and persistent
 * lesson completion tracking with real progress percentage calculation.
 */

import { getSupabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Lesson = {
  id: string;
  title: string;
  duration: string;
  module: string;
  summary: string;
  completed: boolean;
};

export type Course = {
  id: string;
  title: string;
  lessonsCount: number;
  duration: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  rating: string;
  category: string;
  progressPercent: number;
  image: any;
  summary: string;
  bullets: string[];
  modules: string[];
  lessons: Lesson[];
  requirements: string[];
  reviews: { name: string; role: string; rating: number; comment: string }[];
  authorId?: string;
  authorName?: string;
  isEnrolled?: boolean;
  createdAt?: string;
};

const CUSTOM_COURSES_KEY = "@bitc_custom_courses";
const LAST_STUDIED_KEY = "@bitc_course_last_studied_date";

function getUserProgressKey(userId?: string): string {
  return userId ? `@bitc_course_progress_${userId}` : "@bitc_course_completed_lessons_guest";
}

function getUserEnrollmentsKey(userId?: string): string {
  return userId ? `@bitc_enrolled_courses_${userId}` : "@bitc_enrolled_courses_guest";
}

const BASE_COURSES: Course[] = [
  {
    id: "r1",
    title: "Designing for Mobile: UI Foundations",
    lessonsCount: 12,
    duration: "5-8 Hours",
    level: "Beginner",
    rating: "4.8",
    category: "Mobile UI",
    progressPercent: 0,
    image: require("../images/Rectangle 93.png"),
    summary:
      "Master the fundamentals of designing intuitive, user-friendly mobile interfaces. In this course, you’ll learn how to structure layouts, apply spacing rules, design with responsiveness in mind, and create visually appealing UI patterns tailored for mobile devices.",
    bullets: [
      "Understand core mobile UI design constraints & touch targets",
      "Apply 8pt grid spacing, modern typography scale, and visual rhythm",
      "Build wireframes and clickable high-fidelity prototypes in Figma",
      "Use production-ready design patterns for iOS and Android",
      "Design accessible contrast ratios and states (active, disabled, focused)",
    ],
    modules: ["Module 1: Mobile UI Foundations", "Module 2: Layouts & Spatial Systems", "Module 3: Prototyping & Interactions"],
    lessons: [
      { id: "r1-l1", title: "Introduction to Touch Ergonomics & Safe Areas", duration: "18 mins", module: "Module 1: Mobile UI Foundations", summary: "Learn thumb zones and iOS dynamic island/safe area considerations.", completed: false },
      { id: "r1-l2", title: "The 8-Point Spatial Grid System", duration: "24 mins", module: "Module 1: Mobile UI Foundations", summary: "Master consistent padding, gutters, and micro-spacing tokens.", completed: false },
      { id: "r1-l3", title: "Typography Hierarchies on High-DPI Displays", duration: "20 mins", module: "Module 1: Mobile UI Foundations", summary: "Setting up type scales with Inter and SF Pro for crisp readability.", completed: false },
      { id: "r1-l4", title: "Accessible Color Contrast & Dark Theme", duration: "25 mins", module: "Module 1: Mobile UI Foundations", summary: "Designing WCAG AA compliant palettes with elevation surface layers.", completed: false },

      { id: "r1-l5", title: "Bottom Sheets, Modals, and Overlay Stacks", duration: "32 mins", module: "Module 2: Layouts & Spatial Systems", summary: "Structuring interactive drawers and sheet dismissal gestures.", completed: false },
      { id: "r1-l6", title: "Mobile Navigation: Tabs vs. Hamburger vs. Flow", duration: "28 mins", module: "Module 2: Layouts & Spatial Systems", summary: "Choosing optimal navigation architecture for complex user workflows.", completed: false },
      { id: "r1-l7", title: "Form Inputs, Floating Labels, and Validation States", duration: "30 mins", module: "Module 2: Layouts & Spatial Systems", summary: "Designing keyboard-safe forms with real-time feedback cues.", completed: false },
      { id: "r1-l8", title: "Cards, Lists, and Infinite Scroll UX", duration: "22 mins", module: "Module 2: Layouts & Spatial Systems", summary: "Structuring scannable list item layouts with micro-actions.", completed: false },

      { id: "r1-l9", title: "Clickable Micro-Interactions in Figma", duration: "35 mins", module: "Module 3: Prototyping & Interactions", summary: "Building smart-animate transitions for buttons and tab switches.", completed: false },
      { id: "r1-l10", title: "Handoff to React Native Developers", duration: "25 mins", module: "Module 3: Prototyping & Interactions", summary: "Specifying design tokens, export scales, and asset naming conventions.", completed: false },
      { id: "r1-l11", title: "Usability Testing on Real Hardware", duration: "20 mins", module: "Module 3: Prototyping & Interactions", summary: "Running 5-user guerrilla usability tests via Expo Go.", completed: false },
      { id: "r1-l12", title: "Capstone Project: Mobile Banking Dashboard", duration: "45 mins", module: "Module 3: Prototyping & Interactions", summary: "Build a complete 5-screen financial app UI prototype.", completed: false },
    ],
    requirements: [
      "Basic understanding of Figma or design software interface",
      "A computer capable of running Figma in browser or desktop app",
      "No prior coding experience required",
    ],
    reviews: [
      { name: "Amara Okafor", role: "Product Designer", rating: 5, comment: "The module on spatial grids completely transformed how I space components in mobile apps!" },
      { name: "Devon Clark", role: "Junior UI Designer", rating: 5, comment: "Super practical and direct. The safe area breakdown alone is worth gold." },
    ],
  },
  {
    id: "c1",
    title: "Mastering Logo Variations",
    lessonsCount: 8,
    duration: "1-2 Hours",
    level: "Intermediate",
    rating: "4.9",
    category: "Brand Design",
    progressPercent: 0,
    image: require("../images/image 2.png"),
    summary:
      "Learn how to develop cohesive, responsive brand identity marks that look immaculate across tiny app icons, website headers, billboards, and social media avatars.",
    bullets: [
      "Primary, secondary, and sub-mark lockup hierarchies",
      "Designing responsive vector icons for 16px to 512px viewports",
      "Mono-color and inverted contrast treatments",
      "Clear space rules and usage guidelines for brand manuals",
    ],
    modules: ["Module 1: Responsive Logo Architecture", "Module 2: Production Vector Assets"],
    lessons: [
      { id: "c1-l1", title: "Primary vs. Secondary Brand Lockups", duration: "15 mins", module: "Module 1: Responsive Logo Architecture", summary: "Structuring vertical and horizontal arrangements.", completed: false },
      { id: "c1-l2", title: "Creating the Iconic Favicon & App Icon", duration: "20 mins", module: "Module 1: Responsive Logo Architecture", summary: "Simplifying complex forms for small touch targets.", completed: false },
      { id: "c1-l3", title: "Monochrome & Inverted Contrast Standards", duration: "14 mins", module: "Module 1: Responsive Logo Architecture", summary: "Ensuring legibility on light, dark, and photography backgrounds.", completed: false },
      { id: "c1-l4", title: "Negative Space Crafting & Optical Balance", duration: "22 mins", module: "Module 1: Responsive Logo Architecture", summary: "Fine-tuning bezier curves for geometric harmony.", completed: false },
      { id: "c1-l5", title: "Color Profiles: RGB, CMYK, and Pantone Matching", duration: "18 mins", module: "Module 2: Production Vector Assets", summary: "Preventing color shifts between print and screen.", completed: false },
      { id: "c1-l6", title: "Exporting Clean SVG Vectors without Bloat", duration: "16 mins", module: "Module 2: Production Vector Assets", summary: "Optimizing SVG code and outlines for developers.", completed: false },
      { id: "c1-l7", title: "Building the Brand Guidelines Logo Page", duration: "25 mins", module: "Module 2: Production Vector Assets", summary: "Documenting clear-space, minimum sizes, and forbidden uses.", completed: false },
      { id: "c1-l8", title: "Case Study: Modern Tech Rebrand", duration: "30 mins", module: "Module 2: Production Vector Assets", summary: "Walkthrough of an end-to-end responsive identity delivery.", completed: false },
    ],
    requirements: [
      "Familiarity with vector tools (Illustrator, Figma, or Affinity Designer)",
      "Basic understanding of bezier curves",
    ],
    reviews: [
      { name: "Marcus Vance", role: "Brand Strategist", rating: 5, comment: "Short, punchy, and zero fluff. Every brand designer should take this." },
    ],
  },
  {
    id: "c2",
    title: "UI/UX Design Essentials",
    lessonsCount: 10,
    duration: "2-3 Hours",
    level: "Beginner",
    rating: "4.7",
    category: "Product Design",
    progressPercent: 0,
    image: require("../images/image 1.png"),
    summary:
      "A complete primer on user research, user journey mapping, information architecture, and modern wireframing principles to craft intuitive digital experiences.",
    bullets: [
      "User research methodologies and stakeholder interview framing",
      "Creating personas and end-to-end user journeys",
      "Information architecture and wireframe fidelity steps",
      "Interactive component states and micro-copy writing",
    ],
    modules: ["Module 1: UX Strategy & Discovery", "Module 2: Wireframing & Usability"],
    lessons: [
      { id: "c2-l1", title: "What is Good UX? The 10 Usability Heuristics", duration: "16 mins", module: "Module 1: UX Strategy & Discovery", summary: "Nielsen Norman group principles applied to modern apps.", completed: false },
      { id: "c2-l2", title: "Conducting Actionable User Interviews", duration: "24 mins", module: "Module 1: UX Strategy & Discovery", summary: "Uncovering user pain points without asking leading questions.", completed: false },
      { id: "c2-l3", title: "Synthesizing Findings into User Personas", duration: "20 mins", module: "Module 1: UX Strategy & Discovery", summary: "Creating living personas that actually guide design decisions.", completed: false },
      { id: "c2-l4", title: "Mapping the End-to-End User Journey", duration: "25 mins", module: "Module 1: UX Strategy & Discovery", summary: "Identifying drop-off risks across key user flows.", completed: false },
      { id: "c2-l5", title: "Information Architecture & Card Sorting", duration: "18 mins", module: "Module 1: UX Strategy & Discovery", summary: "Organizing app features intuitively so users never get lost.", completed: false },
      { id: "c2-l6", title: "Low-Fidelity Paper Wireframing", duration: "15 mins", module: "Module 2: Wireframing & Usability", summary: "Rapid ideation before touching pixel-perfect software.", completed: false },
      { id: "c2-l7", title: "Mid-Fidelity Wireframes in Figma", duration: "30 mins", module: "Module 2: Wireframing & Usability", summary: "Focusing on layout, content structure, and information hierarchy.", completed: false },
      { id: "c2-l8", title: "Writing Clear UX Microcopy", duration: "18 mins", module: "Module 2: Wireframing & Usability", summary: "Crafting error messages, button labels, and empty state text.", completed: false },
      { id: "c2-l9", title: "Moderated Usability Testing Walkthrough", duration: "25 mins", module: "Module 2: Wireframing & Usability", summary: "Observing real users navigating your wireframes.", completed: false },
      { id: "c2-l10", title: "Presenting UX Rationale to Clients & Teams", duration: "20 mins", module: "Module 2: Wireframing & Usability", summary: "Defending design choices with research evidence.", completed: false },
    ],
    requirements: [
      "Curiosity about how digital products solve human problems",
      "No coding background required",
    ],
    reviews: [
      { name: "Sophie Tremblay", role: "Product Manager", rating: 5, comment: "Helped me understand the UX workflow so much better. Highly recommended!" },
    ],
  },
];

/**
 * Get map of completed lesson IDs from storage for a specific user
 */
async function getCompletedLessonIds(userId?: string): Promise<Record<string, boolean>> {
  try {
    const key = getUserProgressKey(userId);
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Get enrolled course IDs for a specific user
 */
export async function getUserEnrolledCourseIds(userId?: string): Promise<string[]> {
  const localKey = getUserEnrollmentsKey(userId);
  let localEnrolled: string[] = [];
  try {
    const raw = await AsyncStorage.getItem(localKey);
    if (raw) localEnrolled = JSON.parse(raw);
  } catch {}

  const sb = getSupabase();
  if (sb && userId) {
    try {
      const { data, error } = await sb
        .from("course_enrollments")
        .select("course_id")
        .eq("user_id", userId);
      if (!error && data && Array.isArray(data)) {
        const cloudIds = data.map((r: any) => String(r.course_id));
        const merged = Array.from(new Set([...localEnrolled, ...cloudIds]));
        return merged;
      }
    } catch {}
  }
  return localEnrolled;
}

/**
 * Enroll user in a course
 */
export async function enrollInCourse(courseId: string, userId?: string): Promise<boolean> {
  const localKey = getUserEnrollmentsKey(userId);
  let enrolled: string[] = [];
  try {
    const raw = await AsyncStorage.getItem(localKey);
    if (raw) enrolled = JSON.parse(raw);
  } catch {}

  if (!enrolled.includes(courseId)) {
    enrolled.push(courseId);
    await AsyncStorage.setItem(localKey, JSON.stringify(enrolled));
  }

  const sb = getSupabase();
  if (sb && userId) {
    try {
      await sb.from("course_enrollments").upsert(
        {
          user_id: userId,
          course_id: courseId,
          progress: 0,
          status: "in_progress",
          last_accessed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,course_id" }
      );
    } catch {}
  }

  return true;
}

/**
 * Unenroll user from a course
 */
export async function unenrollFromCourse(courseId: string, userId?: string): Promise<boolean> {
  const localKey = getUserEnrollmentsKey(userId);
  let enrolled: string[] = [];
  try {
    const raw = await AsyncStorage.getItem(localKey);
    if (raw) enrolled = JSON.parse(raw);
  } catch {}

  enrolled = enrolled.filter((id) => id !== courseId);
  await AsyncStorage.setItem(localKey, JSON.stringify(enrolled));

  const sb = getSupabase();
  if (sb && userId) {
    try {
      await sb.from("course_enrollments").delete().eq("user_id", userId).eq("course_id", courseId);
    } catch {}
  }

  return true;
}

/**
 * Create and publish a course (for Business/Studio & Admin accounts)
 */
export async function createCourse(
  courseInput: {
    title: string;
    category: string;
    level: "Beginner" | "Intermediate" | "Advanced";
    duration: string;
    summary: string;
    imageUri?: string | null;
    bullets: string[];
    requirements: string[];
    lessons: { title: string; duration: string; summary: string; module?: string }[];
  },
  authorId: string,
  authorName: string
): Promise<Course> {
  const courseId = `course_${Date.now()}`;
  const modulesList = Array.from(
    new Set(courseInput.lessons.map((l) => l.module || "Module 1: Course Core"))
  );

  const formattedLessons: Lesson[] = courseInput.lessons.map((l, idx) => ({
    id: `${courseId}-l${idx + 1}`,
    title: l.title.trim(),
    duration: l.duration.trim() || "15 mins",
    module: l.module || "Module 1: Course Core",
    summary: l.summary.trim() || "Comprehensive practical lesson walkthrough.",
    completed: false,
  }));

  const newCourse: Course = {
    id: courseId,
    title: courseInput.title.trim(),
    lessonsCount: formattedLessons.length,
    duration:
      courseInput.duration.trim() ||
      `${Math.max(1, Math.round(formattedLessons.length * 0.4))} Hours`,
    level: courseInput.level,
    rating: "5.0",
    category: courseInput.category || "Creative Direction",
    progressPercent: 0,
    image: courseInput.imageUri
      ? { uri: courseInput.imageUri }
      : require("../images/Rectangle 93.png"),
    summary: courseInput.summary.trim(),
    bullets: courseInput.bullets.filter(Boolean),
    modules: modulesList.length > 0 ? modulesList : ["Module 1: Course Core"],
    lessons: formattedLessons,
    requirements: courseInput.requirements.filter(Boolean),
    reviews: [
      {
        name: authorName,
        role: "Studio Instructor",
        rating: 5,
        comment: "Official masterclass provided for the BITC Creative Network.",
      },
    ],
    authorId,
    authorName,
    isEnrolled: false,
    createdAt: new Date().toISOString(),
  };

  // 1. Save to custom courses in storage
  let customList: Course[] = [];
  try {
    const raw = await AsyncStorage.getItem(CUSTOM_COURSES_KEY);
    if (raw) customList = JSON.parse(raw);
  } catch {}
  customList.unshift(newCourse);
  await AsyncStorage.setItem(CUSTOM_COURSES_KEY, JSON.stringify(customList));

  // 2. Try saving to Supabase courses table
  const sb = getSupabase();
  if (sb) {
    try {
      await sb.from("courses").insert({
        id: courseId,
        title: newCourse.title,
        category: newCourse.category,
        level: newCourse.level,
        duration: newCourse.duration,
        summary: newCourse.summary,
        author_id: authorId,
        author_name: authorName,
        lessons_count: newCourse.lessonsCount,
        image_url: courseInput.imageUri ?? null,
      });
    } catch {}
  }

  return newCourse;
}

/**
 * Fetch all courses populated with user's real progress and enrollment status
 */
export async function fetchCourses(userId?: string): Promise<Course[]> {
  const completedMap = await getCompletedLessonIds(userId);
  const enrolledIds = await getUserEnrolledCourseIds(userId);

  // Load custom studio courses
  let customCourses: Course[] = [];
  try {
    const raw = await AsyncStorage.getItem(CUSTOM_COURSES_KEY);
    if (raw) customCourses = JSON.parse(raw);
  } catch {}

  const all = [...customCourses, ...BASE_COURSES];

  return all.map((course) => {
    const isEnrolled = enrolledIds.includes(course.id);
    const lessonsWithStatus = course.lessons.map((lesson) => ({
      ...lesson,
      completed: Boolean(completedMap[lesson.id]),
    }));
    const completedCount = lessonsWithStatus.filter((l) => l.completed).length;
    const progressPercent =
      course.lessons.length > 0
        ? Math.round((completedCount / course.lessons.length) * 100)
        : 0;

    return {
      ...course,
      lessons: lessonsWithStatus,
      lessonsCount: course.lessons.length,
      progressPercent,
      isEnrolled,
    };
  });
}

/**
 * Fetch specific course by ID with user enrollment & progress context
 */
export async function fetchCourseById(courseId: string, userId?: string): Promise<Course | null> {
  const courses = await fetchCourses(userId);
  const found = courses.find((c) => c.id === courseId);
  return found || courses[0];
}

/**
 * Toggle a lesson completed or uncompleted for a user
 */
export async function toggleLessonCompleted(
  courseId: string,
  lessonId: string,
  userId?: string
): Promise<{ course: Course; completed: boolean; progressPercent: number }> {
  const completedMap = await getCompletedLessonIds(userId);
  const currentStatus = Boolean(completedMap[lessonId]);
  const newStatus = !currentStatus;

  if (newStatus) {
    completedMap[lessonId] = true;
  } else {
    delete completedMap[lessonId];
  }

  // Auto-enroll if not already enrolled
  await enrollInCourse(courseId, userId);

  const localKey = getUserProgressKey(userId);
  await AsyncStorage.setItem(localKey, JSON.stringify(completedMap));
  await AsyncStorage.setItem(
    `${LAST_STUDIED_KEY}_${userId || "guest"}`,
    new Date().toISOString()
  );

  const updatedCourse = (await fetchCourseById(courseId, userId))!;

  // Sync to Supabase course_enrollments if available
  const sb = getSupabase();
  if (sb && userId) {
    try {
      await sb.from("course_enrollments").upsert(
        {
          user_id: userId,
          course_id: courseId,
          progress: updatedCourse.progressPercent,
          status: updatedCourse.progressPercent === 100 ? "completed" : "in_progress",
          last_accessed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,course_id" }
      );
    } catch {}
  }

  return {
    course: updatedCourse,
    completed: newStatus,
    progressPercent: updatedCourse.progressPercent,
  };
}

/**
 * Fetch learning stats for Skills dashboard (strictly user-scoped)
 */
export async function fetchLearningStats(userId?: string): Promise<{
  learningStreakDays: number;
  coursesCompletedCount: number;
  aiToolsUsedThisWeek: number;
  totalLessonsCompleted: number;
}> {
  const courses = await fetchCourses(userId);
  let totalLessonsCompleted = 0;
  let coursesCompletedCount = 0;

  // Only calculate for courses the user has actually enrolled in
  for (const c of courses) {
    if (c.isEnrolled) {
      const done = c.lessons.filter((l) => l.completed).length;
      totalLessonsCompleted += done;
      if (c.progressPercent === 100) {
        coursesCompletedCount++;
      }
    }
  }

  // Calculate streak based on user's last study date
  let streak = 0;
  try {
    const lastStudied = await AsyncStorage.getItem(
      `${LAST_STUDIED_KEY}_${userId || "guest"}`
    );
    if (lastStudied) {
      const diffHours =
        (Date.now() - new Date(lastStudied).getTime()) / (1000 * 60 * 60);
      if (diffHours < 36) {
        streak = 1;
      }
    }
  } catch {}

  // Fetch AI tools used count
  let aiToolsUsed = 0;
  try {
    const { fetchAiToolsUsedCount } = await import("@/services/ai");
    aiToolsUsed = await fetchAiToolsUsedCount();
  } catch {}

  return {
    learningStreakDays: streak,
    coursesCompletedCount,
    aiToolsUsedThisWeek: aiToolsUsed,
    totalLessonsCompleted,
  };
}
