import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BRAND } from '@/theme/colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: BRAND.accent,
        tabBarInactiveTintColor: BRAND.textMuted,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#E5E7EB',
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="critical"
        options={{
          title: 'Critical',
          tabBarIcon: ({ color, size }) => <Ionicons name="alert-circle-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="sunny"
        options={{
          title: 'Sunny',
          tabBarIcon: ({ color, size }) => <Ionicons name="sparkles-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: 'Projects',
          tabBarIcon: ({ color, size }) => <Ionicons name="folder-outline" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
