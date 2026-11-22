// Mirrors joincurva.com (src/discover/entity-identity.ts): initials and a stage color per name.
// Typography only, never a team, artist or show logo.
export function monogram(name: string) {
  const words = name.replace(/[^A-Za-z0-9&' ]/g, " ").split(/\s+/).filter((word) => word && !/^(the|of|and|fc|sc|cf)$/i.test(word));
  const letters = words.length === 1 ? words[0]!.slice(0, 2) : words.slice(0, 3).map((word) => word[0]).join("");
  return letters.toUpperCase();
}

const STAGES = ["#2d4bd6", "#7a2fd0", "#c2410c", "#0f766e", "#be123c", "#0e7490", "#a16207", "#4d7c0f"] as const;
export function stageColor(key: string) {
  let hash = 0;
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return STAGES[hash % STAGES.length]!;
}
