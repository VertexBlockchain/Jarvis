import { useEffect, useMemo } from "react";
import { Animated, Platform, StyleSheet, Text, View } from "react-native";

export type OrbMode = "idle" | "thinking" | "speaking" | "listening";

type JarvisOrbProps = {
  mode: OrbMode;
  compact?: boolean;
};

const modeLabels: Record<OrbMode, string> = {
  idle: "online",
  thinking: "pensando",
  speaking: "falando",
  listening: "ouvindo",
};

export function JarvisOrb({ mode, compact = false }: JarvisOrbProps) {
  const pulse = useMemo(() => new Animated.Value(0), []);
  const breathe = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: mode === "thinking" ? 620 : 1400, useNativeDriver: Platform.OS !== "web" }),
        Animated.timing(pulse, { toValue: 0, duration: mode === "thinking" ? 620 : 1400, useNativeDriver: Platform.OS !== "web" }),
      ]),
    );
    const breatheLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 2200, useNativeDriver: Platform.OS !== "web" }),
        Animated.timing(breathe, { toValue: 0, duration: 2200, useNativeDriver: Platform.OS !== "web" }),
      ]),
    );
    pulseLoop.start();
    breatheLoop.start();
    return () => {
      pulseLoop.stop();
      breatheLoop.stop();
    };
  }, [breathe, mode, pulse]);

  const size = compact ? 78 : 132;
  const coreSize = compact ? 34 : 58;
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, mode === "thinking" ? 1.18 : 1.08] });
  const haloOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.12, mode === "thinking" ? 0.42 : 0.24] });
  const breatheScale = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.04] });

  return (
    <View style={[styles.wrapper, { width: size, height: size }]} accessibilityLabel={`Jarvis ${modeLabels[mode]}`}>
      <Animated.View
        style={[styles.halo, { width: size, height: size, borderRadius: size / 2, opacity: haloOpacity, transform: [{ scale: breatheScale }] }]}
      />
      <Animated.View style={[styles.ring, { width: size - 16, height: size - 16, borderRadius: (size - 16) / 2, transform: [{ rotate: "22deg" }, { scale: pulseScale }] }]} />
      <Animated.View style={[styles.core, { width: coreSize, height: coreSize, borderRadius: coreSize / 2, transform: [{ scale: pulseScale }] }]}>
        <View style={styles.coreDot} />
      </Animated.View>
      {!compact && <Text style={styles.label}>{modeLabels[mode]}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: "center", justifyContent: "center" },
  halo: { position: "absolute", backgroundColor: "#4CE9D7", shadowColor: "#4CE9D7", shadowOpacity: 0.8, shadowRadius: 26, elevation: 14 },
  ring: { position: "absolute", borderWidth: 1, borderColor: "rgba(120,243,229,0.46)", borderTopColor: "rgba(158,112,255,0.9)", borderBottomColor: "rgba(120,243,229,0.15)" },
  core: { alignItems: "center", justifyContent: "center", backgroundColor: "#B5FFF4", shadowColor: "#78F3E5", shadowOpacity: 0.9, shadowRadius: 18, elevation: 12 },
  coreDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: "#10243A" },
  label: { position: "absolute", bottom: -8, color: "#8EA8C5", fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase" },
});
