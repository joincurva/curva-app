import React, { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { updateMyEvent } from "../lib/api";
import { useSession } from "../lib/session";
import { brand, colors, radius, space } from "../lib/theme";
import type { FanEvent } from "../lib/types";

/**
 * Before the show: who's coming and where to meet. After: who you went with and the moment you'll remember.
 * Saved to the fan's Curva account (same as the website), private unless they share.
 */
export function ShowNotes({ show, past }: { show: FanEvent; past: boolean }) {
  const { session } = useSession();
  const [companions, setCompanions] = useState(show.companions ?? "");
  const [meetup, setMeetup] = useState(show.meetup_note ?? "");
  const [memory, setMemory] = useState(show.memory_note ?? "");
  const [saved, setSaved] = useState("");
  const save = async (plan: Parameters<typeof updateMyEvent>[1]) => {
    if (!session) return;
    try {
      await updateMyEvent(show.id, plan, session.token);
      setSaved("Saved");
      setTimeout(() => setSaved(""), 1500);
    } catch {
      setSaved("Couldn't save. Try again.");
    }
  };
  return (
    <View style={s.card}>
      <View style={s.head}>
        <Text style={s.h2}>{past ? "Your memory" : "Your plan"}</Text>
        {saved ? <Text style={s.saved}>{saved}</Text> : null}
      </View>
      <Text style={s.label}>{past ? "Who you went with" : "Who's going with you"}</Text>
      <TextInput
        accessibilityLabel={past ? "Who you went with" : "Who's going with you"}
        onChangeText={setCompanions}
        onEndEditing={() => void save({ companions: companions.trim() || null })}
        placeholder="Names"
        placeholderTextColor={colors.muted}
        style={s.input}
        value={companions}
      />
      {past ? (
        <>
          <Text style={s.label}>The moment you&apos;ll remember</Text>
          <TextInput
            accessibilityLabel="The moment you'll remember"
            multiline
            onChangeText={setMemory}
            onEndEditing={() => void save({ memoryNote: memory.trim() || null })}
            placeholder="The song, the play, the moment"
            placeholderTextColor={colors.muted}
            style={[s.input, s.multi]}
            value={memory}
          />
        </>
      ) : (
        <>
          <Text style={s.label}>Where you&apos;re meeting</Text>
          <TextInput
            accessibilityLabel="Where you're meeting"
            onChangeText={setMeetup}
            onEndEditing={() => void save({ meetupNote: meetup.trim() || null })}
            placeholder="Gate, bar, parking lot, time"
            placeholderTextColor={colors.muted}
            style={s.input}
            value={meetup}
          />
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, padding: space.lg, gap: space.sm },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  h2: { fontSize: 19, fontWeight: "800", color: colors.ink },
  saved: { fontSize: 13, fontWeight: "700", color: colors.cobalt },
  label: { fontSize: 13, fontWeight: "700", color: colors.muted, marginTop: space.xs },
  input: { minHeight: 46, borderWidth: 1, borderColor: colors.border, borderRadius: radius.control, paddingHorizontal: 12, fontSize: 16, color: brand.navy, backgroundColor: colors.canvas },
  multi: { minHeight: 90, paddingTop: 12, textAlignVertical: "top" },
});
