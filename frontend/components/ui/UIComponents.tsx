import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, DimensionValue } from "react-native";
import { COLORS } from "@/constants/colors";
import { TremorLevel } from "@/constants/types";

// ── StatusBar ────────────────────────────────────────────────────────────────
export const AppStatusBar = () => (
  <View style={styles.statusBar}>
    <Text style={styles.statusTime}>9:41</Text>
    <Text style={styles.statusText}>●●● WiFi ⚡ 87%</Text>
  </View>
);

// ── Primary Button ────────────────────────────────────────────────────────────
interface BtnProps {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}
export const Btn = ({ label, onPress, secondary, disabled }: BtnProps) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    style={[styles.btn, secondary && styles.btnSecondary, disabled && styles.btnDisabled]}
    activeOpacity={0.8}
  >
    <Text style={[styles.btnText, (secondary || disabled) && styles.btnTextMuted]}>
      {label}
    </Text>
  </TouchableOpacity>
);

// ── Section Title ─────────────────────────────────────────────────────────────
interface SectionTitleProps {
  icon: string;
  title: string;
  sub?: string;
}
export const SectionTitle = ({ icon, title, sub }: SectionTitleProps) => (
  <View>
    <Text style={styles.sectionTitle}>{icon} {title}</Text>
    {sub && <Text style={styles.sectionSub}>{sub}</Text>}
  </View>
);

// ── MetricChip ────────────────────────────────────────────────────────────────
interface MetricChipProps {
  label: string;
  value: string;
  color: string;
  icon: string;
}
export const MetricChip = ({ label, value, color, icon }: MetricChipProps) => (
  <View style={styles.metricChip}>
    <Text style={styles.metricLabel}>{icon} {label}</Text>
    <Text style={[styles.metricValue, { color }]}>{value}</Text>
  </View>
);

// ── TremorBar ─────────────────────────────────────────────────────────────────
const tremorColors: Record<TremorLevel, string> = {
  LOW: COLORS.green,
  MEDIUM: COLORS.yellow,
  HIGH: COLORS.red,
};
const tremorWidths: Record<TremorLevel, DimensionValue> = {
  LOW: "30%",
  MEDIUM: "60%",
  HIGH: "90%",
};
export const TremorBar = ({ level }: { level: TremorLevel }) => (
  <View style={styles.tremorCard}>
    <Text style={styles.metricLabel}>〰 Tremor</Text>
    <View style={styles.tremorTrack}>
      <View style={[styles.tremorFill, { width: tremorWidths[level], backgroundColor: tremorColors[level] }]} />
    </View>
    <Text style={[styles.tremorLevel, { color: tremorColors[level] }]}>{level}</Text>
  </View>
);

// ── Permission Card ───────────────────────────────────────────────────────────
interface PermCardProps {
  icon: string;
  title: string;
  sub: string;
  granted: boolean;
  onGrant: () => void;
}
export const PermCard = ({ icon, title, sub, granted, onGrant }: PermCardProps) => (
  <View style={[styles.permCard, granted && styles.permCardGranted]}>
    <Text style={styles.permIcon}>{icon}</Text>
    <View style={styles.permInfo}>
      <Text style={styles.permTitle}>{title}</Text>
      <Text style={styles.permSub}>{sub}</Text>
    </View>
    <TouchableOpacity onPress={onGrant} style={[styles.permBtn, granted && styles.permBtnGranted]}>
      <Text style={[styles.permBtnText, granted && styles.permBtnTextGranted]}>
        {granted ? "✓ Done" : "Allow"}
      </Text>
    </TouchableOpacity>
  </View>
);

// ── Quick Action ──────────────────────────────────────────────────────────────
interface QuickActionProps {
  icon: string;
  label: string;
  onPress?: () => void;
}
export const QuickAction = ({ icon, label, onPress }: QuickActionProps) => (
  <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.7}>
    <Text style={styles.quickActionIcon}>{icon}</Text>
    <Text style={styles.quickActionLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  statusBar: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingHorizontal: 28,
    paddingTop: 48, paddingBottom: 8,
  },
  statusTime: { color: COLORS.textSecondary, fontSize: 12, fontWeight: "600" },
  statusText: { color: COLORS.textSecondary, fontSize: 12 },

  btn: {
    height: 56, borderRadius: 18, backgroundColor: COLORS.orange,
    alignItems: "center", justifyContent: "center",
  },
  btnSecondary: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder },
  btnDisabled: { backgroundColor: "#222" },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  btnTextMuted: { color: COLORS.textMuted },

  sectionTitle: { fontSize: 22, fontWeight: "800", color: COLORS.textPrimary },
  sectionSub: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },

  metricChip: {
    flex: 1, backgroundColor: COLORS.card, borderWidth: 1,
    borderColor: COLORS.cardBorder, borderRadius: 14, padding: 10,
  },
  metricLabel: { fontSize: 10, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 1 },
  metricValue: { fontSize: 18, fontWeight: "700", marginTop: 4 },

  tremorCard: {
    flex: 1.4, backgroundColor: COLORS.card, borderWidth: 1,
    borderColor: COLORS.cardBorder, borderRadius: 14, padding: 10,
  },
  tremorTrack: { height: 8, backgroundColor: "#222", borderRadius: 99, overflow: "hidden", marginTop: 6 },
  tremorFill: { height: "100%", borderRadius: 99 },
  tremorLevel: { fontSize: 13, fontWeight: "700", marginTop: 2 },

  permCard: {
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder,
    borderRadius: 18, padding: 16, flexDirection: "row", alignItems: "center", gap: 14,
  },
  permCardGranted: { borderColor: COLORS.green + "44" },
  permIcon: { fontSize: 28 },
  permInfo: { flex: 1 },
  permTitle: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary },
  permSub: { fontSize: 12, color: COLORS.textSecondary },
  permBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12,
    backgroundColor: COLORS.orangeGlow, borderWidth: 1, borderColor: COLORS.orange,
  },
  permBtnGranted: { backgroundColor: COLORS.green + "22", borderColor: COLORS.green },
  permBtnText: { fontSize: 12, fontWeight: "700", color: COLORS.orange },
  permBtnTextGranted: { color: COLORS.green },

  quickAction: {
    flex: 1, height: 60, borderRadius: 16, backgroundColor: COLORS.card,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    alignItems: "center", justifyContent: "center", gap: 4,
  },
  quickActionIcon: { fontSize: 20 },
  quickActionLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: "600" },
});