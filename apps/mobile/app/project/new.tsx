import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FormField } from '@/components/FormField';
import { HeaderIconButton } from '@/components/ScreenHeader';
import { Button, Screen } from '@/components/ui';
import { ApiError, createProject } from '@/lib/api';
import { APP, BRAND, radius, spacing } from '@/theme/colors';

export default function NewProjectScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [clientName, setClientName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [sunnyNotes, setSunnyNotes] = useState('');
  const [portfolio, setPortfolio] = useState<'work' | 'personal'>('work');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      createProject({
        clientName,
        projectName,
        description,
        sunnyNotes,
        portfolio,
      }),
    onSuccess: async ({ project }) => {
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      router.replace(`/project/${project.id}`);
    },
    onError: (err: Error) => {
      if (err instanceof ApiError && err.status === 402) {
        setError('Free plan includes 1 active project. Upgrade on web for unlimited projects.');
        return;
      }
      setError(err.message);
    },
  });

  function handleCreate() {
    setError(null);
    if (!clientName.trim() || !projectName.trim()) {
      setError('Client and project name are required.');
      return;
    }
    mutation.mutate();
  }

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle} numberOfLines={2}>
              New project
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={3}>
              Name it now — add photos and files from the project screen.
            </Text>
          </View>
          <HeaderIconButton label="Close" icon="close" onPress={() => router.back()} />
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.portfolioRow}>
            <PortfolioOption
              label="Work"
              active={portfolio === 'work'}
              onPress={() => setPortfolio('work')}
            />
            <PortfolioOption
              label="Personal"
              active={portfolio === 'personal'}
              onPress={() => setPortfolio('personal')}
            />
          </View>

          <FormField
            label="Who or what is this for?"
            hint="Client, company, or subject Sunny should track."
            value={clientName}
            onChangeText={setClientName}
            placeholder="e.g. Adventist Health"
            autoCapitalize="words"
          />

          <FormField
            label="What are you working on?"
            value={projectName}
            onChangeText={setProjectName}
            placeholder="e.g. Epic Transformation"
            autoCapitalize="words"
          />

          <FormField
            label="Description (optional)"
            value={description}
            onChangeText={setDescription}
            placeholder="Brief project description…"
            multiline
          />

          <FormField
            label="Tell Sunny about this project (optional)"
            value={sunnyNotes}
            onChangeText={setSunnyNotes}
            placeholder="Focus areas, timeline, or context Sunny should know…"
            multiline
          />

          <View style={styles.footer}>
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button
              label="Create project"
              onPress={handleCreate}
              loading={mutation.isPending}
              disabled={!clientName.trim() || !projectName.trim()}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function PortfolioOption({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.portfolioOption, active && styles.portfolioOptionActive]}
    >
      <Text style={[styles.portfolioLabel, active && styles.portfolioLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const GUTTER = 20;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: GUTTER,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
    paddingTop: 2,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: APP.text,
    letterSpacing: -0.6,
    lineHeight: 32,
  },
  headerSubtitle: {
    fontSize: 15,
    lineHeight: 21,
    color: APP.textMuted,
  },
  content: {
    paddingHorizontal: GUTTER,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl + spacing.md,
    gap: spacing.lg,
  },
  portfolioRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  portfolioOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.sm,
    alignItems: 'center',
    backgroundColor: APP.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: APP.border,
  },
  portfolioOptionActive: {
    backgroundColor: APP.btnSecondaryBg,
    borderColor: APP.borderStrong,
  },
  portfolioLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: APP.textMuted,
  },
  portfolioLabelActive: {
    color: APP.text,
  },
  footer: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  error: {
    color: BRAND.danger,
    fontSize: 14,
    lineHeight: 20,
  },
});
