import { fetchJobs, JobRow } from "@/services/jobs";
import { fetchMarketplaceProducts, Product as MarketplaceProduct } from "@/services/marketplace";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

export default function AdminJobsAndMarket() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 840;

  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"jobs" | "marketplace">("jobs");

  useEffect(() => {
    Promise.all([fetchJobs(), fetchMarketplaceProducts()]).then(([j, p]) => {
      setJobs(j);
      setProducts(p);
      setLoading(false);
    });
  }, []);

  function handleUnpublishJob(job: JobRow) {
    Alert.alert(
      "Unpublish Job",
      `Remove "${job.title}" from the public job board?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unpublish",
          style: "destructive",
          onPress: () => {
            setJobs((prev) => prev.filter((item) => item.id !== job.id));
            Alert.alert("Job Removed", `"${job.title}" has been taken down.`);
          },
        },
      ]
    );
  }

  function handleUnpublishProduct(product: MarketplaceProduct) {
    Alert.alert(
      "Unpublish Digital Asset",
      `Remove "${product.title}" from the digital marketplace?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unpublish",
          style: "destructive",
          onPress: () => {
            setProducts((prev) => prev.filter((item) => item.id !== product.id));
            Alert.alert("Asset Removed", `"${product.title}" has been unpublished.`);
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={colors.accentYellow} />
        <Text style={styles.loadingText}>Loading creative jobs and marketplace catalog…</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.content, isDesktop && styles.desktopContent]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.pageTitle}>Job Board & Marketplace Oversight</Text>
          <Text style={styles.pageSubtitle}>
            Audit job opportunities, monitor applicant flows, and review digital assets.
          </Text>
        </View>
        <Pressable
          style={styles.actionBtn}
          onPress={() => router.push("/create-job")}
        >
          <MaterialIcons name="add" size={18} color={colors.textDark} />
          <Text style={styles.actionBtnText}>Post Verified Job</Text>
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <Pressable
          style={[styles.tabBtn, activeTab === "jobs" && styles.tabBtnActive]}
          onPress={() => setActiveTab("jobs")}
          hitSlop={6}
        >
          <Text style={[styles.tabBtnText, activeTab === "jobs" && styles.tabBtnTextActive]}>
            Active Job Listings ({jobs.length})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabBtn, activeTab === "marketplace" && styles.tabBtnActive]}
          onPress={() => setActiveTab("marketplace")}
          hitSlop={6}
        >
          <Text style={[styles.tabBtnText, activeTab === "marketplace" && styles.tabBtnTextActive]}>
            Marketplace Products ({products.length})
          </Text>
        </Pressable>
      </View>

      {/* Tab Content 1: Jobs */}
      {activeTab === "jobs" && (
        <View style={styles.grid}>
          {jobs.map((job) => (
            <View key={job.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.title}>{job.title}</Text>
                  <Text style={styles.sub}>{job.org || "Creative Agency"} • {job.location || "London / Remote"}</Text>
                </View>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>{job.type || "Full-time"}</Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <MaterialIcons name="payments" size={14} color={colors.accentGreen} />
                <Text style={styles.metaText}>{job.salary || "£45k - £65k / Year"}</Text>
              </View>

              <View style={styles.actionsRow}>
                <Pressable
                  style={styles.viewBtn}
                  onPress={() => router.push(`/job-detail?id=${job.id}` as any)}
                  hitSlop={6}
                >
                  <MaterialIcons name="visibility" size={14} color={colors.textPrimary} />
                  <Text style={styles.viewBtnText}>Inspect Job</Text>
                </Pressable>

                <Pressable
                  style={styles.removeBtn}
                  onPress={() => handleUnpublishJob(job)}
                  hitSlop={6}
                >
                  <MaterialIcons name="delete" size={14} color="#ff6b6b" />
                  <Text style={styles.removeBtnText}>Unpublish</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Tab Content 2: Marketplace */}
      {activeTab === "marketplace" && (
        <View style={styles.grid}>
          {products.map((p) => (
            <View key={p.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.title}>{p.title}</Text>
                  <Text style={styles.sub}>By {p.author || "Community Creator"}</Text>
                </View>
                <View style={styles.priceBadge}>
                  <Text style={styles.priceBadgeText}>
                    {p.price || "Free"}
                  </Text>
                </View>
              </View>

              <Text style={styles.desc} numberOfLines={2}>{p.description}</Text>

              <View style={styles.actionsRow}>
                <Pressable
                  style={styles.viewBtn}
                  onPress={() => router.push("/marketplace")}
                  hitSlop={6}
                >
                  <MaterialIcons name="shopping-bag" size={14} color={colors.textPrimary} />
                  <Text style={styles.viewBtnText}>View Asset</Text>
                </Pressable>

                <Pressable
                  style={styles.removeBtn}
                  onPress={() => handleUnpublishProduct(p)}
                  hitSlop={6}
                >
                  <MaterialIcons name="delete" size={14} color="#ff6b6b" />
                  <Text style={styles.removeBtnText}>Unpublish</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}
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
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.accentYellow,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.pill,
  },
  actionBtnText: { color: colors.textDark, fontFamily: fonts.bold, fontSize: fonts.size.sm },
  tabsRow: { flexDirection: "row", gap: spacing.sm },
  tabBtn: {
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  tabBtnActive: { backgroundColor: "#1e1e1e", borderColor: colors.accentYellow },
  tabBtnText: { color: colors.textSecondary, fontFamily: fonts.semibold, fontSize: fonts.size.xs },
  tabBtnTextActive: { color: colors.accentYellow, fontFamily: fonts.bold },
  grid: { gap: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.outline,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  title: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.md },
  sub: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.xs },
  desc: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm, lineHeight: 18 },
  typeBadge: { backgroundColor: "#1c2b1e", paddingHorizontal: 8, paddingVertical: 3, borderRadius: radii.pill },
  typeBadgeText: { color: colors.accentGreen, fontFamily: fonts.bold, fontSize: 10 },
  priceBadge: { backgroundColor: "#2b2512", paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.pill },
  priceBadgeText: { color: colors.accentYellow, fontFamily: fonts.bold, fontSize: fonts.size.xs },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { color: colors.accentGreen, fontFamily: fonts.semibold, fontSize: fonts.size.xs },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.outline,
    paddingTop: spacing.sm,
  },
  viewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#1f1f1f",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  viewBtnText: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.xs },
  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#3a1515",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  removeBtnText: { color: "#ff6b6b", fontFamily: fonts.semibold, fontSize: fonts.size.xs },
});
