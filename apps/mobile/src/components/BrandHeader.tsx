import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { UpperDeckLogo } from '@/components/UpperDeckLogo';
import { BRAND, spacing } from '@/theme/colors';

type BrandHeaderProps = {
  /** Shown under the wordmark on the home screen — matches web sidebar. */
  tagline?: string;
  compact?: boolean;
  rightAction?: ReactNode;
};

export function BrandHeader({ tagline, compact = false, rightAction }: BrandHeaderProps) {
  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <View style={styles.main}>
        <UpperDeckLogo size={compact ? 'sm' : 'md'} />
        {tagline ? <Text style={styles.tagline}>{tagline}</Text> : null}
      </View>
      {rightAction ? <View style={styles.actions}>{rightAction}</View> : null}
    </View>
  );
}

/** Logo + wordmark + optional page title block for tab screens. */
export function TabScreenHeader({
  tagline,
  compactBrand = true,
  title,
  subtitle,
  rightAction,
}: {
  tagline?: string;
  compactBrand?: boolean;
  title: string;
  subtitle?: string;
  rightAction?: ReactNode;
}) {
  return (
    <View style={styles.stack}>
      <BrandHeader tagline={tagline} compact={compactBrand} rightAction={rightAction} />
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.pageSubtitle} numberOfLines={3}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    backgroundColor: BRAND.cream,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8E6E1',
  },
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: BRAND.cream,
  },
  wrapCompact: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  main: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  tagline: {
    fontSize: 12,
    color: '#6B7280',
    letterSpacing: 0.1,
  },
  actions: {
    flexShrink: 0,
    paddingTop: 2,
  },
  pageHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: 4,
    backgroundColor: BRAND.cream,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: BRAND.graphite,
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  pageSubtitle: {
    fontSize: 15,
    lineHeight: 21,
    color: BRAND.textMuted,
  },
});
