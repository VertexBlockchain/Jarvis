import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import { ScreenContainer } from "@/components/screen-container";
import { useJarvisStore, type MemoryCategory, type MemoryOrigin } from "@/hooks/use-jarvis-store";
import { analyzeJarvisScreenshot } from "@/lib/jarvis-api";

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

const categories: { label: string; value: MemoryCategory }[] = [
  { label: "Pessoal", value: "pessoal" },
  { label: "Trabalho", value: "trabalho" },
  { label: "Preferência", value: "preferência" },
  { label: "Objetivo", value: "objetivo" },
];

type SelectedCapture = { uri: string; base64: string; mimeType: "image/jpeg" };

export default function MemoryScreen() {
  const {
    memories,
    preferences,
    addMemory,
    updateMemory,
    setMemoryShareWithAI,
    deleteMemory,
    clearMemories,
  } = useJarvisStore();
  const [text, setText] = useState("");
  const [category, setCategory] = useState<MemoryCategory>("pessoal");
  const [showAll, setShowAll] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftOrigin, setDraftOrigin] = useState<MemoryOrigin>("manual");
  const [capture, setCapture] = useState<SelectedCapture | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [notice, setNotice] = useState("");
  const visibleMemories = useMemo(() => (showAll ? memories : memories.slice(0, 5)), [memories, showAll]);

  const resetEditor = () => {
    setText("");
    setCategory("pessoal");
    setEditingId(null);
    setDraftOrigin("manual");
    setCapture(null);
  };

  const chooseCapture = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        base64: true,
        quality: 0.65,
        exif: false,
      });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      if (!asset.base64) {
        setNotice("Não consegui ler essa imagem. Você ainda pode guardar uma nota manualmente.");
        return;
      }
      if (asset.base64.length > 8 * 1024 * 1024) {
        setNotice("Essa captura ficou grande demais. Escolha outra imagem ou corte a parte relevante.");
        return;
      }
      // Expo ImagePicker returns its base64 image data as JPEG, regardless of the library asset's original format.
      setCapture({ uri: asset.uri, base64: asset.base64, mimeType: "image/jpeg" });
      setDraftOrigin("manual");
      setEditingId(null);
      setText("");
      setNotice("Captura selecionada. Ela só será enviada se você tocar em “Enviar para análise”.");
    } catch {
      setNotice("Não consegui abrir as imagens deste aparelho agora.");
    }
  };

  const analyzeCapture = async () => {
    if (!capture?.base64) return;
    setIsAnalyzing(true);
    setNotice("Enviando a captura ao núcleo de IA para análise…");
    const result = await analyzeJarvisScreenshot(capture.base64, capture.mimeType);
    setIsAnalyzing(false);
    if (result.fallback) {
      setNotice(result.text);
      return;
    }
    setText(result.text.trim());
    setDraftOrigin("screenshot");
    setCapture((current) => (current ? { ...current, base64: "" } : null));
    setNotice("Sugestão pronta. Revise ou edite o texto antes de guardar; a captura não será salva no cofre.");
  };

  const save = () => {
    if (!text.trim()) return;
    if (editingId) {
      updateMemory(editingId, text, category);
      setNotice("Contexto atualizado.");
    } else {
      addMemory(text, category, draftOrigin);
      setNotice("Contexto guardado neste aparelho. O uso pela IA continua desligado por padrão.");
    }
    resetEditor();
  };

  const editMemory = (memory: (typeof memories)[number]) => {
    setEditingId(memory.id);
    setText(memory.text);
    setCategory(memory.category);
    setDraftOrigin(memory.origin);
    setCapture(null);
    setNotice("Edite o texto e salve para atualizar este item.");
  };

  const removeMemory = (id: string) => {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm("Apagar este contexto do aparelho?")) deleteMemory(id);
      return;
    }
    Alert.alert("Apagar contexto?", "Este item será removido do Cofre neste aparelho.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Apagar", style: "destructive", onPress: () => deleteMemory(id) },
    ]);
  };

  const clear = () => {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm("Apagar todas as memórias do cofre neste aparelho?")) {
        clearMemories();
      }
      return;
    }
    Alert.alert("Apagar tudo?", "Todos os itens do Cofre de Contexto serão removidos deste aparelho.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Apagar", style: "destructive", onPress: clearMemories },
    ]);
  };

  return (
    <ScreenContainer containerClassName="bg-[#07111F]" safeAreaClassName="bg-[#07111F]" edges={["top", "left", "right"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.eyebrowRow}>
            <MaterialIcons name="lock-outline" size={15} color={colors.cyan} />
            <Text style={styles.eyebrow}>COFRE DE CONTEXTO · SOB SEU CONTROLE</Text>
          </View>
          <Text style={styles.title}>O que vale a pena não perder.</Text>
          <Text style={styles.subtitle}>
            Guarde notas ou peça uma leitura de uma captura. Nada entra automaticamente; você revisa cada sugestão antes de salvar.
          </Text>

          <View style={styles.noticeCard}>
            <View style={styles.noticeIcon}>
              <MaterialIcons name="shield" size={18} color={colors.cyan} />
            </View>
            <View style={styles.noticeCopy}>
              <Text style={styles.noticeTitle}>A captura só sai do aparelho quando você pedir</Text>
              <Text style={styles.noticeText}>
                Ao tocar em “Enviar para análise”, a imagem é enviada ao serviço de IA configurado. O Cofre deste aparelho guarda somente o texto que você revisar e salvar; a captura não vira memória.
              </Text>
            </View>
          </View>

          <View style={styles.editorCard}>
            <View style={styles.editorHeading}>
              <Text style={styles.cardLabel}>{editingId ? "EDITAR CONTEXTO" : "ADICIONAR AO COFRE"}</Text>
              {draftOrigin === "screenshot" && !editingId ? (
                <View style={styles.sourceBadge}>
                  <MaterialIcons name="image-search" size={13} color={colors.cyan} />
                  <Text style={styles.sourceBadgeText}>captura analisada</Text>
                </View>
              ) : null}
            </View>

            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Ex.: prefiro resolver reuniões pela manhã"
              placeholderTextColor="#6C86A3"
              multiline
              style={styles.input}
              maxLength={1200}
              accessibilityLabel="Texto do contexto para guardar"
            />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {categories.map((item) => (
                <Pressable
                  key={item.value}
                  onPress={() => setCategory(item.value)}
                  style={[styles.chip, category === item.value && styles.chipActive]}
                >
                  <Text style={[styles.chipText, category === item.value && styles.chipTextActive]}>{item.label}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {capture ? (
              <View style={styles.capturePreview}>
                <Image source={{ uri: capture.uri }} style={styles.captureImage} resizeMode="cover" />
                <View style={styles.captureCopy}>
                  <Text style={styles.captureTitle}>Captura escolhida</Text>
                  <Text style={styles.captureText}>Nenhuma imagem será enviada até você confirmar abaixo.</Text>
                  <Pressable onPress={() => setCapture(null)} accessibilityLabel="Remover captura escolhida" style={styles.removeCapture}>
                    <MaterialIcons name="close" size={15} color={colors.muted} />
                    <Text style={styles.removeCaptureText}>Remover</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            {!editingId ? (
              <Pressable onPress={chooseCapture} disabled={isAnalyzing} style={styles.secondaryButton} accessibilityLabel="Escolher uma captura de tela salva no aparelho">
                <MaterialIcons name="image-search" size={18} color={colors.cyan} />
                <Text style={styles.secondaryButtonText}>{capture ? "Escolher outra captura" : "Escolher uma captura de tela"}</Text>
              </Pressable>
            ) : null}

            {capture?.base64 ? (
              <Pressable onPress={analyzeCapture} disabled={isAnalyzing} style={[styles.analyzeButton, isAnalyzing && styles.disabled]} accessibilityLabel="Enviar a captura selecionada para análise de IA">
                {isAnalyzing ? <ActivityIndicator color={colors.ink} /> : <MaterialIcons name="auto-awesome" size={18} color={colors.ink} />}
                <Text style={styles.analyzeButtonText}>{isAnalyzing ? "Analisando captura…" : "Enviar para análise"}</Text>
              </Pressable>
            ) : null}

            <Pressable onPress={save} disabled={!text.trim() || isAnalyzing} style={[styles.primaryButton, (!text.trim() || isAnalyzing) && styles.disabled]}>
              <MaterialIcons name={editingId ? "save" : "add"} size={18} color={colors.ink} />
              <Text style={styles.primaryButtonText}>{editingId ? "Salvar alterações" : "Guardar no cofre"}</Text>
            </Pressable>
            {editingId ? (
              <Pressable onPress={resetEditor} style={styles.cancelEditButton}>
                <Text style={styles.cancelEditText}>Cancelar edição</Text>
              </Pressable>
            ) : null}
            {notice ? <Text style={styles.inlineNotice}>{notice}</Text> : null}
          </View>

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Seus contextos</Text>
              <Text style={styles.sectionHint}>Use a chave de cada item para permitir ou bloquear o envio à IA.</Text>
            </View>
            <Text style={styles.count}>{memories.length.toString().padStart(2, "0")}</Text>
          </View>

          {visibleMemories.length === 0 ? (
            <View style={styles.empty}>
              <MaterialIcons name="lightbulb-outline" size={25} color={colors.violet} />
              <Text style={styles.emptyTitle}>Seu cofre está vazio</Text>
              <Text style={styles.emptyText}>Comece com uma preferência, um objetivo ou uma captura que você queira retomar depois.</Text>
            </View>
          ) : visibleMemories.map((memory) => (
            <View key={memory.id} style={styles.memoryCard}>
              <View style={styles.memoryTop}>
                <View style={styles.badges}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{memory.category}</Text>
                  </View>
                  <View style={styles.originBadge}>
                    <MaterialIcons name={memory.origin === "screenshot" ? "image-search" : "edit-note"} size={12} color={colors.muted} />
                    <Text style={styles.originText}>{memory.origin === "screenshot" ? "captura analisada" : "adicionada por você"}</Text>
                  </View>
                </View>
                <Pressable onPress={() => removeMemory(memory.id)} accessibilityLabel="Apagar contexto" style={styles.smallIconButton}>
                  <MaterialIcons name="close" size={18} color={colors.muted} />
                </Pressable>
              </View>
              <Text style={styles.memoryText}>{memory.text}</Text>
              <View style={styles.memoryFooter}>
                <View style={styles.shareCopy}>
                  <Text style={styles.shareTitle}>Permitir uso em respostas</Text>
                  <Text style={styles.shareHint}>
                    {memory.shareWithAI
                      ? preferences.privacyMode === "contextual" ? "Ativo no modo contextual" : "Autorizado; depende do modo contextual no Perfil"
                      : "Desativado; este item não acompanha conversas"}
                  </Text>
                </View>
                <Switch
                  value={memory.shareWithAI}
                  onValueChange={(enabled) => setMemoryShareWithAI(memory.id, enabled)}
                  trackColor={{ false: "#24384F", true: "#3ABCAF" }}
                  thumbColor={memory.shareWithAI ? colors.cyan : "#8EA8C5"}
                  accessibilityLabel={`Permitir uso de ${memory.category} pela IA`}
                />
              </View>
              <View style={styles.cardActions}>
                <Text style={styles.memoryDate}>{new Date(memory.createdAt).toLocaleDateString("pt-BR")} · armazenado neste aparelho</Text>
                <Pressable onPress={() => editMemory(memory)} accessibilityLabel="Editar contexto" style={styles.editButton}>
                  <MaterialIcons name="edit" size={14} color={colors.cyan} />
                  <Text style={styles.editText}>Editar</Text>
                </Pressable>
              </View>
            </View>
          ))}

          {memories.length > 5 ? (
            <Pressable onPress={() => setShowAll((value) => !value)} style={styles.linkButton}>
              <Text style={styles.linkText}>{showAll ? "Mostrar menos" : `Ver todos os ${memories.length} contextos`}</Text>
            </Pressable>
          ) : null}
          {memories.length > 0 ? (
            <Pressable onPress={clear} style={styles.clearButton}>
              <MaterialIcons name="delete-outline" size={17} color="#F39AA9" />
              <Text style={styles.clearText}>Apagar todo o cofre</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 18, paddingBottom: 30, gap: 16 },
  eyebrowRow: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 2 },
  eyebrow: { color: colors.cyan, fontSize: 10, letterSpacing: 1.15, fontWeight: "700" },
  title: { color: colors.text, fontSize: 29, lineHeight: 35, fontWeight: "800", letterSpacing: -0.7 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: -8 },
  noticeCard: { flexDirection: "row", gap: 11, padding: 14, borderRadius: 17, backgroundColor: "rgba(120,243,229,0.07)", borderWidth: 1, borderColor: "rgba(120,243,229,0.18)" },
  noticeIcon: { width: 33, height: 33, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(120,243,229,0.1)" },
  noticeCopy: { flex: 1, gap: 4 },
  noticeTitle: { color: colors.text, fontSize: 13, fontWeight: "800" },
  noticeText: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  editorCard: { padding: 15, borderRadius: 19, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line, gap: 12 },
  editorHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  cardLabel: { color: colors.muted, fontSize: 10, letterSpacing: 1.2, fontWeight: "700" },
  sourceBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, backgroundColor: "rgba(120,243,229,0.09)" },
  sourceBadgeText: { color: colors.cyan, fontSize: 9, fontWeight: "700" },
  input: { minHeight: 68, color: colors.text, fontSize: 14, lineHeight: 20, paddingTop: 0, textAlignVertical: "top" },
  chips: { gap: 7 },
  chip: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: colors.line },
  chipActive: { backgroundColor: "rgba(167,131,255,0.16)", borderColor: "rgba(167,131,255,0.5)" },
  chipText: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  chipTextActive: { color: "#D5C7FF" },
  capturePreview: { flexDirection: "row", gap: 12, alignItems: "center", padding: 9, borderRadius: 14, backgroundColor: colors.panelSoft },
  captureImage: { width: 70, height: 70, borderRadius: 10, backgroundColor: colors.ink },
  captureCopy: { flex: 1, gap: 4 },
  captureTitle: { color: colors.text, fontSize: 12, fontWeight: "800" },
  captureText: { color: colors.muted, fontSize: 10, lineHeight: 15 },
  removeCapture: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", paddingTop: 2 },
  removeCaptureText: { color: colors.muted, fontSize: 10, fontWeight: "700" },
  secondaryButton: { minHeight: 43, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingHorizontal: 12, borderRadius: 13, borderWidth: 1, borderColor: "rgba(120,243,229,0.28)" },
  secondaryButtonText: { color: colors.cyan, fontSize: 12, fontWeight: "800" },
  analyzeButton: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingHorizontal: 12, borderRadius: 13, backgroundColor: "#B8FFF4" },
  analyzeButtonText: { color: colors.ink, fontSize: 12, fontWeight: "800" },
  primaryButton: { minHeight: 44, borderRadius: 13, flexDirection: "row", gap: 7, alignItems: "center", justifyContent: "center", backgroundColor: colors.cyan },
  primaryButtonText: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  disabled: { opacity: 0.4 },
  cancelEditButton: { alignItems: "center", paddingVertical: 4 },
  cancelEditText: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  inlineNotice: { color: colors.muted, fontSize: 11, lineHeight: 16, textAlign: "center" },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: "800" },
  sectionHint: { color: colors.muted, fontSize: 10, lineHeight: 14, maxWidth: 265, marginTop: 3 },
  count: { color: colors.cyan, fontSize: 12, fontWeight: "800" },
  empty: { alignItems: "center", padding: 25, borderRadius: 18, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line, gap: 7 },
  emptyTitle: { color: colors.text, fontWeight: "800", fontSize: 15 },
  emptyText: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: "center", maxWidth: 285 },
  memoryCard: { padding: 14, borderRadius: 17, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line, gap: 10 },
  memoryTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  badges: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6, flex: 1 },
  categoryBadge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 9, backgroundColor: "rgba(167,131,255,0.12)" },
  categoryText: { color: "#CBB8FF", fontSize: 9, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.6 },
  originBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 7, paddingVertical: 5, borderRadius: 9, backgroundColor: "rgba(142,168,197,0.08)" },
  originText: { color: colors.muted, fontSize: 9, fontWeight: "700" },
  smallIconButton: { padding: 2 },
  memoryText: { color: colors.text, fontSize: 14, lineHeight: 20 },
  memoryFooter: { flexDirection: "row", alignItems: "center", gap: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.line },
  shareCopy: { flex: 1, gap: 3 },
  shareTitle: { color: colors.text, fontSize: 11, fontWeight: "700" },
  shareHint: { color: colors.muted, fontSize: 9, lineHeight: 13 },
  cardActions: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  memoryDate: { color: "#5E7896", fontSize: 9, flex: 1 },
  editButton: { flexDirection: "row", alignItems: "center", gap: 4, padding: 4 },
  editText: { color: colors.cyan, fontSize: 10, fontWeight: "800" },
  linkButton: { alignItems: "center", paddingVertical: 6 },
  linkText: { color: colors.cyan, fontSize: 12, fontWeight: "700" },
  clearButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10 },
  clearText: { color: "#F39AA9", fontSize: 11, fontWeight: "700" },
});
