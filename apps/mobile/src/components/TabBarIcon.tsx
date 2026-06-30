import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SunnyMark } from '@/components/SunnyMark';

type IconName = ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { active: IconName; inactive: IconName }> = {
  index: { active: 'home', inactive: 'home-outline' },
  critical: { active: 'alert-circle', inactive: 'alert-circle-outline' },
  projects: { active: 'folder', inactive: 'folder-outline' },
};

export function TabBarIcon({
  routeName,
  focused,
  color,
}: {
  routeName: string;
  focused: boolean;
  color: string;
}) {
  if (routeName === 'sunny') {
    return <SunnyMark size={26} muted={!focused} />;
  }

  const icons = TAB_ICONS[routeName] ?? TAB_ICONS.index;
  return <Ionicons name={focused ? icons.active : icons.inactive} size={24} color={color} />;
}
