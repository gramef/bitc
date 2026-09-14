import SafeScreen from "@/components/SafeScreen";
import { Button } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { getSupabase } from "@/lib/supabase";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email: paramEmail, persona: paramPersona } = useLocalSearchParams<{
    email?: string;
    persona?: string;
  }>();
  const { user, profile, refreshProfile } = useAuth();

  const [email] = useState(paramEmail || user?.email || "");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [checkingLink, setCheckingLink] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<TextInput>(null);

  // Countdown timer for resending code
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  /**
   * Submits the 6-digit confirmation code via Supabase verifyOtp
   */
  async function handleVerifyCode() {
    const cleanCode = code.replace(/\D/g, "");
    if (cleanCode.length < 6) {
      setError("Please enter the complete 6-digit verification code");
      return;
    }

    const targetEmail = email.trim();
    if (!targetEmail) {
      setError("Email address missing. Please go back to signup.");
      return;
    }

    const sb = getSupabase();
    if (!sb) {
      setError("Service unavailable");
      return;
    }

    setError(null);
    setMessage(null);
    setVerifying(true);

    try {
      // 1. Try 'signup' token verification
      let { data, error: verifyErr } = await sb.auth.verifyOtp({
        email: targetEmail,
        token: cleanCode,
        type: "signup",
      });

      // 2. Fallback to 'email' verification type if signup type is not matched
      if (verifyErr) {
        const fallback = await sb.auth.verifyOtp({
          email: targetEmail,
          token: cleanCode,
          type: "email",
        });
        if (!fallback.error) {
          data = fallback.data;
          verifyErr = null;
        }
      }

      if (verifyErr) {
        setError(verifyErr.message || "Invalid or expired verification code. Please check and try again.");
        setVerifying(false);
        return;
      }

      setMessage("Email verified successfully! Setting up your persona…");
      await refreshProfile();
      const targetRole = paramPersona || profile?.role;
      setTimeout(() => {
        if (targetRole === "creative") {
          router.replace("/onboarding/creative" as any);
        } else if (targetRole === "business") {
          router.replace("/onboarding/business" as any);
        } else if (targetRole === "user") {
          router.replace("/onboarding/user" as any);
        } else {
          router.replace("/onboarding/identity");
        }
      }, 700);
    } catch (e: any) {
      setError(e?.message || "Verification failed. Please check your connection.");
    } finally {
      setVerifying(false);
    }
  }

  /**
   * Checks if user has verified via email confirmation link on another browser/app
   */
  async function handleCheckLinkVerification() {
    if (checkingLink) return;
    setError(null);
    setMessage(null);
    setCheckingLink(true);

    const sb = getSupabase();
    if (!sb) {
      setError("Service unavailable");
      setCheckingLink(false);
      return;
    }

    try {
      const { data, error: userErr } = await sb.auth.getUser();
      if (userErr || !data?.user) {
        setError("Session not detected yet. Enter the 6-digit code or click the confirmation link in your email.");
        setCheckingLink(false);
        return;
      }

      const u = data.user;
      if (u.email_confirmed_at || (u as any).confirmed_at) {
        setMessage("Email verified! Redirecting to setup…");
        await refreshProfile();
        const targetRole = paramPersona || profile?.role;
        setTimeout(() => {
          if (targetRole === "creative") {
            router.replace("/onboarding/creative" as any);
          } else if (targetRole === "business") {
            router.replace("/onboarding/business" as any);
          } else if (targetRole === "user") {
            router.replace("/onboarding/user" as any);
          } else {
            router.replace("/onboarding/identity");
          }
        }, 700);
      } else {
        setError("Email is not verified yet. Please enter the 6-digit code sent to your inbox.");
      }
    } catch (e: any) {
      setError(e?.message || "Failed to check verification status");
    } finally {
      setCheckingLink(false);
    }
  }

  /**
   * Resends the 6-digit verification code to the user's email
   */
  async function handleResendCode() {
    if (resending || resendCooldown > 0) return;
    setError(null);
    setMessage(null);

    const targetEmail = email.trim();
    if (!targetEmail) {
      setError("Email address missing. Please return to login.");
      return;
    }

    const sb = getSupabase();
    if (!sb) {
      setError("Service unavailable");
      return;
    }

    setResending(true);
    try {
      const { error: resendErr } = await sb.auth.resend({
        type: "signup",
        email: targetEmail,
        options: { emailRedirectTo: "bitc://auth/callback" },
      });

      if (resendErr) {
        setError(resendErr.message || "Failed to resend verification code.");
      } else {
        setMessage(`Verification code resent to ${targetEmail}. Please check your inbox!`);
        setResendCooldown(60);
      }
    } catch (e: any) {
      setError(e?.message || "Error resending code");
    } finally {
      setResending(false);
    }
  }

  const digits = (code + "      ").slice(0, 6).split("");

  return (
    <SafeScreen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.iconRing}>
            <MaterialIcons name="mark-email-read" size={42} color={colors.accentYellow} />
          </View>

          <Text style={styles.title}>Confirm Your Email</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit verification code sent to{"\n"}
            <Text style={styles.emailHighlight}>{email || "your email address"}</Text>
          </Text>

          {/* 6-Digit Code Display */}
          <Pressable
            style={styles.codeContainer}
            onPress={() => inputRef.current?.focus()}
            hitSlop={10}
          >
            {digits.map((digit, idx) => {
              const isFilled = digit.trim().length > 0;
              const isCurrent = idx === Math.min(code.length, 5);
              return (
                <View
                  key={idx}
                  style={[
                    styles.digitBox,
                    isFilled && styles.digitBoxFilled,
                    isCurrent && styles.digitBoxActive,
                  ]}
                >
                  <Text style={styles.digitText}>{digit.trim() || ""}</Text>
                </View>
              );
            })}
          </Pressable>

          {/* Hidden Text Input for native keyboard interaction */}
          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={(val) => setCode(val.replace(/\D/g, "").slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
            style={styles.hiddenInput}
            testID="verification-code-input"
          />

          {error ? (
            <View style={styles.alertBoxError}>
              <MaterialIcons name="error-outline" size={16} color="#ff6b6b" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {message ? (
            <View style={styles.alertBoxSuccess}>
              <MaterialIcons name="check-circle-outline" size={16} color="#00B894" />
              <Text style={styles.successText}>{message}</Text>
            </View>
          ) : null}

          {/* Verification CTA */}
          <View style={styles.btnStack}>
            <Button
              title={verifying ? "Verifying Code…" : "Confirm Code & Continue"}
              onPress={handleVerifyCode}
              disabled={verifying || code.length < 6}
            />

            {/* Resend Code Button with Cooldown */}
            <Pressable
              style={[
                styles.secondaryBtn,
                (resending || resendCooldown > 0) && styles.disabledBtn,
              ]}
              onPress={handleResendCode}
              disabled={resending || resendCooldown > 0}
            >
              {resending ? (
                <ActivityIndicator size="small" color={colors.textPrimary} />
              ) : (
                <Text style={styles.secondaryBtnText}>
                  {resendCooldown > 0
                    ? `Resend Code in ${resendCooldown}s`
                    : "Resend Verification Code"}
                </Text>
              )}
            </Pressable>
          </View>

          {/* Fallback for Users who Clicked the Magic Link */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR CLICKED THE LINK?</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            style={styles.linkCheckBtn}
            onPress={handleCheckLinkVerification}
            disabled={checkingLink}
          >
            <MaterialIcons name="open-in-browser" size={18} color={colors.textSecondary} />
            <Text style={styles.linkCheckBtnText}>
              {checkingLink ? "Checking…" : "I clicked the link in my email"}
            </Text>
          </Pressable>

          {/* Wrong Email Address Link */}
          <View style={styles.bottomRow}>
            <Text style={styles.bottomText}>Wrong email? </Text>
            <Pressable onPress={() => router.replace("/signup")} hitSlop={8}>
              <Text style={styles.bottomLink}>Sign up with another address</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
  },
  iconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#EAD0541A",
    borderWidth: 2,
    borderColor: colors.accentYellow,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 24,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: fonts.size.md,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  emailHighlight: {
    color: colors.accentYellow,
    fontFamily: fonts.semibold,
  },
  codeContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: spacing.lg,
    justifyContent: "center",
    width: "100%",
  },
  digitBox: {
    width: 46,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.outline,
    alignItems: "center",
    justifyContent: "center",
  },
  digitBoxActive: {
    borderColor: colors.accentYellow,
  },
  digitBoxFilled: {
    borderColor: "#EAD05480",
    backgroundColor: "#201E15",
  },
  digitText: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 22,
  },
  hiddenInput: {
    position: "absolute",
    opacity: 0,
    width: 1,
    height: 1,
  },
  alertBoxError: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#351515",
    borderWidth: 1,
    borderColor: "#ff6b6b50",
    borderRadius: radii.card,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginBottom: spacing.md,
    width: "100%",
  },
  errorText: {
    color: "#ff6b6b",
    fontFamily: fonts.semibold,
    fontSize: fonts.size.sm,
    flex: 1,
  },
  alertBoxSuccess: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#0F281E",
    borderWidth: 1,
    borderColor: "#00B89450",
    borderRadius: radii.card,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginBottom: spacing.md,
    width: "100%",
  },
  successText: {
    color: "#00B894",
    fontFamily: fonts.semibold,
    fontSize: fonts.size.sm,
    flex: 1,
  },
  btnStack: {
    width: "100%",
    gap: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  secondaryBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outline,
    alignItems: "center",
  },
  disabledBtn: {
    opacity: 0.6,
  },
  secondaryBtnText: {
    color: colors.textPrimary,
    fontFamily: fonts.semibold,
    fontSize: fonts.size.md,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: spacing.md,
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.outline,
  },
  dividerText: {
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    fontSize: 10,
    letterSpacing: 1,
  },
  linkCheckBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    marginBottom: spacing.xl,
  },
  linkCheckBtnText: {
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    fontSize: fonts.size.sm,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomText: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: fonts.size.sm,
  },
  bottomLink: {
    color: colors.accentYellow,
    fontFamily: fonts.semibold,
    fontSize: fonts.size.sm,
  },
});
