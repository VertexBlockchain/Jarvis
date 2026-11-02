const MAX_BASE64_LENGTH = 8 * 1024 * 1024;
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const MAX_CONTEXT_TEXT_LENGTH = 1200;
const MAX_TASK_SUGGESTION_LENGTH = 160;
const TEMPORAL_MARKER = /(?:\b(?:hoje|ontem|amanha|depois de amanha|esta semana|proxima semana|semana que vem|proximo mes|mes que vem|segunda(?:-feira)?|terca(?:-feira)?|quarta(?:-feira)?|quinta(?:-feira)?|sexta(?:-feira)?|sabado|domingo|today|tomorrow|yesterday|next week|next month|monday|tuesday|wednesday|thursday|friday|saturday|sunday|prazo|deadline|eod)\b|\b(?:dia\s+\d{1,2}|ate\s+(?:dia\s+)?\d{1,2}|em\s+\d+\s+(?:minutos?|horas?|dias?|semanas?)|daqui\s+a\s+\d+\s+(?:minutos?|horas?|dias?|semanas?)|(?:no\s+)?(?:fim|final)\s+do\s+dia|end\s+of\s+day)\b|\b\d{1,2}(?:[/-]\d{1,2}(?:[/-]\d{2,4})?)\b|\b\d{1,2}[:h]\d{2}\b|\b(?:as|at)\s+\d{1,2}(?::\d{2}|h\d{0,2})?\b)/i;

export type JarvisScreenshotAnalysis = { text: string; taskSuggestion: string | null };

function trimToLimit(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength);
}

export function parseJarvisScreenshotAnalysis(content: string): JarvisScreenshotAnalysis {
  const raw = trimToLimit(content, MAX_CONTEXT_TEXT_LENGTH);
  const normalized = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

  try {
    const parsed: unknown = JSON.parse(normalized);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { text: raw, taskSuggestion: null };
    }

    const output = parsed as Record<string, unknown>;
    const summary = typeof output.summary === "string" ? trimToLimit(output.summary, MAX_CONTEXT_TEXT_LENGTH) : "";
    const hasExpectedKeys = Object.keys(output).length === 2 && "summary" in output && "taskSuggestion" in output;
    const hasValidSchema = hasExpectedKeys && summary.length > 0 && (output.taskSuggestion === null || typeof output.taskSuggestion === "string");
    const rawTask = hasValidSchema && typeof output.taskSuggestion === "string" ? output.taskSuggestion : "";
    const taskSuggestion = trimToLimit(rawTask.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " "), MAX_TASK_SUGGESTION_LENGTH);
    const normalizedTask = taskSuggestion.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    return {
      text: summary || raw || "Não encontrei um resumo legível para guardar desta captura.",
      taskSuggestion: taskSuggestion && !TEMPORAL_MARKER.test(normalizedTask) ? taskSuggestion : null,
    };
  } catch {
    return { text: raw, taskSuggestion: null };
  }
}

export function validateJarvisScreenshot(imageBase64: string, mimeType: string): string | null {
  if (mimeType.toLowerCase() !== "image/jpeg") {
    return "A análise aceita capturas JPEG. Escolha outra imagem para continuar.";
  }
  if (
    imageBase64.length === 0 ||
    imageBase64.length > MAX_BASE64_LENGTH ||
    imageBase64.length % 4 !== 0 ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(imageBase64)
  ) {
    return "A captura precisa ser uma imagem JPEG válida e ter até 6 MB.";
  }

  const imageBytes = Buffer.from(imageBase64, "base64");
  if (imageBytes.byteLength > MAX_IMAGE_BYTES) {
    return "A captura precisa ter até 6 MB.";
  }
  if (imageBytes[0] !== 0xff || imageBytes[1] !== 0xd8 || imageBytes[2] !== 0xff) {
    return "O conteúdo selecionado não parece ser uma imagem JPEG válida.";
  }
  return null;
}

type WindowEntry = { count: number; resetAt: number };

type RateLimitResult = { allowed: true; retryAfterMs: 0 } | { allowed: false; retryAfterMs: number };

export function createFixedWindowRateLimiter(maxRequests: number, windowMs: number, now: () => number = Date.now) {
  const clients = new Map<string, WindowEntry>();

  return (clientKey: string): RateLimitResult => {
    const currentTime = now();
    const current = clients.get(clientKey);
    if (!current || current.resetAt <= currentTime) {
      if (current) clients.delete(clientKey);
      if (clients.size >= 1024) {
        for (const [key, entry] of clients) {
          if (entry.resetAt <= currentTime) clients.delete(key);
        }
        if (clients.size >= 1024) {
          const oldestKey = clients.keys().next().value;
          if (oldestKey !== undefined) clients.delete(oldestKey);
        }
      }
      clients.set(clientKey, { count: 1, resetAt: currentTime + windowMs });
      return { allowed: true, retryAfterMs: 0 };
    }

    if (current.count >= maxRequests) {
      return { allowed: false, retryAfterMs: Math.max(1, current.resetAt - currentTime) };
    }

    current.count += 1;
    return { allowed: true, retryAfterMs: 0 };
  };
}
