import SafeScreen from "@/components/SafeScreen";
import { Avatar, Button, Input, ProfileCover } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { getSupabase, getSupabaseUrl } from "@/lib/supabase";
import { getRoleBadge } from "@/services/permissions";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function ProfileSetup() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();

  const role = profile?.role ?? "creative";
  const badge = getRoleBadge(role);

  const personaConfig = useMemo(() => {
    switch (role) {
      case "business":
        return {
          headerTitle: "Company & Studio Profile",
          headerSubtitle: "Present your brand and studio identity to creators and attendees.",
          nameLabel: "Company / Studio Name *",
          namePlaceholder: "e.g. Acme Design Studio",
          bioLabel: "Studio Mission & Overview",
          bioPlaceholder: "What kind of work does your company create and what talent are you looking for?",
          avatarHint: "Tap camera to upload company/studio logo",
        };
      case "creative":
        return {
          headerTitle: "Creator Profile",
          headerSubtitle: "Showcase your artistic identity, skills, and portfolio.",
          nameLabel: "Display / Artist Name *",
          namePlaceholder: "e.g. Amara Okafor",
          bioLabel: "Artist Bio & Statement",
          bioPlaceholder: "Tell clients and collaborators about your craft and vision…",
          avatarHint: "Tap camera to upload headshot or avatar",
        };
      case "user":
      default:
        return {
          headerTitle: "Community Profile",
          headerSubtitle: "Let event organizers and fellow members know who you are.",
          nameLabel: "Full Name *",
          namePlaceholder: "e.g. Jordan Lee",
          bioLabel: "Bio",
          bioPlaceholder: "A brief bio about yourself and what you're passionate about…",
          avatarHint: "Tap camera to upload profile photo",
        };
    }
  }, [role]);

  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [existingAvatarUrl, setExistingAvatarUrl] = useState<string | null>(
    null
  );
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [coverBase64, setCoverBase64] = useState<string | null>(null);
  const [existingCoverUrl, setExistingCoverUrl] = useState<string | null>(null);

  // Pre-fill from AuthContext profile
  useEffect(() => {
    const isConfirmed = Boolean(user?.email_confirmed_at || (user as any)?.confirmed_at);
    if (user && !isConfirmed) {
      router.replace({ pathname: "/verify-email", params: { email: user.email } } as any);
      return;
    }
    if (profile) {
      if (profile.fullName !== "Guest") setFullName(profile.fullName);
      setBio(profile.bio ?? "");
      if (profile.avatarUrl) {
        setExistingAvatarUrl(profile.avatarUrl);
      }
      if (profile.coverUrl) {
        setExistingCoverUrl(profile.coverUrl);
      }
    }
  }, [user, profile]);

  async function pickAvatar() {
    setError(null);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError("Permission required to select photo");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
      base64: true,
      mediaTypes: ["images"] as any,
    });
    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (asset?.uri) {
      setAvatarUri(asset.uri);
      if (asset.base64) {
        setAvatarBase64(`data:image/jpeg;base64,${asset.base64}`);
      }
    }
  }

  async function pickCover() {
    setError(null);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError("Permission required to select cover image");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.75,
      allowsEditing: true,
      aspect: [16, 7],
      base64: true,
      mediaTypes: ["images"] as any,
    });
    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (asset?.uri) {
      setCoverUri(asset.uri);
      if (asset.base64) {
        setCoverBase64(`data:image/jpeg;base64,${asset.base64}`);
      }
    }
  }

  async function uploadAvatarFromUri(
    userId: string,
    uri: string,
    inlineBase64?: string | null
  ): Promise<string> {
    const sb = getSupabase();
    const stamp = Date.now();
    const path = `public/${userId}/${stamp}.jpg`;

    // 1. Fast attempt with Supabase Storage (max 2.5 seconds timeout)
    if (sb) {
      try {
        const uploadAction = (async () => {
          let body: any;
          const fetchRes = await fetch(inlineBase64 || uri);
          body = await fetchRes.blob();
          const { error: upError } = await sb.storage
            .from("avatars")
            .upload(path, body, {
              upsert: true,
              contentType: "image/jpeg",
            });
          if (!upError) {
            const pub = sb.storage.from("avatars").getPublicUrl(path);
            if (pub?.data?.publicUrl) {
              return `${pub.data.publicUrl}?t=${stamp}`;
            }
          }
          return null;
        })();

        const timeoutAction = new Promise<null>((resolve) =>
          setTimeout(() => resolve(null), 2500)
        );

        const storageUrl = await Promise.race([uploadAction, timeoutAction]);
        if (storageUrl) {
          return storageUrl;
        }
      } catch (storageErr) {
        console.warn("Storage upload failed:", storageErr);
      }
    }

    // 2. High-speed, guaranteed reliable fallback: Base64 data URI
    if (inlineBase64 && inlineBase64.startsWith("data:image")) {
      return inlineBase64;
    }

    // 3. Convert uri to Data URI if base64 was missing
    try {
      const res = await fetch(uri);
      const blob = await res.blob();
      const dataUri = await new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
      if (dataUri) return dataUri;
    } catch (dataUriErr) {
      console.warn("Data URI conversion failed:", dataUriErr);
    }

    return uri;
  }

  async function handleSave() {
    if (loading) return;
    const sb = getSupabase();
    setError(null);
    setInfo(null);
    if (!sb) {
      setError("Service unavailable");
      return;
    }
    if (!user) {
      setError("Not signed in");
      return;
    }
    if (!fullName.trim()) {
      setError(
        role === "business"
          ? "Please enter your company / studio name"
          : "Please enter your name"
      );
      return;
    }
    setLoading(true);
    try {
      let avatarUrl: string | null = existingAvatarUrl;
      if (avatarUri) {
        avatarUrl = await uploadAvatarFromUri(user.id, avatarUri, avatarBase64);
      }
      let coverUrl: string | null = existingCoverUrl;
      if (coverUri) {
        coverUrl = await uploadAvatarFromUri(user.id, coverUri, coverBase64);
        await sb.auth.updateUser({ data: { cover_url: coverUrl } }).catch(() => {});
        import("@react-native-async-storage/async-storage").then(({ default: AsyncStorage }) => {
          AsyncStorage.setItem(`@bitc_cover_${user.id}`, coverUrl!).catch(() => {});
        });
      }
      try {
        await sb.from("profiles").upsert(
          {
            id: user.id,
            full_name: fullName.trim(),
            bio: bio.trim(),
            avatar_url: avatarUrl,
            cover_url: coverUrl,
          },
          { onConflict: "id" }
        );
      } catch {
        await sb.from("profiles").upsert(
          {
            id: user.id,
            full_name: fullName.trim(),
            bio: bio.trim(),
            avatar_url: avatarUrl,
          },
          { onConflict: "id" }
        );
      }
      setExistingAvatarUrl(avatarUrl);
      setAvatarUri(null);
      setAvatarBase64(null);
      setExistingCoverUrl(coverUrl);
      setCoverUri(null);
      setCoverBase64(null);
      await refreshProfile();
      if (profile?.fullName && profile.fullName !== "Guest") {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace("/(tabs)/profile");
        }
      } else {
        router.replace("/(tabs)/home");
      }
    } catch (e: any) {
      setError(e?.message || "Network request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeScreen>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={10}
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <View style={styles.badgeRow}>
          <View style={[styles.personaPill, { backgroundColor: badge.bgColor }]}>
            <MaterialIcons name={badge.icon as any} size={14} color={badge.color} />
            <Text style={[styles.personaPillText, { color: badge.color }]}>
              {badge.label.toUpperCase()} SETUP
            </Text>
          </View>
          <Text style={styles.stepText}>Step 3 of 3</Text>
        </View>
        <Text style={styles.title}>{personaConfig.headerTitle}</Text>
        <Text style={styles.subtitle}>{personaConfig.headerSubtitle}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: "100%" }]} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Cover Banner Preview & Picker */}
        <View style={styles.setupCoverContainer}>
          <ProfileCover
            uri={coverBase64 || coverUri || existingCoverUrl}
            role={role}
            height={110}
            borderRadius={radii.card}
            editable
            onPressEdit={pickCover}
          />
        </View>

        <View style={styles.avatarWrap}>
          <Pressable onPress={pickAvatar} hitSlop={6} accessibilityRole="button" accessibilityLabel="Select profile picture">
            <Avatar
              uri={avatarBase64 || avatarUri || existingAvatarUrl}
              name={fullName}
              size={100}
              bordered
              borderColor={colors.accentYellow}
            />
          </Pressable>
          <Pressable
            style={styles.cameraBadge}
            onPress={pickAvatar}
            hitSlop={6}
          >
            <MaterialIcons name="photo-camera" size={18} color="#141414" />
          </Pressable>
        </View>
        <Text style={styles.avatarHintText}>{personaConfig.avatarHint}</Text>

        <Text style={styles.label}>{personaConfig.nameLabel}</Text>
        <Input
          value={fullName}
          onChangeText={setFullName}
          placeholder={personaConfig.namePlaceholder}
        />

        <Text style={styles.label}>{personaConfig.bioLabel}</Text>
        <Input
          value={bio}
          onChangeText={setBio}
          placeholder={personaConfig.bioPlaceholder}
          multiline
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {info ? <Text style={styles.info}>{info}</Text> : null}

        <View style={{ height: spacing.md }} />
        <Button
          title={loading ? "Saving Profile…" : "Complete Setup & Enter BITC"}
          onPress={handleSave}
        />
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },
  backBtn: { alignSelf: "flex-start", paddingVertical: 8 },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: fonts.size.title,
    marginTop: 4,
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: fonts.size.sm,
    marginTop: 2,
  },
  progressTrack: {
    marginTop: 10,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#9E9E9E",
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: colors.accentGreen },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  setupCoverContainer: {
    width: "100%",
    marginTop: 8,
    marginBottom: 4,
  },
  avatarWrap: {
    alignSelf: "center",
    width: 104,
    height: 104,
    marginTop: 14,
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  cameraBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accentYellow,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.background,
  },
  label: {
    color: colors.textPrimary,
    fontFamily: fonts.semibold,
    fontSize: fonts.size.md,
    marginTop: 8,
    marginBottom: 8,
  },
  error: {
    color: "#ff6b6b",
    fontFamily: fonts.semibold,
    fontSize: fonts.size.sm,
    marginTop: 8,
  },
  info: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: fonts.size.sm,
    marginTop: 8,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
    marginBottom: 4,
  },
  personaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  personaPillText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  stepText: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 11,
  },
  avatarHintText: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 12,
    textAlign: "center",
    marginBottom: 12,
  },
});
