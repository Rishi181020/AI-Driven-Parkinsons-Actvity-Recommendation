import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "@/constants/colors";

const weekData = [40, 55, 45, 60, 42, 35, 30];
const days = ["M", "T", "W", "T", "F", "S", "S"];
const MAX = 70;

export const TrendCard = () => (
  <View style={styles.card}>
    <Text style={styles.tag}>📈 WEEKLY TREND</Text>
    <Text style={styles.subtitle}>
      This week:{" "}
      <Text style={styles.highlight}>24% less tremor</Text> after gait practice 👍
    </Text>

    <View style={styles.chartContainer}>
      {weekData.map((v, i) => (
        <View key={i} style={styles.barWrapper}>
          <View
            style={[
              styles.bar,
              {
                height: (v / MAX) * 72,
                backgroundColor: i === 6 ? COLORS.success : COLORS.success + "55",
              },
            ]}
          />
          <Text style={styles.dayLabel}>{days[i]}</Text>
        </View>
      ))}
    </View>

    <View style={styles.summaryBox}>
      <Text style={styles.summaryText}>
        📉 Tremor severity score down from 3.8 → 2.9 this week
      </Text>
    </View>
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
  tag: { fontSize: 11, color: COLORS.success, fontWeight: "700", letterSpacing: 1, marginBottom: 6 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 16, lineHeight: 20 },
  highlight: { color: COLORS.success, fontWeight: "700" },
  chartContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    height: 88,
    marginBottom: 8,
  },
  barWrapper: { flex: 1, alignItems: "center", justifyContent: "flex-end", gap: 4 },
  bar: { width: "100%", borderRadius: 6 },
  dayLabel: { fontSize: 10, color: COLORS.textMuted },
  summaryBox: {
    backgroundColor: COLORS.success + "11",
    borderWidth: 1,
    borderColor: COLORS.success + "33",
    borderRadius: 12,
    padding: 12,
  },
  summaryText: { fontSize: 13, color: COLORS.success, fontWeight: "600" },
});
