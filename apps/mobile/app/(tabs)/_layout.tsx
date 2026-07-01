import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { FloatingTabBar } from '@/components/FloatingTabBar';
import { TabBarIcon } from '@/components/TabBarIcon';
import { SUNNY_MARK_COLORS } from '@/components/SunnyMark';
import { BRAND } from '@/theme/colors';

export default function TabsLayout() {
  return (
    <Tabs
      safeAreaInsets={{ bottom: 0 }}
      tabBar={(props) => (
        <View style={styles.tabBarHost} pointerEvents="box-none">
          <FloatingTabBar {...props} />
        </View>
      )}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: BRAND.accent,
        tabBarInactiveTintColor: BRAND.textMuted,
        sceneStyle: {
          backgroundColor: 'transparent',
        },
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 0,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
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

const styles = StyleSheet.create({
  tabBarHost: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
});
