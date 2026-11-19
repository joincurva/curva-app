import React, { useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { EventCard } from "../../components/event-card";
import {
  Body,
  Button,
  Card,
  Input,
  Screen,
  State,
  Title,
} from "../../components/ui";
import { request } from "../../lib/api";
import { useSession } from "../../lib/session";
import type { Event } from "../../lib/types";
import { colors, space } from "../../lib/theme";
type Message = {
  id: string;
  role: "fan" | "concierge";
  text: string;
  events?: Event[];
};
export default function Ask() {
  const { session } = useSession();
  const params = useLocalSearchParams<{
    eventId?: string;
    eventName?: string;
  }>();
  const [prompt, setPrompt] = useState(
    params.eventName ? `What should I know about ${params.eventName}?` : "",
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const send = async () => {
    if (!prompt.trim() || !session) return;
    const fan: Message = {
      id: crypto.randomUUID(),
      role: "fan",
      text: prompt.trim(),
    };
    const history = [...messages, fan];
    setMessages(history);
    setPrompt("");
    setLoading(true);
    setError("");
    try {
      const result = await request<{
        text: string;
        events: Event[];
        usage: { limit: number; remaining: number };
      }>(
        "/api/ask-curva",
        {
          method: "POST",
          body: JSON.stringify({
            messages: history.map(({ role, text }) => ({ role, text })),
            context: params.eventId
              ? {
                  kind: "event",
                  id: params.eventId,
                  label: params.eventName ?? "Event",
                  route: `/events/${params.eventId}`,
                }
              : undefined,
          }),
        },
        session.token,
      );
      setMessages((v) => [
        ...v,
        {
          id: crypto.randomUUID(),
          role: "concierge",
          text: result.text,
          events: result.events,
        },
      ]);
    } catch (x) {
      setError(x instanceof Error ? x.message : "Ask Curva could not respond.");
    } finally {
      setLoading(false);
    }
  };
  if (!session)
    return (
      <Screen>
        <View style={s.empty}>
          <Title>Ask Curva</Title>
          <Body muted>
            Sign in to get grounded event guidance within your membership
            allowance.
          </Body>
          <Button label="Sign in" onPress={() => router.push("/auth")} />
        </View>
      </Screen>
    );
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <Screen>
        <FlatList
          style={s.messages}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={s.list}
          renderItem={({ item }) => (
            <Card>
              <Body>{item.role === "fan" ? "You" : "Curva"}</Body>
              <Body muted={item.role === "fan"}>{item.text}</Body>
              {item.events?.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </Card>
          )}
          ListHeaderComponent={
            <View style={{ gap: space.sm }}>
              <Title>Ask Curva</Title>
              <Body muted>
                Grounded guidance from real event results—not invented prices or
                inventory.
              </Body>
            </View>
          }
          ListFooterComponent={
            <>
              {loading && (
                <State
                  kind="loading"
                  message="Curva is checking verified event context…"
                />
              )}
              {error && <State kind="error" message={error} />}
            </>
          }
        />
        <View style={s.composer} accessibilityLabel="Ask Curva message composer">
          <Input
            accessibilityLabel="Ask Curva a question"
            placeholder="Ask about an event…"
            value={prompt}
            onChangeText={setPrompt}
            multiline
            returnKeyType="default"
            accessibilityHint="Enter a question about live events"
          />
          <Button
            label="Send"
            disabled={loading || !prompt.trim()}
            onPress={send}
          />
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}
const s = StyleSheet.create({
  messages: { flex: 1 },
  list: { padding: space.lg, gap: space.md, paddingBottom: space.lg },
  composer: {
    padding: space.md,
    gap: space.sm,
    backgroundColor: colors.canvas,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  empty: { padding: space.xl, gap: space.lg },
});
