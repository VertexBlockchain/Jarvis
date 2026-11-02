import { describe, expect, it } from "vitest";

import { createFixedWindowRateLimiter, parseJarvisScreenshotAnalysis, validateJarvisScreenshot } from "./jarvis-context";

const jpegBase64 = Buffer.from([0xff, 0xd8, 0xff, 0xd9]).toString("base64");

describe("validateJarvisScreenshot", () => {
  it("aceita apenas uma captura JPEG cujo MIME e assinatura correspondem", () => {
    expect(validateJarvisScreenshot(jpegBase64, "image/jpeg")).toBeNull();
  });

  it("rejeita MIME enganoso e bytes que não começam com a assinatura JPEG", () => {
    expect(validateJarvisScreenshot(jpegBase64, "image/png")).not.toBeNull();
    expect(validateJarvisScreenshot(Buffer.from("not an image").toString("base64"), "image/jpeg")).not.toBeNull();
  });

  it("rejeita base64 malformado", () => {
    expect(validateJarvisScreenshot("not!base64", "image/jpeg")).not.toBeNull();
  });

  it("rejeita payloads acima do limite antes de decodificá-los", () => {
    expect(validateJarvisScreenshot("A".repeat(8 * 1024 * 1024 + 4), "image/jpeg")).not.toBeNull();
  });
});

describe("createFixedWindowRateLimiter", () => {
  it("bloqueia após o limite e libera novamente ao iniciar uma nova janela", () => {
    let now = 1_000;
    const consume = createFixedWindowRateLimiter(2, 60_000, () => now);

    expect(consume("client-a").allowed).toBe(true);
    expect(consume("client-a").allowed).toBe(true);
    const limited = consume("client-a");
    expect(limited.allowed).toBe(false);
    if (!limited.allowed) expect(limited.retryAfterMs).toBe(60_000);

    now += 60_000;
    expect(consume("client-a").allowed).toBe(true);
  });
});

describe("parseJarvisScreenshotAnalysis", () => {
  it("separa uma nota e uma sugestão de tarefa válidas", () => {
    expect(parseJarvisScreenshotAnalysis('{"summary":"Revisar o orçamento","taskSuggestion":"Responder à Ana"}')).toEqual({
      text: "Revisar o orçamento",
      taskSuggestion: "Responder à Ana",
    });
  });

  it("mantém apenas a nota quando o modelo não sugere uma ação", () => {
    expect(parseJarvisScreenshotAnalysis('{"summary":"Consulta marcada para sexta","taskSuggestion":null}')).toEqual({
      text: "Consulta marcada para sexta",
      taskSuggestion: null,
    });
  });

  it("não produz tarefa quando a resposta não é JSON válido", () => {
    expect(parseJarvisScreenshotAnalysis("Resumo não estruturado do modelo")).toEqual({
      text: "Resumo não estruturado do modelo",
      taskSuggestion: null,
    });
  });

  it("não produz tarefa se o schema estiver incompleto ou tiver chaves extras", () => {
    expect(parseJarvisScreenshotAnalysis('{"taskSuggestion":"Responder à Ana"}').taskSuggestion).toBeNull();
    expect(parseJarvisScreenshotAnalysis('{"summary":"Nota","taskSuggestion":"Responder à Ana","extra":true}')).toEqual({
      text: "Nota",
      taskSuggestion: null,
    });
    expect(parseJarvisScreenshotAnalysis('{"summary":"Nota","taskSuggestion":42}').taskSuggestion).toBeNull();
  });

  it("rejeita prazos e horários dentro do título sugerido", () => {
    expect(parseJarvisScreenshotAnalysis('{"summary":"Nota","taskSuggestion":"Enviar até amanhã às 09:00"}').taskSuggestion).toBeNull();
    expect(parseJarvisScreenshotAnalysis('{"summary":"Nota","taskSuggestion":"Revisar documento em 15/11"}').taskSuggestion).toBeNull();
  });

  it("normaliza quebras de linha e limita o título sugerido", () => {
    const result = parseJarvisScreenshotAnalysis(JSON.stringify({ summary: "Nota", taskSuggestion: `  Fazer\n${"x".repeat(200)}` }));
    expect(result.taskSuggestion).toHaveLength(160);
    expect(result.taskSuggestion).not.toContain("\n");
  });
});
