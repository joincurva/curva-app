import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useSession } from "../lib/session";
import { Body, Button, Input, Screen, Title } from "../components/ui";
import { request } from "../lib/api";
import { colors, space } from "../lib/theme";
export default function Auth() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [codeOpen, setCodeOpen] = useState(false);
  const [code, setCode] = useState("");
  const { setSession } = useSession();
  // For accounts given an access code (Apple's App Store review). Fans sign in with the email link.
  const useCode = async () => {
    setBusy(true);
    setMessage("");
    try {
      const r = await request<{ sessionToken: string; user: { id: string; email: string; displayName?: string } }>("/api/auth/review-session", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      });
      await setSession({ token: r.sessionToken, user: r.user });
      router.replace("/welcome");
    } catch (x) {
      setMessage(x instanceof Error ? x.message : "That code isn't valid.");
    } finally {
      setBusy(false);
    }
  };
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
        {codeOpen ? (
          <>
            <Input
              accessibilityLabel="Access code"
              placeholder="Access code"
              autoCapitalize="characters"
              autoCorrect={false}
              value={code}
              onChangeText={setCode}
            />
            <Button label={busy ? "Signing in…" : "Sign in with code"} disabled={busy || !email.includes("@") || code.trim().length < 6} onPress={useCode} />
          </>
        ) : (
          <Pressable accessibilityRole="button" onPress={() => setCodeOpen(true)}>
            <Text style={{ color: colors.cobalt, fontWeight: "700" }}>Have an access code?</Text>
          </Pressable>
        )}
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
