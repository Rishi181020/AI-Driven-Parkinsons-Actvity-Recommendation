import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from "react-native";
import { router } from "expo-router";
import Svg, { Circle } from "react-native-svg";
import { COLORS } from "@/constants/colors";
import { useTimer } from "@/hooks/useTimer";

type Phase = "detail" | "timer" | "feedback";

const BENEFITS = [
  { icon: "✅", text: "Reduces bradykinesia", detail: "Improves movement initiation" },
  { icon: "✅", text: "24% tremor improvement", detail: "Based on your personal data" },
  { icon: "✅", text: "No equipment needed", detail: "Do it anywhere, anytime" },
];

export default function ActivityScreen() {
  const [phase, setPhase] = useState<Phase>("detail");
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [voiceActive, setVoiceActive] = useState(false);

  const { timer, running, start, pause, fmt } = useTimer(120);
  const pct = ((120 - timer) / 120) * 100;
  const circumference = 2 * Math.PI * 88;

  const handleStart = () => {
    setPhase("timer");
    start();
  };

  return (
    <View style={styles.container}>
      {/* Back header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Activity</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Detail Phase ── */}
      {phase === "detail" && (
        <View style={styles.content}>
          <View style={styles.heroSection}>
            <Text style={styles.heroEmoji}>🚶</Text>
            <Text style={styles.heroTitle}>Marching in Place</Text>
            <Text style={styles.heroMeta}>2 minutes • Low intensity</Text>
          </View>

          <View style={styles.benefitsCard}>
            <Text style={styles.benefitsTitle}>WHY THIS WORKS</Text>
            {BENEFITS.map((b, i) => (
              <View
                key={i}
                style={[styles.benefitRow, i < 2 && styles.benefitBorder]}
              >
                <Text style={styles.benefitIcon}>{b.icon}</Text>
                <View>
                  <Text style={styles.benefitText}>{b.text}</Text>
                  <Text style={styles.benefitDetail}>{b.detail}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={handleStart} style={styles.primaryBtn} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>▶ Start 2:00</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip this activity</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Timer Phase ── */}
      {phase === "timer" && (
        <View style={styles.timerContent}>
          <View style={styles.circleContainer}>
            <Svg width={200} height={200}>
              <Circle cx={100} cy={100} r={88} fill="none" stroke={COLORS.cardBorder} strokeWidth={8} />
              <Circle
                cx={100} cy={100} r={88} fill="none"
                stroke={COLORS.primary} strokeWidth={8}
                strokeDasharray={`${(circumference * pct) / 100} ${circumference}`}
                strokeLinecap="round"
                rotation={-90} origin="100, 100"
              />
            </Svg>
            <View style={styles.timerOverlay}>
              <Text style={styles.timerText}>{fmt(timer)}</Text>
              <Text style={styles.timerSub}>remaining</Text>
            </View>
          </View>

          <Text style={styles.timerActivity}>🚶 March in Place</Text>
          <Text style={styles.timerHint}>Lift knees to hip height, swing arms naturally</Text>

          <TouchableOpacity
            onPress={() => {
              running ? pause() : start();
              if (timer === 0) setPhase("feedback");
            }}
            style={[styles.pauseBtn, running && styles.pauseBtnActive]}
            activeOpacity={0.85}
          >
            <Text style={[styles.pauseBtnText, running && { color: COLORS.textPrimary }]}>
              {timer === 0 ? "✓ Done!" : running ? "⏸ Pause" : "▶ Resume"}
            </Text>
          </TouchableOpacity>

          {timer === 0 && (
            <TouchableOpacity onPress={() => setPhase("feedback")} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Continue to feedback →</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── Feedback Phase ── */}
      {phase === "feedback" && (
        <View style={styles.content}>
          <View style={styles.feedbackHero}>
            <Text style={styles.feedbackEmoji}>🎉</Text>
            <Text style={styles.feedbackTitle}>Activity Complete!</Text>
            <Text style={styles.feedbackSub}>How did it feel?</Text>
          </View>

          <View style={styles.feedbackRow}>
            <TouchableOpacity
              onPress={() => setFeedback("up")}
              style={[styles.feedbackBtn, feedback === "up" && styles.feedbackBtnUp]}
            >
              <Text style={styles.feedbackBtnEmoji}>👍</Text>
              <Text style={[styles.feedbackBtnLabel, feedback === "up" && { color: COLORS.success }]}>
                Helped
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setFeedback("down")}
              style={[styles.feedbackBtn, feedback === "down" && styles.feedbackBtnDown]}
            >
              <Text style={styles.feedbackBtnEmoji}>👎</Text>
              <Text style={[styles.feedbackBtnLabel, feedback === "down" && { color: COLORS.danger }]}>
                No change
              </Text>
            </TouchableOpacity>
          </View>

          <Pressable
            onPressIn={() => setVoiceActive(true)}
            onPressOut={() => setVoiceActive(false)}
            style={[styles.voiceBtn, voiceActive && styles.voiceBtnActive]}
          >
            <Text style={[styles.voiceBtnText, voiceActive && { color: COLORS.primary }]}>
              {voiceActive ? "🔴 Recording... release to stop" : "🎙 Voice note: Tremor? Mood? (1-5)"}
            </Text>
          </Pressable>

          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={() => router.replace("/")} style={styles.primaryBtn} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>Next Recommendation →</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 20, paddingBottom: 16,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder,
    alignItems: "center", justifyContent: "center",
  },
  backIcon: { fontSize: 18, color: COLORS.textSecondary },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "700", color: COLORS.textPrimary },

  content: { flex: 1, paddingHorizontal: 24, paddingBottom: 32, gap: 16 },

  heroSection: { alignItems: "center", paddingTop: 12 },
  heroEmoji: { fontSize: 64 },
  heroTitle: { fontSize: 26, fontWeight: "800", color: COLORS.textPrimary, marginTop: 8 },
  heroMeta: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },

  benefitsCard: {
    backgroundColor: COLORS.card, borderWidth: 1,
    borderColor: COLORS.cardBorder, borderRadius: 20, padding: 20,
  },
  benefitsTitle: {
    fontSize: 13, fontWeight: "700", color: COLORS.textMuted,
    letterSpacing: 0.5, marginBottom: 12,
  },
  benefitRow: { flexDirection: "row", gap: 12, paddingVertical: 10, alignItems: "center" },
  benefitBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder },
  benefitIcon: { fontSize: 16 },
  benefitText: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
  benefitDetail: { fontSize: 12, color: COLORS.textMuted },

  primaryBtn: {
    height: 60, borderRadius: 20, backgroundColor: COLORS.primary,
    alignItems: "center", justifyContent: "center",
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4, shadowRadius: 20, elevation: 8,
  },
  primaryBtnText: { fontSize: 18, fontWeight: "800", color: "#fff" },
  skipBtn: { height: 44, alignItems: "center", justifyContent: "center" },
  skipText: { fontSize: 14, color: COLORS.textMuted },

  timerContent: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 32, gap: 20,
  },
  circleContainer: { width: 200, height: 200, position: "relative" },
  timerOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center", justifyContent: "center",
  },
  timerText: { fontSize: 48, fontWeight: "900", color: COLORS.textPrimary, letterSpacing: -2 },
  timerSub: { fontSize: 13, color: COLORS.textMuted },
  timerActivity: { fontSize: 18, fontWeight: "700", color: COLORS.textPrimary },
  timerHint: { fontSize: 14, color: COLORS.textSecondary, textAlign: "center" },
  pauseBtn: {
    width: 160, height: 56, borderRadius: 18,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder,
    alignItems: "center", justifyContent: "center",
  },
  pauseBtnActive: { backgroundColor: COLORS.primary },
  pauseBtnText: { fontSize: 16, fontWeight: "700", color: COLORS.textMuted },

  feedbackHero: { alignItems: "center", paddingTop: 20, gap: 8 },
  feedbackEmoji: { fontSize: 48 },
  feedbackTitle: { fontSize: 24, fontWeight: "800", color: COLORS.textPrimary },
  feedbackSub: { fontSize: 14, color: COLORS.textSecondary },
  feedbackRow: { flexDirection: "row", gap: 16 },
  feedbackBtn: {
    flex: 1, height: 90, borderRadius: 20,
    backgroundColor: COLORS.card, borderWidth: 2, borderColor: COLORS.cardBorder,
    alignItems: "center", justifyContent: "center", gap: 6,
  },
  feedbackBtnUp: { backgroundColor: COLORS.success + "22", borderColor: COLORS.success },
  feedbackBtnDown: { backgroundColor: COLORS.danger + "22", borderColor: COLORS.danger },
  feedbackBtnEmoji: { fontSize: 36 },
  feedbackBtnLabel: { fontSize: 12, fontWeight: "700", color: COLORS.textMuted },
  voiceBtn: {
    height: 60, borderRadius: 18,
    backgroundColor: COLORS.card, borderWidth: 2, borderColor: COLORS.cardBorder,
    alignItems: "center", justifyContent: "center",
  },
  voiceBtnActive: { backgroundColor: COLORS.primaryGlow, borderColor: COLORS.primary },
  voiceBtnText: { fontSize: 15, fontWeight: "700", color: COLORS.textMuted },
});
