import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { ScreenContainer } from "@/components/screen-container";
import { useJarvisStore, type MemoryCategory } from "@/hooks/use-jarvis-store";

const colors = { ink: "#07111F", panel: "#0D1B2D", text: "#EDF7FF", muted: "#8EA8C5", cyan: "#78F3E5", violet: "#A783FF", line: "rgba(155, 190, 220, 0.15)" };
const categories: { label: string; value: MemoryCategory }[] = [
  { label: "Pessoal", value: "pessoal" },
  { label: "Trabalho", value: "trabalho" },
  { label: "Preferência", value: "preferência" },
  { label: "Objetivo", value: "objetivo" },
];

export default function MemoryScreen() {
  const { memories, addMemory, deleteMemory, clearMemories } = useJarvisStore();
  const [text, setText] = useState("");
  const [category, setCategory] = useState<MemoryCategory>("pessoal");
  const [showAll, setShowAll] = useState(false);
  const visibleMemories = useMemo(() => (showAll ? memories : memories.slice(0, 5)), [memories, showAll]);

  const save = () => {
    if (!text.trim()) return;
    addMemory(text, category);
    setText("");
  };

  const clear = () => {
    const confirmed = Platform.OS === "web" ? window.confirm("Apagar todas as memórias locais?") : true;
    if (confirmed) clearMemories();
  };

  return (
    <ScreenContainer containerClassName="bg-[#07111F]" safeAreaClassName="bg-[#07111F]" edges={["top", "left", "right"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.eyebrowRow}><MaterialIcons name="lock-outline" size={15} color={colors.cyan} /><Text style={styles.eyebrow}>MEMÓRIA · LOCAL POR PADRÃO</Text></View>
          <Text style={styles.title}>O que importa para você.</Text>
          <Text style={styles.subtitle}>Guarde apenas o que quiser. Nada entra aqui automaticamente a partir das conversas.</Text>

          <View style={styles.notice}>
            <View style={styles.noticeIcon}><MaterialIcons name="shield" size={18} color={colors.cyan} /></View>
            <View style={styles.noticeCopy}><Text style={styles.noticeTitle}>Você está no controle</Text><Text style={styles.noticeText}>Memórias ficam neste aparelho. No modo contextual, você decide quando elas ajudam uma resposta.</Text></View>
          </View>

          <View style={styles.editorCard}>
            <Text style={styles.cardLabel}>NOVA MEMÓRIA</Text>
            <TextInput value={text} onChangeText={setText} placeholder="Ex.: prefiro resolver reuniões pela manhã" placeholderTextColor="#6C86A3" multiline style={styles.input} maxLength={240} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {categories.map((item) => <Pressable key={item.value} onPress={() => setCategory(item.value)} style={[styles.chip, category === item.value && styles.chipActive]}><Text style={[styles.chipText, category === item.value && styles.chipTextActive]}>{item.label}</Text></Pressable>)}
            </ScrollView>
            <Pressable onPress={save} disabled={!text.trim()} style={[styles.primaryButton, !text.trim() && styles.disabled]}><MaterialIcons name="add" size={18} color={colors.ink} /><Text style={styles.primaryButtonText}>Guardar no Jarvis</Text></Pressable>
          </View>

          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Suas memórias</Text><Text style={styles.count}>{memories.length.toString().padStart(2, "0")}</Text></View>
          {visibleMemories.length === 0 ? <View style={styles.empty}><MaterialIcons name="lightbulb-outline" size={25} color={colors.violet} /><Text style={styles.emptyTitle}>Ainda não há memórias</Text><Text style={styles.emptyText}>Comece com uma preferência, um objetivo ou algo que queira retomar depois.</Text></View> : visibleMemories.map((memory) => (
            <View key={memory.id} style={styles.memoryCard}><View style={styles.memoryTop}><View style={styles.categoryBadge}><Text style={styles.categoryText}>{memory.category}</Text></View><Pressable onPress={() => deleteMemory(memory.id)} accessibilityLabel="Apagar memória"><MaterialIcons name="close" size={18} color={colors.muted} /></Pressable></View><Text style={styles.memoryText}>{memory.text}</Text><Text style={styles.memoryDate}>adicionada agora · somente neste dispositivo</Text></View>
          ))}
          {memories.length > 5 && <Pressable onPress={() => setShowAll((value) => !value)} style={styles.linkButton}><Text style={styles.linkText}>{showAll ? "Mostrar menos" : `Ver todas as ${memories.length} memórias`}</Text></Pressable>}
          {memories.length > 0 && <Pressable onPress={clear} style={styles.clearButton}><MaterialIcons name="delete-outline" size={17} color="#F39AA9" /><Text style={styles.clearText}>Apagar todas as memórias</Text></Pressable>}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, content: { padding: 18, paddingBottom: 30, gap: 16 }, eyebrowRow: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 10 }, eyebrow: { color: colors.cyan, fontSize: 10, letterSpacing: 1.25, fontWeight: "700" }, title: { color: colors.text, fontSize: 29, lineHeight: 35, fontWeight: "800", letterSpacing: -0.7 }, subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: -7 }, notice: { flexDirection: "row", gap: 11, padding: 14, borderRadius: 17, backgroundColor: "rgba(120,243,229,0.07)", borderWidth: 1, borderColor: "rgba(120,243,229,0.18)" }, noticeIcon: { width: 33, height: 33, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(120,243,229,0.1)" }, noticeCopy: { flex: 1, gap: 3 }, noticeTitle: { color: colors.text, fontSize: 13, fontWeight: "800" }, noticeText: { color: colors.muted, fontSize: 12, lineHeight: 17 }, editorCard: { padding: 15, borderRadius: 19, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line, gap: 12 }, cardLabel: { color: colors.muted, fontSize: 10, letterSpacing: 1.2, fontWeight: "700" }, input: { minHeight: 68, color: colors.text, fontSize: 14, lineHeight: 20, paddingTop: 0 }, chips: { gap: 7 }, chip: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: colors.line }, chipActive: { backgroundColor: "rgba(167,131,255,0.16)", borderColor: "rgba(167,131,255,0.5)" }, chipText: { color: colors.muted, fontSize: 11, fontWeight: "700" }, chipTextActive: { color: "#D5C7FF" }, primaryButton: { minHeight: 44, borderRadius: 13, flexDirection: "row", gap: 7, alignItems: "center", justifyContent: "center", backgroundColor: colors.cyan }, primaryButtonText: { color: colors.ink, fontSize: 13, fontWeight: "800" }, disabled: { opacity: 0.4 }, sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 }, sectionTitle: { color: colors.text, fontSize: 18, fontWeight: "800" }, count: { color: colors.cyan, fontSize: 12, fontWeight: "800" }, empty: { alignItems: "center", padding: 25, borderRadius: 18, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line, gap: 7 }, emptyTitle: { color: colors.text, fontWeight: "800", fontSize: 15 }, emptyText: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: "center", maxWidth: 285 }, memoryCard: { padding: 14, borderRadius: 17, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line, gap: 9 }, memoryTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, categoryBadge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 9, backgroundColor: "rgba(167,131,255,0.12)" }, categoryText: { color: "#CBB8FF", fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.7 }, memoryText: { color: colors.text, fontSize: 14, lineHeight: 20 }, memoryDate: { color: "#5E7896", fontSize: 10 }, linkButton: { alignItems: "center", paddingVertical: 6 }, linkText: { color: colors.cyan, fontSize: 12, fontWeight: "700" }, clearButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10 }, clearText: { color: "#F39AA9", fontSize: 12, fontWeight: "700" },
});
