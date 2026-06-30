import { useId } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { BRAND } from '@/theme/colors';

type LogoSize = 'sm' | 'md';

const sizes: Record<LogoSize, { icon: number; name: number; tld: number }> = {
  sm: { icon: 28, name: 15, tld: 13 },
  md: { icon: 34, name: 18, tld: 16 },
};

export function UpperDeckIcon({
  size = 28,
  variant = 'light',
}: {
  size?: number;
  variant?: 'light' | 'dark';
}) {
  const uid = useId().replace(/:/g, '');
  const r = size * 0.19;
  const gap = size * 0.08;
  const start = (size - 2 * r - gap) / 2;

  const circles = [
    [start, start],
    [start + r + gap, start],
    [start, start + r + gap],
    [start + r + gap, start + r + gap],
  ];

  const strokeColor = variant === 'light' ? '#E5E7EB' : BRAND.textSecondary;
  const strokeOpacity = variant === 'light' ? 0.5 : 0.35;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <LinearGradient id={`${uid}-g`} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop stopColor={BRAND.accentLight} />
          <Stop offset="0.5" stopColor={BRAND.accent} />
          <Stop offset="1" stopColor={BRAND.accentDark} />
        </LinearGradient>
      </Defs>
      {circles.map(([cx, cy], index) => (
        <Circle
          key={index}
          cx={cx + r}
          cy={cy + r}
          r={r}
          fill={`url(#${uid}-g)`}
          fillOpacity={0.35 + index * 0.08}
          stroke={strokeColor}
          strokeOpacity={strokeOpacity}
          strokeWidth={0.75}
        />
      ))}
    </Svg>
  );
}

export function UpperDeckLogo({
  size = 'sm',
  showDomain = true,
}: {
  size?: LogoSize;
  showDomain?: boolean;
}) {
  const s = sizes[size];

  return (
    <View style={styles.row}>
      <UpperDeckIcon size={s.icon} />
      <Text style={styles.wordmark}>
        <Text style={[styles.name, { fontSize: s.name }]}>UpperDeck</Text>
        {showDomain ? (
          <Text style={[styles.tld, { fontSize: s.tld }]}>.dev</Text>
        ) : null}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  wordmark: {
    flexShrink: 1,
  },
  name: {
    fontWeight: '700',
    color: BRAND.graphite,
    letterSpacing: -0.4,
  },
  tld: {
    fontWeight: '400',
    color: BRAND.textMuted,
  },
});
