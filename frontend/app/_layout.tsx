import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#0D0F14" },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="index" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="activity" options={{ animation: "slide_from_bottom" }} />
        <Stack.Screen name="chat" options={{ animation: "slide_from_bottom" }} />
        <Stack.Screen name="settings" />
      </Stack>
    </>
  );
}
