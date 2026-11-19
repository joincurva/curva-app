import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Body, Button, Input, Screen, Title } from "../components/ui";
import { request } from "../lib/api";
import { useSession } from "../lib/session";
import { space } from "../lib/theme";
export default function Support() {
  const { session } = useSession();
  const [email, setEmail] = useState(session?.user.email ?? "");
  const [name, setName] = useState(session?.user.displayName ?? "");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const send = async () => {
    setBusy(true);
    try {
      const r = await request<{ reference: string }>(
        "/api/crm/cases",
        {
          method: "POST",
          body: JSON.stringify({
            email,
            name: name || "Curva fan",
            category: "product_support",
            subject: "iOS app support",
            message,
            sourcePath: "curva-ios",
          }),
        },
        session?.token,
      );
      setStatus(`Sent. Reference ${r.reference}`);
      setMessage("");
    } catch (x) {
      setStatus(x instanceof Error ? x.message : "Support request failed.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen>
      <View style={s.content}>
        <Title>Curva Support</Title>
        <Body muted>
          Your request goes to Curva’s existing support workflow and HubSpot
          case system.
        </Body>
        <Input
          accessibilityLabel="Name"
          placeholder="Name"
          value={name}
          onChangeText={setName}
        />
        <Input
          accessibilityLabel="Email"
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <Input
          accessibilityLabel="How can we help?"
          placeholder="How can we help?"
          multiline
          value={message}
          onChangeText={setMessage}
          style={{ minHeight: 130, textAlignVertical: "top", paddingTop: 14 }}
        />
        <Button
          label={busy ? "Sending…" : "Send support request"}
          disabled={busy || message.trim().length < 20 || !email.includes("@")}
          onPress={send}
        />
        {status && <Body>{status}</Body>}
      </View>
    </Screen>
  );
}
const s = StyleSheet.create({ content: { padding: space.lg, gap: space.md } });
