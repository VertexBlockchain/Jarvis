# TODO — Jarvis MVP

## 1. Entregar a experiência principal de conversa

- [x] O app Android/Expo deve abrir em uma tela principal em português com identidade Jarvis, esfera visual animada e a pergunta “Estou com você. Por onde começamos?”.
- [x] O usuário deve conseguir escrever e enviar uma mensagem, ver suas mensagens e as respostas da assistente em uma conversa contínua.
- [x] A interface deve indicar quando a assistente está pensando, responder sem travar a tela e preservar a mensagem do usuário em caso de erro.
- [x] A assistente deve deixar claro quando uma resposta veio de fallback e nunca afirmar que enviou mensagem, marcou consulta ou concluiu uma ação externa sem confirmação e integração real.
- [x] A tela deve oferecer ações rápidas para planejar o dia, guardar uma memória e visualizar tarefas.

## 2. Implementar memória pessoal local e controlada

- [x] O usuário deve conseguir adicionar uma memória por texto, escolher uma categoria e visualizar as memórias salvas.
- [x] Cada memória deve poder ser removida individualmente e deve existir uma ação para apagar todas as memórias.
- [x] O histórico de conversa deve ser separado visualmente da memória; neste MVP, falar algo na conversa não deve salvar memória automaticamente.
- [x] A tela deve explicar que as memórias são locais por padrão e oferecer acesso claro à limpeza dos dados.

## 3. Implementar tarefas e continuidade

- [x] O usuário deve conseguir criar uma tarefa, marcar como concluída, reabrir e remover.
- [x] A tela Hoje deve mostrar um resumo de tarefas pendentes e o próximo passo sugerido.
- [x] A assistente deve receber as tarefas e memórias autorizadas como contexto selecionado para responder melhor, sem enviar o histórico inteiro por padrão.

## 4. Implementar integração segura com IA

- [x] O servidor deve expor `POST /api/jarvis/chat` e chamar a API LLM gerenciada somente no backend usando as variáveis de ambiente do projeto.
- [x] O app não deve conter a chave de serviço nem derivar credenciais do navegador.
- [x] O endpoint deve receber mensagens recentes e memórias autorizadas, responder em português e orientar a assistente a ser transparente sobre limitações e ações.
- [x] Falhas do serviço devem retornar uma resposta recuperável, com indicação de fallback, sem apagar a mensagem enviada.

## 5. Entregar privacidade, identidade e navegação

- [x] O app deve ter quatro áreas navegáveis: Hoje, Memória, Tarefas e Perfil.
- [x] O perfil deve permitir ativar/desativar leitura de respostas em voz quando disponível, escolher modo de privacidade e apagar todos os dados locais.
- [x] A interface deve explicar que bolha flutuante, leitura de notificações, calendário e automações profundas não fazem parte desta primeira entrega.
- [x] O visual deve seguir o estilo Luxury command center: azul-noite, ciano de ação, violeta para inteligência, cards em camadas e esfera com halo.
- [x] Os assets nativos `icon.png`, `splash-icon.png`, `favicon.png`, `android-icon-foreground.png`, `android-icon-background.png` e `android-icon-monochrome.png` devem carregar a mesma identidade visual, sem cantos arredondados embutidos no ícone principal.

## 6. Segunda camada: agir localmente com segurança

- [x] Frases explícitas como “guarde na memória que…”, “crie uma tarefa…” e “me lembre de…” devem ser resolvidas localmente, sem enviar esse comando ao servidor LLM.
- [x] A frase “o que tenho para hoje?” deve consultar as tarefas abertas locais e responder com um resumo.
- [x] Cada tarefa deve oferecer o agendamento opcional de um lembrete local; por padrão são 30 minutos depois, e comandos com “hoje às HH:MM” ou “amanhã às 09:00” usam o horário exato, solicitando a permissão de notificações no Android/iOS e explicando a limitação na Preview Web.
- [x] Os comandos locais devem possuir testes unitários para memória, tarefa com prazo, consulta de pendências e rejeição de conversa comum.
- [x] A captura de voz nativa deve transformar fala em texto usando o microfone e o serviço de transcrição, com tratamento de permissão e erro.
- [ ] O Android deve receber a bolha flutuante e o calendário nativo após a confirmação das permissões do sistema.

## 7. Voz com privacidade por padrão

- [x] O cockpit deve exibir um botão de microfone com estados de ouvir, parar e transcrever, além de tratar permissão negada e gravação vazia sem travar a conversa.
- [x] O app deve enviar somente o áudio da gravação atual para `POST /api/jarvis/transcribe`; a chave do serviço de transcrição permanece exclusivamente no backend.
- [x] O servidor deve limitar o áudio bruto a 12 MB, adaptar o arquivo ao endpoint Whisper compatível, pedir transcrição em português do Brasil e retornar texto ou fallback explícito.
- [x] A gravação deve continuar integrada ao fluxo atual: o texto transcrito aparece como mensagem do usuário e segue para comandos locais ou conversa com o Jarvis.
- [ ] Validar a captura real de microfone e a permissão de áudio em um Android/iOS conectado; a Preview Web valida apenas a interface e o bundle.

## 8. Lembretes com horário

- [x] O parser deve reconhecer “me lembre de [tarefa] hoje às 08:30” e “amanhã às 09:00”, preservando o rótulo humano e uma data ISO local para o agendamento.
- [x] A tarefa deve persistir o horário opcional sem quebrar tarefas antigas que só possuem `dueLabel`.
- [x] O agendador deve usar gatilho de data quando o horário ainda estiver no futuro e manter o fallback de 30 minutos para tarefas sem horário.
- [x] A tela Tarefas deve informar se o lembrete foi agendado no horário exato ou no fallback de 30 minutos.
- [ ] Calendário nativo deve reutilizar o mesmo `dueAt`, mas só criar eventos depois de uma confirmação explícita do usuário.

## 9. Cofre de Contexto com origem e autorização explícitas

- [x] A área de Memória deve se apresentar como um Cofre de Contexto: nenhum contexto novo entra automaticamente a partir da conversa ou de uma captura de tela.
- [x] A pessoa pode escolher uma captura de tela salva e tocar explicitamente em “Enviar para análise”; a interface informa que a imagem JPEG será enviada ao serviço de IA configurado e permite remover/cancelar antes do envio.
- [x] O backend valida base64, MIME e assinatura JPEG real, limita a imagem a 6 MB, aplica uma quota de cinco análises por minuto por IP e instrui o modelo a tratar o conteúdo visual como dado não confiável.
- [x] A sugestão gerada aparece em texto editável; só é guardada após revisão e toque em “Guardar no cofre”. A imagem não é adicionada à memória persistente local.
- [x] Cada memória exibe sua origem (`adicionada por você` ou `captura analisada`), permite edição, remoção individual confirmada e limpeza de todas, e possui permissão individual para uso em respostas da IA, desligada por padrão.
- [x] O modo `local` não envia tarefas ou memórias; no modo `contextual`, títulos/status de tarefas são enviados e somente memórias com permissão individual ativada acompanham a mensagem. Memórias antigas migram com essa permissão desligada.
- [x] O Perfil explica o envio da conversa recente, das tarefas no modo contextual e das memórias autorizadas individualmente.
- [ ] Testar seleção/envio/revisão em Expo Go, confirmar suporte a visão no provedor, validar `EXPO_PUBLIC_API_BASE_URL` no build nativo e substituir a quota em memória por autenticação/quota distribuída antes de exposição pública; esta sessão não conseguiu anexar o projeto WebDev para Preview nem acessou dispositivo móvel.
