import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { useTheme } from '@/theme';

interface HalfTurnArcProps {
  size?: number;
  stroke?: number;
  progress?: number;
  colors?: readonly [string, string];
  track?: string;
  gapDeg?: number;
}

export function HalfTurnArc({
  size = 120,
  stroke = 6,
  progress = 1,
  colors = ['#FCEBA4', '#8E77E6'],
  track,
  gapDeg = 90,
}: HalfTurnArcProps) {
  const { theme } = useTheme();
  const resolvedTrack = track ?? (theme.dark ? 'rgba(255,255,255,0.10)' : 'rgba(24,20,37,0.06)');
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const visibleFrac = (360 - gapDeg) / 360;
  const arcLen = circumference * visibleFrac;
  const filled = Math.max(0, Math.min(1, progress)) * arcLen;
  const rotation = 90 + gapDeg / 2;

  return (
    <Svg width={size} height={size}>
      <Defs>
        <LinearGradient id="halfTurn" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={colors[0]} />
          <Stop offset="1" stopColor={colors[1]} />
        </LinearGradient>
      </Defs>
      {/* Track */}
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={resolvedTrack}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${arcLen} ${circumference}`}
        transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
      />
      {/* Filled sweep */}
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="url(#halfTurn)"
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circumference}`}
        transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
}
