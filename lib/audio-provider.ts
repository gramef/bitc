import { getSupabase, getSupabaseUrl } from "@/lib/supabase";
import {
  ConnectionState,
  type Participant,
  Room,
  RoomEvent,
  Track,
  type TrackPublication,
} from "livekit-client";

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
  onDisconnected?: () => void;
};

/* ────────────────── Config ────────────────── */

// LiveKit server URL — set in .env
const LIVEKIT_URL = process.env.EXPO_PUBLIC_LIVEKIT_URL ?? "";

/* ────────────────── Token Fetch ────────────────── */

async function fetchToken(
  roomName: string,
  identity: string,
  name: string,
  canPublish: boolean
): Promise<string | null> {
  const sb = getSupabase();
  const baseUrl = getSupabaseUrl();
  if (!sb || !baseUrl) return null;

  const { data: sessionData } = await sb.auth.getSession();
  const accessToken = sessionData?.session?.access_token;
  if (!accessToken) return null;

  try {
    const res = await fetch(`${baseUrl}/functions/v1/livekit-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ roomName, identity, name, canPublish }),
    });

    if (!res.ok) {
      console.warn("LiveKit token fetch failed:", res.status);
      return null;
    }

    const { token } = await res.json();
    return token ?? null;
  } catch (err) {
    console.warn("LiveKit token fetch error:", err);
    return null;
  }
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
  canPublish: boolean,
  callbacks?: RoomCallbacks
): Promise<boolean> {
  if (!LIVEKIT_URL) {
    console.warn("LiveKit URL not configured — skipping audio connection");
    return false;
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

    // Event listeners
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

    // Connect
    await room.connect(LIVEKIT_URL, token);

    // Enable microphone if speaker
    if (canPublish) {
      await room.localParticipant.setMicrophoneEnabled(true);
    }

    // Set up listeners for existing participants
    for (const p of room.remoteParticipants.values()) {
      setupParticipantListeners(p, callbacks);
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
  if (!_room?.localParticipant) return;
  await _room.localParticipant.setMicrophoneEnabled(enabled);
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
