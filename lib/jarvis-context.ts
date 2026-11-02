import type { Memory, PrivacyMode } from "../hooks/use-jarvis-store";

export type SharedMemory = Pick<Memory, "text" | "category">;

export function selectMemoriesForAI(memories: Memory[], privacyMode: PrivacyMode): SharedMemory[] {
  if (privacyMode !== "contextual") return [];
  return memories
    .filter((memory) => memory.shareWithAI === true)
    .map(({ text, category }) => ({ text, category }));
}
