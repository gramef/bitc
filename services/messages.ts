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
  last_message: string;
  last_message_time: string;
  unread_count: number;
};

const MESSAGES_STORAGE_KEY = "@bitc_direct_messages";

const SEED_CONVERSATIONS: Conversation[] = [
  {
    id: "conv_kofi",
    participant_id: "usr_201",
    participant_name: "Kofi Mensah",
    participant_avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    participant_role: "Lead Product Designer at Monzo",
    last_message: "Hey! Loved your mobile case study. Are you open for contract UI roles starting next month?",
    last_message_time: "10:42 AM",
    unread_count: 1,
  },
  {
    id: "conv_sophie",
    participant_id: "usr_103",
    participant_name: "Sophie Tremblay",
    participant_avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    participant_role: "Creative Director",
    last_message: "See you at the London Brunch networking this weekend! Don't forget your portfolio deck.",
    last_message_time: "Yesterday",
    unread_count: 0,
  },
  {
    id: "conv_amara",
    participant_id: "usr_101",
    participant_name: "Amara Okafor",
    participant_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    participant_role: "Brand Identity Lead",
    last_message: "Thanks for the feedback on the typography lockup. That spacing fix worked perfectly!",
    last_message_time: "Sep 7",
    unread_count: 0,
  },
];

const SEED_MESSAGES: Record<string, DirectMessage[]> = {
  conv_kofi: [
    {
      id: "m_1",
      conversation_id: "conv_kofi",
      sender_id: "usr_201",
      sender_name: "Kofi Mensah",
      sender_avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      recipient_id: "me",
      text: "Hi there! I noticed your recent portfolio project featured in the Skills Vault.",
      created_at: "10:35 AM",
      read: true,
    },
    {
      id: "m_2",
      conversation_id: "conv_kofi",
      sender_id: "usr_201",
      sender_name: "Kofi Mensah",
      sender_avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      recipient_id: "me",
      text: "Hey! Loved your mobile case study. Are you open for contract UI roles starting next month?",
      created_at: "10:42 AM",
      read: false,
    },
  ],
  conv_sophie: [
    {
      id: "m_3",
      conversation_id: "conv_sophie",
      sender_id: "usr_103",
      sender_name: "Sophie Tremblay",
      sender_avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
      recipient_id: "me",
      text: "See you at the London Brunch networking this weekend! Don't forget your portfolio deck.",
      created_at: "Yesterday",
      read: true,
    },
  ],
};

async function getStoredState(): Promise<{
  conversations: Conversation[];
  messages: Record<string, DirectMessage[]>;
}> {
  try {
    const raw = await AsyncStorage.getItem(MESSAGES_STORAGE_KEY);
    if (!raw) {
      const initial = { conversations: SEED_CONVERSATIONS, messages: SEED_MESSAGES };
      await AsyncStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return { conversations: SEED_CONVERSATIONS, messages: SEED_MESSAGES };
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
    // Generate new conversation container on the fly if starting a new chat
    conversation = {
      id: `conv_${convOrUserId}`,
      participant_id: convOrUserId,
      participant_name: "Creative Member",
      participant_avatar: null,
      participant_role: "Designer",
      last_message: "Conversation started",
      last_message_time: "Just now",
      unread_count: 0,
    };
    state.conversations.unshift(conversation);
    state.messages[conversation.id] = [];
    await AsyncStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(state));
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
      last_message: params.text,
      last_message_time: timeStr,
      unread_count: 0,
    };
    state.conversations.unshift(conv);
  } else {
    conv.last_message = params.text;
    conv.last_message_time = timeStr;
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

  await AsyncStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(state));

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
