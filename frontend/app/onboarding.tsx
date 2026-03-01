import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { COLORS } from "@/constants/colors";
import { Btn, PermCard, SectionTitle } from "@/components/ui/UIComponents";
import { createUser } from "@/api/user";
import { setUser } from "@/storage/user";
import { Audio } from "expo-av";
import { createInfer } from "@/api/infer";
import { setInferResult } from "@/storage/useInfer";

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);

  // NEW: user fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState(""); // optional, not sent yet if backend doesn't accept
  const [creatingUser, setCreatingUser] = useState(false);
  const [tremorScore, setTremorScore] = React.useState<number | null>(null);
  const [permGranted, setPermGranted] = useState(false);
  const [lastMed, setLastMed] = React.useState("");
  const [sleep, setSleep] = useState("");
  const [micGranted, setMicGranted] = useState(false);


  async function requestMicrophone() {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      const ok = status === "granted";
      setMicGranted(ok);
      if (!ok) Alert.alert("Microphone not enabled", "You can enable it later in Settings.");
    } catch (e) {
      Alert.alert("Error", "Could not request microphone permission.");
    }
  }



  const goNext = async () => {
    if (step === 0) {
      if (!name.trim()) return;

      try {
        setCreatingUser(true);
        const res = await createUser(name.trim(), email.trim() || undefined);
        console.log(name.trim())
        await setUser(res.user_id, name.trim());
        setStep(1);
      } catch (e: any) {
        Alert.alert("Could not create account", e?.message ?? "Try again");
      } finally {
        setCreatingUser(false);
      }
      return;
    }
    if (step === 2) {
      try {
        const result = await createInfer();
        await setInferResult(result);
        setStep(3);
      } catch (e) {
        console.log("ERROR:", e);
      }
      return;
    }
    // existing flow untouched
    if (step < 3) setStep(step + 1);
    else router.replace("/");
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Step 0 – Welcome + user fields */}
        {step === 0 && (
          <View style={styles.centered}>
            <View style={styles.logoBox}>
              <Text style={styles.logoEmoji}>🧠</Text>
            </View>

            <Text style={styles.welcomeTitle}>
              Hi, I'm <Text style={{ color: COLORS.primary }}>HealinMotion</Text>
            </Text>

            <Text style={styles.welcomeSub}>
              I'll help manage your Parkinson's with smart, personalized activity suggestions — learning what works best for you.
            </Text>

            {/* NEW: input card */}
            <View style={styles.userCard}>
              <Text style={styles.inputLabel}>Your name</Text>
              <TextInput
                placeholder="e.g., Your Name"
                placeholderTextColor={COLORS.textMuted}
                style={styles.inputField}
                value={name}
                onChangeText={setName}
              />

              <View style={{ height: 12 }} />

              <Text style={styles.inputLabel}>Email (optional)</Text>
              <TextInput
                placeholder="e.g., example@email.com"
                placeholderTextColor={COLORS.textMuted}
                style={styles.inputField}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <Btn
              label={creatingUser ? "Creating..." : "Let's get started →"}
              onPress={goNext}
              disabled={creatingUser || !name.trim()}
            />
          </View>
        )}

        {/* Step 1 – Permissions (unchanged) */}
        {step === 1 && (
          <View style={styles.step}>
            <SectionTitle icon="🔗" title="Connect your devices" sub="For the best recommendations" />
            <PermCard icon="⌚" title="Wearable Device" sub="Detects tremor & movement in real-time" granted={permGranted} onGrant={() => setPermGranted(true)} />
            <PermCard icon="🎙️" title="Microphone" sub="Voice-first interaction" granted={micGranted} onGrant={requestMicrophone} />
            <View style={{ flex: 1 }} />
            <Btn label={permGranted ? "Continue →" : "Skip for now"} onPress={goNext} secondary={!permGranted} />
          </View>
        )}

        {/* Step 2 – Baseline (only fix: trim() bug) */}
        {step === 2 && (
          <View style={styles.step}>
            <SectionTitle icon="📊" title="Quick baseline check" sub="Takes 30 seconds" />
            <View style={styles.quizCard}>
              <Text style={styles.quizQuestion}>How's your tremor today?</Text>
              <View style={styles.scoreRow}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <TouchableOpacity
                    key={n}
                    onPress={() => setTremorScore(n)}
                    style={[styles.scoreBtn, tremorScore === n && styles.scoreBtnActive]}
                  >
                    <Text style={[styles.scoreBtnText, tremorScore === n && { color: COLORS.primary }]}>
                      {n}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.scoreLabels}>
                <Text style={styles.scoreLabel}>None</Text>
                <Text style={styles.scoreLabel}>Severe</Text>
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={styles.smallInput}>
                <Text style={styles.inputLabel}>💊 Last med</Text>
                <TextInput
                  placeholder="9:00 AM"
                  placeholderTextColor={COLORS.textMuted}
                  value={lastMed}
                  onChangeText={setLastMed}
                  style={styles.inputField}
                />
              </View>
              <View style={styles.smallInput}>
                <Text style={styles.inputLabel}>😴 Sleep</Text>
                <TextInput
                  placeholder="7h 30m"
                  placeholderTextColor={COLORS.textMuted}
                  style={styles.inputField}
                  value={sleep}
                  onChangeText={setSleep}
                />
              </View>
            </View>

            <View style={{ flex: 1 }} />
            <Btn
              label="Build my plan →"
              onPress={goNext}
              disabled={!tremorScore || !lastMed.trim() || !sleep.trim()}
            />
          </View>
        )}

        {/* Step 3 – unchanged */}
        {step === 3 && (
          <View style={styles.step}>
            <View style={styles.centered}>
              <Text style={styles.doneEmoji}>✨</Text>
              <Text style={styles.doneTitle}>Your plan is ready!</Text>
              <Text style={styles.doneSub}>Based on your input, here's your first recommendation</Text>
            </View>

            <View style={styles.recCard}>
              <Text style={styles.recTag}>🎯 Start now</Text>
              <Text style={styles.recName}>Seated Arm Circles</Text>
              <Text style={styles.recMeta}>2 minutes • Great for morning tremor</Text>
              <TouchableOpacity onPress={goNext} style={styles.recBtn} activeOpacity={0.85}>
                <Text style={styles.recBtnText}>▶ START 2:00</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={goNext} style={styles.skipBtn}>
              <Text style={styles.skipText}>Skip to home screen</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Progress dots */}
        <View style={styles.dots}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { flexGrow: 1, padding: 24, paddingBottom: 40 },
  centered: { alignItems: "center", justifyContent: "center", paddingVertical: 32, gap: 20 },
  step: { flex: 1, gap: 20, paddingTop: 20 },
  userCard: {
    width: "100%",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 20,
    padding: 16,
  },
  logoBox: {
    width: 100, height: 100, borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: "center", justifyContent: "center",
  },
  logoEmoji: { fontSize: 44 },
  welcomeTitle: { fontSize: 28, fontWeight: "800", color: COLORS.textPrimary, textAlign: "center" },
  welcomeSub: { fontSize: 15, color: COLORS.textSecondary, textAlign: "center", lineHeight: 24, paddingHorizontal: 8 },

  quizCard: {
    backgroundColor: COLORS.card, borderWidth: 1,
    borderColor: COLORS.cardBorder, borderRadius: 20, padding: 20,
  },
  quizQuestion: { fontSize: 16, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 16 },
  scoreRow: { flexDirection: "row", gap: 10 },
  scoreBtn: {
    flex: 1, height: 52, borderRadius: 14, borderWidth: 2,
    borderColor: COLORS.cardBorder, alignItems: "center", justifyContent: "center",
  },
  scoreBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryGlow },
  scoreBtnText: { fontSize: 18, fontWeight: "800", color: COLORS.textSecondary },
  scoreLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  scoreLabel: { fontSize: 11, color: COLORS.textMuted },

  inputRow: { flexDirection: "row", gap: 12 },
  smallInput: {
    flex: 1, backgroundColor: COLORS.card, borderWidth: 1,
    borderColor: COLORS.cardBorder, borderRadius: 14, padding: 12,
  },
  inputLabel: { fontSize: 11, color: COLORS.textMuted },
  inputField: { color: COLORS.textPrimary, fontSize: 14, fontWeight: "600", marginTop: 4 },

  doneEmoji: { fontSize: 48 },
  doneTitle: { fontSize: 24, fontWeight: "800", color: COLORS.textPrimary },
  doneSub: { fontSize: 14, color: COLORS.textSecondary, textAlign: "center" },

  recCard: {
    borderWidth: 1.5, borderColor: COLORS.primary + "55",
    borderRadius: 24, padding: 24,
    backgroundColor: COLORS.primaryGlow,
  },
  recTag: { fontSize: 13, color: COLORS.primary, fontWeight: "700", letterSpacing: 1 },
  recName: { fontSize: 22, fontWeight: "800", color: COLORS.textPrimary, marginTop: 8 },
  recMeta: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  recBtn: {
    marginTop: 20, height: 60, borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: "center", justifyContent: "center",
  },
  recBtnText: { fontSize: 18, fontWeight: "800", color: "#fff" },

  skipBtn: { alignItems: "center", marginTop: 8 },
  skipText: { color: COLORS.textMuted, fontSize: 14 },

  dots: { flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 24 },
  dot: { width: 8, height: 8, borderRadius: 99, backgroundColor: COLORS.cardBorder },
  dotActive: { width: 24, backgroundColor: COLORS.primary },
});
