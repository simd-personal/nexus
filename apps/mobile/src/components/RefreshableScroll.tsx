import { ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View, type ScrollViewProps } from 'react-native';
import { useFloatingTabBarInset } from '@/components/FloatingTabBar';
import { BRAND, spacing } from '@/theme/colors';

type RefreshableScrollProps = ScrollViewProps & {
  onRefresh: () => void | Promise<void>;
  refreshing: boolean;
  header?: ReactNode;
  children: ReactNode;
};

export function RefreshableScroll({
  onRefresh,
  refreshing,
  header,
  children,
  contentContainerStyle,
  ...rest
}: RefreshableScrollProps) {
  const tabBarInset = useFloatingTabBarInset();

  return (
    <ScrollView
      {...rest}
      alwaysBounceVertical
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: tabBarInset },
        contentContainerStyle,
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void onRefresh()}
          tintColor={BRAND.accent}
          colors={[BRAND.accent]}
          title={refreshing ? 'Refreshing…' : undefined}
          titleColor={BRAND.textMuted}
        />
      }
    >
      {header ? <View style={styles.headerSlot}>{header}</View> : null}
      {children}
    </ScrollView>
  );
}

export function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {count !== undefined ? (
        <View style={styles.sectionBadge}>
          <Text style={styles.sectionBadgeText}>{count}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.md,
    flexGrow: 1,
  },
  headerSlot: {
    marginHorizontal: -spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: BRAND.graphite,
    letterSpacing: -0.2,
  },
  sectionBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
  },
  sectionBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: BRAND.accent,
  },
});
