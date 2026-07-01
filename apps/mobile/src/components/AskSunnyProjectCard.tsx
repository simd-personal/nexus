import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SunnyMark } from '@/components/SunnyMark';
import { Card } from '@/components/ui';
import { openSunnyForProject } from '@/lib/sunny-navigation';
import { BRAND, spacing } from '@/theme/colors';

export function AskSunnyProjectCard({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const router = useRouter();

  function handlePress() {
    openSunnyForProject(projectId);
    router.push('/(tabs)/sunny');
  }

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.wrap, pressed && styles.wrapPressed]}
      accessibilityRole="button"
      accessibilityLabel={`Ask Sunny about ${projectName}`}
    >
      <Card>
        <View style={styles.row}>
          <View style={styles.iconWrap}>
            <SunnyMark size={32} />
          </View>
          <View style={styles.text}>
            <Text style={styles.title}>Ask Sunny</Text>
            <Text style={styles.body} numberOfLines={2}>
              Chat about {projectName} with evidence from this project&apos;s files.
            </Text>
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
  wrapPressed: {
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
