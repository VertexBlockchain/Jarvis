const MAX_BASE64_LENGTH = 8 * 1024 * 1024;
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;

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
