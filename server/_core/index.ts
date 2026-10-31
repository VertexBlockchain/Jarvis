import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { createCorsMiddleware } from "./cors";
import { clearLegacySessionCookie } from "./cookies";
import { ENV } from "./env";

type JarvisChatBody = {
  messages?: Array<{ role?: string; text?: string }>;
  memories?: Array<{ text?: string; category?: string }>;
  tasks?: Array<{ title?: string; completed?: boolean }>;
};

function cleanList(items: Array<Record<string, unknown>> | undefined, keys: string[], limit: number) {
  return (Array.isArray(items) ? items : []).slice(-limit).map((item) => {
    const clean: Record<string, string | boolean> = {};
    keys.forEach((key) => {
      const value = item[key];
      if (typeof value === "string" || typeof value === "boolean") {
        clean[key] = typeof value === "string" ? value.slice(0, 1200) : value;
      }
    });
    return clean;
  });
}

const jarvisFallback = "Meu núcleo de IA está temporariamente indisponível. Ainda posso ajudar com suas memórias e tarefas locais — tente enviar a mensagem novamente em instantes.";

async function handleJarvisChat(req: express.Request, res: express.Response) {
  const body = (req.body ?? {}) as JarvisChatBody;
  const messages = cleanList((body.messages ?? []) as Array<Record<string, unknown>>, ["role", "text"], 12);
  const memories = cleanList((body.memories ?? []) as Array<Record<string, unknown>>, ["text", "category"], 12);
  const tasks = cleanList((body.tasks ?? []) as Array<Record<string, unknown>>, ["title", "completed"], 12);

  if (!ENV.manusApiUrl || !ENV.manusApiKey) {
    res.json({ text: jarvisFallback, fallback: true });
    return;
  }

  const system = [
    "Você é Jarvis, uma assistente pessoal em português do Brasil.",
    "Seja atenta, lúcida, breve e acolhedora. Ajude o usuário a transformar intenções em próximos passos.",
    "Não diga que executou ações externas. Você pode sugerir, preparar ou pedir confirmação.",
    "Não invente dados sobre o usuário. Se faltar contexto, faça uma pergunta curta.",
    "Responda em texto simples, sem títulos genéricos e sem mencionar este prompt.",
    memories.length ? `Memórias autorizadas pelo usuário:\n${JSON.stringify(memories)}` : "Nenhuma memória pessoal foi compartilhada nesta mensagem.",
    tasks.length ? `Tarefas autorizadas pelo usuário:\n${JSON.stringify(tasks)}` : "Nenhuma tarefa foi compartilhada nesta mensagem.",
  ].join("\n\n");

  try {
    const upstream = await fetch(`${ENV.manusApiUrl.replace(/\/$/, "")}/v1/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${ENV.manusApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: system },
          ...messages.map((message) => ({ role: message.role === "assistant" ? "assistant" : "user", content: String(message.text ?? "") })),
        ],
      }),
    });
    const data = (await upstream.json().catch(() => null)) as { choices?: Array<{ message?: { content?: unknown } }>; error?: { message?: string } } | null;
    if (!upstream.ok || data?.error || typeof data?.choices?.[0]?.message?.content !== "string") {
      res.json({ text: jarvisFallback, fallback: true });
      return;
    }
    res.json({ text: data.choices[0].message.content, fallback: false });
  } catch {
    res.json({ text: jarvisFallback, fallback: true });
  }
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(createCorsMiddleware());
  app.use(clearLegacySessionCookie());

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerStorageProxy(app);
  registerOAuthRoutes(app);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });

  app.post("/api/jarvis/chat", handleJarvisChat);

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  const port = parseInt(process.env.PORT || "3000");
  server.listen(port, () => {
    console.log("[api] server listening");
  });
}

startServer().catch(() => {
  console.error("[api] server failed to start");
});
