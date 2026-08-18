import SafeScreen from "@/components/SafeScreen";
import { Button } from "@/components/ui";
import { colors, fonts, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import { LayoutChangeEvent, PanResponder, Pressable, StyleSheet, Text, View } from "react-native";

type Option = { label: string; selected: boolean };

export default function Filter() {
  const router = useRouter();

  const [price, setPrice] = useState(300);
  const [trackW, setTrackW] = useState(0);
  const min = 0;
  const max = 1000;

  const jobTypes = useMemo<Option[]>(() => [
    { label: "Full-time", selected: false },
    { label: "Part-time", selected: false },
    { label: "Remote", selected: false },
    { label: "Hybrid", selected: false },
    { label: "Freelance", selected: false },
  ], []);
  const [jobSel, setJobSel] = useState<Record<string, boolean>>({});

  const categories = useMemo<Option[]>(() => [
    { label: "Design", selected: false },
    { label: "Writing", selected: false },
    { label: "Photography", selected: false },
    { label: "Marketing", selected: false },
    { label: "Development", selected: false },
    { label: "Events", selected: false },
  ], []);
  const [catSel, setCatSel] = useState<Record<string, boolean>>({});

  const levels = useMemo<Option[]>(() => [
    { label: "Internship", selected: false },
    { label: "Junior", selected: false },
    { label: "Mid-level", selected: false },
    { label: "Senior", selected: false },
  ], []);
  const [levelSel, setLevelSel] = useState<Record<string, boolean>>({});

  function toggle(
    map: Record<string, boolean>,
    setMap: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
    key: string,
    single?: boolean
  ) {
    setMap((prev) => {
      if (single) {
        const next: Record<string, boolean> = {};
        next[key] = !prev[key];
        return next;
      }
      return { ...prev, [key]: !prev[key] };
    });
  }

  function resetAll() {
    setPrice(300);
    setJobSel({});
    setCatSel({});
    setLevelSel({});
  }

  function onTrackLayout(e: LayoutChangeEvent) {
    setTrackW(e.nativeEvent.layout.width);
  }

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt) => {
        const x = evt.nativeEvent.locationX;
        if (trackW <= 0) return;
        const ratio = Math.max(0, Math.min(1, x / trackW));
        const value = Math.round((min + ratio * (max - min)) / 10) * 10;
        setPrice(value);
      },
    })
  ).current;

  const knobX = trackW > 0 ? Math.max(0, Math.min(trackW, (price - min) / (max - min) * trackW)) : 0;

  return (
    <SafeScreen>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Filter</Text>
        <Pressable onPress={resetAll} hitSlop={8}>
          <Text style={styles.reset}>Reset</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>Price Range</Text>
        <View style={styles.sliderWrap}>
          <View style={styles.track} onLayout={onTrackLayout} {...pan.panHandlers}>
            <View style={[styles.trackFill, { width: knobX }]} />
            <View style={[styles.knob, { left: knobX - 10 }]} {...pan.panHandlers}>
              <View style={styles.priceBubble}>
                <Text style={styles.priceText}>£{price}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.label}>Job Type</Text>
        <View style={styles.optionsRow}>
          {jobTypes.map((o) => (
            <Pressable key={o.label} style={styles.option} onPress={() => toggle(jobSel, setJobSel, o.label)}>
              <View style={[styles.radio, jobSel[o.label] ? styles.radioActive : styles.radioInactive]}>
                {jobSel[o.label] ? <View style={styles.radioDot} /> : null}
              </View>
              <Text style={[styles.optionText, jobSel[o.label] ? styles.optionTextActive : styles.optionTextInactive]}>{o.label}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.divider} />

        <Text style={styles.label}>Category</Text>
        <View style={styles.optionsRow}>
          {categories.map((o) => (
            <Pressable key={o.label} style={styles.option} onPress={() => toggle(catSel, setCatSel, o.label)}>
              <View style={[styles.radio, catSel[o.label] ? styles.radioActive : styles.radioInactive]}>
                {catSel[o.label] ? <View style={styles.radioDot} /> : null}
              </View>
              <Text style={[styles.optionText, catSel[o.label] ? styles.optionTextActive : styles.optionTextInactive]}>{o.label}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.divider} />

        <Text style={styles.label}>Experience Level</Text>
        <View style={styles.optionsRow}>
          {levels.map((o) => (
            <Pressable key={o.label} style={styles.option} onPress={() => toggle(levelSel, setLevelSel, o.label, true)}>
              <View style={[styles.radio, levelSel[o.label] ? styles.radioActive : styles.radioInactive]}>
                {levelSel[o.label] ? <View style={styles.radioDot} /> : null}
              </View>
              <Text style={[styles.optionText, levelSel[o.label] ? styles.optionTextActive : styles.optionTextInactive]}>{o.label}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.divider} />

        <Text style={styles.label}>Location</Text>

        <Button
          title="Apply Filter"
          onPress={() => {
            const types = Object.keys(jobSel).filter((k) => jobSel[k]);
            const categoriesSel = Object.keys(catSel).filter((k) => catSel[k]);
            const level = Object.keys(levelSel).find((k) => levelSel[k]) || undefined;
            const q = JSON.stringify({ types, categories: categoriesSel, level, maxPrice: price });
            router.replace({ pathname: "/(tabs)/jobs" as any, params: { q } });
          }}
          style={{ marginTop: spacing.lg, width: "100%" }}
        />
      </View>
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
  reset: {
    color: colors.accentYellow,
    fontFamily: fonts.semibold,
    fontSize: fonts.size.md,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  label: {
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    fontSize: fonts.size.md,
    marginTop: spacing.lg,
  },
  sliderWrap: {
    marginTop: spacing.md,
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#333",
  },
  trackFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.accentGreen,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  knob: {
    position: "absolute",
    top: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accentGreen,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  priceBubble: {
    position: "absolute",
    bottom: 24,
    left: -14,
    backgroundColor: "#1E1E1E",
    borderWidth: 1,
    borderColor: colors.accentGreen,
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  priceText: {
    color: "#E8FFE8",
    fontFamily: fonts.semibold,
    fontSize: fonts.size.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.outline,
    marginTop: spacing.md,
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInactive: {
    borderColor: colors.textSecondary,
  },
  radioActive: {
    borderColor: colors.accentGreen,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accentGreen,
  },
  optionText: {
    fontFamily: fonts.semibold,
    fontSize: fonts.size.md,
  },
  optionTextInactive: {
    color: colors.textSecondary,
  },
  optionTextActive: {
    color: colors.textPrimary,
  },
});
