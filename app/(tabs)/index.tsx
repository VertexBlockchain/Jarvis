import { useEffect, useMemo, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { RecordingPresets, requestRecordingPermissionsAsync, useAudioRecorder, useAudioRecorderState } from "expo-audio";

import { ScreenContainer } from "@/components/screen-container";
import { JarvisOrb, type OrbMode } from "@/components/jarvis-orb";
import { useJarvisStore } from "@/hooks/use-jarvis-store";
import { askJarvis, speakJarvis, transcribeJarvisAudio } from "@/lib/jarvis-api";
import { parseLocalCommand } from "@/lib/jarvis-commands";

const colors = {
  ink: "#07111F",
  panel: "#0D1B2D",
  panelSoft: "#10243A",
  text: "#EDF7FF",
  muted: "#8EA8C5",
  cyan: "#78F3E5",
  violet: "#A783FF",
  line: "rgba(155, 190, 220, 0.15)",
};

function formatTime(value: string) {
  if (value === new Date(0).toISOString()) return "agora";
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export default function HomeScreen() {
  const { messages, memories, tasks, preferences, addMessage, addMemory, addTask, hydrated } = useJarvisStore();
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<OrbMode>("idle");
  const [isSending, setIsSending] = useState(false);
  const [recordingIntent, setRecordingIntent] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("");
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 200);
  const scrollRef = useRef<ScrollView>(null);
  const isRecording = recordingIntent || recorderState.isRecording;

  const pendingTasks = useMemo(() => tasks.filter((task) => !task.completed), [tasks]);
  const recentMessages = useMemo(() => messages.slice(-8), [messages]);
  const greeting = new Date().getHours() < 12 ? "Bom dia" : new Date().getHours() < 18 ? "Boa tarde" : "Boa noite";

  useEffect(() => {
    const timeout = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(timeout);
  }, [messages.length]);

  const submit = async (value = input, allowWhileBusy = false) => {
    const text = value.trim();
    if (!text || (isSending && !allowWhileBusy)) return;
    setInput("");
    const userMessage = addMessage("user", text);
    setIsSending(true);
    setMode("thinking");

    const localCommand = parseLocalCommand(text);
    if (localCommand) {
      let localReply = "";
      if (localCommand.kind === "memory") {
        addMemory(localCommand.text, localCommand.category);
        localReply = `Guardei isso na sua memória local: “${localCommand.text}”`;
      } else if (localCommand.kind === "task") {
        addTask(localCommand.title, localCommand.dueLabel);
        localReply = `Anotei como próximo passo${localCommand.dueLabel ? ` para ${localCommand.dueLabel}` : ""}: “${localCommand.title}”`;
      } else {
        const openTasks = tasks.filter((task) => !task.completed);
        localReply = openTasks.length
          ? `Você tem ${openTasks.length} pendência${openTasks.length === 1 ? "" : "s"}: ${openTasks.map((task) => task.title).join("; ")}.`
          : "Seu dia está limpo por enquanto. Quer escolher um próximo passo?";
      }
      addMessage("assistant", localReply);
      setIsSending(false);
      setMode(preferences.voiceEnabled ? "speaking" : "idle");
      if (preferences.voiceEnabled) speakJarvis(localReply);
      return;
    }

    const response = await askJarvis({
      messages: [...messages, userMessage],
      memories: preferences.privacyMode === "contextual" ? memories : [],
      tasks: preferences.privacyMode === "contextual" ? tasks : [],
    });

    addMessage("assistant", response.text, response.fallback);
    setIsSending(false);
    setMode(response.fallback ? "idle" : preferences.voiceEnabled ? "speaking" : "idle");
    if (preferences.voiceEnabled) speakJarvis(response.text);
  };

  const toggleVoice = async () => {
    if (isSending && !isRecording) return;
    if (isRecording) {
      setVoiceStatus("transcrevendo…");
      try {
        await recorder.stop();
        setRecordingIntent(false);
        if (!recorder.uri) {
          setVoiceStatus("Não encontrei um áudio válido. Tente novamente.");
          return;
        }
        setIsSending(true);
        const transcription = await transcribeJarvisAudio(recorder.uri);
        if (transcription.fallback || !transcription.text.trim()) {
          addMessage("assistant", transcription.text || "Não consegui entender o áudio. Você pode repetir ou escrever a mensagem.", true);
          setIsSending(false);
          setMode("idle");
          setVoiceStatus("");
          return;
        }
        setVoiceStatus("");
        await submit(transcription.text, true);
      } catch {
        setRecordingIntent(false);
        setIsSending(false);
        setMode("idle");
        setVoiceStatus("Não consegui processar o áudio. Verifique a permissão do microfone.");
      }
      return;
    }

    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      setVoiceStatus("Permita o microfone para conversar por voz.");
      return;
    }
    try {
      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecordingIntent(true);
      setVoiceStatus("ouvindo… toque para parar");
      setMode("listening");
    } catch {
      setVoiceStatus("Não consegui iniciar o microfone neste aparelho.");
    }
  };

  const replayLast = () => {
    const lastAssistant = [...messages].reverse().find((message) => message.role === "assistant");
    if (lastAssistant) {
      speakJarvis(lastAssistant.text);
      setMode("speaking");
      setTimeout(() => setMode("idle"), 1800);
    }
  };

  return (
    <ScreenContainer containerClassName="bg-[#07111F]" safeAreaClassName="bg-[#07111F]" edges={["top", "left", "right"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView ref={scrollRef} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <View>
              <View style={styles.eyebrowRow}>
                <View style={styles.onlineDot} />
                <Text style={styles.eyebrow}>JARVIS CORE · LOCAL-FIRST</Text>
              </View>
              <Text style={styles.title}>{greeting}.</Text>
              <Text style={styles.subtitle}>{preferences.displayName ? `${preferences.displayName}, ` : ""}vamos deixar o dia mais claro.</Text>
            </View>
            <Pressable onPress={() => router.push("/profile")} style={styles.profileButton} accessibilityLabel="Abrir perfil e privacidade">
              <MaterialIcons name="tune" size={20} color={colors.cyan} />
            </Pressable>
          </View>

          <View style={styles.orbStage}>
            <View style={styles.orbGlow} />
            <JarvisOrb mode={mode} />
            <Text style={styles.orbHint}>{hydrated ? "presença pronta" : "sincronizando local"}</Text>
          </View>

          <View style={styles.signalRow}>
            <View style={styles.signalCard}>
              <Text style={styles.signalLabel}>PENDÊNCIAS</Text>
              <Text style={styles.signalValue}>{pendingTasks.length.toString().padStart(2, "0")}</Text>
              <Text style={styles.signalCaption}>{pendingTasks.length === 1 ? "próximo passo" : "próximos passos"}</Text>
            </View>
            <View style={styles.signalCard}>
              <Text style={styles.signalLabel}>MEMÓRIA</Text>
              <Text style={styles.signalValue}>{memories.length.toString().padStart(2, "0")}</Text>
              <Text style={styles.signalCaption}>itens locais</Text>
            </View>
            <View style={[styles.signalCard, styles.privacySignal]}>
              <MaterialIcons name="lock-outline" size={16} color={colors.cyan} />
              <Text style={styles.signalCaption}>privacidade</Text>
              <Text style={styles.privacyValue}>{preferences.privacyMode === "local" ? "local" : "contextual"}</Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Conversa</Text>
            <Text style={styles.sectionMeta}>{isSending ? "processando" : "agora"}</Text>
          </View>

          <View style={styles.chatPanel}>
            {recentMessages.map((message) => (
              <View key={message.id} style={[styles.messageRow, message.role === "user" && styles.userMessageRow]}>
                {message.role === "assistant" && <JarvisOrb mode={message.fallback ? "idle" : "speaking"} compact />}
                <View style={[styles.bubble, message.role === "user" ? styles.userBubble : styles.assistantBubble]}>
                  <Text style={[styles.messageText, message.role === "user" && styles.userMessageText]}>{message.text}</Text>
                  <View style={styles.messageMetaRow}>
                    {message.fallback && <Text style={styles.fallbackLabel}>modo reserva</Text>}
                    <Text style={[styles.messageTime, message.role === "user" && styles.userMessageTime]}>{formatTime(message.createdAt)}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActions}>
            <Pressable onPress={() => submit("Me ajude a organizar minhas prioridades de hoje.")} style={styles.quickAction}>
              <MaterialIcons name="auto-awesome" size={16} color={colors.cyan} />
              <Text style={styles.quickText}>Planejar meu dia</Text>
            </Pressable>
            <Pressable onPress={() => router.push("/memory")} style={styles.quickAction}>
              <MaterialIcons name="bookmark-border" size={16} color={colors.violet} />
              <Text style={styles.quickText}>Guardar memória</Text>
            </Pressable>
            <Pressable onPress={() => router.push("/tasks")} style={styles.quickAction}>
              <MaterialIcons name="check-circle-outline" size={16} color={colors.cyan} />
              <Text style={styles.quickText}>Ver tarefas</Text>
            </Pressable>
          </ScrollView>
        </ScrollView>

        <View style={styles.composerShell}>
          <View style={styles.composer}>
            <TextInput
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => submit()}
              placeholder="Fale com sua assistente..."
              placeholderTextColor="#6C86A3"
              style={styles.input}
              multiline
              maxLength={1200}
              editable={!isSending}
              returnKeyType="send"
            />
            <Pressable onPress={toggleVoice} style={[styles.iconButton, isRecording && styles.recordingButton]} accessibilityLabel={isRecording ? "Parar gravação" : "Falar com Jarvis"}>
              <MaterialIcons name={isRecording ? "stop" : "mic-none"} size={21} color={isRecording ? colors.ink : colors.muted} />
            </Pressable>
            <Pressable onPress={replayLast} style={styles.iconButton} accessibilityLabel="Ouvir última resposta">
              <MaterialIcons name="volume-up" size={21} color={colors.muted} />
            </Pressable>
            <Pressable onPress={() => submit()} disabled={!input.trim() || isSending} style={[styles.sendButton, (!input.trim() || isSending) && styles.sendButtonDisabled]} accessibilityLabel="Enviar mensagem">
              <MaterialIcons name="arrow-upward" size={21} color={colors.ink} />
            </Pressable>
          </View>
          <Text style={styles.composerNote}>{voiceStatus || "Ações sensíveis sempre pedem sua confirmação."}</Text>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 18, gap: 18 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  eyebrowRow: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 10 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.cyan, shadowColor: colors.cyan, shadowOpacity: 0.9, shadowRadius: 6 },
  eyebrow: { color: colors.muted, fontSize: 10, letterSpacing: 1.35, fontWeight: "700" },
  title: { color: colors.text, fontSize: 32, lineHeight: 37, fontWeight: "800", letterSpacing: -0.8 },
  subtitle: { color: colors.muted, fontSize: 14, marginTop: 3 },
  profileButton: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(120,243,229,0.08)", borderWidth: 1, borderColor: "rgba(120,243,229,0.18)" },
  orbStage: { height: 185, alignItems: "center", justifyContent: "center", marginTop: -2 },
  orbGlow: { position: "absolute", width: 150, height: 90, borderRadius: 80, backgroundColor: "rgba(78, 205, 230, 0.08)", transform: [{ scaleX: 1.7 }], shadowColor: colors.violet, shadowOpacity: 0.36, shadowRadius: 40 },
  orbHint: { color: colors.muted, fontSize: 11, marginTop: 20, letterSpacing: 0.8 },
  signalRow: { flexDirection: "row", gap: 8 },
  signalCard: { flex: 1, minHeight: 84, padding: 12, borderRadius: 16, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line },
  privacySignal: { alignItems: "flex-start", justifyContent: "space-between" },
  signalLabel: { color: colors.muted, fontSize: 9, letterSpacing: 1.1, fontWeight: "700" },
  signalValue: { color: colors.text, fontSize: 25, fontWeight: "800", marginTop: 6 },
  signalCaption: { color: colors.muted, fontSize: 11 },
  privacyValue: { color: colors.cyan, fontSize: 12, fontWeight: "700" },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: "800" },
  sectionMeta: { color: colors.cyan, fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase" },
  chatPanel: { gap: 14 },
  messageRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, maxWidth: "94%" },
  userMessageRow: { alignSelf: "flex-end" },
  bubble: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 18, flexShrink: 1 },
  assistantBubble: { backgroundColor: colors.panel, borderTopLeftRadius: 5, borderWidth: 1, borderColor: colors.line },
  userBubble: { backgroundColor: colors.cyan, borderBottomRightRadius: 5 },
  messageText: { color: colors.text, fontSize: 14, lineHeight: 20 },
  userMessageText: { color: colors.ink, fontWeight: "600" },
  messageMetaRow: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: 8, marginTop: 6 },
  messageTime: { color: "#67809D", fontSize: 9 },
  userMessageTime: { color: "rgba(7,17,31,0.58)" },
  fallbackLabel: { color: "#C7A9FF", fontSize: 9, textTransform: "uppercase", letterSpacing: 0.6 },
  quickActions: { gap: 8, paddingVertical: 2 },
  quickAction: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line },
  quickText: { color: colors.text, fontSize: 12, fontWeight: "600" },
  composerShell: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: Platform.OS === "web" ? 12 : 6, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.ink },
  composer: { flexDirection: "row", alignItems: "flex-end", gap: 8, padding: 7, borderRadius: 18, backgroundColor: colors.panel, borderWidth: 1, borderColor: "rgba(120,243,229,0.2)" },
  input: { flex: 1, minHeight: 42, maxHeight: 92, color: colors.text, fontSize: 14, paddingHorizontal: 8, paddingTop: 10, paddingBottom: 8 },
  iconButton: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  recordingButton: { borderRadius: 12, backgroundColor: colors.cyan },
  sendButton: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: colors.cyan },
  sendButtonDisabled: { opacity: 0.35 },
  composerNote: { color: "#5E7896", fontSize: 10, textAlign: "center", marginTop: 7 },
});
