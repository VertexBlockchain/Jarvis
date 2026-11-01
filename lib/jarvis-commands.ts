import type { MemoryCategory } from "@/hooks/use-jarvis-store";

export type LocalCommand =
  | { kind: "memory"; text: string; category: MemoryCategory }
  | { kind: "task"; title: string; dueLabel?: string; dueAt?: string }
  | { kind: "list-tasks" };

function dueLabelFor(text: string) {
  const normalized = text.toLocaleLowerCase("pt-BR");
  if (normalized.includes("amanhã")) return "amanhã";
  if (normalized.includes("hoje")) return "hoje";
  if (normalized.includes("segunda")) return "segunda-feira";
  return undefined;
}

function exactDueFor(text: string) {
  const match = text.match(/\b(hoje|amanhã)\s+às?\s+(\d{1,2})(?::|h)?(\d{2})?\b/i);
  if (!match) return { dueLabel: dueLabelFor(text) };

  const dayLabel = match[1].toLocaleLowerCase("pt-BR");
  const hour = Number(match[2]);
  const minute = Number(match[3] ?? "0");
  if (hour > 23 || minute > 59) return { dueLabel: dueLabelFor(text) };

  const date = new Date();
  if (dayLabel === "amanhã") date.setDate(date.getDate() + 1);
  date.setHours(hour, minute, 0, 0);
  if (dayLabel === "hoje" && date.getTime() <= Date.now()) date.setDate(date.getDate() + 1);

  return {
    dueLabel: `${dayLabel === "amanhã" ? "amanhã" : "hoje"} às ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    dueAt: date.toISOString(),
  };
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
    return { kind: "task", title, ...exactDueFor(title) };
  }

  return null;
}
