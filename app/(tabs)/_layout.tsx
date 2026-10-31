import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Platform } from "react-native";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#78F3E5",
        tabBarInactiveTintColor: "#617B98",
        headerShown: false,
        tabBarButton: HapticTab,
          tabBarStyle: {
            paddingTop: 8,
            paddingBottom: bottomPadding,
            height: tabBarHeight,
            backgroundColor: "#07111F",
            borderTopColor: "rgba(155, 190, 220, 0.15)",
            borderTopWidth: 0.5,
          },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Hoje",
          tabBarIcon: ({ color }) => <IconSymbol size={23} name="sparkles" color={color} />,
        }}
      />
      <Tabs.Screen
        name="memory"
        options={{
          title: "Memória",
          tabBarIcon: ({ color }) => <IconSymbol size={23} name="brain" color={color} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: "Tarefas",
          tabBarIcon: ({ color }) => <IconSymbol size={23} name="checklist" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => <IconSymbol size={23} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
