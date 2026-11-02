import { describe, expect, it } from "vitest";

import { createFixedWindowRateLimiter, validateJarvisScreenshot } from "./jarvis-context";

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
