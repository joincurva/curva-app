import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { router } from "expo-router";
import {
  Body,
  Button,
  Card,
  Heading,
  Screen,
  State,
  Title,
} from "../../components/ui";
import { performerSlug, request } from "../../lib/api";
import { turnOffSaleAlerts, turnOnSaleAlerts } from "../../lib/push";
import { useSession } from "../../lib/session";
import { useFollows } from "../../lib/follows";
import { brand, space } from "../../lib/theme";
type Membership = { plan: "free" | "plus" | "premier"; status: string; cancelAtPeriodEnd?: boolean; currentPeriodEnd?: string };

/** Plain words for the fan, never raw billing states. */
function membershipLabel({ plan, cancelAtPeriodEnd, currentPeriodEnd }: Membership, _trialEndsAt?: string) {
  const day = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  if (plan === "free") return "Free, for good";
  const name = plan === "plus" ? "Curva Plus" : "Curva Premier";
  return cancelAtPeriodEnd && currentPeriodEnd ? `${name}, through ${day(currentPeriodEnd)}` : name;
}
export default function Account() {
  const { session, setSession } = useSession();
  const [membership, setMembership] = useState<Membership>();
  const [trialEndsAt, setTrialEndsAt] = useState<string>();
  const [push, setPush] = useState(
    "Get an alert on this iPhone the day before a sale and right before the queue opens. Email reminders keep working either way.",
  );
  const [pushToken, setPushToken] = useState<string>();
  const [accountError, setAccountError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (session)
      request<{ membership: Membership; trialEndsAt?: string }>(
        "/api/mobile/account",
        {},
        session.token,
      )
        .then((r) => { setMembership(r.membership); setTrialEndsAt(r.trialEndsAt); })
        .catch((error) => {
          setMembership(undefined);
          setAccountError(
            error instanceof Error
              ? error.message
              : "Membership status is unavailable.",
          );
        });
  }, [session]);
  const logout = async () => {
    setBusy(true);
    setAccountError("");
    try {
      if (session && pushToken)
        await turnOffSaleAlerts(session.token, pushToken).catch(() => undefined);
      if (session)
        await request(
          "/api/auth/session",
          { method: "DELETE" },
          session.token,
        ).catch(() => undefined);
      await setSession();
    } catch {
      setAccountError(
        "Curva could not clear the secure session. Close the app and try again.",
      );
    } finally {
      setBusy(false);
    }
  };
  const { follows, unfollow } = useFollows();
  const deletion = () =>
    Alert.alert(
      "Permanently delete account?",
      "This deletes your Curva account, Ticket Alerts, saved state, and supported CRM data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete account",
          style: "destructive",
          onPress: async () => {
            if (!session) return;
            setBusy(true);
            setAccountError("");
            try {
              await request(
                "/api/account/data",
                { method: "DELETE" },
                session.token,
              );
              await setSession();
            } catch (error) {
              setAccountError(
                error instanceof Error
                  ? error.message
                  : "Your account could not be deleted. Nothing was changed.",
              );
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  return (
    <Screen>
      <ScrollView contentContainerStyle={s.content}>
        <Title>Account</Title>
        {accountError ? <State kind="error" message={accountError} /> : null}
        {session ? (
          <>
            <Card>
              <Heading>{session.user.displayName ?? "Curva fan"}</Heading>
              <Body muted>{session.user.email}</Body>
            </Card>
            <Card>
              <Heading>Membership</Heading>
              <Body>
                {membership
                  ? membershipLabel(membership, trialEndsAt)
                  : "Checking your Curva membership…"}
              </Body>
              <Body muted>
                Curva Free is yours to keep. Your membership is the same here
                and on joincurva.com.
              </Body>
            </Card>
            <Card>
              <Heading>Following</Heading>
              <Body muted>
                {follows.length
                  ? "Curva alerts you before every presale and on-sale for these, including dates announced later."
                  : "Follow an artist, team or show from any sale and Curva covers every presale and on-sale for you."}
              </Body>
              {follows.map((f) => (
                <React.Fragment key={f.name_key}>
                  <Button label={`${f.name}: dates and sales`} onPress={() => router.push(`/presales/${performerSlug(f.name)}`)} />
                  <Button variant="secondary" label={`Unfollow ${f.name}`} disabled={busy} onPress={() => void unfollow(f.name)} />
                </React.Fragment>
              ))}
            </Card>
            <Card>
              <Heading>Notifications</Heading>
              <Body muted>{push}</Body>
              <Button
                variant={pushToken ? "secondary" : "primary"}
                label={pushToken ? "Turn off sale alerts" : "Turn on sale alerts"}
                disabled={busy}
                onPress={async () => {
                  if (!session) return;
                  setBusy(true);
                  try {
                    if (pushToken) {
                      await turnOffSaleAlerts(session.token, pushToken);
                      setPushToken(undefined);
                      setPush("Sale alerts are off on this iPhone. Email reminders keep working.");
                    } else {
                      const r = await turnOnSaleAlerts(session.token);
                      if (r.status === "on") {
                        setPushToken(r.token);
                        setPush("Sale alerts are on. We'll alert you the day before and right before the queue opens.");
                      } else setPush(r.message);
                    }
                  } catch {
                    setPush("Alerts could not be changed. Email reminders keep working.");
                  } finally {
                    setBusy(false);
                  }
                }}
              />
            </Card>
          </>
        ) : (
          <Card>
            <Body muted>
              Sign in to view membership, Ticket Alerts, and account controls.
            </Body>
            <Button label="Sign in" onPress={() => router.push("/auth")} />
          </Card>
        )}
        <Card>
          <Heading>Help & trust</Heading>
          <Button
            variant="secondary"
            label="Contact support"
            onPress={() => router.push("/support")}
          />
          <Button
            variant="secondary"
            label="Privacy policy"
            onPress={() =>
              void WebBrowser.openBrowserAsync("https://joincurva.com/privacy", { controlsColor: brand.navy, dismissButtonStyle: "done" }).catch(() =>
                setAccountError("The privacy policy could not be opened."),
              )
            }
          />
          <Button
            variant="secondary"
            label="Terms"
            onPress={() =>
              void WebBrowser.openBrowserAsync("https://joincurva.com/terms", { controlsColor: brand.navy, dismissButtonStyle: "done" }).catch(() =>
                setAccountError("The terms could not be opened."),
              )
            }
          />
          <Button
            variant="secondary"
            label="Accessibility"
            onPress={() =>
              void WebBrowser.openBrowserAsync("https://joincurva.com/accessibility", { controlsColor: brand.navy, dismissButtonStyle: "done" }).catch(
                () =>
                  setAccountError("The accessibility page could not be opened."),
              )
            }
          />
        </Card>
        {session && (
          <>
            <Button
              variant="secondary"
              label={busy ? "Working…" : "Log out"}
              disabled={busy}
              onPress={logout}
            />
            <Button
              variant="danger"
              label="Delete my account"
              disabled={busy}
              onPress={deletion}
            />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
const s = StyleSheet.create({
  content: { padding: space.lg, gap: space.lg, paddingBottom: 120 },
});
