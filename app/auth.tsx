import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Body, Button, Input, Screen, Title } from "../components/ui";
import { request } from "../lib/api";
import { space } from "../lib/theme";
export default function Auth() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const send = async () => {
    setBusy(true);
    setMessage("");
    try {
      const r = await request<{ message: string }>("/api/auth/request-link", {
        method: "POST",
        body: JSON.stringify({ email, client: "ios", returnTo: "/dashboard" }),
      });
      setMessage(r.message);
    } catch (x) {
      setMessage(
        x instanceof Error ? x.message : "Could not send sign-in link.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen>
      <View style={s.content}>
        <Title>Sign in to Curva</Title>
        <Body muted>
          We’ll email a secure, single-use link that returns you to this app.
          Curva never asks for a password.
        </Body>
        <Input
          accessibilityLabel="Email address"
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
        />
        <Button
          label={busy ? "Sending…" : "Email me a sign-in link"}
          disabled={busy || !email.includes("@")}
          onPress={send}
        />
        {message && <Body>{message}</Body>}
        <Button
          variant="secondary"
          label="Not now"
          onPress={() => router.back()}
        />
      </View>
    </Screen>
  );
}
const s = StyleSheet.create({ content: { padding: space.xl, gap: space.lg } });
