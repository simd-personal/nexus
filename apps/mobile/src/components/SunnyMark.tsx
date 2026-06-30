import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

const RAY_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315] as const;

/** Matches web `SunnyMark` — Tailwind amber-400 / amber-500. */
export const SUNNY_MARK_COLORS = {
  ray: '#FBBF24',
  face: '#F59E0B',
  detail: '#1A2433',
} as const;

const SUNNY_PALETTES = {
  color: SUNNY_MARK_COLORS,
  muted: {
    ray: '#FDE68A',
    face: '#FBBF24',
    detail: '#94A3B8',
  },
} as const;

type SunnyMarkProps = {
  size?: number;
  /** Softer amber when inactive (e.g. tab bar). */
  muted?: boolean;
};

/** Crisp vector Sunny mark — matches web SunnyMark. */
export function SunnyMark({ size = 64, muted = false }: SunnyMarkProps) {
  const palette = muted ? SUNNY_PALETTES.muted : SUNNY_PALETTES.color;

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <G transform="translate(32,32)" fill={palette.ray}>
        {RAY_ANGLES.map((deg) => (
          <Path key={deg} d="M0,-27 L-3.5,-14.5 L3.5,-14.5 Z" transform={`rotate(${deg})`} />
        ))}
      </G>
      <Circle cx="32" cy="32" r="17" fill={palette.face} />
      <Rect x="19" y="27" width="10" height="8" rx="2.5" fill={palette.detail} />
      <Rect x="35" y="27" width="10" height="8" rx="2.5" fill={palette.detail} />
      <Rect x="29" y="30" width="6" height="2" rx="1" fill={palette.detail} />
      <Path
        d="M24 40 Q32 46 40 40"
        stroke={palette.detail}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}
