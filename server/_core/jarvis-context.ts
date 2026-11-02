const MAX_BASE64_LENGTH = 8 * 1024 * 1024;
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const MAX_CONTEXT_TEXT_LENGTH = 1200;
const MAX_TASK_SUGGESTION_LENGTH = 160;
const TEMPORAL_MARKERS = [
  /\b(?:hoje|ontem|amanha|depois de amanha|esta semana|proxima semana|semana que vem|proximo mes|mes que vem|proxima quinzena|quinzena que vem|next fortnight|proximo trimestre|trimestre que vem|next (?:fiscal )?quarter|this quarter|next year|ano que vem|segunda(?:-feira)?|terca(?:-feira)?|quarta(?:-feira)?|quinta(?:-feira)?|sexta(?:-feira)?|sabado|domingo|today|tomorrow|yesterday|next week|next month|monday|tuesday|wednesday|thursday|friday|saturday|sunday|noon|midnight|meio[ -]dia|meia[ -]noite|prazo|deadline|eod)\b/i,
  /\b(?:dia\s+\d{1,2}|ate\s+(?:dia\s+)?\d{1,2}|(?:em|daqui a|within|in)\s+(?:\d+|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:minutos?|horas?|dias?|semanas?|meses?|years?)|(?:nos\s+)?proxim(?:o|a|os|as)\s+(?:\d+|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez)\s+(?:dias?|semanas?|meses?)|(?:next|within the next|in the next)\s+(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:days?|weeks?|months?|years?)|(?:no\s+)?(?:fim|final)\s+(?:do|da)\s+(?:dia|mes|semana|ano|expediente|trimestre|quinzena)|end\s+of\s+(?:day|week|month|quarter|year)|close\s+of\s+business)\b/i,
  /\b\d{4}-\d{2}-\d{2}\b/i,
  /\b\d{1,2}(?:[/-]\d{1,2}(?:[/-]\d{2,4})?)\b/i,
  /\b\d{1,2}\s+de\s+(?:janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\b/i,
  /\b\d{1,2}(?:st|nd|rd|th)?\s+(?:of\s+)?(?:january|february|march|april|may|june|july|august|september|october|november|december)\b/i,
  /\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:st|nd|rd|th)?\b/i,
  /\b\d{1,2}[:h]\d{2}\b/i,
  /\b(?:as|at)\s+\d{1,2}(?::\d{2}|h\d{0,2})?\b/i,
];

export type JarvisScreenshotAnalysis = { text: string; taskSuggestion: string | null };

function trimToLimit(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength);
}

function normalizeSuggestion(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const suggestion = trimToLimit(value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " "), MAX_TASK_SUGGESTION_LENGTH);
  const temporalText = suggestion.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return suggestion && !TEMPORAL_MARKERS.some((marker) => marker.test(temporalText)) ? suggestion : null;
}

function parseStructuredAssistantContent(content: string, textKey: "summary" | "reply"): JarvisScreenshotAnalysis {
  const raw = trimToLimit(content, MAX_CONTEXT_TEXT_LENGTH);
  const normalized = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

  try {
    const parsed: unknown = JSON.parse(normalized);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { text: raw, taskSuggestion: null };
    }

    const output = parsed as Record<string, unknown>;
    const reply = typeof output[textKey] === "string" ? trimToLimit(output[textKey], MAX_CONTEXT_TEXT_LENGTH) : "";
    const hasExpectedKeys = Object.keys(output).length === 2 && textKey in output && "taskSuggestion" in output;
    const hasValidSchema = hasExpectedKeys && reply.length > 0 && (output.taskSuggestion === null || typeof output.taskSuggestion === "string");

    return {
      text: reply || raw || "Não encontrei um texto legível para mostrar.",
      taskSuggestion: hasValidSchema ? normalizeSuggestion(output.taskSuggestion) : null,
    };
  } catch {
    return { text: raw, taskSuggestion: null };
  }
}

export function parseJarvisScreenshotAnalysis(content: string): JarvisScreenshotAnalysis {
  return parseStructuredAssistantContent(content, "summary");
}

export function parseJarvisChatResponse(content: string): JarvisScreenshotAnalysis {
  return parseStructuredAssistantContent(content, "reply");
}

export function hasPersonalCommitmentMarker(message: string): boolean {
  const normalized = message.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const negated = /\b(?:nao\s+(?:vou|preciso|precisamos|tenho que|temos que|tenho de|temos de|devo|devia|deveria)|i don['’]?t\s+(?:need to|have to|will)|we don['’]?t\s+(?:need to|have to)|i will not|we will not)\b/;
  const uncertain = /\b(?:nao sei se|nao tenho certeza|talvez|quem sabe|acho que|se\s+(?:eu|a gente|nos)\b|caso\s+(?:eu|a gente|nos)\b|not sure if|maybe|perhaps|i might|i could|i am not sure|i'm not sure|i am unsure|i'm unsure|i don't know if|i do not know if)\b/;
  const completed = /\b(?:ja\s+(?:enviei|envie|fiz|paguei|mandei|respondi|marquei|resolvi|conclui|concluido|terminei|finalizei|entreguei|comprei|cancelei|agendei|falei)|acabei de|acabamos de|esta feito|foi feito|resolvido|concluido|terminado|finalizado|already\s+(?:sent|done|completed|paid|finished|submitted|called|booked)|i already|we already|it['’]?s done|that is done|i am done|we are done)\b/;
  if (/[?？]/.test(message) || negated.test(normalized) || uncertain.test(normalized) || completed.test(normalized)) return false;
  return /\b(?:vou|irei|farei|preciso|precisamos|tenho que|temos que|tenho de|temos de|devo|devia|deveria|pretendo|planejo|nao posso esquecer de|nao posso deixar de|nao esqueca de|quero lembrar de|me comprometi (?:a|com)|lembra[- ]me de|me lembra de|me lembre de|avise[- ]me de|i will|i need to|i have to|i should|i must|i['’]?ll|i am going to|i['’]?m going to|we need to|we have to|we should|i plan to|we plan to|remind me to|don['’]?t let me forget|do not let me forget|don['’]?t forget to|do not forget to)\b/.test(normalized);
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
