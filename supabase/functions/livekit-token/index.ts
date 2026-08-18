// @ts-nocheck — Deno edge function
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

/**
 * BITC Live — LiveKit Token Generator
 *
 * Deploy as a Supabase Edge Function:
 *   supabase functions deploy livekit-token
 *
 * Set secrets:
 *   supabase secrets set LIVEKIT_API_KEY=your_key LIVEKIT_API_SECRET=your_secret
 *
 * Endpoint: POST /functions/v1/livekit-token
 * Body: { "roomName": "room-uuid", "identity": "user-uuid", "name": "Display Name", "canPublish": true }
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Minimal JWT generation for LiveKit (no external deps needed in Deno)
function base64url(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function createLivekitToken(
  apiKey: string,
  apiSecret: string,
  roomName: string,
  identity: string,
  name: string,
  canPublish: boolean
): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: apiKey,
    sub: identity,
    name: name,
    nbf: now,
    exp: now + 86400, // 24h
    jti: identity,
    video: {
      roomJoin: true,
      room: roomName,
      canPublish: canPublish,
      canSubscribe: true,
      canPublishData: true,
    },
  };

  const encoder = new TextEncoder();
  const headerB64 = base64url(encoder.encode(JSON.stringify(header)));
  const payloadB64 = base64url(encoder.encode(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(apiSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(signingInput));
  const sigB64 = base64url(new Uint8Array(sig));

  return `${signingInput}.${sigB64}`;
}

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("LIVEKIT_API_KEY");
    const apiSecret = Deno.env.get("LIVEKIT_API_SECRET");

    if (!apiKey || !apiSecret) {
      return new Response(
        JSON.stringify({ error: "LiveKit credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { roomName, identity, name, canPublish = false } = await req.json();

    if (!roomName || !identity) {
      return new Response(
        JSON.stringify({ error: "roomName and identity are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = await createLivekitToken(
      apiKey,
      apiSecret,
      roomName,
      identity,
      name ?? "Guest",
      canPublish
    );

    return new Response(
      JSON.stringify({ token }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
