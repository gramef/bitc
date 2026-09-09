import SafeScreen from "@/components/SafeScreen";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function AIPortfolioReviewUpload() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    uri: string;
    size?: number;
  } | null>(null);

  async function handleBrowseFiles() {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Photo library access is required to upload portfolio case studies or artwork."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileName =
          asset.fileName ||
          asset.uri.split("/").pop() ||
          `Portfolio_Case_Study_${Date.now()}.png`;

        setSelectedFile({
          name: fileName,
          uri: asset.uri,
          size: asset.fileSize,
        });
      }
    } catch (err: any) {
      Alert.alert("File Selection", "Could not load file. You can also paste your portfolio link below.");
    }
  }

  function handleStartReview() {
    const trimmedUrl = url.trim();
    if (!selectedFile && !trimmedUrl) {
      Alert.alert(
        "Upload or Link Required",
        "Please select a portfolio image/file or paste your portfolio URL (e.g. Behance, Figma, personal website) to analyze."
      );
      return;
    }

    router.push({
      pathname: "/skills/tools/portfolio-review-analyzing",
      params: {
        fileName: selectedFile?.name || "",
        fileUri: selectedFile?.uri || "",
        portfolioUrl: trimmedUrl,
      },
    });
  }

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={6} style={styles.iconBtn}>
            <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <View style={{ width: 32 }} />
        </View>

        <Text style={styles.title}>AI Portfolio Review</Text>
        <Text style={styles.subtitle}>
          Get instant, personalised feedback to improve your creative portfolio.
        </Text>

        <View style={styles.dropZone}>
          {selectedFile ? (
            <View style={styles.selectedFileBox}>
              <Image source={{ uri: selectedFile.uri }} style={styles.thumbnail} />
              <View style={{ flex: 1 }}>
                <Text style={styles.selectedFileName} numberOfLines={1}>
                  {selectedFile.name}
                </Text>
                <Text style={styles.selectedFileMeta}>
                  Ready for AI Multi-Criteria Analysis
                </Text>
              </View>
              <Pressable
                onPress={() => setSelectedFile(null)}
                hitSlop={8}
                style={styles.removeBtn}
              >
                <MaterialIcons name="close" size={18} color={colors.textSecondary} />
              </Pressable>
            </View>
          ) : (
            <>
              <Pressable style={styles.browseBtn} hitSlop={8} onPress={handleBrowseFiles}>
                <MaterialIcons name="folder-open" size={18} color={colors.textDark} />
                <Text style={styles.browseText}>Browse files</Text>
              </Pressable>
              <Text style={styles.dropHelp}>Tap to select image, case study, or artwork</Text>
              <Text style={styles.dropHint}>JPG, PNG, WEBP / Up to 50 MB</Text>
            </>
          )}
        </View>
        <Text style={styles.privacy}>Your data is secure and analyzed confidentially.</Text>

        <Text style={styles.inputLabel}>Portfolio URL (Alternative or Additional)</Text>
        <TextInput
          placeholder="e.g., https://behance.net/yourprofile or Figma link"
          placeholderTextColor={colors.textSecondary}
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          keyboardType="url"
          style={styles.input}
        />

        <View style={{ height: spacing.lg }} />
        <Pressable style={styles.ctaMain} hitSlop={8} onPress={handleStartReview}>
          <Text style={styles.ctaText}>Start Review</Text>
        </Pressable>
        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
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
  title: { color: colors.accentYellow, fontFamily: fonts.bold, fontSize: fonts.size.title, alignSelf: "flex-start", marginTop: spacing.sm },
  subtitle: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.md, lineHeight: 20 },
  dropZone: {
    marginTop: spacing.lg,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.outline,
    borderStyle: "dashed",
    padding: spacing.lg,
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  browseBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.accentYellow,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  browseText: { color: colors.textDark, fontFamily: fonts.semibold, fontSize: fonts.size.md },
  dropHelp: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm, marginTop: spacing.md },
  dropHint: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.xs, marginTop: 2 },
  selectedFileBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    width: "100%",
    backgroundColor: "#161616",
    borderRadius: radii.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.accentGreen,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  selectedFileName: {
    color: colors.textPrimary,
    fontFamily: fonts.semibold,
    fontSize: fonts.size.md,
  },
  selectedFileMeta: {
    color: colors.accentGreen,
    fontFamily: fonts.regular,
    fontSize: fonts.size.xs,
    marginTop: 2,
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  privacy: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm, textAlign: "center", marginTop: spacing.sm },
  inputLabel: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.md, marginTop: spacing.lg },
  input: {
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.outline,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    color: colors.textPrimary,
    fontFamily: fonts.regular,
    fontSize: fonts.size.md,
  },
  ctaMain: {
    backgroundColor: colors.accentGreen,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
  },
  ctaText: { color: colors.textDark, fontFamily: fonts.bold, fontSize: fonts.size.lg },
});

