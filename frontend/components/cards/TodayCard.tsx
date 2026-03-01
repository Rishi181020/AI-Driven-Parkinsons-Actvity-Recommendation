import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS } from "@/constants/colors";
import { router } from "expo-router";
import { getInferResult } from "@/storage/useInfer";
import AsyncStorage from "@react-native-async-storage/async-storage";

type InferResult = {
  pred_label?: string;
  pred_index?: number;
  probs?: number[];
};

interface Props {
  refreshKey?: number;
}

export const TodayCard = ({ refreshKey }: Props) => {
  const [inferResult, setInferResult] = React.useState<InferResult | null>(null);

  React.useEffect(() => {
    (async () => {
      const r = await getInferResult();
      setInferResult(r);
    })();
  }, [refreshKey]);

  React.useEffect(() => {
    (async () => {
      const r = await getInferResult();
      setInferResult(r);
      return r
    })();
  }, []);
  const label = inferResult?.pred_label ?? "No plan yet";
  const confidence =
    inferResult?.probs && typeof inferResult?.pred_index === "number"
      ? Math.round((inferResult.probs[inferResult.pred_index] ?? 0) * 100)
      : null;

  return (
    <View style={styles.card}>
      <Text style={styles.tag}>📅 TODAY'S PLAN</Text>

      <Text style={styles.subtitle}>
        {inferResult?.pred_label
          ? `Recommended activity${confidence !== null ? ` • ${confidence}% confidence` : ""}`
          : "Run onboarding to generate your plan"}
      </Text>

      <TouchableOpacity
        onPress={() => {
          router.push({
            pathname: "/activity",
            params: {
              rec: JSON.stringify(inferResult),
            },
          })
        }

        }
        style={styles.row}
        activeOpacity={0.7}
        disabled={!inferResult?.pred_label}
      >
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: COLORS.primary + "22",
              borderColor: COLORS.primary + "44",
            },
          ]}
        >
          <Text style={styles.activityIcon}>🎯</Text>
        </View>

        <View style={styles.rowInfo}>
          <Text style={styles.activityName}>{label}</Text>
          <Text style={styles.activityTime}>
            {inferResult?.pred_label ? "Start now" : "Complete onboarding"}
          </Text>
        </View>

        <Text style={[styles.playBtn, { color: COLORS.primary }]}>▶</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.explainBtn} activeOpacity={0.7} disabled={!inferResult?.pred_label} onPress={async () => {
        await AsyncStorage.setItem("pending_message", "Explain why you recommended this activity for me");
        router.push("/chat");
      }}>
        <Text style={styles.explainText}>🎙 Explain why?</Text>
      </TouchableOpacity>
    </View >
  );
};

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