import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS } from "@/constants/colors";
import { Activity } from "@/constants/types";
import { router } from "expo-router";

const activities: Activity[] = [
  { time: "8:00 AM", name: "Gait Training", icon: "🚶", color: COLORS.secondary },
  { time: "10:00 AM", name: "Stretching", icon: "🧘", color: COLORS.success },
  { time: "12:00 PM", name: "Breathing", icon: "💨", color: COLORS.warning },
];

export const TodayCard = () => (
  <View style={styles.card}>
    <Text style={styles.tag}>📅 TODAY'S PLAN</Text>
    <Text style={styles.subtitle}>
      Morning tremor detected → 3 activities to start strong
    </Text>
    {activities.map((a, i) => (
      <TouchableOpacity
        key={i}
        onPress={() => router.push("/activity")}
        style={[styles.row, i < 2 && styles.rowBorder]}
        activeOpacity={0.7}
      >
        <View style={[styles.iconBox, { backgroundColor: a.color + "22", borderColor: a.color + "44" }]}>
          <Text style={styles.activityIcon}>{a.icon}</Text>
        </View>
        <View style={styles.rowInfo}>
          <Text style={styles.activityName}>{a.name}</Text>
          <Text style={styles.activityTime}>{a.time}</Text>
        </View>
        <Text style={[styles.playBtn, { color: a.color }]}>▶</Text>
      </TouchableOpacity>
    ))}
    <TouchableOpacity style={styles.explainBtn} activeOpacity={0.7}>
      <Text style={styles.explainText}>🎙 Explain why?</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 24,
    padding: 20,
  },
  tag: { fontSize: 11, color: COLORS.primary, fontWeight: "700", letterSpacing: 1, marginBottom: 6 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 16, lineHeight: 20 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  activityIcon: { fontSize: 18 },
  rowInfo: { flex: 1 },
  activityName: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary },
  activityTime: { fontSize: 12, color: COLORS.textMuted },
  playBtn: { fontSize: 18 },
  explainBtn: {
    marginTop: 14,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.primaryGlow,
    borderWidth: 1,
    borderColor: COLORS.primary + "44",
    alignItems: "center",
    justifyContent: "center",
  },
  explainText: { fontSize: 12, fontWeight: "700", color: COLORS.primary },
});
