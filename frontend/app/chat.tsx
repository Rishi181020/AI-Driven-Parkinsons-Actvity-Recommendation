import React, { useState, useRef, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  Keyboard,
  KeyboardEvent,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";
import { Message } from "@/constants/types";
import { createChat } from "@/api/chat";
import { getInferResult } from "@/storage/useInfer";

const INITIAL_MESSAGES: Message[] = [];

export default function ChatScreen() {

  const [chatHistory, setChatHistory] = useState<{ role: string, content: string }[]>([]);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [voiceMode, setVoiceMode] = useState(true);
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  // Track keyboard height directly

  const clearChat = async () => {
    await AsyncStorage.removeItem("chat_messages");
    await AsyncStorage.removeItem("chat_history");
    setMessages([]);
    setChatHistory([]);
  };

  useEffect(() => {
    const load = async () => {
      const savedMessages = await AsyncStorage.getItem("chat_messages");
      const savedHistory = await AsyncStorage.getItem("chat_history");
      if (savedMessages) setMessages(JSON.parse(savedMessages));
      if (savedHistory) setChatHistory(JSON.parse(savedHistory));
      const pending = await AsyncStorage.getItem("pending_message");
      if (pending) {
        await AsyncStorage.removeItem("pending_message");
        send(pending); // auto sends on open
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;
    AsyncStorage.setItem("chat_messages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (chatHistory.length === 0) return;
    AsyncStorage.setItem("chat_history", JSON.stringify(chatHistory));
  }, [chatHistory]);


  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e: KeyboardEvent) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardHeight(0)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Scroll to bottom when keyboard opens or messages change
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [keyboardHeight, messages]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;

    const inferResult = await getInferResult();

    setMessages((m) => [...m, { role: "user", text, time: "Now" }]);
    setInput("");
    setLoading(true);

    try {
      const historyText = chatHistory
        .map(h => `${h.role}: ${h.content}`)
        .join("\n");

      const res = await createChat(text +
        " Chat History: " + historyText +
        " Inference Recommended: " + (inferResult?.pred_label ?? ""));

      // update history with both user + agent messages
      setChatHistory((h) => [
        ...h,
        { role: "user", content: text },
        { role: "assistant", content: res.content },
      ]);

      setMessages((m) => [
        ...m,
        { role: "agent", text: res.content, time: "Now" },
      ]);

    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "agent", text: "Sorry, couldn't reach the assistant. Try again.", time: "Now" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>HealinMotion Assistant</Text>
          <Text style={styles.headerStatus}>● Online • Context-aware</Text>
        </View>
        <TouchableOpacity onPress={clearChat} style={styles.clearBtn}>
          <Text style={styles.clearBtnText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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

        {/* Typing indicator */}
        {loading && (
          <View style={styles.msgWrapper}>
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>🧠</Text>
            </View>
            <View style={styles.bubbleAgent}>
              <Text style={{ color: COLORS.textMuted, fontSize: 14, padding: 14 }}>Thinking...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom section pushed up by keyboard height */}
      <View style={{ paddingBottom: keyboardHeight > 0 ? keyboardHeight - insets.bottom : insets.bottom }}>

        {/* Quick Replies */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickReplies}
          style={styles.quickRepliesScroll}
          keyboardShouldPersistTaps="handled"
        >
        </ScrollView>

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => send(input)}
            placeholder="Chat with assistant"
            placeholderTextColor={COLORS.textMuted}
            style={styles.textInput}
            returnKeyType="send"
          />
          <TouchableOpacity
            onPress={() => send(input)}
            style={[styles.sendBtn, loading && { opacity: 0.5 }]}
            disabled={loading}
          >
            <Text style={styles.sendBtnText}>{loading ? "..." : "↑"}</Text>
          </TouchableOpacity>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder,
    alignItems: "center", justifyContent: "center",
  },
  backIcon: { fontSize: 18, color: COLORS.textSecondary },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 16, fontWeight: "800", color: COLORS.textPrimary },
  headerStatus: { fontSize: 11, color: COLORS.success },

  messages: { flex: 1 },
  msgWrapper: { marginBottom: 14 },
  msgWrapperUser: { alignItems: "flex-end" },
  avatar: {
    width: 28, height: 28, borderRadius: 99,
    backgroundColor: COLORS.primary,
    alignItems: "center", justifyContent: "center",
    marginBottom: 4,
  },
  avatarEmoji: { fontSize: 14 },
  bubble: {
    maxWidth: "82%", borderRadius: 18, padding: 14,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder,
    borderTopLeftRadius: 4,
  },
  clearBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder,
    alignItems: "center", justifyContent: "center",
  },
  clearBtnText: { fontSize: 11, fontWeight: "700", color: COLORS.textMuted },
  bubbleUser: {
    backgroundColor: COLORS.primary,
    borderWidth: 0,
    borderRadius: 18, borderTopRightRadius: 4,
  },
  bubbleAgent: {
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder,
    borderTopLeftRadius: 4, borderRadius: 18, maxWidth: "82%",
  },
  bubbleText: { fontSize: 14, color: COLORS.textPrimary, lineHeight: 20 },
  bubbleTextUser: { color: "#fff" },
  msgTime: { fontSize: 10, color: COLORS.textMuted, marginTop: 4 },

  actionRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  yesBtn: {
    flex: 1, height: 34, borderRadius: 10,
    backgroundColor: COLORS.success + "22", borderWidth: 1, borderColor: COLORS.success + "55",
    alignItems: "center", justifyContent: "center",
  },
  yesBtnText: { fontSize: 12, fontWeight: "700", color: COLORS.success },
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
    padding: 12, paddingHorizontal: 16,
  },
  modeBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder,
    alignItems: "center", justifyContent: "center",
  },
  modeBtnActive: { backgroundColor: COLORS.primaryGlow, borderColor: COLORS.primary },
  modeBtnIcon: { fontSize: 18 },
  voiceBtn: {
    flex: 1, height: 44, borderRadius: 14,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder,
    alignItems: "center", justifyContent: "center",
  },
  voiceBtnActive: { backgroundColor: COLORS.primaryGlow, borderColor: COLORS.primary },
  voiceBtnText: { fontSize: 13, fontWeight: "700", color: COLORS.textMuted },
  textInput: {
    flex: 1, height: 44, borderRadius: 14,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder,
    color: COLORS.textPrimary, fontSize: 14, paddingHorizontal: 16,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center", justifyContent: "center",
  },
  sendBtnText: { fontSize: 18, color: "#fff", fontWeight: "700" },
});