# Jarvis — Assistente Pessoal

## Objetivo

Construir a primeira versão navegável de uma assistente pessoal avançada, com experiência de “amiga digital privada”: conversa natural, memória controlada pelo usuário, organização de tarefas e transparência sobre o que é armazenado ou enviado para a nuvem. O primeiro alvo é Android, usando o starter Expo/React Native/TypeScript gerenciado pelo Manus; a Preview Web serve para validar a experiência enquanto o app nativo evolui.

## Escopo do MVP

### Entregas desta versão

- Tela principal de conversa em português, com identidade Jarvis e esfera visual animada.
- Mensagens persistidas localmente no aparelho/Storage do navegador para continuidade da sessão.
- Memórias pessoais editáveis: criar, consultar, apagar e limpar tudo.
- Separação visual entre memória e histórico; nenhuma frase vira memória sem ação explícita do usuário.
- Lista de tarefas local com criação, conclusão e remoção.
- Ações rápidas para “planejar meu dia”, “guardar uma memória” e “ver tarefas”.
- Endpoint de servidor seguro para conversar com o LLM gerenciado usando `MANUS_API_URL` e `MANUS_API_KEY` apenas no servidor.
- Fallback local amigável quando o serviço de IA estiver indisponível, sem perder a mensagem do usuário.
- Modo de voz visual e leitura de respostas via Web Speech Synthesis quando disponível; captura de voz nativa e transcrição ficam para a próxima fase.
- Tela de perfil/privacidade com modo de processamento, explicação de permissões e botão para apagar todos os dados locais.
- Tema visual escuro, premium e calmo, com navegação inferior em quatro áreas: Hoje, Memória, Tarefas e Perfil.

### Fora do MVP, mas preparado no desenho

- Bolha flutuante sobre outros aplicativos Android.
- Leitura filtrada de notificações e contexto de apps.
- Lembretes nativos, calendário e integrações externas.
- Rotinas autônomas, planejamento de múltiplas etapas e execução em serviços.
- Sincronização entre dispositivos e memória na nuvem.
- STT nativo completo e palavra-chave permanente.

## Arquitetura

### Frontend mobile

- Expo Router com React Native e NativeWind já instalados no starter.
- `app/(tabs)/index.tsx`: conversa e resumo do dia.
- `app/(tabs)/memory.tsx`: memória pessoal editável.
- `app/(tabs)/tasks.tsx`: tarefas e pendências.
- `app/(tabs)/profile.tsx`: identidade, privacidade e limpeza de dados.
- `hooks/use-jarvis-store.ts`: estado e persistência local via AsyncStorage; mantém histórico, memórias, tarefas e preferências.
- `components/jarvis-orb.tsx`: esfera/halo visual com estados idle, thinking, listening e speaking.
- `lib/jarvis-api.ts`: cliente do endpoint relativo `/api/jarvis/chat`, sem credenciais no bundle.

### Backend

- `POST /api/jarvis/chat` no Express.
- Recebe apenas o contexto selecionado pelo app: mensagens recentes e memórias autorizadas.
- Monta um prompt de sistema em português, orientado a ser útil, transparente e não inventar ações executadas.
- Chama `POST $MANUS_API_URL/v1/chat/completions` com `Authorization: Bearer $MANUS_API_KEY`.
- Responde somente com texto; não persiste conteúdo do usuário no servidor neste MVP.
- Em erro transitório ou configuração ausente, retorna uma resposta de fallback e um sinal `fallback: true` para a interface.

### Modelo local de dados

```text
ChatMessage { id, role: user | assistant, text, createdAt }
Memory { id, text, category, createdAt }
Task { id, title, dueLabel?, completed, createdAt }
Preferences { voiceEnabled, privacyMode, displayName }
```

Dados locais devem ter ações explícitas de exclusão. A memória não deve ser inferida automaticamente do histórico no MVP.

## Direção visual

### Estilos considerados

- **Neon editorial de ficção científica** — 0,07: alto contraste, ciano luminoso e tipografia técnica.
- **Minimalismo sereno de wellness** — 0,04: superfícies claras, ritmo espaçado e foco em hábitos.
- **Luxury command center** — 0,06: fundo azul-noite, cartões de vidro, ciano como cor de ação e violeta como sinal de inteligência.

### Estilo escolhido: Luxury command center

- **Movimento:** dashboard de comando premium com influência de interfaces espaciais, mas com calor humano; nada de “hacker cliché”.
- **Princípios:** clareza antes de espetáculo; foco em uma ação por vez; profundidade por camadas; privacidade sempre visível.
- **Filosofia de cor:** azul-noite quase preto reduz ruído e dá sensação de presença; ciano elétrico indica ação e disponibilidade; violeta marca raciocínio e memória; branco azulado preserva legibilidade.
- **Layout:** composição vertical assimétrica, com cabeçalho leve, esfera como âncora e painéis empilhados; os cards não devem parecer uma tabela administrativa.
- **Assinaturas:** esfera “Astra-core” com halo pulsante; etiqueta de privacidade “local por padrão”; linha fina ciano em estados ativos.
- **Interação:** ações críticas explicam o que acontecerá; botões têm rótulos curtos e estados táteis; respostas nunca simulam que uma tarefa foi executada sem confirmação.
- **Animação:** respiração lenta no idle; pulso mais rápido em thinking; transições de 180–260 ms; evitar movimento constante que canse o usuário.
- **Tipografia:** sistema sans para leitura; pesos 400/500 para corpo e 700 para títulos; etiquetas curtas em caixa alta com tracking moderado.
- **Essência da marca:** “Uma presença inteligente e privada para ajudar você a conduzir o dia.” Personalidade: atenta, lúcida, confiável.
- **Voz da marca:** direta, acolhedora e sem exagerar promessas. Exemplos: “Estou com você. Por onde começamos?” e “Posso preparar isso — você confirma antes de eu executar.”
- **Marca:** wordmark “JARVIS” em caixa alta com um ponto/halo ciano sobre o I; ícone quadrado com um núcleo circular e quatro arcos orbitais.
- **Cor proprietária:** ciano “core light” `#78F3E5`, usado com parcimônia para ações e estados ativos.

## Dependências e restrições

- Manter o starter Expo fixo; não trocar framework nem portas 8081/3000.
- Não expor `MANUS_API_KEY` nem outras credenciais no app.
- Usar componentes React Native, com estilos compatíveis com Web e Android.
- Não prometer leitura de qualquer aplicativo, execução autônoma ampla ou memória em nuvem nesta etapa.
- Registrar branding nativo nos assets exigidos e configurar `logoUrl` antes do checkpoint.

## Fluxo de construção

1. Aplicar tema, navegação e telas do MVP.
2. Criar store local e ações de memória/tarefas.
3. Implementar endpoint de conversa e cliente do app.
4. Integrar estados da esfera, loading, erro e fallback.
5. Criar identidade nativa e atualizar configuração Expo.
6. Rodar banco do starter, checagem TypeScript, lint e iniciar Metro/API.
7. Inspecionar a Preview em viewport móvel e corrigir problemas visuais ou de fluxo.
8. Salvar checkpoint no repositório gerenciado.
