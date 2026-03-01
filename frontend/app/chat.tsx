import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { COLORS } from "@/constants/colors";
import { AppStatusBar } from "@/components/ui/UIComponents";
import { Message } from "@/constants/types";

const INITIAL_MESSAGES: Message[] = [
  { role: "agent", text: "How did marching feel? Tremor better? 😊", time: "9:45 AM" },
  { role: "user", text: "Tremor worse after lunch", time: "12:32 PM" },
  {
    role: "agent",
    text: "Sorry to hear. Try rest 10min + med check. Track now?",
    time: "12:32 PM",
    hasAction: true,
  },
  { role: "user", text: "Why gait now?", time: "2:10 PM" },
  {
    role: "agent",
    text: "Your tremor peaks at 10AM. Gait training reduces it 25% based on your data. 📊",
    time: "2:10 PM",
  },
];

const QUICK_REPLIES = ["Tremor?", "Next?", "Explain?", "Call caregiver", "Sleep bad", "Why gait?"];

const AGENT_RESPONSES: Record<string, string> = {
  "Tremor?": "Current tremor level: HIGH. Elevated for the past 2 hours. Try seated breathing now?",
  "Next?": "Next activity is Stretching at 10AM. Should reduce tremor by ~20% based on your data.",
  "Explain?": "I use your wearable data + activity history to find patterns. Gait training reduces YOUR tremor by 24% on average.",
  "Call caregiver": "Calling Sarah (caregiver)... 📞",
  "Sleep bad": "Prioritizing breathing exercises today since sleep affects tremor. Take melatonin tonight? 💊",
  "Why gait?": "Your tremor peaks at 10AM. Gait training reduces it 25% based on your data. 📊",
};

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [voiceMode, setVoiceMode] = useState(true);
  const [recording, setRecording] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const send = (text: string) => {
    if (!text.trim()) return;
    const agentText = AGENT_RESPONSES[text] ?? `Thanks for sharing. Updating your plan based on: "${text}" 🤔`;
    setMessages((m) => [
      ...m,
      { role: "user", text, time: "Now" },
      { role: "agent", text: agentText, time: "Now" },
    ]);
    setInput("");
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <AppStatusBar />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Neuro Assistant</Text>
          <Text style={styles.headerStatus}>● Online • Context-aware</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((m, i) => (
          <View
            key={i}
            style={[styles.msgWrapper, m.role === "user" && styles.msgWrapperUser]}
          >
            {m.role === "agent" && (
              <View style={styles.avatar}>
                <Text style={styles.avatarEmoji}>🧠</Text>
              </View>
            )}
            <View style={[styles.bubble, m.role === "user" ? styles.bubbleUser : styles.bubbleAgent]}>
              <Text style={[styles.bubbleText, m.role === "user" && styles.bubbleTextUser]}>
                {m.text}
              </Text>
              {m.hasAction && (
                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.yesBtn}>
                    <Text style={styles.yesBtnText}>YES</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.noBtn}>
                    <Text style={styles.noBtnText}>NO</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            <Text style={styles.msgTime}>{m.time}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Quick Replies */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickReplies}
        style={styles.quickRepliesScroll}
      >
        {QUICK_REPLIES.map((r) => (
          <TouchableOpacity key={r} onPress={() => send(r)} style={styles.quickReply}>
            <Text style={styles.quickReplyText}>{r}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Input Bar */}
      <View style={styles.inputBar}>
        <TouchableOpacity
          onPress={() => setVoiceMode(!voiceMode)}
          style={[styles.modeBtn, voiceMode && styles.modeBtnActive]}
        >
          <Text style={styles.modeBtnIcon}>{voiceMode ? "🎙" : "⌨"}</Text>
        </TouchableOpacity>

        {voiceMode ? (
          <Pressable
            onPressIn={() => setRecording(true)}
            onPressOut={() => { setRecording(false); send("Voice message sent"); }}
            style={[styles.voiceBtn, recording && styles.voiceBtnActive]}
          >
            <Text style={[styles.voiceBtnText, recording && { color: COLORS.orange }]}>
              {recording ? "🔴 Listening... release to send" : "Hold to speak"}
            </Text>
          </Pressable>
        ) : (
          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => send(input)}
            placeholder="Type a message..."
            placeholderTextColor={COLORS.textMuted}
            style={styles.textInput}
            returnKeyType="send"
          />
        )}

        <TouchableOpacity onPress={() => send(input)} style={styles.sendBtn}>
          <Text style={styles.sendBtnText}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 20, paddingBottom: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder,
    alignItems: "center", justifyContent: "center",
  },
  backIcon: { fontSize: 18, color: COLORS.textSecondary },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 16, fontWeight: "800", color: COLORS.textPrimary },
  headerStatus: { fontSize: 11, color: COLORS.green },

  messages: { flex: 1 },
  msgWrapper: { marginBottom: 14 },
  msgWrapperUser: { alignItems: "flex-end" },
  avatar: {
    width: 28, height: 28, borderRadius: 99,
    backgroundColor: COLORS.orange,
    alignItems: "center", justifyContent: "center",
    marginBottom: 4,
  },
  avatarEmoji: { fontSize: 14 },
  bubble: {
    maxWidth: "82%", borderRadius: 18, padding: 14,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder,
    borderTopLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: COLORS.orange,
    borderWidth: 0,
    borderRadius: 18, borderTopRightRadius: 4,
  },
   bubbleAgent: {
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder,
    borderTopLeftRadius: 4,
  },
  bubbleText: { fontSize: 14, color: COLORS.textPrimary, lineHeight: 20 },
  bubbleTextUser: { color: "#fff" },
  msgTime: { fontSize: 10, color: COLORS.textMuted, marginTop: 4 },

  actionRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  yesBtn: {
    flex: 1, height: 34, borderRadius: 10,
    backgroundColor: COLORS.green + "22", borderWidth: 1, borderColor: COLORS.green + "55",
    alignItems: "center", justifyContent: "center",
  },
  yesBtnText: { fontSize: 12, fontWeight: "700", color: COLORS.green },
  noBtn: {
    flex: 1, height: 34, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    alignItems: "center", justifyContent: "center",
  },
  noBtnText: { fontSize: 12, fontWeight: "700", color: COLORS.textMuted },

  quickRepliesScroll: { maxHeight: 50 },
  quickReplies: { paddingHorizontal: 16, gap: 8, alignItems: "center" },
  quickReply: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  quickReplyText: { fontSize: 12, fontWeight: "600", color: COLORS.textSecondary },

  inputBar: {
    flexDirection: "row", gap: 10, alignItems: "center",
    padding: 12, paddingHorizontal: 16, paddingBottom: 32,
  },
  modeBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder,
    alignItems: "center", justifyContent: "center",
  },
  modeBtnActive: { backgroundColor: COLORS.orangeGlow, borderColor: COLORS.orange },
  modeBtnIcon: { fontSize: 18 },
  voiceBtn: {
    flex: 1, height: 44, borderRadius: 14,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder,
    alignItems: "center", justifyContent: "center",
  },
  voiceBtnActive: { backgroundColor: COLORS.orangeGlow, borderColor: COLORS.orange },
  voiceBtnText: { fontSize: 13, fontWeight: "700", color: COLORS.textMuted },
  textInput: {
    flex: 1, height: 44, borderRadius: 14,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder,
    color: COLORS.textPrimary, fontSize: 14, paddingHorizontal: 16,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: COLORS.orange,
    alignItems: "center", justifyContent: "center",
  },
  sendBtnText: { fontSize: 18, color: "#fff", fontWeight: "700" },
});
