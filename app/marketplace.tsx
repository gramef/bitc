import SafeScreen from "@/components/SafeScreen";
import { Chip, EmptyState, SearchBar } from "@/components/ui";
import { claimMarketplaceProduct, fetchMarketplaceProducts, type Product } from "@/services/marketplace";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

const CATEGORIES = ["All", "Templates", "E-Books", "Assets", "Courses", "Tools"] as const;

export default function Marketplace() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState<string>("All");
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [claimedIds, setClaimedIds] = useState<Record<string, boolean>>({});
    const [claiming, setClaiming] = useState(false);
    const [claimSuccess, setClaimSuccess] = useState(false);

    useEffect(() => {
        let active = true;
        fetchMarketplaceProducts(search).then((data) => {
            if (active) {
                setProducts(data);
                setLoading(false);
            }
        });
        return () => { active = false; };
    }, [search]);

    const filtered = products.filter((p) => {
        const q = search.toLowerCase();
        if (q && !p.title.toLowerCase().includes(q) && !(p.description ?? "").toLowerCase().includes(q)) return false;
        if (category !== "All" && p.category !== category) return false;
        return true;
    });

    function openProductModal(product: Product) {
        setSelectedProduct(product);
        setClaimSuccess(!!claimedIds[product.id]);
        setModalVisible(true);
    }

    async function handleClaimProduct() {
        if (!selectedProduct) return;
        setClaiming(true);

        const res = await claimMarketplaceProduct(selectedProduct.id);
        setClaiming(false);

        if (res.ok) {
            setClaimedIds((prev) => ({ ...prev, [selectedProduct.id]: true }));
            setClaimSuccess(true);
        } else {
            Alert.alert("Notice", res.error || "Product added to your library!");
            setClaimedIds((prev) => ({ ...prev, [selectedProduct.id]: true }));
            setClaimSuccess(true);
        }
    }

    return (
        <SafeScreen>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={10}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
                </Pressable>
                <Text style={styles.title}>Marketplace</Text>
                <Text style={styles.subtitle}>Digital products, templates, and resources to power your creative workflow.</Text>

                <SearchBar value={search} onChangeText={setSearch} placeholder="Search products…" />

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                    {CATEGORIES.map((c) => (
                        <Chip key={c} label={c} selected={category === c} onPress={() => setCategory(c)} />
                    ))}
                </ScrollView>

                {loading ? (
                    <ActivityIndicator color={colors.accentYellow} style={{ marginVertical: 40 }} />
                ) : filtered.length === 0 ? (
                    <EmptyState icon="storefront" title="No products found" subtitle="Try a different search or category" />
                ) : (
                    <View style={styles.grid}>
                        {filtered.map((product) => {
                            const isClaimed = !!claimedIds[product.id];
                            return (
                                <View key={product.id} style={styles.productCard}>
                                    <View style={styles.productIcon}>
                                        <MaterialIcons name={product.iconName} size={28} color={colors.accentYellow} />
                                    </View>
                                    <Text style={styles.productTitle} numberOfLines={2}>{product.title}</Text>
                                    <Text style={styles.productDesc} numberOfLines={2}>{product.description}</Text>
                                    <View style={styles.productMeta}>
                                        <Text style={styles.productAuthor}>By {product.author}</Text>
                                        <View style={styles.downloadBadge}>
                                            <MaterialIcons name="download" size={12} color={colors.textSecondary} />
                                            <Text style={styles.downloadText}>{product.downloads.toLocaleString()}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.productFooter}>
                                        <Text style={styles.priceTag}>{product.price}</Text>
                                        <Pressable
                                            style={[styles.getBtn, isClaimed && styles.getBtnDone]}
                                            onPress={() => openProductModal(product)}
                                        >
                                            <Text style={[styles.getBtnText, isClaimed && styles.getBtnTextDone]}>
                                                {isClaimed ? "In Library" : "Get"}
                                            </Text>
                                        </Pressable>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}
            </ScrollView>

            {/* ── Product Access Modal ── */}
            <Modal
                visible={modalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        {selectedProduct && (
                            <>
                                <View style={styles.modalHeaderRow}>
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 }}>
                                        <View style={styles.modalIconWrap}>
                                            <MaterialIcons name={selectedProduct.iconName} size={24} color={colors.accentYellow} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.modalTitle} numberOfLines={1}>{selectedProduct.title}</Text>
                                            <Text style={styles.modalAuthor}>By {selectedProduct.author}</Text>
                                        </View>
                                    </View>
                                    <Pressable hitSlop={8} onPress={() => setModalVisible(false)}>
                                        <MaterialIcons name="close" size={24} color={colors.textSecondary} />
                                    </Pressable>
                                </View>

                                <View style={styles.modalBody}>
                                    <Text style={styles.detailDesc}>{selectedProduct.description}</Text>

                                    <View style={styles.specsGrid}>
                                        <View style={styles.specBox}>
                                            <Text style={styles.specLabel}>Category</Text>
                                            <Text style={styles.specVal}>{selectedProduct.category}</Text>
                                        </View>
                                        <View style={styles.specBox}>
                                            <Text style={styles.specLabel}>Format</Text>
                                            <Text style={styles.specVal}>ZIP / Digital File</Text>
                                        </View>
                                        <View style={styles.specBox}>
                                            <Text style={styles.specLabel}>License</Text>
                                            <Text style={styles.specVal}>Personal & Commercial</Text>
                                        </View>
                                        <View style={styles.specBox}>
                                            <Text style={styles.specLabel}>Price</Text>
                                            <Text style={[styles.specVal, { color: colors.accentGreen }]}>{selectedProduct.price}</Text>
                                        </View>
                                    </View>

                                    {claimSuccess ? (
                                        <View style={styles.claimedBanner}>
                                            <MaterialIcons name="check-circle" size={24} color={colors.accentGreen} />
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.claimedTitle}>Added to your Creative Library!</Text>
                                                <Text style={styles.claimedSub}>You have permanent access to this asset.</Text>
                                            </View>
                                        </View>
                                    ) : null}

                                    <Pressable
                                        style={[styles.claimBtn, (claiming || claimSuccess) && styles.claimBtnDisabled]}
                                        onPress={handleClaimProduct}
                                        disabled={claiming || claimSuccess}
                                    >
                                        {claiming ? (
                                            <ActivityIndicator color={colors.textDark} />
                                        ) : (
                                            <Text style={styles.claimBtnText}>
                                                {claimSuccess ? "✓ Download Ready" : `Get Asset (${selectedProduct.price})`}
                                            </Text>
                                        )}
                                    </Pressable>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeScreen>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
    backBtn: { alignSelf: "flex-start", paddingVertical: spacing.sm },
    title: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.title },
    subtitle: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.md, lineHeight: 22 },
    chipRow: { gap: spacing.sm },
    grid: { gap: spacing.md },
    productCard: { backgroundColor: colors.surface, borderRadius: radii.card, borderWidth: 1, borderColor: colors.outline, padding: spacing.md },
    productIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: "#2a2200", alignItems: "center", justifyContent: "center", marginBottom: spacing.sm },
    productTitle: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.lg, marginBottom: 4 },
    productDesc: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.sm, lineHeight: 18, marginBottom: spacing.sm },
    productMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
    productAuthor: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.xs },
    downloadBadge: { flexDirection: "row", alignItems: "center", gap: 2 },
    downloadText: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.xs },
    productFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    priceTag: { color: colors.accentGreen, fontFamily: fonts.bold, fontSize: fonts.size.lg },
    getBtn: { backgroundColor: colors.accentYellow, borderRadius: radii.pill, paddingHorizontal: 20, paddingVertical: 8 },
    getBtnDone: { backgroundColor: "#00B89420", borderWidth: 1, borderColor: colors.accentGreen },
    getBtnText: { color: colors.textDark, fontFamily: fonts.bold, fontSize: fonts.size.sm },
    getBtnTextDone: { color: colors.accentGreen },

    /* Modal */
    modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" },
    modalCard: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, maxHeight: "80%" },
    modalHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
    modalIconWrap: { width: 40, height: 40, borderRadius: 10, backgroundColor: "#2a2200", alignItems: "center", justifyContent: "center" },
    modalTitle: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fonts.size.lg },
    modalAuthor: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.xs },
    modalBody: { gap: spacing.md },
    detailDesc: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.md, lineHeight: 22 },
    specsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
    specBox: { backgroundColor: colors.background, borderRadius: radii.card, padding: spacing.sm, borderWidth: 1, borderColor: colors.outline, width: "48%" },
    specLabel: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.xs, marginBottom: 2 },
    specVal: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fonts.size.sm },
    claimedBanner: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: "#00B89415", padding: spacing.md, borderRadius: radii.card, borderWidth: 1, borderColor: colors.accentGreen },
    claimedTitle: { color: colors.accentGreen, fontFamily: fonts.bold, fontSize: fonts.size.sm },
    claimedSub: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fonts.size.xs },
    claimBtn: { backgroundColor: colors.accentYellow, borderRadius: radii.pill, paddingVertical: 14, alignItems: "center", justifyContent: "center", marginTop: spacing.sm },
    claimBtnDisabled: { backgroundColor: "#1e1e1e", opacity: 0.8 },
    claimBtnText: { color: colors.textDark, fontFamily: fonts.bold, fontSize: fonts.size.md },
});

