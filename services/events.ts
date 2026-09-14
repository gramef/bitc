import { getSupabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type EventRow = {
  id: string;
  title: string;
  org: string | null;
  city: string | null;
  event_date: string | null;
  image_url: string | null;
};

export async function fetchEvents(limit = 20): Promise<EventRow[]> {
  const sb = getSupabase();
  if (!sb) return [];

  const { data, error } = await sb
    .from("events")
    .select("id,title,org,city,event_date,image_url")
    .order("created_at", { ascending: false })
    .limit(limit);

    if (error || !data) return [];
    return data as EventRow[];
}

export type EventTicket = {
    id: string;
    event_id: string;
    user_id: string;
    ticket_code: string;
    status: "valid" | "checked_in" | "cancelled";
    created_at: string;
};

function generateTicketCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const nums = "23456789";
    let codePart1 = "";
    let codePart2 = "";
    for (let i = 0; i < 4; i++) {
        codePart1 += chars.charAt(Math.floor(Math.random() * chars.length));
        codePart2 += nums.charAt(Math.floor(Math.random() * nums.length));
    }
    return `BITC-${codePart1}-${codePart2}`;
}

export async function registerForEvent(
    eventId: string
): Promise<{ ok: boolean; error?: string; ticket?: EventTicket }> {
    const sb = getSupabase();
    if (!sb) return { ok: false, error: "Database not connected" };

    const { data: userRes } = await sb.auth.getUser();
    if (!userRes?.user?.id) return { ok: false, error: "Must be signed in to get tickets" };
    const userId = userRes.user.id;
    const ticketCode = generateTicketCode();

    const newTicket: EventTicket = {
        id: "tkt_" + Date.now(),
        event_id: eventId,
        user_id: userId,
        ticket_code: ticketCode,
        status: "valid",
        created_at: new Date().toISOString(),
    };

    // Always persist to local cache so user never loses their ticket
    try {
        const key = `@bitc_my_tickets_${userId}`;
        const raw = await AsyncStorage.getItem(key);
        const existing: EventTicket[] = raw ? JSON.parse(raw) : [];
        existing.unshift(newTicket);
        await AsyncStorage.setItem(key, JSON.stringify(existing));
    } catch {}

    try {
        const { data, error } = await sb
            .from("event_tickets")
            .insert({
                event_id: eventId,
                user_id: userId,
                ticket_code: ticketCode,
                status: "valid",
            })
            .select()
            .single();

        const finalTicket = (error || !data) ? newTicket : (data as EventTicket);

        // Trigger local pass confirmation notification
        import("@/services/notifications").then((m) => {
            m.sendTicketConfirmedNotification("Weekend Brunch Mixer", finalTicket.ticket_code);
        });

        return { ok: true, ticket: finalTicket };
    } catch {
        // Trigger local pass confirmation notification
        import("@/services/notifications").then((m) => {
            m.sendTicketConfirmedNotification("Weekend Brunch Mixer", newTicket.ticket_code);
        });

        return { ok: true, ticket: newTicket };
    }
}

export async function fetchMyEventTicket(eventId: string): Promise<EventTicket | null> {
    const sb = getSupabase();
    if (!sb) return null;

    const { data: userRes } = await sb.auth.getUser();
    if (!userRes?.user?.id) return null;
    const userId = userRes.user.id;

    try {
        const { data, error } = await sb
            .from("event_tickets")
            .select("*")
            .eq("event_id", eventId)
            .eq("user_id", userId)
            .maybeSingle();

        if (data && !error) return data as EventTicket;
    } catch {}

    // Check local storage
    try {
        const key = `@bitc_my_tickets_${userId}`;
        const raw = await AsyncStorage.getItem(key);
        if (raw) {
            const list: EventTicket[] = JSON.parse(raw);
            const found = list.find((t) => t.event_id === eventId);
            if (found) return found;
        }
    } catch {}

    return null;
}

export type MyTicketWithEvent = EventTicket & {
    event_title?: string;
    event_city?: string | null;
    event_date?: string | null;
    image_url?: string | null;
};

export async function fetchMyTickets(): Promise<MyTicketWithEvent[]> {
    const sb = getSupabase();
    if (!sb) return [];

    const { data: userRes } = await sb.auth.getUser();
    if (!userRes?.user?.id) return [];
    const userId = userRes.user.id;

    try {
        const { data, error } = await sb
            .from("event_tickets")
            .select(`
                id, event_id, user_id, ticket_code, status, created_at,
                events (id, title, city, event_date, image_url)
            `)
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
            return (data as any[]).map((row) => ({
                id: row.id,
                event_id: row.event_id,
                user_id: row.user_id,
                ticket_code: row.ticket_code,
                status: row.status,
                created_at: row.created_at,
                event_title: row.events?.title || "BITC Brunch Event",
                event_city: row.events?.city || "London",
                event_date: row.events?.event_date || row.created_at,
                image_url: row.events?.image_url || null,
            }));
        }
    } catch {}

    // Local storage fallback with live event details lookup
    try {
        const key = `@bitc_my_tickets_${userId}`;
        const raw = await AsyncStorage.getItem(key);
        if (raw) {
            const list: EventTicket[] = JSON.parse(raw);
            const allEvents = await fetchEvents(50);
            return list.map((t) => {
                const ev = allEvents.find((e) => e.id === t.event_id);
                return {
                    ...t,
                    event_title: ev?.title || "BITC Brunch Event",
                    event_city: ev?.city || "London",
                    event_date: ev?.event_date || t.created_at,
                    image_url: ev?.image_url || null,
                };
            });
        }
    } catch {}

    return [];
}

export type AttendeeTicket = EventTicket & {
    attendee_name: string;
    attendee_avatar: string | null;
    attendee_role: string;
    checked_in_at?: string | null;
};

/**
 * Fetch attendee roster for a specific event (Admin)
 */
export async function fetchEventRoster(eventId: string): Promise<AttendeeTicket[]> {
    const sb = getSupabase();
    if (!sb) return [];

    try {
        const { data, error } = await sb
            .from("event_tickets")
            .select(`
                id, event_id, user_id, ticket_code, status, created_at,
                profiles:user_id (full_name, avatar_url, role)
            `)
            .eq("event_id", eventId);

        if (error || !data || data.length === 0) {
            return [];
        }

        return data.map((d: any) => ({
            id: d.id,
            event_id: d.event_id,
            user_id: d.user_id,
            ticket_code: d.ticket_code,
            status: d.status,
            created_at: d.created_at,
            attendee_name: d.profiles?.full_name || "Guest Attendee",
            attendee_avatar: d.profiles?.avatar_url || null,
            attendee_role: d.profiles?.role || "Creative",
        }));
    } catch {
        return [];
    }
}

/**
 * Check in an attendee ticket by code (Door Scanner / Admin Console)
 */
export async function checkInTicket(
    ticketCode: string
): Promise<{ ok: boolean; ticket?: AttendeeTicket; message: string }> {
    const normalizedCode = ticketCode.trim().toUpperCase();
    const sb = getSupabase();

    if (sb) {
        try {
            const { data, error } = await sb
                .from("event_tickets")
                .select("*, profiles:user_id (full_name, avatar_url, role)")
                .eq("ticket_code", normalizedCode)
                .maybeSingle();

            if (data && !error) {
                if (data.status === "checked_in") {
                    return {
                        ok: false,
                        ticket: {
                            ...data,
                            attendee_name: data.profiles?.full_name || "Attendee",
                            attendee_avatar: data.profiles?.avatar_url || null,
                            attendee_role: data.profiles?.role || "Creative",
                        },
                        message: `⚠️ Ticket ${normalizedCode} was already checked in.`,
                    };
                }

                await sb.from("event_tickets").update({ status: "checked_in" }).eq("id", data.id);

                const attendee: AttendeeTicket = {
                    ...data,
                    status: "checked_in",
                    attendee_name: data.profiles?.full_name || "Attendee",
                    attendee_avatar: data.profiles?.avatar_url || null,
                    attendee_role: data.profiles?.role || "Creative",
                    checked_in_at: new Date().toLocaleTimeString(),
                };
                return {
                    ok: true,
                    ticket: attendee,
                    message: `✓ Checked in: ${attendee.attendee_name}!`,
                };
            }
        } catch {}
    }

    return {
        ok: false,
        message: `❌ Invalid Ticket Code: "${ticketCode}". No registration found in system.`,
    };
}

/**
 * Fetch overall event stats for Admin KPI Center (calculates from real data)
 */
export async function fetchAllEventStats(): Promise<{
    totalEvents: number;
    totalTicketsIssued: number;
    checkedInCount: number;
    checkInRatePercent: number;
}> {
    const events = await fetchEvents(50);
    const sb = getSupabase();
    let totalIssued = 0;
    let checkedIn = 0;

    if (sb) {
        try {
            const { data } = await sb.from("event_tickets").select("id, status");
            if (data && data.length > 0) {
                totalIssued = data.length;
                checkedIn = data.filter((t: any) => t.status === "checked_in").length;
            }
        } catch {}
    }

    const checkInRatePercent = totalIssued > 0 ? Math.round((checkedIn / totalIssued) * 100) : 0;

    return {
        totalEvents: events.length,
        totalTicketsIssued: totalIssued,
        checkedInCount: checkedIn,
        checkInRatePercent,
    };
}

