import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS } from "@/constants/colors";

// ── Settings Group ────────────────────────────────────────────────────────────
interface SettingsGroupProps {
  title: string;
  children: React.ReactNode;
}
export const SettingsGroup = ({ title, children }: SettingsGroupProps) => (
  <View style={styles.group}>
    <Text style={styles.groupTitle}>{title}</Text>
    <View style={styles.groupCard}>{children}</View>
  </View>
);

// ── Settings Row ──────────────────────────────────────────────────────────────
interface SettingsRowProps {
  icon: string;
  label: string;
  value?: string;
  action?: string;
  onPress?: () => void;
}
export const SettingsRow = ({ icon, label, value, action, onPress }: SettingsRowProps) => (
  <View style={styles.row}>
    <Text style={styles.rowIcon}>{icon}</Text>
    <View style={styles.rowInfo}>
      <Text style={styles.rowLabel}>{label}</Text>
      {value && <Text style={styles.rowValue}>{value}</Text>}
    </View>
    {action && (
      <TouchableOpacity onPress={onPress} style={styles.actionBtn}>
        <Text style={styles.actionBtnText}>{action}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ── Settings Toggle ───────────────────────────────────────────────────────────
interface SettingsToggleProps {
  icon: string;
  label: string;
  value: boolean;
  onToggle: () => void;
}
export const SettingsToggle = ({ icon, label, value, onToggle }: SettingsToggleProps) => (
  <View style={styles.row}>
    <Text style={styles.rowIcon}>{icon}</Text>
    <Text style={[styles.rowLabel, { flex: 1 }]}>{label}</Text>
    <TouchableOpacity
      onPress={onToggle}
      style={[styles.toggle, value && styles.toggleOn]}
      activeOpacity={0.8}
    >
      <View style={[styles.toggleThumb, value && styles.toggleThumbOn]} />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  group: { marginBottom: 4 },
  groupTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textMuted,
    letterSpacing: 1.2,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  groupCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 20,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  rowIcon: { fontSize: 18, marginRight: 14 },
  rowInfo: { flex: 1 },
  rowLabel: { fontSize: 14, fontWeight: "600", color: COLORS.textPrimary },
  rowValue: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: COLORS.orangeGlow,
    borderWidth: 1,
    borderColor: COLORS.orange + "44",
  },
  actionBtnText: { fontSize: 11, fontWeight: "700", color: COLORS.orange },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 99,
    backgroundColor: COLORS.cardBorder,
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  toggleOn: { backgroundColor: COLORS.orange },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 99,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  toggleThumbOn: { alignSelf: "flex-end" },
});
