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
- Privacidade local por padrão; no modo contextual vão títulos/status das tarefas e apenas memórias com autorização individual.
- Cofre de Contexto com notas editáveis, origem visível e permissão individual para cada memória.
- Análise opcional de uma captura de tela escolhida pela pessoa; o texto sugerido precisa ser revisado antes de ser salvo, e a imagem não é adicionada ao cofre.
- Fallbacks para rede, permissão negada, áudio inválido e indisponibilidade do núcleo de IA.

## Arquitetura

```text
app/                 Telas Expo Router: Hoje, Memória, Tarefas e Perfil
components/          Orb, ícones e componentes visuais
hooks/               Estado local persistido com AsyncStorage
lib/jarvis-api.ts    Cliente de conversa, transcrição e análise de capturas
lib/jarvis-commands.ts  Parser de comandos locais de baixa consequência
lib/local-notifications.ts  Lembretes Expo nativos
server/_core/index.ts  API Express, LLM, transcrição Whisper e análise visual
server/_core/jarvis-context.ts  Validação JPEG e quota de análise por IP
drizzle/             Schema do starter e autenticação futura
```

O celular nunca recebe `MANUS_API_KEY`. No Preview Web, o app deriva a URL do backend a partir do host; builds nativos precisam receber `EXPO_PUBLIC_API_BASE_URL`. O servidor chama os serviços gerenciados usando as credenciais de runtime.

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

Para analisar uma captura, a pessoa escolhe uma imagem salva no aparelho e toca em “Enviar para análise”. O app envia JPEG de até 6 MB ao serviço de IA configurado; o servidor verifica a assinatura real da imagem e limita a cinco análises por minuto por IP. Somente o texto revisado e salvo fica no estado local do Jarvis. Nenhuma captura é monitorada ou lida em segundo plano.

## Privacidade e limites atuais

O MVP não lê automaticamente todas as mensagens, notificações ou outros aplicativos. Também não envia mensagens, marca consultas, faz compras ou cancela compromissos sem uma integração explícita e confirmação do usuário. A quota da análise de captura é apenas em memória e por IP; antes de expor o serviço publicamente, adicione autenticação e quota distribuída por usuário. A captura de voz e notificações deve ser verificada em um aparelho Android/iOS real; a Preview Web valida o bundle e a interface, não permissões nativas.

## Próximos passos

1. Validar microfone e notificações em Android/iOS conectado.
2. Calendário nativo reaproveitando horários exatos e pedindo confirmação antes de criar eventos.
3. Confirmação visual para ações externas.
4. Bolha flutuante Android e contexto filtrado de notificações.
5. Sincronização opcional e criptografada entre dispositivos.

## Repositório

O projeto é mantido no repositório [VertexBlockchain/Jarvis](https://github.com/VertexBlockchain/Jarvis). O repositório gerenciado do projeto Manus continua preservado para Preview e checkpoints Mobile.
