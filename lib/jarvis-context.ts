import type { JarvisTask, Memory, PrivacyMode } from "../hooks/use-jarvis-store";

export type SharedMemory = Pick<Memory, "text" | "category">;
export type SharedTask = Pick<JarvisTask, "title" | "completed">;

export function selectMemoriesForAI(memories: Memory[], privacyMode: PrivacyMode): SharedMemory[] {
  if (privacyMode !== "contextual") return [];
  return memories
    .filter((memory) => memory.shareWithAI === true)
    .map(({ text, category }) => ({ text, category }));
}

export function selectTasksForAI(tasks: JarvisTask[], privacyMode: PrivacyMode): SharedTask[] {
  if (privacyMode !== "contextual") return [];
  return tasks.slice(0, 12).map(({ title, completed }) => ({ title, completed }));
}
