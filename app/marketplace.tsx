import SafeScreen from "@/components/SafeScreen";
import { Chip, EmptyState, SearchBar } from "@/components/ui";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

type Product = {
    id: string;
    title: string;
    category: string;
    description: string;
    price: string;
    author: string;
    downloads: number;
    iconName: keyof typeof MaterialIcons.glyphMap;
};

const CATEGORIES = ["All", "Templates", "E-Books", "Assets", "Courses", "Tools"] as const;

const PRODUCTS: Product[] = [
    { id: "p1", title: "Brand Identity Toolkit", category: "Templates", description: "Complete brand guidelines template with logo placement, colour system, and typography rules.", price: "Free", author: "Sarah Chen", downloads: 2340, iconName: "palette" },
    { id: "p2", title: "Freelancer's Finance Guide", category: "E-Books", description: "Everything you need to know about managing money as a creative freelancer.", price: "Free", author: "Marcus Williams", downloads: 1890, iconName: "menu-book" },
    { id: "p3", title: "Social Media Templates Pack", category: "Assets", description: "50+ ready-to-use social media post templates in Figma and Canva formats.", price: "Free", author: "Amina Diallo", downloads: 4560, iconName: "image" },
    { id: "p4", title: "Portfolio Building Masterclass", category: "Courses", description: "12-lesson course on creating a portfolio that actually gets you hired.", price: "Free", author: "James Okonkwo", downloads: 980, iconName: "school" },
    { id: "p5", title: "Invoice Generator", category: "Tools", description: "Simple, professional invoice generator for freelancers and small studios.", price: "Free", author: "Priya Sharma", downloads: 3200, iconName: "receipt" },
    { id: "p6", title: "Color Palette Generator", category: "Tools", description: "AI-powered colour palette generator for designers and brand strategists.", price: "Free", author: "David Miller", downloads: 5670, iconName: "color-lens" },
];

export default function Marketplace() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState<string>("All");

    const filtered = PRODUCTS.filter((p) => {
        const q = search.toLowerCase();
        if (q && !p.title.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q)) return false;
        if (category !== "All" && p.category !== category) return false;
        return true;
    });

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

                {filtered.length === 0 ? (
                    <EmptyState icon="storefront" title="No products found" subtitle="Try a different search or category" />
                ) : (
                    <View style={styles.grid}>
                        {filtered.map((product) => (
                            <View key={product.id} style={styles.productCard}>
                                <View style={styles.productIcon}>
                                    <MaterialIcons name={product.iconName} size={28} color={colors.accentYellow} />
                                </View>
                                <Text style={styles.productTitle} numberOfLines={2}>{product.title}</Text>
                                <Text style={styles.productDesc} numberOfLines={2}>{product.description}</Text>
                                <View style={styles.productMeta}>
                                    <Text style={styles.productAuthor}>{product.author}</Text>
                                    <View style={styles.downloadBadge}>
                                        <MaterialIcons name="download" size={12} color={colors.textSecondary} />
                                        <Text style={styles.downloadText}>{product.downloads.toLocaleString()}</Text>
                                    </View>
                                </View>
                                <View style={styles.productFooter}>
                                    <Text style={styles.priceTag}>{product.price}</Text>
                                    <Pressable style={styles.getBtn}>
                                        <Text style={styles.getBtnText}>Get</Text>
                                    </Pressable>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
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
    getBtnText: { color: colors.textDark, fontFamily: fonts.bold, fontSize: fonts.size.sm },
});
