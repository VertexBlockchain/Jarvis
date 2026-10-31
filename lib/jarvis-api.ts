import { getApiBaseUrl } from "@/constants/oauth";
import type { ChatMessage, JarvisTask, Memory } from "@/hooks/use-jarvis-store";

type ChatInput = {
  messages: ChatMessage[];
  memories: Memory[];
  tasks: JarvisTask[];
};

type ChatResponse = {
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
        messages: input.messages.slice(-12),
        memories: input.memories.slice(0, 12),
        tasks: input.tasks.slice(0, 12),
      }),
    });

    const data = (await response.json().catch(() => null)) as { text?: unknown; fallback?: unknown; error?: unknown } | null;
    if (!response.ok || typeof data?.text !== "string") {
      throw new Error(typeof data?.error === "string" ? data.error : "jarvis_chat_failed");
    }

    return { text: data.text, fallback: data.fallback === true };
  } catch {
    return { text: NETWORK_FALLBACK, fallback: true };
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
