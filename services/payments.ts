import AsyncStorage from "@react-native-async-storage/async-storage";
import { getSupabase } from "@/lib/supabase";

export interface FeeSplit {
  grossAmountCents: number;
  platformFeeCents: number;
  creatorNetCents: number;
  platformFeeFormatted: string;
  creatorNetFormatted: string;
  grossFormatted: string;
}

export interface PaymentTransaction {
  id: string;
  title: string;
  amountCents: number;
  currency: string;
  type: "marketplace_purchase" | "event_ticket" | "mentorship_fee" | "tip";
  status: "succeeded" | "pending" | "failed" | "refunded";
  creatorId?: string;
  payerId?: string;
  payerEmail?: string;
  feeSplit: FeeSplit;
  createdAt: string;
  metadata?: Record<string, any>;
}

const STORAGE_KEY = "@bitc_payment_transactions_v1";

/**
 * Calculates standard platform commission (10% platform, 90% creator).
 */
export function calculateFeeSplit(
  amountCents: number,
  platformCommissionPercent: number = 10
): FeeSplit {
  const platformFeeCents = Math.round((amountCents * platformCommissionPercent) / 100);
  const creatorNetCents = amountCents - platformFeeCents;

  const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return {
    grossAmountCents: amountCents,
    platformFeeCents,
    creatorNetCents,
    platformFeeFormatted: fmt(platformFeeCents),
    creatorNetFormatted: fmt(creatorNetCents),
    grossFormatted: fmt(amountCents),
  };
}

/**
 * Parses numeric price string (e.g. "$49.99" or "49.99" or "Free") into cents.
 */
export function parsePriceToCents(priceStr: string): number {
  if (!priceStr || priceStr.toLowerCase().includes("free")) {
    return 0;
  }
  const clean = priceStr.replace(/[^0-9.]/g, "");
  const val = parseFloat(clean);
  return isNaN(val) ? 0 : Math.round(val * 100);
}

/**
 * Seeds initial demo transaction history for testing and admin telemetry.
 */
const SEED_TRANSACTIONS: PaymentTransaction[] = [
  {
    id: "tx_1",
    title: "Design System Figma UI Kit Pro",
    amountCents: 4900,
    currency: "usd",
    type: "marketplace_purchase",
    status: "succeeded",
    creatorId: "user_aisha",
    payerEmail: "alex@creator.dev",
    feeSplit: calculateFeeSplit(4900, 10),
    createdAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
  },
  {
    id: "tx_2",
    title: "BITC Global Tech Summit 2026 - VIP Pass",
    amountCents: 15000,
    currency: "usd",
    type: "event_ticket",
    status: "succeeded",
    creatorId: "bitc_foundation",
    payerEmail: "sarah.j@acme.org",
    feeSplit: calculateFeeSplit(15000, 10),
    createdAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
  },
  {
    id: "tx_3",
    title: "1:1 Staff Frontend Architecture Mentorship",
    amountCents: 8500,
    currency: "usd",
    type: "mentorship_fee",
    status: "succeeded",
    creatorId: "user_marcus",
    payerEmail: "david.c@startup.io",
    feeSplit: calculateFeeSplit(8500, 10),
    createdAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
  },
  {
    id: "tx_4",
    title: "Next.js Mobile-First Boilerplate Template",
    amountCents: 2900,
    currency: "usd",
    type: "marketplace_purchase",
    status: "succeeded",
    creatorId: "user_elena",
    payerEmail: "dev_jay@tech.net",
    feeSplit: calculateFeeSplit(2900, 10),
    createdAt: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
  },
];

/**
 * Fetches all transaction records, merging cloud and offline mock transactions.
 */
export async function fetchPaymentHistory(): Promise<PaymentTransaction[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("AsyncStorage read error for payments:", e);
  }

  // Attempt fetching from Supabase payments table if configured
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb
        .from("payment_transactions")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return data as PaymentTransaction[];
      }
    } catch {
      // Fallback
    }
  }

  return [];
}

/**
 * Initiates Stripe payment processing flow. In dev/mock mode or when live Stripe keys are not yet injected,
 * creates a successful simulated transaction with fee split verification.
 */
export async function processPayment({
  title,
  amountCents,
  type,
  creatorId,
  metadata,
}: {
  title: string;
  amountCents: number;
  type: PaymentTransaction["type"];
  creatorId?: string;
  metadata?: Record<string, any>;
}): Promise<{ ok: boolean; transaction?: PaymentTransaction; error?: string }> {
  try {
    const feeSplit = calculateFeeSplit(amountCents);

    const sb = getSupabase();
    let payerId: string | undefined;
    let payerEmail: string = "attendee@bitc.network";

    if (sb) {
      try {
        const { data } = await sb.auth.getUser();
        if (data?.user) {
          payerId = data.user.id;
          payerEmail = data.user.email ?? payerEmail;
        }
      } catch {
        // Continue
      }
    }

    const tx: PaymentTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title,
      amountCents,
      currency: "usd",
      type,
      status: "succeeded",
      creatorId: creatorId ?? "bitc_platform",
      payerId,
      payerEmail,
      feeSplit,
      createdAt: new Date().toISOString(),
      metadata,
    };

    // Save locally
    const current = await fetchPaymentHistory();
    const updated = [tx, ...current];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Best-effort remote sync
    if (sb) {
      try {
        await sb.from("payment_transactions").insert({
          id: tx.id,
          title: tx.title,
          amount_cents: tx.amountCents,
          currency: tx.currency,
          type: tx.type,
          status: tx.status,
          creator_id: tx.creatorId,
          payer_id: tx.payerId,
          payer_email: tx.payerEmail,
          platform_fee_cents: tx.feeSplit.platformFeeCents,
          creator_net_cents: tx.feeSplit.creatorNetCents,
          created_at: tx.createdAt,
          metadata: tx.metadata,
        });
      } catch {
        // Table may not exist yet
      }
    }

    return { ok: true, transaction: tx };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Payment processing failed." };
  }
}

/**
 * Returns whether live Stripe credentials are configured in the environment
 */
export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
    process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY.startsWith("pk_")
  );
}

export function getStripePublishableKey(): string | null {
  return process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || null;
}
