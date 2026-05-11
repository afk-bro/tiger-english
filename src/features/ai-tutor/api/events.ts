import { supabase } from "@/lib/supabase";
import type { FrontendEventType } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

export async function reportTutorEvent(
  eventType: FrontendEventType,
  payload: Record<string, unknown> = {},
  sessionId?: string,
): Promise<void> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;
    await fetch(`${API_BASE}/me/ai-tutor/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        event_type: eventType,
        payload,
        session_id: sessionId ?? null,
      }),
      keepalive: true,
    });
  } catch {
    // Telemetry: never throw to caller.
  }
}
