import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SunnyMark } from '@/components/SunnyMark';
import { Card } from '@/components/ui';
import { openSunnyForProject } from '@/lib/sunny-navigation';
import { BRAND, spacing } from '@/theme/colors';

export function SunnyHandoffCard({
  projectId,
  projectName,
  title,
  body,
  icon = 'chatbubble-ellipses-outline',
}: {
  projectId: string;
  projectName: string;
  title: string;
  body: string;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const router = useRouter();

  function handlePress() {
    openSunnyForProject(projectId);
    router.push('/(tabs)/sunny');
  }

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <Card>
        <View style={styles.row}>
          <View style={styles.iconWrap}>
            {icon === 'sunny-outline' ? (
              <SunnyMark size={32} />
            ) : (
              <Ionicons name={icon} size={24} color={BRAND.accent} />
            )}
          </View>
          <View style={styles.text}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.body}>{body.replace('{project}', projectName)}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={BRAND.textMuted} />
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 0,
  },
  pressed: {
    opacity: 0.88,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF7ED',
  },
  text: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: BRAND.graphite,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: BRAND.textMuted,
  },
});
