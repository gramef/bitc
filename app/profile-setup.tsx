import SafeScreen from "@/components/SafeScreen";
import { Avatar, Button, Input } from "@/components/ui";
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
  const [existingAvatarUrl, setExistingAvatarUrl] = useState<string | null>(
    null
  );

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
      quality: 0.8,
      allowsEditing: true,
      mediaTypes: ["images"] as any,
    });
    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (asset?.uri) {
      setAvatarUri(asset.uri);
    }
  }

  async function uploadAvatarFromUri(
    userId: string,
    uri: string
  ): Promise<string | null> {
    const sb = getSupabase();
    const baseUrl = getSupabaseUrl();
    if (!sb || !baseUrl) return null;
    const { data: sessionRes } = await sb.auth.getSession();
    const token = sessionRes?.session?.access_token;
    if (!token) return null;
    const parts = uri.split(".");
    const ext =
      parts.length > 1
        ? parts[parts.length - 1].toLowerCase().split("?")[0]
        : "jpg";
    const stamp = Date.now();
    const path = `public/${userId}/${stamp}.${ext}`;
    const name = `${stamp}.${ext}`;
    const type = `image/${ext === "jpg" ? "jpeg" : ext}`;

    // On Web, upload Blob directly using Supabase client to avoid FormData [object Object] serialization issues
    if (Platform.OS === "web") {
      try {
        const response = await fetch(uri);
        const blob = await response.blob();
        const { error: uploadError } = await sb.storage
          .from("avatars")
          .upload(path, blob, {
            upsert: true,
            contentType: blob.type || type,
          });
        if (!uploadError) {
          const pub = sb.storage.from("avatars").getPublicUrl(path);
          return pub.data.publicUrl ? `${pub.data.publicUrl}?t=${stamp}` : null;
        }
        console.error("Supabase web storage upload error:", uploadError);
      } catch (webErr) {
        console.warn("Web blob fetch/upload error:", webErr);
      }
    }

    try {
      const form = new FormData();
      form.append("file", { uri, name, type } as any);
      const res = await fetch(`${baseUrl}/storage/v1/object/avatars/${path}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "x-upsert": "true",
        },
        body: form,
      });
      if (res.ok) {
        const pub = sb.storage.from("avatars").getPublicUrl(path);
        return pub.data.publicUrl ? `${pub.data.publicUrl}?t=${stamp}` : null;
      }
    } catch (formErr) {
      console.warn("FormData upload failed:", formErr);
    }

    // Fallback: arrayBuffer upload
    try {
      const res = await fetch(uri);
      const arrayBuffer = await res.arrayBuffer();
      const { error: abErr } = await sb.storage
        .from("avatars")
        .upload(path, arrayBuffer, {
          upsert: true,
          contentType: type,
        });
      if (!abErr) {
        const pub = sb.storage.from("avatars").getPublicUrl(path);
        return pub.data.publicUrl ? `${pub.data.publicUrl}?t=${stamp}` : null;
      }
    } catch {
      // final fallback
    }

    return null;
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
        try {
          const uploaded = await uploadAvatarFromUri(user.id, avatarUri);
          if (uploaded) {
            avatarUrl = uploaded;
          }
        } catch (upErr) {
          console.warn("Avatar upload error:", upErr);
        }
      }
      await sb.from("profiles").upsert(
        {
          id: user.id,
          full_name: fullName.trim(),
          bio: bio.trim(),
          avatar_url: avatarUrl,
        },
        { onConflict: "id" }
      );
      setExistingAvatarUrl(avatarUrl);
      setAvatarUri(null);
      await refreshProfile();
      router.replace("/(tabs)/home");
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
        <View style={styles.avatarWrap}>
          <Avatar
            uri={avatarUri || existingAvatarUrl}
            name={fullName}
            size={100}
            bordered
            borderColor={colors.accentYellow}
          />
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
