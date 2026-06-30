import { Ionicons } from '@expo/vector-icons';
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
import { HeaderActions, HeaderIconButton, ScreenHeader } from '@/components/ScreenHeader';
import { Button, Screen } from '@/components/ui';
import { ApiError, createProject } from '@/lib/api';
import { BRAND, radius, spacing } from '@/theme/colors';

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
        <ScreenHeader
          title="New project"
          subtitle="Name it now — add photos and files from the project screen."
          rightAction={
            <HeaderActions>
              <HeaderIconButton label="Close" icon="close" onPress={() => router.back()} />
            </HeaderActions>
          }
        />

        <ScrollView
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

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            label="Create project"
            onPress={handleCreate}
            loading={mutation.isPending}
            disabled={!clientName.trim() || !projectName.trim()}
          />
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

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  portfolioRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  portfolioOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  portfolioOptionActive: {
    backgroundColor: '#EFF6FF',
    borderColor: BRAND.accent,
  },
  portfolioLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.textMuted,
  },
  portfolioLabelActive: {
    color: BRAND.accent,
  },
  error: {
    color: BRAND.danger,
    fontSize: 14,
    lineHeight: 20,
  },
});
