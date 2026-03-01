import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { router } from "expo-router";
import { COLORS } from "@/constants/colors";
import { SettingsGroup, SettingsRow, SettingsToggle } from "@/components/ui/settingsComponents";

export default function SettingsScreen() {
  const [toggles, setToggles] = useState({
    tremorAlerts: true,
    morningBriefing: true,
    medicationReminder: true,
  });

  const toggle = (key: keyof typeof toggles) =>
    setToggles((t) => ({ ...t, [key]: !t[key] }));

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <SettingsGroup title="DEVICES">
          <SettingsRow icon="⌚" label="Wearable Device" value="Apple Watch" action="Change" />
          <SettingsRow icon="📱" label="Phone Sync" value="Connected" />
        </SettingsGroup>

        <SettingsGroup title="NOTIFICATIONS">
          <SettingsToggle
            icon="⚡" label="High Tremor Alerts"
            value={toggles.tremorAlerts} onToggle={() => toggle("tremorAlerts")}
          />
          <SettingsToggle
            icon="🌅" label="Morning Briefing"
            value={toggles.morningBriefing} onToggle={() => toggle("morningBriefing")}
          />
          <SettingsToggle
            icon="💊" label="Medication Reminder"
            value={toggles.medicationReminder} onToggle={() => toggle("medicationReminder")}
          />
        </SettingsGroup>

        <SettingsGroup title="CAREGIVER">
          <SettingsRow icon="👥" label="Caregiver Name" value="Sarah Johnson" action="Edit" />
          <SettingsRow icon="📞" label="Phone Number" value="+1 (555) 0142" action="Edit" />
          <SettingsRow icon="🚨" label="Emergency Alerts" value="Enabled" action="Change" />
        </SettingsGroup>

        <SettingsGroup title="MEDICATIONS">
          <SettingsRow
            icon="💊" label="Levodopa"
            value="8:00 AM · 2:00 PM · 8:00 PM" action="Edit"
          />
          <TouchableOpacity style={styles.addMedBtn}>
            <Text style={styles.addMedText}>+ Add Medication</Text>
          </TouchableOpacity>
        </SettingsGroup>

        <SettingsGroup title="DATA & PRIVACY">
          <SettingsRow icon="📊" label="Export My Data" action="Export" />
          <SettingsRow icon="🔒" label="Data Sharing" value="Anonymized only" />
        </SettingsGroup>

        <Text style={styles.version}>CureMotion v1.0.0 • Built with ❤️ for Parkinson's care</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
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
  headerTitle: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "700", color: COLORS.textPrimary },
  content: { padding: 20, gap: 20 },
  addMedBtn: {
    height: 44, borderRadius: 14, margin: 10,
    backgroundColor: COLORS.primaryGlow,
    borderWidth: 1, borderColor: COLORS.primary + "44",
    alignItems: "center", justifyContent: "center",
  },
  addMedText: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
  version: { textAlign: "center", fontSize: 12, color: COLORS.textMuted, marginTop: 8 },
});
