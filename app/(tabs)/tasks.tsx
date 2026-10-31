import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { ScreenContainer } from "@/components/screen-container";
import { useJarvisStore } from "@/hooks/use-jarvis-store";

const colors = { ink: "#07111F", panel: "#0D1B2D", text: "#EDF7FF", muted: "#8EA8C5", cyan: "#78F3E5", violet: "#A783FF", line: "rgba(155, 190, 220, 0.15)" };

type Filter = "abertas" | "concluídas";

export default function TasksScreen() {
  const { tasks, addTask, toggleTask, deleteTask } = useJarvisStore();
  const [title, setTitle] = useState("");
  const [filter, setFilter] = useState<Filter>("abertas");
  const pending = tasks.filter((task) => !task.completed).length;
  const visibleTasks = useMemo(() => tasks.filter((task) => (filter === "abertas" ? !task.completed : task.completed)), [filter, tasks]);

  const save = () => {
    if (!title.trim()) return;
    addTask(title);
    setTitle("");
  };

  return (
    <ScreenContainer containerClassName="bg-[#07111F]" safeAreaClassName="bg-[#07111F]" edges={["top", "left", "right"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.eyebrowRow}><MaterialIcons name="check-circle-outline" size={15} color={colors.cyan} /><Text style={styles.eyebrow}>TAREFAS · PRÓXIMO PASSO</Text></View>
          <View style={styles.titleRow}><View><Text style={styles.title}>Menos ruído.</Text><Text style={styles.titleAccent}>Mais continuidade.</Text></View><View style={styles.counter}><Text style={styles.counterValue}>{pending.toString().padStart(2, "0")}</Text><Text style={styles.counterLabel}>abertas</Text></View></View>
          <Text style={styles.subtitle}>Deixe o Jarvis acompanhar o que não pode escapar — sem assumir o controle por você.</Text>

          <View style={styles.editorCard}><TextInput value={title} onChangeText={setTitle} onSubmitEditing={save} placeholder="Adicionar um próximo passo..." placeholderTextColor="#6C86A3" style={styles.input} maxLength={160} /><Pressable onPress={save} disabled={!title.trim()} style={[styles.addButton, !title.trim() && styles.disabled]}><MaterialIcons name="add" size={22} color={colors.ink} /></Pressable></View>

          <View style={styles.filterRow}><Pressable onPress={() => setFilter("abertas")} style={[styles.filter, filter === "abertas" && styles.filterActive]}><Text style={[styles.filterText, filter === "abertas" && styles.filterTextActive]}>Abertas</Text></Pressable><Pressable onPress={() => setFilter("concluídas")} style={[styles.filter, filter === "concluídas" && styles.filterActive]}><Text style={[styles.filterText, filter === "concluídas" && styles.filterTextActive]}>Concluídas</Text></Pressable></View>

          {visibleTasks.length === 0 ? <View style={styles.empty}><MaterialIcons name={filter === "abertas" ? "wb-sunny" : "done-all"} size={26} color={colors.violet} /><Text style={styles.emptyTitle}>{filter === "abertas" ? "Tudo limpo por aqui" : "Nada concluído ainda"}</Text><Text style={styles.emptyText}>{filter === "abertas" ? "Adicione uma tarefa pequena. Clareza costuma começar pelo próximo passo." : "Quando você concluir algo, ele aparece nesta visão."}</Text></View> : visibleTasks.map((task) => (
            <View key={task.id} style={[styles.taskCard, task.completed && styles.taskDone]}><Pressable onPress={() => toggleTask(task.id)} style={[styles.checkbox, task.completed && styles.checkboxDone]} accessibilityLabel={task.completed ? "Reabrir tarefa" : "Concluir tarefa"}>{task.completed && <MaterialIcons name="check" size={16} color={colors.ink} />}</Pressable><View style={styles.taskCopy}><Text style={[styles.taskTitle, task.completed && styles.taskTitleDone]}>{task.title}</Text><Text style={styles.taskMeta}>{task.completed ? "concluída agora" : task.dueLabel ?? "sem prazo · local"}</Text></View><Pressable onPress={() => deleteTask(task.id)} accessibilityLabel="Apagar tarefa"><MaterialIcons name="more-vert" size={20} color={colors.muted} /></Pressable></View>
          ))}

          <View style={styles.footerNote}><MaterialIcons name="info-outline" size={16} color={colors.muted} /><Text style={styles.footerText}>Neste MVP, as tarefas são locais. Calendário e lembretes nativos entram na próxima fase.</Text></View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, content: { padding: 18, paddingBottom: 30, gap: 16 }, eyebrowRow: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 8 }, eyebrow: { color: colors.cyan, fontSize: 10, letterSpacing: 1.2, fontWeight: "700" }, titleRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }, title: { color: colors.text, fontSize: 30, lineHeight: 34, fontWeight: "800", letterSpacing: -0.8 }, titleAccent: { color: colors.violet, fontSize: 30, lineHeight: 34, fontWeight: "800", letterSpacing: -0.8 }, subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: -5 }, counter: { alignItems: "flex-end", paddingTop: 3 }, counterValue: { color: colors.cyan, fontSize: 30, fontWeight: "800" }, counterLabel: { color: colors.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }, editorCard: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: 8, padding: 7, paddingLeft: 15, backgroundColor: colors.panel, borderRadius: 17, borderWidth: 1, borderColor: "rgba(120,243,229,0.2)" }, input: { flex: 1, color: colors.text, fontSize: 14, paddingVertical: 10 }, addButton: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: colors.cyan }, disabled: { opacity: 0.35 }, filterRow: { flexDirection: "row", gap: 8 }, filter: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 11, borderWidth: 1, borderColor: colors.line }, filterActive: { backgroundColor: "rgba(167,131,255,0.15)", borderColor: "rgba(167,131,255,0.45)" }, filterText: { color: colors.muted, fontSize: 12, fontWeight: "700" }, filterTextActive: { color: "#D7CBFF" }, empty: { alignItems: "center", padding: 28, borderRadius: 18, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line, gap: 7 }, emptyTitle: { color: colors.text, fontWeight: "800", fontSize: 15 }, emptyText: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: "center", maxWidth: 285 }, taskCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 17, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line }, taskDone: { opacity: 0.68 }, checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 1.5, borderColor: "rgba(120,243,229,0.5)", alignItems: "center", justifyContent: "center" }, checkboxDone: { backgroundColor: colors.cyan, borderColor: colors.cyan }, taskCopy: { flex: 1, gap: 4 }, taskTitle: { color: colors.text, fontSize: 14, fontWeight: "700", lineHeight: 19 }, taskTitleDone: { textDecorationLine: "line-through", color: colors.muted }, taskMeta: { color: colors.muted, fontSize: 10 }, footerNote: { flexDirection: "row", alignItems: "flex-start", gap: 7, paddingTop: 4 }, footerText: { flex: 1, color: colors.muted, fontSize: 11, lineHeight: 16 },
});
