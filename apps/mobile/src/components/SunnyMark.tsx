import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

const RAY_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315] as const;

type SunnyMarkProps = {
  size?: number;
};

/** Crisp vector Sunny mark — matches web SunnyMark. */
export function SunnyMark({ size = 64 }: SunnyMarkProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <G transform="translate(32,32)" fill="#FBBF24">
        {RAY_ANGLES.map((deg) => (
          <Path key={deg} d="M0,-27 L-3.5,-14.5 L3.5,-14.5 Z" transform={`rotate(${deg})`} />
        ))}
      </G>
      <Circle cx="32" cy="32" r="17" fill="#F59E0B" />
      <Rect x="19" y="27" width="10" height="8" rx="2.5" fill="#1A2433" />
      <Rect x="35" y="27" width="10" height="8" rx="2.5" fill="#1A2433" />
      <Rect x="29" y="30" width="6" height="2" rx="1" fill="#1A2433" />
      <Path d="M24 40 Q32 46 40 40" stroke="#1A2433" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}
