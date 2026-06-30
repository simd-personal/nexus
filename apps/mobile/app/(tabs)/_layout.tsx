import { Tabs } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabBarIcon } from '@/components/TabBarIcon';
import { SUNNY_MARK_COLORS } from '@/components/SunnyMark';
import { BRAND } from '@/theme/colors';

const TAB_BAR_BASE = 52;

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = TAB_BAR_BASE + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: BRAND.accent,
        tabBarInactiveTintColor: BRAND.textMuted,
        tabBarStyle: {
          height: tabBarHeight,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 6),
          backgroundColor: '#fff',
          borderTopColor: '#E5E7EB',
          borderTopWidth: StyleSheet.hairlineWidth,
          ...Platform.select({
            ios: {
              shadowColor: '#0E1115',
              shadowOpacity: 0.06,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: -2 },
            },
            android: {
              elevation: 8,
            },
          }),
        },
        tabBarItemStyle: {
          paddingTop: 2,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon routeName="index" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="critical"
        options={{
          title: 'Critical',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon routeName="critical" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="sunny"
        options={{
          title: 'Sunny',
          tabBarHideOnKeyboard: true,
          tabBarActiveTintColor: SUNNY_MARK_COLORS.face,
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon routeName="sunny" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: 'Projects',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon routeName="projects" focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
