import { getSupabase, getSupabaseUrl } from "@/lib/supabase";
import {
  ConnectionState,
  type Participant,
  Room,
  RoomEvent,
  Track,
  type TrackPublication,
} from "livekit-client";
import { Platform } from "react-native";

/* ────────────────── Types ────────────────── */

export type AudioParticipant = {
  identity: string;
  name: string;
  isSpeaking: boolean;
  isMuted: boolean;
  audioLevel: number;
};

export type RoomCallbacks = {
  onParticipantJoined?: (participant: AudioParticipant) => void;
  onParticipantLeft?: (identity: string) => void;
  onSpeakingChanged?: (identity: string, speaking: boolean) => void;
  onMuteChanged?: (identity: string, muted: boolean) => void;
  onConnectionStateChanged?: (state: ConnectionState) => void;
  onAudioPlaybackChanged?: (canPlayback: boolean) => void;
  onDisconnected?: () => void;
};

// LiveKit credentials — set in .env
const LIVEKIT_URL = process.env.EXPO_PUBLIC_LIVEKIT_URL ?? "";
const LIVEKIT_API_KEY = process.env.EXPO_PUBLIC_LIVEKIT_API_KEY ?? "";
const LIVEKIT_API_SECRET = process.env.EXPO_PUBLIC_LIVEKIT_API_SECRET ?? "";

/* ────────────────── Token Generator ────────────────── */

function base64url(data: Uint8Array): string {
  const binary = Array.from(data).map((b) => String.fromCharCode(b)).join("");
  const b64 = typeof btoa !== "undefined" ? btoa(binary) : Buffer.from(data).toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function generateLocalLivekitToken(
  roomName: string,
  identity: string,
  name: string,
  _canPublish: boolean
): Promise<string | null> {
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) return null;
  try {
    const header = { alg: "HS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: LIVEKIT_API_KEY,
      sub: identity,
      name: name,
      nbf: now,
      exp: now + 86400,
      jti: identity,
      video: {
        roomJoin: true,
        room: roomName,
        canPublish: true,
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
      encoder.encode(LIVEKIT_API_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(signingInput));
    const sigB64 = base64url(new Uint8Array(sig));

    return `${signingInput}.${sigB64}`;
  } catch (err) {
    console.warn("Local LiveKit token gen error:", err);
    return null;
  }
}

async function fetchToken(
  roomName: string,
  identity: string,
  name: string,
  canPublish: boolean
): Promise<string | null> {
  const sb = getSupabase();
  const baseUrl = getSupabaseUrl();

  // 1. Try Supabase Edge Function
  if (sb && baseUrl) {
    try {
      const { data: sessionData } = await sb.auth.getSession();
      const authToken = sessionData?.session?.access_token || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      if (authToken) {
        const res = await fetch(`${baseUrl}/functions/v1/livekit-token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ roomName, identity, name, canPublish }),
        });
        if (res.ok) {
          const { token } = await res.json();
          if (token) return token;
        }
      }
    } catch (err) {
      console.warn("Edge function token fetch error, using fallback:", err);
    }
  }

  // 2. Fallback to client-side token generation with configured API Key/Secret
  return generateLocalLivekitToken(roomName, identity, name, canPublish);
}

/* ────────────────── Room Manager ────────────────── */

let _room: Room | null = null;

function getParticipantInfo(p: Participant): AudioParticipant {
  return {
    identity: p.identity,
    name: p.name ?? p.identity,
    isSpeaking: p.isSpeaking,
    isMuted: !p.isMicrophoneEnabled,
    audioLevel: p.audioLevel ?? 0,
  };
}

export async function connectToRoom(
  roomName: string,
  identity: string,
  displayName: string,
  canPublish: boolean = true,
  callbacks?: RoomCallbacks
): Promise<boolean> {
  if (!LIVEKIT_URL) {
    console.warn("LiveKit URL not configured — skipping audio connection");
    return false;
  }

  // Register native globals for iOS / Android if running native
  if (Platform.OS !== "web") {
    try {
      const { registerGlobals } = require("@livekit/react-native");
      registerGlobals();
    } catch {
      // Native globals registration optional if already set up
    }
  }

  try {
    const token = await fetchToken(roomName, identity, displayName, canPublish);
    if (!token) {
      console.warn("Failed to get LiveKit token");
      return false;
    }

    // Disconnect existing room
    if (_room) {
      _room.disconnect();
      _room = null;
    }

    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
    });

    // Handle remote track subscription and audio output element binding
    room.on(RoomEvent.TrackSubscribed, (track: Track, _pub: TrackPublication, _participant: Participant) => {
      if (track.kind === Track.Kind.Audio) {
        try {
          if (Platform.OS === "web" || typeof document !== "undefined") {
            const el = track.attach();
            if (el && typeof el.play === "function") {
              el.play().catch((playErr) => {
                console.warn("LiveKit audio autoplay blocked by browser policy:", playErr);
              });
            }
          }
        } catch (attachErr) {
          console.warn("LiveKit track attach warning:", attachErr);
        }
      }
    });

    room.on(RoomEvent.TrackUnsubscribed, (track: Track) => {
      if (track.kind === Track.Kind.Audio) {
        try {
          if (Platform.OS === "web" || typeof document !== "undefined") {
            track.detach();
          }
        } catch (detachErr) {
          console.warn("LiveKit track detach warning:", detachErr);
        }
      }
    });

    // Browser audio playback autoplay status
    room.on(RoomEvent.AudioPlaybackStatusChanged, () => {
      callbacks?.onAudioPlaybackChanged?.(room.canPlaybackAudio);
    });

    // Participant lifecycle listeners
    room.on(RoomEvent.ParticipantConnected, (participant: Participant) => {
      callbacks?.onParticipantJoined?.(getParticipantInfo(participant));
      setupParticipantListeners(participant, callbacks);
    });

    room.on(RoomEvent.ParticipantDisconnected, (participant: Participant) => {
      callbacks?.onParticipantLeft?.(participant.identity);
    });

    room.on(RoomEvent.ActiveSpeakersChanged, (speakers: Participant[]) => {
      const speakerIds = new Set(speakers.map((s) => s.identity));
      // Notify all participants of speaking state
      for (const p of room.remoteParticipants.values()) {
        callbacks?.onSpeakingChanged?.(p.identity, speakerIds.has(p.identity));
      }
      if (room.localParticipant) {
        callbacks?.onSpeakingChanged?.(
          room.localParticipant.identity,
          speakerIds.has(room.localParticipant.identity)
        );
      }
    });

    room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
      callbacks?.onConnectionStateChanged?.(state);
    });

    room.on(RoomEvent.Disconnected, () => {
      callbacks?.onDisconnected?.();
      _room = null;
    });

    // Connect to LiveKit server
    await room.connect(LIVEKIT_URL, token);

    // Start audio playback for browser autoplay policies
    try {
      await room.startAudio();
    } catch (audioErr) {
      console.warn("LiveKit startAudio notice:", audioErr);
    }

    // Enable microphone safely if authorized to publish
    if (canPublish) {
      try {
        await room.localParticipant.setMicrophoneEnabled(true);
      } catch (micErr) {
        console.warn("Microphone publish warning:", micErr);
      }
    }

    // Set up listeners and attach any existing audio tracks from remote participants
    for (const p of room.remoteParticipants.values()) {
      setupParticipantListeners(p, callbacks);
      for (const pub of p.audioTrackPublications.values()) {
        if (pub.track && (Platform.OS === "web" || typeof document !== "undefined")) {
          try {
            const el = pub.track.attach();
            if (el && typeof el.play === "function") {
              el.play().catch(() => {});
            }
          } catch {}
        }
      }
    }

    _room = room;
    return true;
  } catch (err) {
    console.warn("LiveKit connect error:", err);
    return false;
  }
}

function setupParticipantListeners(
  participant: Participant,
  callbacks?: RoomCallbacks
) {
  participant.on("trackMuted", (pub: TrackPublication) => {
    if (pub.kind === Track.Kind.Audio) {
      callbacks?.onMuteChanged?.(participant.identity, true);
    }
  });

  participant.on("trackUnmuted", (pub: TrackPublication) => {
    if (pub.kind === Track.Kind.Audio) {
      callbacks?.onMuteChanged?.(participant.identity, false);
    }
  });
}

/* ────────────────── Controls ────────────────── */

export async function setMicrophoneEnabled(enabled: boolean): Promise<void> {
  if (!_room) return;
  try {
    await _room.localParticipant.setMicrophoneEnabled(enabled);
  } catch (err) {
    console.warn("setMicrophoneEnabled warning:", err);
  }
}

export async function resumeAudioPlayback(): Promise<boolean> {
  if (!_room) return false;
  try {
    await _room.startAudio();
    return _room.canPlaybackAudio;
  } catch {
    return false;
  }
}

export function canPlaybackAudio(): boolean {
  return _room ? _room.canPlaybackAudio : true;
}

export function getLocalParticipant(): AudioParticipant | null {
  if (!_room?.localParticipant) return null;
  return getParticipantInfo(_room.localParticipant);
}

export function getRemoteParticipants(): AudioParticipant[] {
  if (!_room) return [];
  return Array.from(_room.remoteParticipants.values()).map(getParticipantInfo);
}

export function isConnected(): boolean {
  return _room?.state === ConnectionState.Connected;
}

export function disconnectFromRoom(): void {
  if (_room) {
    _room.disconnect();
    _room = null;
  }
}
