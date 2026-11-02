import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type MessageRole = "user" | "assistant";
export type MemoryCategory = "pessoal" | "trabalho" | "preferência" | "objetivo";
export type MemoryOrigin = "manual" | "screenshot";
export type TaskOrigin = "manual" | "screenshot";
export type PrivacyMode = "local" | "contextual";

export type ChatMessage = {
  id: string;
  role: MessageRole;
  text: string;
  createdAt: string;
  fallback?: boolean;
};

export type Memory = {
  id: string;
  text: string;
  category: MemoryCategory;
  origin: MemoryOrigin;
  shareWithAI: boolean;
  createdAt: string;
  updatedAt?: string;
};

export type JarvisTask = {
  id: string;
  title: string;
  dueLabel?: string;
  dueAt?: string;
  completed: boolean;
  createdAt: string;
  origin?: TaskOrigin;
};

export type JarvisPreferences = {
  voiceEnabled: boolean;
  privacyMode: PrivacyMode;
  displayName: string;
};

type JarvisState = {
  messages: ChatMessage[];
  memories: Memory[];
  tasks: JarvisTask[];
  preferences: JarvisPreferences;
};

type JarvisStore = JarvisState & {
  hydrated: boolean;
  addMessage: (role: MessageRole, text: string, fallback?: boolean) => ChatMessage;
  addMemory: (text: string, category: MemoryCategory, origin?: MemoryOrigin) => Memory;
  updateMemory: (id: string, text: string, category: MemoryCategory) => void;
  setMemoryShareWithAI: (id: string, enabled: boolean) => void;
  deleteMemory: (id: string) => void;
  clearMemories: () => void;
  addTask: (title: string, dueLabel?: string, dueAt?: string, origin?: TaskOrigin) => JarvisTask;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  updatePreferences: (preferences: Partial<JarvisPreferences>) => void;
  clearAllData: () => void;
};

const STORAGE_KEY = "jarvis-local-state-v1";

const welcomeMessage: ChatMessage = {
  id: "welcome",
  role: "assistant",
  text: "Estou com você. Posso ajudar a organizar o dia, guardar uma memória ou pensar no próximo passo.",
  createdAt: new Date(0).toISOString(),
};

const initialState: JarvisState = {
  messages: [welcomeMessage],
  memories: [],
  tasks: [],
  preferences: {
    voiceEnabled: false,
    privacyMode: "local",
    displayName: "",
  },
};

const JarvisStoreContext = createContext<JarvisStore | null>(null);

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function mergeStoredState(value: string | null): JarvisState {
  if (!value) return initialState;
  try {
    const parsed = JSON.parse(value) as Partial<JarvisState>;
    const memories = Array.isArray(parsed.memories)
      ? parsed.memories.map((memory) => ({
          ...memory,
          origin: memory.origin === "screenshot" ? "screenshot" as const : "manual" as const,
          // Legacy entries must not become shareable without a fresh user choice.
          shareWithAI: memory.shareWithAI === true,
        }))
      : [];
    return {
      messages: Array.isArray(parsed.messages) && parsed.messages.length > 0 ? parsed.messages : initialState.messages,
      memories,
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      preferences: {
        ...initialState.preferences,
        ...(parsed.preferences ?? {}),
      },
    };
  } catch {
    return initialState;
  }
}

export function JarvisStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<JarvisState>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => setState(mergeStoredState(stored)))
      .catch(() => setState(initialState))
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => undefined);
  }, [hydrated, state]);

  const addMessage = useCallback((role: MessageRole, text: string, fallback = false) => {
    const message: ChatMessage = {
      id: createId(role),
      role,
      text,
      createdAt: new Date().toISOString(),
      fallback,
    };
    setState((current) => ({ ...current, messages: [...current.messages, message] }));
    return message;
  }, []);

  const addMemory = useCallback((text: string, category: MemoryCategory, origin: MemoryOrigin = "manual") => {
    const memory: Memory = {
      id: createId("memory"),
      text: text.trim(),
      category,
      origin,
      shareWithAI: false,
      createdAt: new Date().toISOString(),
    };
    setState((current) => ({ ...current, memories: [memory, ...current.memories] }));
    return memory;
  }, []);

  const updateMemory = useCallback((id: string, text: string, category: MemoryCategory) => {
    setState((current) => ({
      ...current,
      memories: current.memories.map((memory) =>
        memory.id === id ? { ...memory, text: text.trim(), category, updatedAt: new Date().toISOString() } : memory,
      ),
    }));
  }, []);

  const setMemoryShareWithAI = useCallback((id: string, enabled: boolean) => {
    setState((current) => ({
      ...current,
      memories: current.memories.map((memory) =>
        memory.id === id ? { ...memory, shareWithAI: enabled, updatedAt: new Date().toISOString() } : memory,
      ),
    }));
  }, []);

  const deleteMemory = useCallback((id: string) => {
    setState((current) => ({ ...current, memories: current.memories.filter((memory) => memory.id !== id) }));
  }, []);

  const clearMemories = useCallback(() => {
    setState((current) => ({ ...current, memories: [] }));
  }, []);

  const addTask = useCallback((title: string, dueLabel?: string, dueAt?: string, origin: TaskOrigin = "manual") => {
    const task: JarvisTask = {
      id: createId("task"),
      title: title.trim(),
      dueLabel,
      dueAt,
      completed: false,
      createdAt: new Date().toISOString(),
      origin,
    };
    setState((current) => ({ ...current, tasks: [task, ...current.tasks] }));
    return task;
  }, []);

  const toggleTask = useCallback((id: string) => {
    setState((current) => ({
      ...current,
      tasks: current.tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)),
    }));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setState((current) => ({ ...current, tasks: current.tasks.filter((task) => task.id !== id) }));
  }, []);

  const updatePreferences = useCallback((preferences: Partial<JarvisPreferences>) => {
    setState((current) => ({ ...current, preferences: { ...current.preferences, ...preferences } }));
  }, []);

  const clearAllData = useCallback(() => {
    setState(initialState);
  }, []);

  const value = useMemo<JarvisStore>(() => ({
    ...state,
    hydrated,
    addMessage,
    addMemory,
    updateMemory,
    setMemoryShareWithAI,
    deleteMemory,
    clearMemories,
    addTask,
    toggleTask,
    deleteTask,
    updatePreferences,
    clearAllData,
  }), [
    state,
    hydrated,
    addMessage,
    addMemory,
    updateMemory,
    setMemoryShareWithAI,
    deleteMemory,
    clearMemories,
    addTask,
    toggleTask,
    deleteTask,
    updatePreferences,
    clearAllData,
  ]);

  return createElement(JarvisStoreContext.Provider, { value }, hydrated ? children : null);
}

export function useJarvisStore() {
  const store = useContext(JarvisStoreContext);
  if (!store) throw new Error("useJarvisStore must be used within JarvisStoreProvider");
  return store;
}
