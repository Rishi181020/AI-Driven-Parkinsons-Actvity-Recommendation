import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS } from "@/constants/colors";
import { useTimer } from "@/hooks/useTimer";
import { router } from "expo-router";

export const CurrentRecCard = () => {
  const { timer, running, finished, start, pause, fmt } = useTimer(120);

  return (
    <View style={styles.card}>
      <Text style={styles.tag}>⚡ CURRENT REC</Text>
      <Text style={styles.subtitle}>
        High tremor + sitting 45min →{" "}
        <Text style={styles.highlight}>March in place 2min NOW</Text>
      </Text>

      <Text style={[styles.timerText, finished && { color: COLORS.success }]}>
        {fmt(timer)}
      </Text>

      <TouchableOpacity
        onPress={running ? pause : start}
        style={[styles.startBtn, running && styles.startBtnPaused]}
        activeOpacity={0.85}
      >
        <Text style={[styles.startBtnText, running && { color: COLORS.success }]}>
          {finished ? "✓ Done!" : running ? "⏸ Pause" : "▶ START"}
        </Text>
      </TouchableOpacity>

      <View style={styles.row}>
        <TouchableOpacity style={styles.secondaryBtn}>
          <Text style={styles.secondaryBtnText}>Snooze 15m</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push("/activity")}
        >
          <Text style={styles.secondaryBtnText}>Why this?</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: COLORS.primary + "44",
    borderRadius: 24,
    padding: 20,
  },
  tag: { fontSize: 11, color: COLORS.primary, fontWeight: "700", letterSpacing: 1, marginBottom: 6 },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, lineHeight: 22, marginBottom: 16 },
  highlight: { color: COLORS.textPrimary, fontWeight: "700" },
  timerText: {
    fontSize: 52,
    fontWeight: "900",
    color: COLORS.primary,
    textAlign: "center",
    letterSpacing: -2,
    marginBottom: 16,
  },
  startBtn: {
    height: 56,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  startBtnPaused: {
    backgroundColor: COLORS.success + "33",
    borderWidth: 1.5,
    borderColor: COLORS.success,
  },
  startBtnText: { fontSize: 17, fontWeight: "800", color: "#fff" },
  row: { flexDirection: "row", gap: 10 },
  secondaryBtn: {
    flex: 1,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: { fontSize: 12, fontWeight: "700", color: COLORS.textMuted },
});
