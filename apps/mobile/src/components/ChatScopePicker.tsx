import { Feather } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ALL_PROJECTS_SCOPE,
  buildChatScope,
  checkedIdsFromScope,
  formatScopeSummary,
  getNodeCheckState,
  getPortfolioCheckState,
  normalizeProjectPortfolios,
  projectLabel,
  removeScopeLabel,
  splitProjectsByPortfolio,
  toggleNodeChecked,
  togglePortfolioChecked,
  type ChatScope,
  type TreeCheckState,
} from '@upperdeck/shared/chat-scope';
import type { ProjectWithStats } from '@/lib/types';
import { APP, radius, spacing } from '@/theme/colors';

function ScopeCheckBox({
  state,
  onPress,
  label,
}: {
  state: TreeCheckState;
  onPress: () => void;
  label: string;
}) {
  const checked = state === 'checked' || state === 'indeterminate';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: state === 'indeterminate' ? 'mixed' : checked }}
      accessibilityLabel={label}
      style={[
        styles.checkbox,
        checked && styles.checkboxChecked,
        state === 'indeterminate' && styles.checkboxChecked,
      ]}
    >
      {state === 'checked' ? <Text style={styles.checkMark}>✓</Text> : null}
      {state === 'indeterminate' ? <Text style={styles.checkMark}>−</Text> : null}
    </Pressable>
  );
}

function ScopeTreeNode({
  node,
  depth,
  checkedIds,
  onToggleCheck,
}: {
  node: ProjectWithStats;
  depth: number;
  checkedIds: Set<string>;
  onToggleCheck: (node: ProjectWithStats) => void;
}) {
  const children = node.sub_projects ?? [];
  const checkState = getNodeCheckState(node, checkedIds);
  const label = projectLabel(node);

  return (
    <View>
      <Pressable
        onPress={() => onToggleCheck(node)}
        style={[styles.treeRow, depth > 0 && styles.treeRowNested]}
      >
        <ScopeCheckBox
          state={checkState}
          onPress={() => onToggleCheck(node)}
          label={label}
        />
        <Feather
          name={children.length > 0 ? 'folder' : depth > 0 ? 'git-branch' : 'folder'}
          size={14}
          color={APP.textSubtle}
        />
        <Text style={styles.treeLabel} numberOfLines={1}>
          {label}
        </Text>
        {children.length > 0 ? (
          <Text style={styles.workstreamCount}>
            {children.length} workstream{children.length !== 1 ? 's' : ''}
          </Text>
        ) : null}
      </Pressable>
      {children.map((child) => (
        <ScopeTreeNode
          key={child.id}
          node={child}
          depth={depth + 1}
          checkedIds={checkedIds}
          onToggleCheck={onToggleCheck}
        />
      ))}
    </View>
  );
}

function PortfolioScopeSection({
  title,
  portfolio,
  projects,
  allProjects,
  checkedIds,
  onToggleCheck,
  onTogglePortfolio,
}: {
  title: string;
  portfolio: 'work' | 'personal';
  projects: ProjectWithStats[];
  allProjects: ProjectWithStats[];
  checkedIds: Set<string>;
  onToggleCheck: (node: ProjectWithStats) => void;
  onTogglePortfolio: () => void;
}) {
  const portfolioState = getPortfolioCheckState(allProjects, portfolio, checkedIds);
  const portfolioLabel = portfolio === 'work' ? 'Work projects' : 'Personal projects';

  return (
    <View style={styles.portfolioSection}>
      <Text style={styles.portfolioSectionTitle}>{title}</Text>
      <Pressable onPress={onTogglePortfolio} style={styles.portfolioRow}>
        <ScopeCheckBox
          state={portfolioState}
          onPress={onTogglePortfolio}
          label={portfolioLabel}
        />
        <Text style={styles.portfolioRowLabel}>{portfolioLabel}</Text>
      </Pressable>
      {projects.length === 0 ? (
        <Text style={styles.portfolioEmpty}>No {title.toLowerCase()} projects yet</Text>
      ) : (
        projects.map((project) => (
          <ScopeTreeNode
            key={project.id}
            node={project}
            depth={0}
            checkedIds={checkedIds}
            onToggleCheck={onToggleCheck}
          />
        ))
      )}
    </View>
  );
}

type ChatScopePickerProps = {
  projects: ProjectWithStats[];
  scope: ChatScope;
  onScopeChange: (scope: ChatScope) => void;
  onOpenChange?: (open: boolean) => void;
};

export function ChatScopePicker({
  projects,
  scope,
  onScopeChange,
  onOpenChange,
}: ChatScopePickerProps) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(() => new Set());
  const scopeProjects = useMemo(() => normalizeProjectPortfolios(projects), [projects]);
  const { work, personal } = useMemo(
    () => splitProjectsByPortfolio(scopeProjects),
    [scopeProjects]
  );

  useEffect(() => {
    if (!open) return;
    setCheckedIds(checkedIdsFromScope(scopeProjects, scope));
  }, [open, scopeProjects, scope]);

  function setPickerOpen(next: boolean) {
    setOpen(next);
    onOpenChange?.(next);
  }

  function applyCheckedIds(next: Set<string>) {
    setCheckedIds(next);
    onScopeChange(buildChatScope(scopeProjects, next));
  }

  function selectAllProjects() {
    setCheckedIds(new Set());
    onScopeChange(ALL_PROJECTS_SCOPE);
    setPickerOpen(false);
  }

  return (
    <>
      <Pressable
        onPress={() => setPickerOpen(true)}
        style={({ pressed }) => [styles.trigger, pressed && styles.triggerPressed]}
        accessibilityRole="button"
        accessibilityLabel="Choose project scope"
      >
        <Feather name="folder" size={14} color={APP.textSubtle} />
        <Text style={styles.triggerLabel} numberOfLines={1}>
          {formatScopeSummary(scope)}
        </Text>
        <Feather name="chevron-down" size={14} color={APP.textSubtle} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setPickerOpen(false)} />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Project scope</Text>
              <Pressable onPress={() => setPickerOpen(false)} hitSlop={8}>
                <Feather name="x" size={20} color={APP.textMuted} />
              </Pressable>
            </View>

            <Pressable
              onPress={selectAllProjects}
              style={[styles.allRow, scope.kind === 'all' && styles.allRowActive]}
            >
              <ScopeCheckBox
                state={scope.kind === 'all' ? 'checked' : 'unchecked'}
                onPress={selectAllProjects}
                label="All projects"
              />
              <Text style={styles.allLabel}>All projects</Text>
            </Pressable>

            <View style={styles.divider} />

            <ScrollView style={styles.treeList} keyboardShouldPersistTaps="handled">
              <PortfolioScopeSection
                title="Work"
                portfolio="work"
                projects={work}
                allProjects={scopeProjects}
                checkedIds={checkedIds}
                onToggleCheck={(node) => applyCheckedIds(toggleNodeChecked(node, checkedIds))}
                onTogglePortfolio={() =>
                  applyCheckedIds(togglePortfolioChecked(scopeProjects, 'work', checkedIds))
                }
              />
              <PortfolioScopeSection
                title="Personal"
                portfolio="personal"
                projects={personal}
                allProjects={scopeProjects}
                checkedIds={checkedIds}
                onToggleCheck={(node) => applyCheckedIds(toggleNodeChecked(node, checkedIds))}
                onTogglePortfolio={() =>
                  applyCheckedIds(togglePortfolioChecked(scopeProjects, 'personal', checkedIds))
                }
              />
            </ScrollView>

            <Pressable onPress={() => setPickerOpen(false)} style={styles.doneBtn}>
              <Text style={styles.doneBtnText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 240,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: APP.border,
    borderRadius: radius.sm,
    backgroundColor: APP.surface,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  triggerPressed: {
    backgroundColor: APP.surfaceMuted,
  },
  triggerLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: APP.text,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    maxHeight: '72%',
    width: '100%',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    backgroundColor: APP.surface,
    paddingHorizontal: spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: APP.text,
  },
  allRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
  },
  allRowActive: {
    backgroundColor: APP.btnSecondaryBg,
  },
  allLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: APP.text,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: APP.border,
    marginVertical: spacing.sm,
  },
  treeList: {
    flexGrow: 1,
    flexShrink: 1,
    maxHeight: 420,
  },
  portfolioSection: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  portfolioSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: APP.textSubtle,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
  },
  portfolioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    backgroundColor: APP.surfaceMuted,
  },
  portfolioRowLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: APP.text,
  },
  portfolioEmpty: {
    fontSize: 12,
    color: APP.textSubtle,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xs,
  },
  treeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
  },
  treeRowNested: {
    marginLeft: spacing.md,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: APP.border,
    paddingLeft: spacing.md,
  },
  treeLabel: {
    flex: 1,
    fontSize: 12,
    color: APP.text,
  },
  workstreamCount: {
    fontSize: 10,
    color: APP.textSubtle,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: APP.borderStrong,
    backgroundColor: APP.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: APP.btnPrimaryBg,
    backgroundColor: APP.btnPrimaryBg,
  },
  checkMark: {
    color: APP.btnPrimaryText,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
  },
  doneBtn: {
    marginTop: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: APP.btnPrimaryBg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneBtnText: {
    color: APP.btnPrimaryText,
    fontSize: 15,
    fontWeight: '600',
  },
});
