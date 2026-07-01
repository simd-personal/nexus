import * as Clipboard from 'expo-clipboard';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { InlineNotice } from '@/components/InlineNotice';
import { Button, Card } from '@/components/ui';
import { generateProjectContent } from '@/lib/api';
import type { ProjectGenerateType } from '@/lib/types';
import { APP, radius, spacing } from '@/theme/colors';

type ProjectGeneratePanelProps = {
  projectId: string;
  type: ProjectGenerateType;
  title: string;
  description: string;
  showVersionPills?: boolean;
};

const VERSIONS = ['short', 'detailed', 'executive'] as const;

export function ProjectGeneratePanel({
  projectId,
  type,
  title,
  description,
  showVersionPills = type === 'follow_up_email',
}: ProjectGeneratePanelProps) {
  const [version, setVersion] = useState<(typeof VERSIONS)[number]>('detailed');
  const [instructions, setInstructions] = useState('');
  const [resultTitle, setResultTitle] = useState<string | null>(null);
  const [resultContent, setResultContent] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState<{ message: string; variant: 'success' | 'error' } | null>(
    null
  );

  const generateMutation = useMutation({
    mutationFn: () =>
      generateProjectContent(projectId, type, {
        version: showVersionPills ? version : undefined,
        instructions: instructions.trim() || undefined,
      }),
    onSuccess: (response) => {
      setResultTitle(response.data.title);
      setResultContent(response.data.content);
      setNotice({ message: 'Generated — Sunny saved this to your project timeline.', variant: 'success' });
    },
    onError: (error: Error) => {
      setNotice({ message: error.message || 'Generation failed.', variant: 'error' });
    },
  });

  async function copyResult() {
    if (!resultContent) return;
    await Clipboard.setStringAsync(resultContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <View style={styles.wrap}>
      <Card>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>

        {notice ? (
          <InlineNotice message={notice.message} variant={notice.variant} onDismiss={() => setNotice(null)} />
        ) : null}

        {showVersionPills ? (
          <View style={styles.pillRow}>
            {VERSIONS.map((option) => {
              const active = version === option;
              return (
                <Pressable
                  key={option}
                  onPress={() => setVersion(option)}
                  style={[styles.versionPill, active && styles.versionPillActive]}
                >
                  <Text style={[styles.versionPillText, active && styles.versionPillTextActive]}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <TextInput
          value={instructions}
          onChangeText={setInstructions}
          placeholder="Optional instructions for Sunny…"
          placeholderTextColor={APP.textSubtle}
          style={styles.input}
          multiline
        />

        <Button
          label={`Generate ${title.toLowerCase()}`}
          onPress={() => generateMutation.mutate()}
          loading={generateMutation.isPending}
        />
      </Card>

      {resultContent ? (
        <Card>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>{resultTitle ?? title}</Text>
            <Button
              label={copied ? 'Copied' : 'Copy'}
              variant="secondary"
              size="compact"
              onPress={() => void copyResult()}
            />
          </View>
          <Text style={styles.resultBody}>{resultContent}</Text>
        </Card>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: APP.text,
  },
  description: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: APP.textMuted,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  versionPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: APP.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: APP.border,
  },
  versionPillActive: {
    backgroundColor: APP.btnSecondaryBg,
    borderColor: APP.borderStrong,
  },
  versionPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: APP.textMuted,
  },
  versionPillTextActive: {
    color: APP.text,
  },
  input: {
    marginTop: spacing.md,
    backgroundColor: APP.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: APP.borderStrong,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: APP.text,
    minHeight: 88,
    textAlignVertical: 'top',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  resultTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: APP.text,
  },
  resultBody: {
    fontSize: 15,
    lineHeight: 23,
    color: APP.text,
  },
});
