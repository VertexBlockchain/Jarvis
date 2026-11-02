import { describe, expect, it } from "vitest";

import { selectMemoriesForAI } from "./jarvis-context";
import type { Memory } from "../hooks/use-jarvis-store";

const memories: Memory[] = [
  {
    id: "private-note",
    text: "Não compartilhar",
    category: "pessoal",
    origin: "manual",
    shareWithAI: false,
    createdAt: "2026-11-01T10:00:00.000Z",
  },
  {
    id: "approved-note",
    text: "Gosto de planejar pela manhã",
    category: "preferência",
    origin: "manual",
    shareWithAI: true,
    createdAt: "2026-11-01T10:01:00.000Z",
  },
];

describe("selectMemoriesForAI", () => {
  it("não envia memórias no modo local mesmo se uma estiver autorizada individualmente", () => {
    expect(selectMemoriesForAI(memories, "local")).toEqual([]);
  });

  it("no modo contextual envia apenas memórias autorizadas, sem metadados locais", () => {
    expect(selectMemoriesForAI(memories, "contextual")).toEqual([
      { text: "Gosto de planejar pela manhã", category: "preferência" },
    ]);
  });
});
