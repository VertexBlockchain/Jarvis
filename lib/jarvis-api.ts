import { getApiBaseUrl } from "@/constants/oauth";
import type { ChatMessage } from "@/hooks/use-jarvis-store";
import type { SharedMemory, SharedTask } from "@/lib/jarvis-context";

type ChatInput = {
  messages: ChatMessage[];
  memories: SharedMemory[];
  tasks: SharedTask[];
};

type ChatResponse = {
  text: string;
  fallback: boolean;
  taskSuggestion: string | null;
};

type ScreenshotAnalysisResponse = ChatResponse;

type TranscriptionResponse = {
  text: string;
  fallback: boolean;
};

const NETWORK_FALLBACK =
  "Estou sem conexão com meu núcleo agora. Sua mensagem ficou aqui; tente novamente em instantes e eu continuo de onde paramos.";

export async function askJarvis(input: ChatInput): Promise<ChatResponse> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/jarvis/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: input.messages.slice(-12).map(({ role, text }) => ({ role, text })),
        memories: input.memories.slice(0, 12),
        tasks: input.tasks.slice(0, 12),
      }),
    });

    const data = (await response.json().catch(() => null)) as { text?: unknown; taskSuggestion?: unknown; fallback?: unknown; error?: unknown } | null;
    if (!response.ok || typeof data?.text !== "string") {
      throw new Error(typeof data?.error === "string" ? data.error : "jarvis_chat_failed");
    }

    const taskSuggestion = typeof data.taskSuggestion === "string" ? data.taskSuggestion.trim().slice(0, 160) || null : null;
    return { text: data.text, taskSuggestion, fallback: data.fallback === true };
  } catch {
    return { text: NETWORK_FALLBACK, taskSuggestion: null, fallback: true };
  }
}

export async function analyzeJarvisScreenshot(imageBase64: string, mimeType: string): Promise<ScreenshotAnalysisResponse> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/jarvis/context/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64, mimeType }),
    });
    const data = (await response.json().catch(() => null)) as { text?: unknown; taskSuggestion?: unknown; fallback?: unknown } | null;
    if (typeof data?.text !== "string") {
      throw new Error("jarvis_context_analysis_failed");
    }
    return {
      text: data.text,
      taskSuggestion: typeof data.taskSuggestion === "string" ? data.taskSuggestion : null,
      fallback: !response.ok || data.fallback === true,
    };
  } catch {
    return {
      text: "Não consegui analisar essa captura agora. Você pode tentar novamente ou guardar uma nota manualmente.",
      taskSuggestion: null,
      fallback: true,
    };
  }
}

export async function transcribeJarvisAudio(uri: string): Promise<TranscriptionResponse> {
  try {
    const audio = await fetch(uri).then((response) => response.blob());
    if (!audio.size || audio.size > 12 * 1024 * 1024) {
      return { text: "", fallback: true };
    }
    const response = await fetch(`${getApiBaseUrl()}/api/jarvis/transcribe`, {
      method: "POST",
      headers: { "Content-Type": audio.type || "audio/m4a" },
      body: audio,
    });
    const data = (await response.json().catch(() => null)) as { text?: unknown; fallback?: unknown; error?: unknown } | null;
    if (!response.ok || typeof data?.text !== "string") return { text: "", fallback: true };
    return { text: data.text, fallback: data.fallback === true };
  } catch {
    return { text: "", fallback: true };
  }
}

export function speakJarvis(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "pt-BR";
  utterance.rate = 0.96;
  utterance.pitch = 0.92;
  window.speechSynthesis.speak(utterance);
  return true;
}
