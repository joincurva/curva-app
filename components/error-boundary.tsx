import React from "react";
import { StyleSheet, View } from "react-native";
import { Body, Button, Title } from "./ui";
import { colors, space } from "../lib/theme";
type State = { failed: boolean };
export class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    if (__DEV__) console.error("curva-render-failure", error.name);
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <View style={s.page}>
        <Title>Curva needs a fresh start</Title>
        <Body muted>
          Your account is safe. Close and reopen the app, then try again.
        </Body>
        <Button
          label="Try again"
          onPress={() => this.setState({ failed: false })}
        />
      </View>
    );
  }
}
const s = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: "center",
    padding: space.xl,
    gap: space.lg,
    backgroundColor: colors.canvas,
  },
});
