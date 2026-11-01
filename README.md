# Jarvis — Assistente Pessoal

Assistente pessoal Android/Expo com conversa em português do Brasil, memória local editável, tarefas, lembretes nativos opcionais e transcrição de voz protegida pelo backend.

## Estado atual

O MVP já entrega:

- Cockpit visual com esfera de presença e conversa por texto.
- Memória pessoal local, com categorias, edição por adição e limpeza controlada.
- Tarefas locais com conclusão, remoção e lembrete opcional; frases como “amanhã às 08:30” agendam o horário exato no aparelho.
- Comandos locais: `guarde na memória que...`, `crie uma tarefa...`, `me lembre de...` e `o que tenho para hoje?`.
- Voz com `expo-audio`: gravação, permissão, envio do áudio atual e transcrição no backend.
- Respostas faladas no Web Preview quando `speechSynthesis` está disponível.
- Privacidade local por padrão; memórias e tarefas só acompanham a chamada LLM no modo contextual.
- Fallbacks para rede, permissão negada, áudio inválido e indisponibilidade do núcleo de IA.

## Arquitetura

```text
app/                 Telas Expo Router: Hoje, Memória, Tarefas e Perfil
components/          Orb, ícones e componentes visuais
hooks/               Estado local persistido com AsyncStorage
lib/jarvis-api.ts    Cliente de conversa e transcrição
lib/jarvis-commands.ts  Parser de comandos locais de baixa consequência
lib/local-notifications.ts  Lembretes Expo nativos
server/_core/index.ts  API Express, LLM e transcrição Whisper compatível
drizzle/             Schema do starter e autenticação futura
```

O celular nunca recebe `MANUS_API_KEY`. O app envia mensagens para rotas relativas do próprio projeto; o servidor chama os serviços gerenciados usando as credenciais de runtime.

## Desenvolvimento

```bash
pnpm install
pnpm db:push
pnpm dev
```

- Preview Web: Metro na porta `8081`.
- API: Express na porta `3000`.
- Checagens: `pnpm check`, `pnpm lint`, `pnpm test` e `pnpm build`.

As variáveis protegidas são carregadas pelo ambiente do projeto. Não coloque chaves em `app.config.ts`, no bundle Expo, no README ou em commits.

## Privacidade e limites atuais

O MVP não lê automaticamente todas as mensagens, notificações ou outros aplicativos. Também não envia mensagens, marca consultas, faz compras ou cancela compromissos sem uma integração explícita e confirmação do usuário. A captura de voz e notificações deve ser verificada em um aparelho Android/iOS real; a Preview Web valida o bundle e a interface, não permissões nativas.

## Próximos passos

1. Validar microfone e notificações em Android/iOS conectado.
2. Calendário nativo reaproveitando horários exatos e pedindo confirmação antes de criar eventos.
3. Confirmação visual para ações externas.
4. Bolha flutuante Android e contexto filtrado de notificações.
5. Sincronização opcional e criptografada entre dispositivos.

## Repositório

O projeto é mantido no repositório [VertexBlockchain/Jarvis](https://github.com/VertexBlockchain/Jarvis). O repositório gerenciado do projeto Manus continua preservado para Preview e checkpoints Mobile.
