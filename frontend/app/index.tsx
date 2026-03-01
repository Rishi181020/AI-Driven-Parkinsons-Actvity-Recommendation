import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  PanResponder,
} from "react-native";
import { router } from "expo-router";
import { COLORS } from "@/constants/colors";
import { MetricChip, TremorBar, PermCard, QuickAction } from "@/components/ui/UIComponents";
import { TodayCard } from "@/components/cards/TodayCard";
import { CurrentRecCard } from "@/components/cards/CurrentRecCard";
import { TrendCard } from "@/components/cards/TrendCard";

const CARD_LABELS = ["TODAY", "NOW", "TREND"];

export default function HomeScreen() {
  const [cardIdx, setCardIdx] = useState(0);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10,
    onPanResponderRelease: (_, g) => {
      if (g.dx < -40) setCardIdx((i) => Math.min(i + 1, 2));
      if (g.dx > 40) setCardIdx((i) => Math.max(i - 1, 0));
    },
  });

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning,</Text>
          <Text style={styles.name}>
            Michael <Text style={{ color: COLORS.primary }}>👋</Text>
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/settings")}
          style={styles.menuBtn}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Live Metrics */}
        <View style={styles.metrics}>
          <TremorBar level="HIGH" />
          <MetricChip icon="👟" label="Steps" value="2.1k" color={COLORS.secondary} />
          <MetricChip icon="😴" label="Sleep" value="6h2m" color={COLORS.textSecondary} />
        </View>

        {/* Card Tab Switcher */}
        <View style={styles.tabRow}>
          {CARD_LABELS.map((l, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setCardIdx(i)}
              style={[styles.tab, cardIdx === i && styles.tabActive]}
            >
              <Text style={[styles.tabText, cardIdx === i && styles.tabTextActive]}>
                {l}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Swipeable Card */}
        <View style={styles.cardContainer} {...panResponder.panHandlers}>
          {cardIdx === 0 && <TodayCard />}
          {cardIdx === 1 && <CurrentRecCard />}
          {cardIdx === 2 && <TrendCard />}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <QuickAction icon="💊" label="Log Meds" />
          <QuickAction icon="📝" label="Track" />
          <QuickAction icon="👥" label="Caregiver" />
          <QuickAction icon="📈" label="History" />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Chat Bubble */}
      <View style={styles.chatBubbleWrapper}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>3</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/chat")}
          style={styles.chatBubble}
          activeOpacity={0.85}
        >
          <Text style={styles.chatBubbleIcon}>👋</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 12,
    paddingTop: 38
  },
  greeting: { fontSize: 13, color: COLORS.textMuted },
  name: { fontSize: 22, fontWeight: "800", color: COLORS.textPrimary },
  menuBtn: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: COLORS.card, borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: "center", justifyContent: "center",
  },
  menuIcon: { fontSize: 18, color: COLORS.textSecondary },

  metrics: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 16,
  },

  tabRow: { flexDirection: "row", gap: 8, paddingHorizontal: 20, marginBottom: 12 },
  tab: {
    flex: 1, height: 30, borderRadius: 10,
    backgroundColor: COLORS.card,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    alignItems: "center", justifyContent: "center",
  },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5, color: COLORS.textMuted },
  tabTextActive: { color: "#fff" },

  cardContainer: { paddingHorizontal: 20, marginBottom: 16 },

  quickActions: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
  },

  chatBubbleWrapper: { position: "absolute", bottom: 80, right: 24 },
  chatBubble: {
    width: 60, height: 60, borderRadius: 99,
    backgroundColor: COLORS.primary,
    alignItems: "center", justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  chatBubbleIcon: { fontSize: 22 },
  badge: {
    position: "absolute", top: -8, right: -4, zIndex: 1,
    width: 18, height: 18, borderRadius: 99,
    backgroundColor: COLORS.danger,
    alignItems: "center", justifyContent: "center",
  },
  badgeText: { fontSize: 11, fontWeight: "800", color: "#fff" },
});
