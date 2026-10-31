import type { MemoryCategory } from "@/hooks/use-jarvis-store";

export type LocalCommand =
  | { kind: "memory"; text: string; category: MemoryCategory }
  | { kind: "task"; title: string; dueLabel?: string }
  | { kind: "list-tasks" };

function dueLabelFor(text: string) {
  const normalized = text.toLocaleLowerCase("pt-BR");
  if (normalized.includes("amanhã")) return "amanhã";
  if (normalized.includes("hoje")) return "hoje";
  if (normalized.includes("segunda")) return "segunda-feira";
  return undefined;
}

export function parseLocalCommand(input: string): LocalCommand | null {
  const text = input.trim();
  if (!text) return null;

  if (/^(?:o que eu tenho|o que tenho)\s+(?:para|de)\s+hoje\??$/i.test(text)) {
    return { kind: "list-tasks" };
  }

  const memoryMatch = text.match(/^(?:guarde|salve|registre)\s+(?:na memória\s+)?(?:que\s+)?(.+)$/i) ?? text.match(/^lembre que\s+(.+)$/i);
  if (memoryMatch?.[1]) {
    return { kind: "memory", text: memoryMatch[1].trim(), category: "pessoal" };
  }

  const taskMatch = text.match(/^(?:crie|adicione|anote)\s+(?:uma tarefa\s+)?(.+)$/i) ?? text.match(/^me lembre(?: de)?\s+(.+)$/i) ?? text.match(/^lembre-me(?: de)?\s+(.+)$/i);
  if (taskMatch?.[1]) {
    const title = taskMatch[1].trim();
    return { kind: "task", title, dueLabel: dueLabelFor(title) };
  }

  return null;
}
