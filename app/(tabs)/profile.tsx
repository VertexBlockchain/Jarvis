import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { ScreenContainer } from "@/components/screen-container";
import { JarvisOrb } from "@/components/jarvis-orb";
import { useJarvisStore, type PrivacyMode } from "@/hooks/use-jarvis-store";

const colors = { ink: "#07111F", panel: "#0D1B2D", text: "#EDF7FF", muted: "#8EA8C5", cyan: "#78F3E5", violet: "#A783FF", line: "rgba(155, 190, 220, 0.15)" };

export default function ProfileScreen() {
  const { preferences, updatePreferences, clearAllData } = useJarvisStore();

  const clear = () => {
    if (Platform.OS === "web") {
      if (window.confirm("Apagar histórico, memórias e tarefas deste dispositivo?")) clearAllData();
      return;
    }
    Alert.alert("Apagar tudo?", "Histórico, memórias e tarefas serão removidos deste dispositivo.", [{ text: "Cancelar", style: "cancel" }, { text: "Apagar", style: "destructive", onPress: clearAllData }]);
  };

  const choosePrivacy = (mode: PrivacyMode) => updatePreferences({ privacyMode: mode });

  return (
    <ScreenContainer containerClassName="bg-[#07111F]" safeAreaClassName="bg-[#07111F]" edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}><View><View style={styles.eyebrowRow}><View style={styles.onlineDot} /><Text style={styles.eyebrow}>PERFIL · CONTROLES</Text></View><Text style={styles.title}>Seu Jarvis, suas regras.</Text></View><JarvisOrb mode="idle" compact /></View>

        <View style={styles.identityCard}><View style={styles.avatar}><MaterialIcons name="auto-awesome" size={23} color={colors.ink} /></View><View style={styles.identityCopy}><Text style={styles.identityTitle}>{preferences.displayName || "Presença local"}</Text><Text style={styles.identityText}>MVP privado · sem sincronização entre dispositivos</Text></View><Pressable onPress={() => updatePreferences({ displayName: preferences.displayName ? "" : "Meu Jarvis" })} accessibilityLabel="Editar nome"><MaterialIcons name="edit" size={18} color={colors.muted} /></Pressable></View>

        <Text style={styles.sectionTitle}>Como o contexto circula</Text>
        <View style={styles.privacyCard}><View style={styles.privacyHeader}><View style={styles.lockIcon}><MaterialIcons name="lock" size={17} color={colors.cyan} /></View><View style={styles.privacyCopy}><Text style={styles.cardTitle}>Memória local por padrão</Text><Text style={styles.cardText}>A mensagem atual e o contexto recente podem ser enviados ao núcleo de IA para gerar uma resposta. Suas memórias só entram quando você escolhe o modo contextual.</Text></View></View><View style={styles.modeRow}><Pressable onPress={() => choosePrivacy("local")} style={[styles.modeButton, preferences.privacyMode === "local" && styles.modeButtonActive]}><Text style={[styles.modeLabel, preferences.privacyMode === "local" && styles.modeLabelActive]}>Local-first</Text><Text style={styles.modeHint}>sem memórias no envio</Text></Pressable><Pressable onPress={() => choosePrivacy("contextual")} style={[styles.modeButton, preferences.privacyMode === "contextual" && styles.modeButtonActive]}><Text style={[styles.modeLabel, preferences.privacyMode === "contextual" && styles.modeLabelActive]}>Contextual</Text><Text style={styles.modeHint}>memórias autorizadas</Text></Pressable></View></View>

        <Text style={styles.sectionTitle}>Presença</Text>
        <View style={styles.settingsCard}><View style={styles.settingRow}><View style={styles.settingIcon}><MaterialIcons name="volume-up" size={19} color={colors.violet} /></View><View style={styles.settingCopy}><Text style={styles.settingTitle}>Ler respostas em voz</Text><Text style={styles.settingText}>Usa a voz do dispositivo quando disponível.</Text></View><Switch value={preferences.voiceEnabled} onValueChange={(value) => updatePreferences({ voiceEnabled: value })} trackColor={{ false: "#24384F", true: "#3ABCAF" }} thumbColor={preferences.voiceEnabled ? colors.cyan : "#8EA8C5"} /></View><View style={styles.divider} /><View style={styles.settingRow}><View style={styles.settingIcon}><MaterialIcons name="notifications-none" size={19} color={colors.violet} /></View><View style={styles.settingCopy}><Text style={styles.settingTitle}>Notificações e outros apps</Text><Text style={styles.settingText}>Leitura filtrada e bolha flutuante entram na próxima fase.</Text></View><View style={styles.comingSoon}><Text style={styles.comingSoonText}>em breve</Text></View></View></View>

        <Text style={styles.sectionTitle}>Transparência</Text>
        <View style={styles.transparencyCard}><View style={styles.bullet}><Text style={styles.bulletText}>01</Text></View><Text style={styles.transparencyText}>A assistente sugere e prepara. Ações sensíveis sempre precisam da sua confirmação.</Text><View style={styles.bullet}><Text style={styles.bulletText}>02</Text></View><Text style={styles.transparencyText}>Neste MVP, tarefas, histórico e memórias ficam neste aparelho.</Text><View style={styles.bullet}><Text style={styles.bulletText}>03</Text></View><Text style={styles.transparencyText}>Você pode apagar tudo a qualquer momento, sem depender de suporte.</Text></View>

        <Pressable onPress={clear} style={styles.clearButton}><MaterialIcons name="delete-outline" size={18} color="#F39AA9" /><Text style={styles.clearText}>Apagar todos os dados locais</Text></Pressable>
        <Text style={styles.version}>JARVIS MVP · núcleo 0.1 · feito para evoluir com você</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 30, gap: 16 }, header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }, eyebrowRow: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 10 }, onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.cyan }, eyebrow: { color: colors.cyan, fontSize: 10, letterSpacing: 1.2, fontWeight: "700" }, title: { color: colors.text, fontSize: 28, lineHeight: 34, fontWeight: "800", letterSpacing: -0.7 }, identityCard: { flexDirection: "row", alignItems: "center", gap: 11, padding: 14, borderRadius: 18, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line }, avatar: { width: 44, height: 44, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: colors.cyan }, identityCopy: { flex: 1, gap: 3 }, identityTitle: { color: colors.text, fontSize: 14, fontWeight: "800" }, identityText: { color: colors.muted, fontSize: 11 }, sectionTitle: { color: colors.text, fontSize: 15, fontWeight: "800", marginTop: 2 }, privacyCard: { padding: 15, borderRadius: 18, backgroundColor: colors.panel, borderWidth: 1, borderColor: "rgba(120,243,229,0.18)", gap: 14 }, privacyHeader: { flexDirection: "row", gap: 11 }, lockIcon: { width: 32, height: 32, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(120,243,229,0.1)" }, privacyCopy: { flex: 1, gap: 4 }, cardTitle: { color: colors.text, fontSize: 13, fontWeight: "800" }, cardText: { color: colors.muted, fontSize: 12, lineHeight: 17 }, modeRow: { flexDirection: "row", gap: 8 }, modeButton: { flex: 1, padding: 11, borderRadius: 13, borderWidth: 1, borderColor: colors.line }, modeButtonActive: { borderColor: colors.cyan, backgroundColor: "rgba(120,243,229,0.08)" }, modeLabel: { color: colors.muted, fontSize: 12, fontWeight: "800" }, modeLabelActive: { color: colors.cyan }, modeHint: { color: "#5E7896", fontSize: 10, marginTop: 3 }, settingsCard: { paddingHorizontal: 14, borderRadius: 18, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line }, settingRow: { minHeight: 74, flexDirection: "row", alignItems: "center", gap: 11 }, settingIcon: { width: 33, height: 33, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(167,131,255,0.1)" }, settingCopy: { flex: 1, gap: 3 }, settingTitle: { color: colors.text, fontSize: 13, fontWeight: "800" }, settingText: { color: colors.muted, fontSize: 11, lineHeight: 16 }, divider: { height: 1, backgroundColor: colors.line }, comingSoon: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, backgroundColor: "rgba(167,131,255,0.1)" }, comingSoonText: { color: "#CBB8FF", fontSize: 9, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: "700" }, transparencyCard: { padding: 15, borderRadius: 18, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line, gap: 10 }, bullet: { width: 25, height: 25, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(167,131,255,0.14)" }, bulletText: { color: "#CBB8FF", fontSize: 9, fontWeight: "800" }, transparencyText: { color: colors.muted, fontSize: 12, lineHeight: 17, marginLeft: 35, marginTop: -34, paddingBottom: 5 }, clearButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingVertical: 12 }, clearText: { color: "#F39AA9", fontSize: 12, fontWeight: "700" }, version: { color: "#516C88", fontSize: 10, textAlign: "center", letterSpacing: 0.5 },
});
