import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  DATA_SECURITY_ALL_USERS,
  DATA_SECURITY_ENTERPRISE_ADDITIONS,
} from '@upperdeck/shared/data-security';
import { Card } from '@/components/ui';
import { BRAND, radius, spacing } from '@/theme/colors';

function SecurityBadge({
  label,
  detail,
}: {
  label: string;
  detail: string;
}) {
  return (
    <View style={styles.badge}>
      <View style={styles.badgeHeader}>
        <Ionicons name="shield-checkmark-outline" size={16} color="#047857" />
        <Text style={styles.badgeLabel}>{label}</Text>
      </View>
      <Text style={styles.badgeDetail}>{detail}</Text>
    </View>
  );
}

export function MobileDataSecurityCard({ isEnterprise = false }: { isEnterprise?: boolean }) {
  return (
    <Card>
      <Text style={styles.cardLabel}>How your files are stored</Text>
      <Text style={styles.intro}>{DATA_SECURITY_ALL_USERS.intro}</Text>

      <View style={styles.badgeGrid}>
        {DATA_SECURITY_ALL_USERS.badges.map((badge) => (
          <SecurityBadge key={badge.id} label={badge.label} detail={badge.detail} />
        ))}
      </View>

      <View style={styles.bulletList}>
        {DATA_SECURITY_ALL_USERS.bullets.slice(0, 3).map((bullet) => (
          <Text key={bullet} style={styles.bullet}>
            • {bullet}
          </Text>
        ))}
      </View>

      {DATA_SECURITY_ALL_USERS.commitment ? (
        <Text style={styles.commitment}>{DATA_SECURITY_ALL_USERS.commitment}</Text>
      ) : null}

      {isEnterprise ? (
        <View style={styles.enterpriseBlock}>
          <Text style={styles.enterpriseTitle}>{DATA_SECURITY_ENTERPRISE_ADDITIONS.title}</Text>
          {DATA_SECURITY_ENTERPRISE_ADDITIONS.bullets.slice(0, 2).map((bullet) => (
            <Text key={bullet} style={styles.bullet}>
              • {bullet}
            </Text>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  cardLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: BRAND.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  intro: {
    fontSize: 14,
    lineHeight: 20,
    color: BRAND.graphite,
    marginBottom: spacing.md,
  },
  badgeGrid: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  badge: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#A7F3D0',
    backgroundColor: '#ECFDF5',
    padding: spacing.sm,
  },
  badgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  badgeDetail: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 16,
    color: '#047857',
  },
  bulletList: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  bullet: {
    fontSize: 13,
    lineHeight: 18,
    color: BRAND.textMuted,
  },
  commitment: {
    fontSize: 12,
    lineHeight: 18,
    color: '#92400E',
    backgroundColor: '#FFFBEB',
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  enterpriseBlock: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    gap: spacing.xs,
  },
  enterpriseTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: BRAND.graphite,
    marginBottom: 4,
  },
});
