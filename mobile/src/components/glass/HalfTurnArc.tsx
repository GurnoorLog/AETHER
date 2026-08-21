import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { useTheme } from '@/theme';

interface HalfTurnArcProps {
  /** Outer diameter. */
  size?: number;
  stroke?: number;
  /** 0..1 of the visible arc that is "filled". */
  progress?: number;
  /** Gradient stops for the filled arc. */
  colors?: readonly [string, string];
  /** Faint unfilled track color. */
  track?: string;
  /** Degrees of open gap at the start of the arc (the "turn" opening). */
  gapDeg?: number;
}

/**
 * The signature mark: a luminous open ring that sweeps like a shoulder-check
 * rotation. It's the same gesture the drill trains and echoes the camera
 * `TrackingRing`. Used as the home hero framing and as a progress/selection
 * indicator so one motif ties the whole system to the app's core action.
 */
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
  // Rotate so the gap sits at the bottom-left (opening toward the "turn").
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
