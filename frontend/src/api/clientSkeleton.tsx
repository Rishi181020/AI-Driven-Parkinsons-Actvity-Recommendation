const BASE_URL = "http://10.0.2.2:8000"; 
// Android emulator -> 10.0.2.2 hits your host machine
// If testing on physical device, use your PC's LAN IP like: http://192.168.1.23:8000

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export async function request<T>(
  path: string,
  options: {
    method?: HttpMethod;
    body?: any;
    headers?: Record<string, string>;
    query?: Record<string, string | number | boolean | undefined | null>;
    timeoutMs?: number;
  } = {}
): Promise<T> {
  const {
    method = "GET",
    body,
    headers = {},
    query,
    timeoutMs = 15000,
  } = options;

  const url = new URL(`${BASE_URL}${path}`);

  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      url.searchParams.set(k, String(v));
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url.toString(), {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    // Try to parse JSON even for errors
    const text = await res.text();
    const data = text ? safeJsonParse(text) : null;

    if (!res.ok) {
      const message =
        (data && (data.detail || data.message)) ||
        `Request failed (${res.status})`;
      throw new Error(message);
    }

    return (data as T) ?? (null as unknown as T);
  } finally {
    clearTimeout(timeout);
  }
}

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

/* =========================
   Types (matching your models)
   ========================= */

export type User = {
  id?: number;
  display_name: string;
  created_at?: string;
};

export type Baseline = {
  id?: number;
  user_id: number;
  tremor_1to5: number;
  sleep_hours: number;
  sleep_minutes: number;
  mood_1to5: number;
  med_last_taken_minutes_ago: number;
};

export type MetricsEvent = {
  id?: number;
  user_id: number;
  ts: string; // ISO datetime
  hr_bpm: number;
  hrv_rmssd_ms: number;
  steps_last_5m: number;
  sleep_last_night_min: number;
  tremor_index: number;
};

export type ActivityLog = {
  id?: number;
  user_id: number;
  activity_id: string;
  duration_sec: number;
  helped: boolean;
  tremor_after_1to5: number;
  mood_after_1to5: number;
  created_at?: string;
};

export type BanditStat = {
  id?: number;
  user_id: number;
  activity_id: string;
  n?: number;
  success_n?: number;
};

export type PredictionLog = {
  id?: number;
  user_id: number;
  session_id: string;
  predicted_activity: string;
  activity_id: number; // 0,1,2,3,4,6
  confidence: number;
  fog_severity: number;
  movement_mag: number;
  time_of_day: number;
  caregiver_alerted?: boolean;
  created_at?: string;
};

export type ConversationMessage = {
  id?: number;
  user_id: number;
  session_id: string;
  role: "system" | "user" | "assistant";
  content: string;
  source?: "text" | "voice";
  created_at?: string;
};