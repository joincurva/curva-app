import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type PressableProps,
  type TextInputProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, space } from "../lib/theme";
export function Screen({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={s.screen}>
      {children}
    </SafeAreaView>
  );
}
export function Title({ children }: { children: React.ReactNode }) {
  return (
    <Text accessibilityRole="header" allowFontScaling style={s.title}>
      {children}
    </Text>
  );
}
export function Heading({ children }: { children: React.ReactNode }) {
  return (
    <Text accessibilityRole="header" allowFontScaling style={s.heading}>
      {children}
    </Text>
  );
}
export function Body({
  children,
  muted = false,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <Text allowFontScaling style={[s.body, muted && s.muted]}>
      {children}
    </Text>
  );
}
export function Button({
  label,
  variant = "primary",
  ...props
}: PressableProps & {
  label: string;
  variant?: "primary" | "secondary" | "danger";
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: props.disabled === true }}
      {...props}
      style={({ pressed }) => [
        s.button,
        variant === "primary"
          ? s.primary
          : variant === "danger"
            ? s.danger
            : s.secondary,
        pressed && { opacity: 0.72 },
        props.disabled && s.disabled,
      ]}
    >
      <Text
        allowFontScaling
        style={[
          s.buttonText,
          variant !== "primary" &&
            variant !== "danger" && { color: colors.ink },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
export function Input(props: TextInputProps) {
  return (
    <TextInput
      allowFontScaling
      placeholderTextColor={colors.muted}
      {...props}
      style={[s.input, props.style]}
    />
  );
}
export function Card({ children }: { children: React.ReactNode }) {
  return <View style={s.card}>{children}</View>;
}
export function State({
  kind,
  message,
  onRetry,
}: {
  kind: "loading" | "empty" | "error";
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View
      accessibilityRole={kind === "error" ? "alert" : "summary"}
      accessibilityLiveRegion={kind === "error" ? "assertive" : "polite"}
      accessibilityLabel={message}
      style={s.state}
    >
      {kind === "loading" && (
        <ActivityIndicator
          accessibilityLabel="Loading"
          color={colors.cobalt}
        />
      )}
      <Body muted>{message}</Body>
      {onRetry && (
        <Button variant="secondary" label="Try again" onPress={onRetry} />
      )}
    </View>
  );
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
    letterSpacing: -0.8,
    color: colors.ink,
  },
  heading: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
    color: colors.ink,
  },
  body: { fontSize: 16, lineHeight: 24, color: colors.ink },
  muted: { color: colors.muted },
  button: {
    minHeight: 48,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: radius.control,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: { backgroundColor: colors.cobalt },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  danger: { backgroundColor: colors.danger },
  buttonText: { fontSize: 16, fontWeight: "700", color: "white" },
  disabled: { opacity: 0.48 },
  input: {
    minHeight: 50,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.control,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.ink,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: space.lg,
    gap: space.sm,
  },
  state: { padding: space.xl, alignItems: "center", gap: space.md },
});
