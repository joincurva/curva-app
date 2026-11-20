import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Body, Button, Screen, State, Title } from "../../components/ui";
import { request } from "../../lib/api";
import { useSession } from "../../lib/session";
import type { User } from "../../lib/types";
import { space } from "../../lib/theme";
export default function NativeAuthExchange() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const { setSession } = useSession();
  const [error, setError] = useState(
    typeof token === "string" ? "" : "This sign-in link is incomplete.",
  );
  useEffect(() => {
    if (typeof token !== "string") return;
    request<{ sessionToken: string; user: User }>("/api/auth/native-session", {
      method: "POST",
      body: JSON.stringify({ token }),
    })
      .then(async (result) => {
        await setSession({ token: result.sessionToken, user: result.user });
        router.replace("/welcome");
      })
      .catch((x) =>
        setError(
          x instanceof Error
            ? x.message
            : "This sign-in link could not be verified.",
        ),
      );
  }, [setSession, token]);
  return (
    <Screen>
      <View style={s.content}>
        <Title>Signing you in</Title>
        {error ? (
          <>
            <State kind="error" message={error} />
            <Button
              label="Request a new link"
              onPress={() => router.replace("/auth")}
            />
          </>
        ) : (
          <Body muted>Securely verifying your one-time Curva link…</Body>
        )}
      </View>
    </Screen>
  );
}
const s = StyleSheet.create({ content: { padding: space.xl, gap: space.lg } });
