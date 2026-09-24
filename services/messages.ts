/**
 * Direct Messaging Service for BITC
 * 
 * Handles 1:1 conversations between creatives, mentors, recruiters, and clients.
 * Supports:
 * 1. Supabase Realtime Broadcast (instant 2-way message delivery between active users)
 * 2. Supabase Postgres 'messages' table synchronization (persistent cloud storage)
 * 3. Local AsyncStorage fallback and instant offline cache
 */

import { getSupabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type DirectMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar: string | null;
  recipient_id: string;
  text: string;
  created_at: string;
  read: boolean;
};

export type Conversation = {
  id: string;
  participant_id: string;
  participant_name: string;
  participant_avatar: string | null;
  participant_role: string;
  is_verified?: boolean;
  last_message: string;
  last_message_time: string;
  unread_count: number;
};

export async function getCurrentUserId(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data: userRes } = await sb.auth.getUser();
    return userRes?.user?.id ?? null;
  } catch {
    return null;
  }
}

async function getMessagesStorageKey(): Promise<string> {
  const userId = await getCurrentUserId();
  if (userId) {
    return `@bitc_direct_messages_${userId}`;
  }
  return "@bitc_direct_messages_guest";
}

async function getStoredState(): Promise<{
  conversations: Conversation[];
  messages: Record<string, DirectMessage[]>;
}> {
  try {
    const key = await getMessagesStorageKey();
    const raw = await AsyncStorage.getItem(key);
    if (!raw) {
      return { conversations: [], messages: {} };
    }
    return JSON.parse(raw);
  } catch {
    return { conversations: [], messages: {} };
  }
}

async function saveStoredState(state: {
  conversations: Conversation[];
  messages: Record<string, DirectMessage[]>;
}): Promise<void> {
  try {
    const key = await getMessagesStorageKey();
    await AsyncStorage.setItem(key, JSON.stringify(state));
  } catch (err) {
    console.warn("Failed saving messaging state to storage", err);
  }
}

/**
 * Deterministic conversation channel name for two participants
 */
export function getConversationChannelName(userA: string, userB: string): string {
  const sorted = [userA, userB].sort();
  return `chat_${sorted[0]}_${sorted[1]}`;
}

/**
 * Fetch all active conversations for the current user
 * Merges local storage with any cloud messages from Supabase
 */
export async function fetchConversations(): Promise<Conversation[]> {
  const state = await getStoredState();
  const currentUserId = await getCurrentUserId();

  // If user is authenticated, attempt to sync with Supabase 'messages' table
  if (currentUserId) {
    const sb = getSupabase();
    if (sb) {
      try {
        const { data: dbMsgs } = await sb
          .from("messages")
          .select("id, sender_id, recipient_id, content, read, created_at")
          .or(`sender_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`)
          .order("created_at", { ascending: true });

        if (dbMsgs && dbMsgs.length > 0) {
          await mergeDbMessagesIntoState(state, dbMsgs, currentUserId);
        }
      } catch {
        // Table may not exist yet in schema cache
      }
    }
  }

  return state.conversations;
}

/**
 * Fetch messages for a specific conversation or participant
 */
export async function fetchConversationDetails(
  convOrUserId: string
): Promise<{ conversation: Conversation; messages: DirectMessage[] }> {
  const state = await getStoredState();
  const currentUserId = await getCurrentUserId();

  let conversation = state.conversations.find(
    (c) => c.id === convOrUserId || c.participant_id === convOrUserId
  );

  const participantId = conversation ? conversation.participant_id : convOrUserId;

  if (!conversation) {
    let name = "Creative Member";
    let avatar: string | null = null;
    let role = "Designer";
    let isVerified = false;

    try {
      const { fetchUserProfile } = await import("@/services/profile");
      const p = await fetchUserProfile(participantId);
      if (p) {
        name = p.fullName;
        avatar = p.avatarUrl ?? null;
        role = p.role || p.bio || "Member";
        isVerified = Boolean(p.isVerified);
      }
    } catch {}

    conversation = {
      id: `conv_${participantId}`,
      participant_id: participantId,
      participant_name: name,
      participant_avatar: avatar,
      participant_role: role,
      is_verified: isVerified,
      last_message: "Conversation started",
      last_message_time: "Just now",
      unread_count: 0,
    };
    state.conversations.unshift(conversation);
    state.messages[conversation.id] = [];
    await saveStoredState(state);
  }

  // Attempt to sync from Supabase if table is present
  if (currentUserId && participantId) {
    const sb = getSupabase();
    if (sb) {
      try {
        const { data: dbMsgs } = await sb
          .from("messages")
          .select("id, sender_id, recipient_id, content, read, created_at")
          .or(
            `and(sender_id.eq.${currentUserId},recipient_id.eq.${participantId}),and(sender_id.eq.${participantId},recipient_id.eq.${currentUserId})`
          )
          .order("created_at", { ascending: true });

        if (dbMsgs && dbMsgs.length > 0) {
          await mergeDbMessagesIntoState(state, dbMsgs, currentUserId);
        }
      } catch {}
    }
  }

  // Mark all unread messages in this conversation as read
  if (state.messages[conversation.id]) {
    state.messages[conversation.id].forEach((m) => {
      m.read = true;
    });
  }
  conversation.unread_count = 0;
  await saveStoredState(state);

  const messages = state.messages[conversation.id] || [];
  return { conversation, messages };
}

/**
 * Merge remote Supabase database rows into local cache state
 */
async function mergeDbMessagesIntoState(
  state: { conversations: Conversation[]; messages: Record<string, DirectMessage[]> },
  dbMsgs: any[],
  currentUserId: string
) {
  let changed = false;

  for (const m of dbMsgs) {
    const otherId = m.sender_id === currentUserId ? m.recipient_id : m.sender_id;
    const convId = `conv_${otherId}`;

    if (!state.messages[convId]) {
      state.messages[convId] = [];
    }

    const exists = state.messages[convId].some(
      (existing) => existing.id === m.id || (existing.text === m.content && existing.created_at === m.created_at)
    );

    if (!exists) {
      const isMe = m.sender_id === currentUserId;
      const timeStr = new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      const newMsg: DirectMessage = {
        id: m.id,
        conversation_id: convId,
        sender_id: m.sender_id,
        sender_name: isMe ? "Me" : "Creative Member",
        sender_avatar: null,
        recipient_id: m.recipient_id,
        text: m.content,
        created_at: timeStr,
        read: isMe ? true : Boolean(m.read),
      };

      state.messages[convId].push(newMsg);
      changed = true;

      let conv = state.conversations.find((c) => c.participant_id === otherId);
      if (conv) {
        conv.last_message = m.content;
        conv.last_message_time = timeStr;
      }
    }
  }

  if (changed) {
    await saveStoredState(state);
  }
}

/**
 * Send a 1:1 direct message
 * 1. Saves locally for instant UI update
 * 2. Broadcasts via Supabase Realtime so active recipient receives it immediately
 * 3. Inserts into Supabase 'messages' table for persistent cloud storage
 */
export async function sendDirectMessage(params: {
  recipientId: string;
  recipientName?: string;
  recipientAvatar?: string | null;
  recipientRole?: string;
  isVerified?: boolean;
  text: string;
}): Promise<DirectMessage> {
  const state = await getStoredState();
  const currentUserId = (await getCurrentUserId()) || "me";
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  let conv = state.conversations.find((c) => c.participant_id === params.recipientId);

  if (!conv) {
    conv = {
      id: `conv_${params.recipientId}`,
      participant_id: params.recipientId,
      participant_name: params.recipientName || "Creative Member",
      participant_avatar: params.recipientAvatar || null,
      participant_role: params.recipientRole || "Designer",
      is_verified: Boolean(params.isVerified),
      last_message: params.text,
      last_message_time: timeStr,
      unread_count: 0,
    };
    state.conversations.unshift(conv);
  } else {
    conv.last_message = params.text;
    conv.last_message_time = timeStr;
    if (params.isVerified !== undefined) {
      conv.is_verified = params.isVerified;
    }
    state.conversations = [conv, ...state.conversations.filter((c) => c.id !== conv?.id)];
  }

  const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newMsg: DirectMessage = {
    id: msgId,
    conversation_id: conv.id,
    sender_id: currentUserId,
    sender_name: "Me",
    sender_avatar: null,
    recipient_id: params.recipientId,
    text: params.text,
    created_at: timeStr,
    read: true,
  };

  if (!state.messages[conv.id]) {
    state.messages[conv.id] = [];
  }
  state.messages[conv.id].push(newMsg);
  await saveStoredState(state);

  // Broadcast & Supabase sync
  const sb = getSupabase();
  if (sb) {
    try {
      // 1. Broadcast to the active conversation channel (if recipient is currently looking at this chat)
      const chatChannelName = getConversationChannelName(currentUserId, params.recipientId);
      const chatChannel = sb.channel(chatChannelName);
      chatChannel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          chatChannel.send({
            type: "broadcast",
            event: "new_message",
            payload: {
              ...newMsg,
              sender_id: currentUserId,
              sender_name: conv?.participant_name || "Creative",
            },
          });
        }
      });

      // 2. Broadcast to recipient's personal inbox channel (if recipient is elsewhere in the app)
      const inboxChannelName = `inbox_${params.recipientId}`;
      const inboxChannel = sb.channel(inboxChannelName);
      inboxChannel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          inboxChannel.send({
            type: "broadcast",
            event: "new_message",
            payload: {
              ...newMsg,
              sender_id: currentUserId,
            },
          });
        }
      });

      // 3. Persist to Supabase 'messages' table if user is logged in
      if (currentUserId !== "me") {
        await sb.from("messages").insert({
          sender_id: currentUserId,
          recipient_id: params.recipientId,
          content: params.text,
        });
      }
    } catch (err) {
      console.warn("Background realtime broadcast/persist error:", err);
    }
  }

  return newMsg;
}

/**
 * Handle receiving an incoming message via Realtime broadcast
 */
export async function handleIncomingRealtimeMessage(
  msg: DirectMessage,
  currentUserId: string
): Promise<DirectMessage | null> {
  // If the message is from myself, ignore
  if (msg.sender_id === currentUserId || msg.sender_id === "me") {
    return null;
  }

  const state = await getStoredState();
  const convId = `conv_${msg.sender_id}`;

  if (!state.messages[convId]) {
    state.messages[convId] = [];
  }

  // Deduplicate
  const exists = state.messages[convId].some((m) => m.id === msg.id);
  if (exists) return null;

  let conv = state.conversations.find((c) => c.participant_id === msg.sender_id);
  if (!conv) {
    let name = msg.sender_name || "Creative Member";
    let avatar = msg.sender_avatar || null;
    let role = "Designer";

    try {
      const { fetchUserProfile } = await import("@/services/profile");
      const p = await fetchUserProfile(msg.sender_id);
      if (p) {
        name = p.fullName;
        avatar = p.avatarUrl ?? null;
        role = p.role || p.bio || "Member";
      }
    } catch {}

    conv = {
      id: convId,
      participant_id: msg.sender_id,
      participant_name: name,
      participant_avatar: avatar,
      participant_role: role,
      last_message: msg.text,
      last_message_time: msg.created_at,
      unread_count: 1,
    };
    state.conversations.unshift(conv);
  } else {
    conv.last_message = msg.text;
    conv.last_message_time = msg.created_at;
    conv.unread_count = (conv.unread_count || 0) + 1;
    state.conversations = [conv, ...state.conversations.filter((c) => c.id !== convId)];
  }

  state.messages[convId].push(msg);
  await saveStoredState(state);

  return msg;
}

/**
 * Subscribe to real-time incoming messages for a specific conversation
 */
export function subscribeToConversationThread(
  currentUserId: string,
  participantId: string,
  onNewMessage: (msg: DirectMessage) => void
): () => void {
  const sb = getSupabase();
  if (!sb || !currentUserId || !participantId) {
    return () => {};
  }

  const channelName = getConversationChannelName(currentUserId, participantId);
  const channel: RealtimeChannel = sb.channel(channelName);

  channel
    .on("broadcast", { event: "new_message" }, async ({ payload }) => {
      if (payload && payload.sender_id !== currentUserId) {
        const processed = await handleIncomingRealtimeMessage(payload, currentUserId);
        if (processed) {
          onNewMessage(processed);
        }
      }
    })
    .subscribe();

  return () => {
    sb.removeChannel(channel);
  };
}

/**
 * Subscribe to personal inbox for notification badges and incoming new chats
 */
export function subscribeToInbox(
  currentUserId: string,
  onNewMessage: (msg: DirectMessage) => void
): () => void {
  const sb = getSupabase();
  if (!sb || !currentUserId) {
    return () => {};
  }

  const channelName = `inbox_${currentUserId}`;
  const channel: RealtimeChannel = sb.channel(channelName);

  channel
    .on("broadcast", { event: "new_message" }, async ({ payload }) => {
      if (payload && payload.sender_id !== currentUserId) {
        const processed = await handleIncomingRealtimeMessage(payload, currentUserId);
        if (processed) {
          onNewMessage(processed);
        }
      }
    })
    .subscribe();

  return () => {
    sb.removeChannel(channel);
  };
}
