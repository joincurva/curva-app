import React, { useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSession } from "../lib/session";
import { Body, Button, Input, Screen, Title } from "../components/ui";
import { request } from "../lib/api";
import { colors, space } from "../lib/theme";

type Mode = "create" | "signin";

export default function Auth() {
  const [mode, setMode] = useState<Mode>("create");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
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

  const creating = mode === "create";
  const validEmail = /^\S+@\S+\.\S+$/.test(email.trim());
  const validZip = postalCode === "" || /^\d{5}$/.test(postalCode);
  const canSend = validEmail && validZip && (!creating || (name.trim().length >= 2 && agreed));

  const send = async () => {
    setBusy(true);
    setMessage("");
    try {
      const body = creating
        ? { email: email.trim(), displayName: name.trim(), postalCode: postalCode || undefined, intent: "signup", affirmativeLegalAcceptance: true, client: "ios", returnTo: "/dashboard" }
        : { email: email.trim(), intent: "signin", client: "ios", returnTo: "/dashboard" };
      const r = await request<{ message: string; noAccount?: boolean }>("/api/auth/request-link", { method: "POST", body: JSON.stringify(body) });
      if (r.noAccount) {
        setMode("create");
        setMessage("There's no Curva account for that email yet. Add your first name and agree to the Terms to create one.");
        return;
      }
      setSent(true);
      setMessage(`Check ${email.trim()} for your sign-in link. It works once and expires in 20 minutes. Open it on this iPhone to come right back here.`);
    } catch (x) {
      setMessage(x instanceof Error ? x.message : "Could not send the sign-in link. Try again in a minute.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <Title>{creating ? "Create your free Curva account" : "Sign in to Curva"}</Title>
        <Body muted>
          {creating
            ? "Follow teams, artists and shows, get presale alerts, and keep your events in one place. No password: we email you a secure link."
            : "We'll email you a secure, single-use link that brings you back to this app. Curva never asks for a password."}
        </Body>

        {creating && (
          <Input accessibilityLabel="First name" placeholder="First name" autoCapitalize="words" autoComplete="given-name" textContentType="givenName" value={name} onChangeText={setName} />
        )}
        <Input accessibilityLabel="Email address" placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" value={email} onChangeText={setEmail} />
        {creating && (
          <>
            <Input accessibilityLabel="ZIP code, optional" placeholder="ZIP code (optional, for events near you)" keyboardType="number-pad" maxLength={5} autoComplete="postal-code" textContentType="postalCode" value={postalCode} onChangeText={(v) => setPostalCode(v.replace(/\D/g, "").slice(0, 5))} />
            <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: agreed }} onPress={() => setAgreed(!agreed)} style={s.agree}>
              <Ionicons name={agreed ? "checkbox" : "square-outline"} size={24} color={agreed ? colors.cobalt : colors.muted} />
              <Text style={s.agreeText}>
                I agree to Curva&apos;s{" "}
                <Text style={s.link} onPress={() => void Linking.openURL("https://joincurva.com/terms")}>Terms</Text> and{" "}
                <Text style={s.link} onPress={() => void Linking.openURL("https://joincurva.com/privacy")}>Privacy Notice</Text>.
              </Text>
            </Pressable>
          </>
        )}

        <Button label={busy ? "Sending…" : sent ? "Send another link" : creating ? "Create account" : "Email me a sign-in link"} disabled={busy || !canSend} onPress={send} />
        {!!message && <Body>{message}</Body>}

        <Pressable accessibilityRole="button" onPress={() => { setMode(creating ? "signin" : "create"); setMessage(""); setSent(false); }}>
          <Text style={s.link}>{creating ? "Already have an account? Sign in" : "New to Curva? Create a free account"}</Text>
        </Pressable>

        <Button variant="secondary" label="Not now" onPress={() => router.back()} />

        {codeOpen ? (
          <View style={s.review}>
            <Body muted>App Store review access</Body>
            <Input accessibilityLabel="Access code" placeholder="Access code" autoCapitalize="characters" autoCorrect={false} value={code} onChangeText={setCode} />
            <Button variant="secondary" label={busy ? "Signing in…" : "Sign in with access code"} disabled={busy || !validEmail || code.trim().length < 6} onPress={useCode} />
          </View>
        ) : (
          <Pressable accessibilityRole="button" onPress={() => setCodeOpen(true)}>
            <Text style={s.small}>App Store reviewer? Use an access code</Text>
          </Pressable>
        )}
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  content: { padding: space.xl, gap: space.lg, paddingBottom: 80 },
  agree: { flexDirection: "row", alignItems: "center", gap: space.sm },
  agreeText: { flex: 1, color: colors.ink, fontSize: 15, lineHeight: 21 },
  link: { color: colors.cobalt, fontWeight: "700" },
  small: { color: colors.muted, fontSize: 13, textAlign: "center" },
  review: { gap: space.md },
});
