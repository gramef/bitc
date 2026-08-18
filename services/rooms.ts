import { getSupabase } from "@/lib/supabase";

/* ────────────────── Types ────────────────── */

export type RoomStatus = "live" | "ended";
export type ParticipantRole = "host" | "co_host" | "speaker" | "listener";

export type RoomRow = {
  id: string;
  title: string;
  description: string | null;
  topic: string | null;
  host_id: string;
  status: RoomStatus;
  max_speakers: number;
  started_at: string;
  created_at: string;
};

export type ParticipantRow = {
  id: string;
  room_id: string;
  user_id: string;
  role: ParticipantRole;
  is_muted: boolean;
  hand_raised: boolean;
  joined_at: string;
};

export type RoomWithMeta = RoomRow & {
  host_name: string;
  host_avatar: string | null;
  speaker_count: number;
  listener_count: number;
  speakers: { id: string; name: string; avatar: string | null; role: ParticipantRole }[];
};

export type ParticipantWithProfile = ParticipantRow & {
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
};

/* ────────────────── Fetch ────────────────── */

export async function fetchLiveRooms(): Promise<RoomWithMeta[]> {
  const sb = getSupabase();
  if (!sb) return [];

  // Fetch live rooms with host profile
  const { data: rooms, error } = await sb
    .from("rooms")
    .select("*")
    .eq("status", "live")
    .order("started_at", { ascending: false });

  if (error || !rooms || rooms.length === 0) return [];

  // Get host profiles
  const hostIds = [...new Set(rooms.map((r: any) => r.host_id))];
  const { data: profiles } = await sb
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", hostIds);

  const profileMap: Record<string, { full_name: string; avatar_url: string | null }> = {};
  (profiles ?? []).forEach((p: any) => {
    profileMap[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url };
  });

  // Get participant counts & speakers for each room
  const roomIds = rooms.map((r: any) => r.id);
  const { data: participants } = await sb
    .from("room_participants")
    .select("room_id, user_id, role")
    .in("room_id", roomIds);

  // Get speaker profiles
  const speakerUserIds = (participants ?? [])
    .filter((p: any) => ["host", "co_host", "speaker"].includes(p.role))
    .map((p: any) => p.user_id);
  const { data: speakerProfiles } = speakerUserIds.length > 0
    ? await sb.from("profiles").select("id, full_name, avatar_url").in("id", speakerUserIds)
    : { data: [] };
  const speakerProfileMap: Record<string, { full_name: string; avatar_url: string | null }> = {};
  (speakerProfiles ?? []).forEach((p: any) => {
    speakerProfileMap[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url };
  });

  return rooms.map((room: any) => {
    const roomParticipants = (participants ?? []).filter((p: any) => p.room_id === room.id);
    const speakers = roomParticipants
      .filter((p: any) => ["host", "co_host", "speaker"].includes(p.role))
      .map((p: any) => ({
        id: p.user_id,
        name: speakerProfileMap[p.user_id]?.full_name ?? "Unknown",
        avatar: speakerProfileMap[p.user_id]?.avatar_url ?? null,
        role: p.role as ParticipantRole,
      }));

    return {
      ...room,
      host_name: profileMap[room.host_id]?.full_name ?? "Unknown",
      host_avatar: profileMap[room.host_id]?.avatar_url ?? null,
      speaker_count: speakers.length,
      listener_count: roomParticipants.filter((p: any) => p.role === "listener").length,
      speakers,
    };
  });
}

export async function fetchRoomById(roomId: string): Promise<RoomWithMeta | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const { data: room, error } = await sb
    .from("rooms")
    .select("*")
    .eq("id", roomId)
    .maybeSingle();

  if (error || !room) return null;

  // Host profile
  const { data: hostProfile } = await sb
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", room.host_id)
    .maybeSingle();

  // Participants
  const { data: participants } = await sb
    .from("room_participants")
    .select("*")
    .eq("room_id", roomId);

  const speakerUserIds = (participants ?? [])
    .filter((p: any) => ["host", "co_host", "speaker"].includes(p.role))
    .map((p: any) => p.user_id);
  const { data: speakerProfiles } = speakerUserIds.length > 0
    ? await sb.from("profiles").select("id, full_name, avatar_url").in("id", speakerUserIds)
    : { data: [] };
  const speakerProfileMap: Record<string, { full_name: string; avatar_url: string | null }> = {};
  (speakerProfiles ?? []).forEach((p: any) => {
    speakerProfileMap[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url };
  });

  const speakers = (participants ?? [])
    .filter((p: any) => ["host", "co_host", "speaker"].includes(p.role))
    .map((p: any) => ({
      id: p.user_id,
      name: speakerProfileMap[p.user_id]?.full_name ?? "Unknown",
      avatar: speakerProfileMap[p.user_id]?.avatar_url ?? null,
      role: p.role as ParticipantRole,
    }));

  return {
    ...room,
    host_name: hostProfile?.full_name ?? "Unknown",
    host_avatar: hostProfile?.avatar_url ?? null,
    speaker_count: speakers.length,
    listener_count: (participants ?? []).filter((p: any) => p.role === "listener").length,
    speakers,
  };
}

export async function fetchRoomParticipants(roomId: string): Promise<ParticipantWithProfile[]> {
  const sb = getSupabase();
  if (!sb) return [];

  const { data: participants } = await sb
    .from("room_participants")
    .select("*")
    .eq("room_id", roomId)
    .order("joined_at", { ascending: true });

  if (!participants || participants.length === 0) return [];

  const userIds = participants.map((p: any) => p.user_id);
  const { data: profiles } = await sb
    .from("profiles")
    .select("id, full_name, avatar_url, bio")
    .in("id", userIds);

  const profileMap: Record<string, any> = {};
  (profiles ?? []).forEach((p: any) => { profileMap[p.id] = p; });

  return participants.map((p: any) => ({
    ...p,
    full_name: profileMap[p.user_id]?.full_name ?? "Unknown",
    avatar_url: profileMap[p.user_id]?.avatar_url ?? null,
    bio: profileMap[p.user_id]?.bio ?? null,
  }));
}

/* ────────────────── Create / Join / Leave ────────────────── */

export async function createRoom(title: string, description?: string, topic?: string): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;

  const { data: room, error } = await sb
    .from("rooms")
    .insert({
      title,
      description: description ?? null,
      topic: topic ?? null,
      host_id: user.id,
      status: "live",
    })
    .select("id")
    .single();

  if (error || !room) return null;

  // Auto-join as host
  await sb.from("room_participants").insert({
    room_id: room.id,
    user_id: user.id,
    role: "host",
    is_muted: false,
  });

  return room.id;
}

export async function joinRoom(roomId: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return false;

  const { error } = await sb.from("room_participants").upsert(
    { room_id: roomId, user_id: user.id, role: "listener", is_muted: true },
    { onConflict: "room_id,user_id" }
  );

  return !error;
}

export async function leaveRoom(roomId: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return;

  await sb.from("room_participants").delete().match({ room_id: roomId, user_id: user.id });
}

/* ────────────────── Participant Actions ────────────────── */

export async function raiseHand(roomId: string, raised: boolean): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return;

  await sb.from("room_participants")
    .update({ hand_raised: raised })
    .match({ room_id: roomId, user_id: user.id });
}

export async function toggleMute(roomId: string, muted: boolean): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return;

  await sb.from("room_participants")
    .update({ is_muted: muted })
    .match({ room_id: roomId, user_id: user.id });
}

/* ────────────────── Host Actions ────────────────── */

export async function promoteToSpeaker(roomId: string, userId: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;

  await sb.from("room_participants")
    .update({ role: "speaker", is_muted: true, hand_raised: false })
    .match({ room_id: roomId, user_id: userId });
}

export async function demoteToListener(roomId: string, userId: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;

  await sb.from("room_participants")
    .update({ role: "listener", is_muted: true, hand_raised: false })
    .match({ room_id: roomId, user_id: userId });
}

export async function muteParticipant(roomId: string, userId: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;

  await sb.from("room_participants")
    .update({ is_muted: true })
    .match({ room_id: roomId, user_id: userId });
}

export async function removeParticipant(roomId: string, userId: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;

  await sb.from("room_participants")
    .delete()
    .match({ room_id: roomId, user_id: userId });
}

export async function makeCoHost(roomId: string, userId: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;

  await sb.from("room_participants")
    .update({ role: "co_host", is_muted: false, hand_raised: false })
    .match({ room_id: roomId, user_id: userId });
}

export async function endRoom(roomId: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;

  await sb.from("rooms")
    .update({ status: "ended", ended_at: new Date().toISOString() })
    .eq("id", roomId);

  // Remove all participants
  await sb.from("room_participants").delete().eq("room_id", roomId);
}

/* ────────────────── Realtime ────────────────── */

export function subscribeToRoomParticipants(
  roomId: string,
  onChange: () => void
) {
  const sb = getSupabase();
  if (!sb) return null;

  const channel = sb
    .channel(`room-${roomId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "room_participants", filter: `room_id=eq.${roomId}` },
      () => onChange()
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
      () => onChange()
    )
    .subscribe();

  return channel;
}

export function subscribeToLiveRooms(onChange: () => void) {
  const sb = getSupabase();
  if (!sb) return null;

  const channel = sb
    .channel("live-rooms")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "rooms" },
      () => onChange()
    )
    .subscribe();

  return channel;
}
