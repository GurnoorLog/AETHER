import { useId, useState } from 'react';
import { View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

interface SparklineProps {
  /** Series values, oldest → newest. */
  data: number[];
  /** Line + trailing-dot color. */
  color: string;
  height?: number;
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * A minimal trend line: a soft area fill under a rounded stroke, with a dot on
 * the latest point (the reference's "you are here" marker). Self-measures its
 * width so it flexes to whatever column it sits in. `react-native-svg` only.
 */
export function Sparkline({ data, color, height = 52, strokeWidth = 2, style }: SparklineProps) {
  const gid = useId();
  const [w, setW] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);

  const max = Math.max(...data, 1);
  const padY = strokeWidth + 2;
  const points = data.map((v, i) => {
    const x = data.length > 1 ? (i / (data.length - 1)) * w : w / 2;
    const y = height - padY - (v / max) * (height - padY * 2);
    return [x, y] as const;
  });

  const line = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = w > 0 && points.length > 0 ? `${line} L${w},${height} L0,${height} Z` : '';
  const last = points[points.length - 1];

  return (
    <View style={[{ height }, style]} onLayout={onLayout}>
      {w > 0 && data.length > 0 ? (
        <Svg width={w} height={height}>
          <Defs>
            <LinearGradient id={`spark-${gid}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity="0.22" />
              <Stop offset="1" stopColor={color} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          {data.length > 1 ? <Path d={area} fill={`url(#spark-${gid})`} /> : null}
          {data.length > 1 ? (
            <Path d={line} stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          ) : null}
          {last ? <Circle cx={last[0]} cy={last[1]} r={strokeWidth + 1.5} fill={color} /> : null}
        </Svg>
      ) : null}
    </View>
  );
}
