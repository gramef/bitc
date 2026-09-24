import { getSupabase } from "@/lib/supabase";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { scheduleLocalNotification } from "./notifications";

export type Product = {
  id: string;
  title: string;
  category: string;
  description: string;
  price: string;
  author: string;
  downloads: number;
  iconName: keyof typeof MaterialIcons.glyphMap;
  fileSize?: string;
  fileFormat?: string;
  license?: string;
};

export const DEFAULT_MARKETPLACE_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    title: "Client Services Agreement & IP Contract Template",
    category: "Templates",
    description: "Battle-tested freelance contract drafted for African & global creative studios. Protects intellectual property, milestone payments, and kills scope creep.",
    price: "Free",
    author: "BITC Legal Hub",
    downloads: 1420,
    iconName: "description",
    fileSize: "1.4 MB",
    fileFormat: "DOCX & Notion",
    license: "Personal & Commercial Use",
  },
  {
    id: "prod-2",
    title: "Mobile UI Design System (Figma & Tokens)",
    category: "Assets",
    description: "Complete design system with 80+ components, dark/light semantic tokens, iOS & Android guidelines, and interactive auto-layout variants.",
    price: "Free",
    author: "BITC Design Team",
    downloads: 2890,
    iconName: "layers",
    fileSize: "18.2 MB",
    fileFormat: "Figma (.fig)",
    license: "Open Source / MIT",
  },
  {
    id: "prod-3",
    title: "Freelance Rate & Value-Pricing Master Guide",
    category: "E-Books",
    description: "Step-by-step formula to calculate day rates, pitch value-based pricing, and close five-figure creative contracts confidently.",
    price: "Free",
    author: "Zainab Bello",
    downloads: 980,
    iconName: "menu-book",
    fileSize: "4.5 MB",
    fileFormat: "PDF",
    license: "Creator Community Edition",
  },
  {
    id: "prod-4",
    title: "Creative Studio Pitch Deck & Proposal Template",
    category: "Templates",
    description: "Winning 14-slide proposal deck engineered to convert high-budget enterprise and brand clients. Includes case study layouts and pricing tables.",
    price: "Free",
    author: "Studio BITC",
    downloads: 1650,
    iconName: "slideshow",
    fileSize: "12.8 MB",
    fileFormat: "Figma & Keynote",
    license: "Full Commercial",
  },
  {
    id: "prod-5",
    title: "3D Abstract Glass & Chrome Render Pack",
    category: "Assets",
    description: "40+ ultra-high-resolution (4K) transparent PNG and Blender 3D assets for modern fintech, web3, and creative brand websites.",
    price: "Free",
    author: "David Kalu",
    downloads: 3120,
    iconName: "view-in-ar",
    fileSize: "142 MB",
    fileFormat: "PNG + .blend",
    license: "Commercial Royalty-Free",
  },
  {
    id: "prod-6",
    title: "Brand Discovery Questionnaire & Strategy Kit",
    category: "Tools",
    description: "The exact client onboarding survey used by top agencies to extract deep brand insights, competitive positioning, and target audiences.",
    price: "Free",
    author: "Amara Okafor",
    downloads: 1210,
    iconName: "psychology",
    fileSize: "2.1 MB",
    fileFormat: "Notion & PDF",
    license: "Unlimited Usage",
  },
];

const CLAIMED_PRODUCTS_STORAGE_KEY = "@bitc_claimed_products";

export async function fetchMarketplaceProducts(query?: string): Promise<Product[]> {
  const sb = getSupabase();
  let list: Product[] = [];

  if (sb) {
    try {
      let builder = sb
        .from("marketplace_products")
        .select("*")
        .order("created_at", { ascending: false });

      if (query && query.trim().length > 0) {
        builder = builder.ilike("title", `%${query.trim()}%`);
      }

      const { data, error } = await builder;
      if (!error && data && data.length > 0) {
        list = data as Product[];
      }
    } catch {
      // Table may not exist yet
    }
  }

  if (list.length === 0) {
    list = DEFAULT_MARKETPLACE_PRODUCTS;
  }

  if (query && query.trim().length > 0) {
    const q = query.toLowerCase();
    list = list.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q)
    );
  }

  return list;
}

export async function claimMarketplaceProduct(
  productId: string,
  productTitle?: string
): Promise<{ ok: boolean; error?: string; claimed?: boolean }> {
  const sb = getSupabase();
  let userId = "guest_user";
  if (sb) {
    const { data: userRes } = await sb.auth.getUser();
    if (userRes?.user?.id) userId = userRes.user.id;
  }

  // 1. Persist claimed state to local storage
  try {
    const key = `${CLAIMED_PRODUCTS_STORAGE_KEY}_${userId}`;
    const raw = await AsyncStorage.getItem(key);
    const existing: Record<string, boolean> = raw ? JSON.parse(raw) : {};
    existing[productId] = true;
    await AsyncStorage.setItem(key, JSON.stringify(existing));
  } catch {}

  // 2. Attempt remote save if user_products table exists
  if (sb && userId !== "guest_user") {
    try {
      await sb.from("user_products").insert({
        product_id: productId,
        user_id: userId,
      });
    } catch {}
  }

  // 3. Notify user
  const title = productTitle || "Asset";
  scheduleLocalNotification(
    "📥 Download Complete",
    `"${title}" is saved to your creative library!`,
    1,
    { type: "marketplace_claim", productId }
  ).catch(() => {});

  return { ok: true, claimed: true };
}

export async function fetchMyClaimedProducts(): Promise<Record<string, boolean>> {
  const sb = getSupabase();
  let userId = "guest_user";
  if (sb) {
    const { data: userRes } = await sb.auth.getUser();
    if (userRes?.user?.id) userId = userRes.user.id;
  }

  try {
    const key = `${CLAIMED_PRODUCTS_STORAGE_KEY}_${userId}`;
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
