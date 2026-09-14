/**
 * Direct Messaging Service for BITC
 * 
 * Handles 1:1 conversations between creatives, mentors, recruiters, and clients.
 * Persists messages locally and synchronizes with Supabase.
 */

import { getSupabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

async function getMessagesStorageKey(): Promise<string> {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data: userRes } = await sb.auth.getUser();
      if (userRes?.user?.id) {
        return `@bitc_direct_messages_${userRes.user.id}`;
      }
    } catch {}
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

/**
 * Fetch all active conversations for the current user
 */
export async function fetchConversations(): Promise<Conversation[]> {
  const state = await getStoredState();
  return state.conversations;
}

/**
 * Fetch messages for a specific conversation or participant
 */
export async function fetchConversationDetails(
  convOrUserId: string
): Promise<{ conversation: Conversation; messages: DirectMessage[] }> {
  const state = await getStoredState();

  let conversation = state.conversations.find(
    (c) => c.id === convOrUserId || c.participant_id === convOrUserId
  );

  if (!conversation) {
    let name = "Creative Member";
    let avatar: string | null = null;
    let role = "Designer";
    let isVerified = false;

    try {
      const { fetchUserProfile } = await import("@/services/profile");
      const p = await fetchUserProfile(convOrUserId);
      if (p) {
        name = p.fullName;
        avatar = p.avatarUrl ?? null;
        role = p.role || p.bio || "Member";
        isVerified = Boolean(p.isVerified);
      }
    } catch {}

    // Generate new conversation container on the fly if starting a new chat
    conversation = {
      id: `conv_${convOrUserId}`,
      participant_id: convOrUserId,
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
    const key = await getMessagesStorageKey();
    await AsyncStorage.setItem(key, JSON.stringify(state));
  }

  const messages = state.messages[conversation.id] || [];
  return { conversation, messages };
}

/**
 * Send a 1:1 direct message
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
    // Move to front
    state.conversations = [conv, ...state.conversations.filter((c) => c.id !== conv?.id)];
  }

  const newMsg: DirectMessage = {
    id: `msg_${Date.now()}`,
    conversation_id: conv.id,
    sender_id: "me",
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

  const key = await getMessagesStorageKey();
  await AsyncStorage.setItem(key, JSON.stringify(state));

  // Also try Supabase if table exists
  const sb = getSupabase();
  if (sb) {
    try {
      const { data: userRes } = await sb.auth.getUser();
      if (userRes?.user?.id) {
        await sb.from("direct_messages").insert({
          sender_id: userRes.user.id,
          recipient_id: params.recipientId,
          text: params.text,
        });
      }
    } catch {}
  }

  return newMsg;
}
