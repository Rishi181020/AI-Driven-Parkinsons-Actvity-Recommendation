import { User } from "./clientSkeleton";
import { Baseline } from "./clientSkeleton";
import { MetricsEvent } from "./clientSkeleton";
import { ActivityLog } from "./clientSkeleton";
import { BanditStat } from "./clientSkeleton";
import { PredictionLog } from "./clientSkeleton";
import { ConversationMessage } from "./clientSkeleton";
import { request } from "./clientSkeleton";

/* =========================
   API functions
   (Assumes REST endpoints like /users, /baselines, etc.)
   Adjust paths to match your FastAPI routes.
   ========================= */

   export const api = {
    // -------- Users --------
    createUser: (payload: Omit<User, "id" | "created_at">) =>
      request<User>("/users", { method: "POST", body: payload }),
  
    getUser: (userId: number) => request<User>(`/users/${userId}`),
  
    listUsers: () => request<User[]>("/users"),
  
    // -------- Baseline --------
    upsertBaseline: (payload: Omit<Baseline, "id">) =>
      request<Baseline>("/baseline", { method: "POST", body: payload }),
    // If you prefer per-user: /users/:id/baseline
  
    getBaselineByUser: (userId: number) =>
      request<Baseline>(`/baseline/${userId}`),
  
    // -------- Metrics Events --------
    postMetricsEvent: (payload: Omit<MetricsEvent, "id">) =>
      request<MetricsEvent>("/metrics", { method: "POST", body: payload }),
  
    listMetricsEvents: (userId: number, limit = 200) =>
      request<MetricsEvent[]>("/metrics", {
        query: { user_id: userId, limit },
      }),
  
    // -------- Activity Logs --------
    postActivityLog: (payload: Omit<ActivityLog, "id" | "created_at">) =>
      request<ActivityLog>("/activity_logs", { method: "POST", body: payload }),
  
    listActivityLogs: (userId: number, limit = 200) =>
      request<ActivityLog[]>("/activity_logs", {
        query: { user_id: userId, limit },
      }),
  
    // -------- Bandit Stats --------
    getBanditStats: (userId: number) =>
      request<BanditStat[]>("/bandit_stats", { query: { user_id: userId } }),
  
    // optional: update stat (if your backend exposes it)
    updateBanditStat: (id: number, patch: Partial<BanditStat>) =>
      request<BanditStat>(`/bandit_stats/${id}`, { method: "PATCH", body: patch }),
  
    // -------- Predictions --------
    // If your backend returns a prediction + logs it, you might call /predict
    predictNextActivity: (payload: {
      user_id: number;
      session_id: string;
      // include whatever your model endpoint expects, e.g. latest metrics window
    }) =>
      request<PredictionLog>("/predict", { method: "POST", body: payload }),
  
    listPredictions: (userId: number, limit = 100) =>
      request<PredictionLog[]>("/predictions", {
        query: { user_id: userId, limit },
      }),
  
    // -------- Conversation Messages --------
    addMessage: (payload: Omit<ConversationMessage, "id" | "created_at">) =>
      request<ConversationMessage>("/messages", { method: "POST", body: payload }),
  
    listMessages: (userId: number, sessionId: string) =>
      request<ConversationMessage[]>("/messages", {
        query: { user_id: userId, session_id: sessionId },
      }),
  
    // Helper: send user message + get assistant response (if you have /chat)
    chat: (payload: {
      user_id: number;
      session_id: string;
      content: string;
      source?: "text" | "voice";
    }) =>
      request<{
        assistant_message: ConversationMessage;
        prediction?: PredictionLog; // if your backend also returns a model suggestion
      }>("/chat", { method: "POST", body: payload }),
  };