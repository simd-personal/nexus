import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  ALL_PROJECTS_SCOPE,
  buildChatScope,
  checkedIdsFromScope,
  formatScopeSummary,
  getNodeCheckState,
  projectLabel,
  removeScopeLabel,
  toggleNodeChecked,
  type ChatScope,
  type TreeCheckState,
} from '@upperdeck/shared/chat-scope';
import type { ProjectWithStats } from '@/lib/types';
import { BRAND, radius, spacing } from '@/theme/colors';

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
          color="#9CA3AF"
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
  const [open, setOpen] = useState(false);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!open) return;
    setCheckedIds(checkedIdsFromScope(projects, scope));
  }, [open, projects, scope]);

  function setPickerOpen(next: boolean) {
    setOpen(next);
    onOpenChange?.(next);
  }

  function applyCheckedIds(next: Set<string>) {
    setCheckedIds(next);
    onScopeChange(buildChatScope(projects, next));
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
        <Feather name="folder" size={14} color="#9CA3AF" />
        <Text style={styles.triggerLabel} numberOfLines={1}>
          {formatScopeSummary(scope)}
        </Text>
        <Feather name="chevron-down" size={14} color="#9CA3AF" />
      </Pressable>

      {open ? (
        <View style={styles.backdrop}>
          <Pressable style={styles.backdropTap} onPress={() => setPickerOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Project scope</Text>
              <Pressable onPress={() => setPickerOpen(false)} hitSlop={8}>
                <Feather name="x" size={20} color="#6B7280" />
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
              {projects.map((project) => (
                <ScopeTreeNode
                  key={project.id}
                  node={project}
                  depth={0}
                  checkedIds={checkedIds}
                  onToggleCheck={(node) => applyCheckedIds(toggleNodeChecked(node, checkedIds))}
                />
              ))}
            </ScrollView>

            <Pressable onPress={() => setPickerOpen(false)} style={styles.doneBtn}>
              <Text style={styles.doneBtnText}>Done</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
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
    borderColor: '#E5E7EB',
    borderRadius: radius.md,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  triggerPressed: {
    backgroundColor: '#F9FAFB',
  },
  triggerLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: BRAND.graphite,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    justifyContent: 'flex-end',
  },
  backdropTap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    maxHeight: '72%',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    backgroundColor: '#fff',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
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
    color: BRAND.graphite,
  },
  allRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
  },
  allRowActive: {
    backgroundColor: '#F3F4F6',
  },
  allLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: BRAND.graphite,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#F3F4F6',
    marginVertical: spacing.sm,
  },
  treeList: {
    maxHeight: 360,
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
    borderLeftColor: '#E5E7EB',
    paddingLeft: spacing.md,
  },
  treeLabel: {
    flex: 1,
    fontSize: 12,
    color: '#1F2937',
  },
  workstreamCount: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D1D5DB',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: BRAND.graphite,
    backgroundColor: BRAND.graphite,
  },
  checkMark: {
    color: '#fff',
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
  },
  doneBtn: {
    marginTop: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: BRAND.graphite,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
