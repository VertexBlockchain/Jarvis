import { describe, expect, it } from "vitest";

import { parseLocalCommand } from "./jarvis-commands";

describe("parseLocalCommand", () => {
  it("converte comando de memória em ação local", () => {
    expect(parseLocalCommand("guarde na memória que gosto de manhãs calmas")).toEqual({
      kind: "memory",
      text: "gosto de manhãs calmas",
      category: "pessoal",
    });
  });

  it("converte lembrete em tarefa com prazo", () => {
    expect(parseLocalCommand("me lembre de pagar a conta amanhã")).toEqual({
      kind: "task",
      title: "pagar a conta amanhã",
      dueLabel: "amanhã",
    });
  });

  it("converte lembrete com horário em tarefa agendada", () => {
    const command = parseLocalCommand("me lembre de tomar o remédio amanhã às 08:30");
    expect(command?.kind).toBe("task");
    expect(command).toMatchObject({
      title: "tomar o remédio amanhã às 08:30",
      dueLabel: "amanhã às 08:30",
    });
    expect(typeof (command?.kind === "task" ? command.dueAt : undefined)).toBe("string");
  });

  it("consulta tarefas sem enviar a frase para a nuvem", () => {
    expect(parseLocalCommand("o que tenho para hoje?")).toEqual({ kind: "list-tasks" });
  });

  it("não captura conversa normal como comando", () => {
    expect(parseLocalCommand("me ajude a pensar em um nome para o projeto")).toBeNull();
  });
});
