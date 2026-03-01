export type TremorLevel = "LOW" | "MEDIUM" | "HIGH";

export type Screen = "onboarding" | "home" | "activity" | "chat" | "settings";

export interface Message {
  role: "user" | "agent";
  text: string;
  time: string;
  hasAction?: boolean;
}

export interface Activity {
  time: string;
  name: string;
  icon: string;
  color: string;
}
