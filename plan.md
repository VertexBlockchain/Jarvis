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
- Lembretes nativos com horário exato, calendário e integrações externas.
- Rotinas autônomas, planejamento de múltiplas etapas e execução em serviços.
- Sincronização entre dispositivos e memória na nuvem.
- STT nativo completo e palavra-chave permanente.

## Evolução já adicionada após o primeiro checkpoint

Comandos explícitos de baixa consequência agora são resolvidos no aparelho antes de chamar o LLM: guardar uma memória, criar uma tarefa, registrar um “me lembre de…” ou consultar as pendências do dia. Isso reduz latência, evita enviar comandos simples para a nuvem e torna a assistente realmente capaz de agir dentro do seu espaço local.

A tela de tarefas oferece um lembrete de 30 minutos usando `expo-notifications` e agora entende horários exatos em frases como “amanhã às 08:30”, usando um gatilho de data no aparelho. O app solicita a permissão no Android/iOS e informa na Web Preview que o recurso depende do aparelho. Calendário nativo com confirmação explícita e bolha flutuante permanecem como próximas integrações de sistema.

### Voz e transcrição

O botão de microfone usa `expo-audio` para gravar no aparelho ou no navegador quando o ambiente oferece microfone. O cliente envia apenas o áudio atual, com limite de 12 MB, para o endpoint relativo `/api/jarvis/transcribe`. O servidor recebe o corpo bruto, cria o multipart exigido pelo endpoint Whisper compatível usando as credenciais de runtime e devolve somente a transcrição. Áudio vazio, permissão negada, formato inválido e indisponibilidade do serviço produzem mensagens recuperáveis; o histórico não é enviado junto com o áudio.

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

## Cofre de Contexto — primeiro incremento

O primeiro incremento transforma a área Memória em um cofre explícito e revisável. A pessoa poderá escolher uma captura de tela já salva no aparelho e tocar em “Enviar para análise”; o seletor Expo entrega base64 JPEG, que o backend verifica pela assinatura real e limita a 6 MB. O endpoint aplica uma quota de cinco análises por minuto por IP. Antes do envio, a interface informa que a captura vai ao serviço de IA configurado e permite cancelar. A captura não é guardada como contexto persistente; apenas a sugestão revisada pela pessoa pode virar nota local. Texto em imagens é conteúdo não confiável: o backend pede ao modelo que não siga instruções presentes na captura e registre somente fatos ou compromissos realmente visíveis.

Cada item guardado manterá origem (`manual` ou `screenshot`), categoria, data de criação e uma permissão individual `shareWithAI`, desativada por padrão. A tela permitirá editar, apagar e alternar essa permissão. Dados antigos serão migrados com `shareWithAI: false` para evitar compartilhamento retroativo. O modo `local` não envia tarefas nem memórias; o modo `contextual` envia títulos/status das tarefas e somente memórias individualmente autorizadas. As mensagens e o contexto recente necessários para responder continuam sendo enviados ao serviço de IA, como está explicado no Perfil.

## Ponte de contexto para próximo passo — segundo incremento

Na análise de uma captura selecionada, o backend pode retornar uma nota curta e, somente se a imagem mostrar claramente uma ação pendente, uma sugestão opcional de tarefa. O contrato exige JSON exato com `summary` não vazia e `taskSuggestion` string ou nula; campos ausentes/extras ou tipos inválidos descartam a sugestão. O parser também rejeita títulos com marcadores de data, hora ou prazo, sem preencher campos de prazo. Na tela, o título é editável e só cria tarefa local quando a pessoa toca em “Criar tarefa”. A tarefa guarda apenas a origem `screenshot` para transparência; nenhum conteúdo da captura é anexado à tarefa ou salvo automaticamente como memória.

O botão de criação informará que é uma tarefa local e que, no modo `contextual`, títulos e status de tarefas podem seguir para a IA. A tela Tarefas exibirá a origem “captura analisada”. Nenhuma mensagem, e-mail, compra, lembrete externo ou outra ação será executada a partir da imagem.

### Estrutura alterada

- `app/(tabs)/memory.tsx`: interface do Cofre, seleção explícita de captura, revisão da sugestão, edição, origem e controle por item.
- `app/(tabs)/tasks.tsx`: rótulo de proveniência para tarefas criadas a partir de uma captura.
- `hooks/use-jarvis-store.ts`: estado persistente compartilhado entre abas, migração das memórias existentes, edição e autorização individual.
- `lib/jarvis-api.ts` e `server/_core/jarvis-context.ts`: contrato e normalização da resposta multimodal; `lib/jarvis-context.ts` continua filtrando memórias autorizadas.
- `server/_core/index.ts` e `server/_core/jarvis-context.ts`: endpoint de análise multimodal, validação de tamanho/formato e quota por IP, além da instrução contra seguir texto da imagem.
- `app/(tabs)/profile.tsx`: explicação precisa da permissão global e das autorizações por memória.

## Compromissos do chat — terceiro incremento

O endpoint de conversa manterá uma resposta legível e aceitará um `taskSuggestion` opcional em JSON estrito (`reply` + `taskSuggestion`). A sugestão só poderá ser produzida a partir de uma intenção explícita na mensagem mais recente da pessoa; o backend normaliza papéis de mensagem para `user`/`assistant`, ignora dados locais de sugestões antigas e aplica uma trava simples de linguagem de compromisso. Schema inválido, intenção ambígua ou título com data/hora/prazo devolve somente a resposta normal, sem tarefa.

A resposta do chat aparece no balão atual. Se houver sugestão, a pessoa pode editar, descartar ou confirmar; o store a grava atomicamente como tarefa local com origem `conversation`, sem vencimento inferido e sem execução externa. O estado de confirmação evita duplicação por toques repetidos. No modo contextual, o filtro existente envia à IA apenas título/status, sem a origem; no modo local, continua enviando zero tarefas. Mensagens antigas seguem válidas com campos opcionais.

### Estrutura alterada

- `server/_core/index.ts` e `server/_core/jarvis-context.ts`: resposta estruturada, filtro determinístico de intenção e validação do título opcional.
- `lib/jarvis-api.ts`: leitura da resposta e remoção de metadados persistidos antes de enviar histórico.
- `hooks/use-jarvis-store.ts`: rascunho opcional por mensagem, edição/descarte e criação idempotente da tarefa confirmada.
- `app/(tabs)/index.tsx` e `app/(tabs)/tasks.tsx`: revisão em contexto e proveniência da tarefa.
