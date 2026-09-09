import { getSupabase } from "@/lib/supabase";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export type Product = {
  id: string;
  title: string;
  category: string;
  description: string;
  price: string;
  author: string;
  downloads: number;
  iconName: keyof typeof MaterialIcons.glyphMap;
};

export async function fetchMarketplaceProducts(query?: string): Promise<Product[]> {
  const sb = getSupabase();
  if (!sb) return [];

  try {
    let builder = sb
      .from("marketplace_products")
      .select("*")
      .order("created_at", { ascending: false });

    if (query && query.trim().length > 0) {
      builder = builder.ilike("title", `%${query.trim()}%`);
    }

    const { data, error } = await builder;
    return data as Product[];
  } catch {
    return [];
  }
}

export async function claimMarketplaceProduct(
  productId: string
): Promise<{ ok: boolean; error?: string; claimed?: boolean }> {
  const sb = getSupabase();
  if (!sb) return { ok: true, claimed: true };

  const { data: userRes } = await sb.auth.getUser();
  if (!userRes?.user?.id) return { ok: false, error: "Must be signed in to download products" };

  try {
    const { error } = await sb
      .from("user_products")
      .insert({
        product_id: productId,
        user_id: userRes.user.id,
      });

    if (error) {
      console.warn("user_products table notice:", error.message);
    }
    return { ok: true, claimed: true };
  } catch {
    return { ok: true, claimed: true };
  }
}
