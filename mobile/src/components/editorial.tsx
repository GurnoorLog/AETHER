import { Animated, Easing, Platform, Pressable, StyleSheet, Text, TextInput, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { useRef, useState, type ReactNode } from 'react';

export const SERIF = Platform.select({ ios: 'Georgia', default: 'serif' }) ?? 'serif';
export const EDITORIAL = {
  cream: '#FDFBF7',
  forest: '#3F5C3A',
  ochre: '#C9772E',
  ink: '#2D3436',
  inkMuted: '#555E61',
};

const ROUGH_CARD: ViewStyle = {
  borderRadius: 20,
  borderTopLeftRadius: 20,
  borderTopRightRadius: 8,
  borderBottomLeftRadius: 22,
  borderBottomRightRadius: 7,
};

const ROUGH_BTN: ViewStyle = {
  borderRadius: 255,
  borderTopLeftRadius: 255,
  borderTopRightRadius: 15,
  borderBottomLeftRadius: 225,
  borderBottomRightRadius: 15,
};

const ROUGH_INPUT: ViewStyle = {
  borderRadius: 16,
  borderTopLeftRadius: 16,
  borderTopRightRadius: 6,
  borderBottomLeftRadius: 18,
  borderBottomRightRadius: 6,
};

const CARD_SHADOW: ViewStyle = {
  boxShadow: '4px 4px 0 0 ' + EDITORIAL.ink,
};

const BTN_SHADOW: ViewStyle = {
  boxShadow: '3px 3px 0 0 ' + EDITORIAL.ink,
};

interface StampProps {
  children: ReactNode;
  tone?: 'ink' | 'forest';
  rotate?: number;
  style?: StyleProp<ViewStyle>;
}

export function Stamp({ children, tone = 'ink', rotate = -1.5, style }: StampProps) {
  const border = tone === 'forest' ? EDITORIAL.forest : EDITORIAL.ink;
  const color = tone === 'forest' ? EDITORIAL.cream : EDITORIAL.forest;
  return (
    <View
      style={[
        styles.stamp,
        {
          borderColor: border,
          backgroundColor: tone === 'forest' ? EDITORIAL.forest : EDITORIAL.cream,
          transform: [{ rotate: `${rotate}deg` }],
        },
        style,
      ]}
    >
      <Text style={[styles.stampText, { color }]}>{children}</Text>
    </View>
  );
}

export function StampInk({ children, rotate = 1.8, style }: Omit<StampProps, 'tone'>) {
  return (
    <View
      style={[
        styles.stamp,
        {
          borderColor: EDITORIAL.ink,
          backgroundColor: EDITORIAL.forest,
          transform: [{ rotate: `${rotate}deg` }],
        },
        style,
      ]}
    >
      <Text style={[styles.stampText, { color: EDITORIAL.cream }]}>{children}</Text>
    </View>
  );
}

export function Kicker({ children, color, style }: { children: ReactNode; color?: string; style?: ViewStyle }) {
  return (
    <View style={[styles.kicker, style]}>
      <Text style={[styles.kickerText, { color: color ?? EDITORIAL.inkMuted }]}>{children}</Text>
    </View>
  );
}

export function RuleRough({ color, style }: { color?: string; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.ruleRough, { backgroundColor: color ?? EDITORIAL.forest }, style]} />;
}

interface EditorialPageHeaderProps {
  kicker?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  rule?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function EditorialPageHeader({ kicker, title, subtitle, rule = true, style }: EditorialPageHeaderProps) {
  return (
    <View style={[styles.pageHeader, style]}>
      {kicker ? <Kicker style={{ marginBottom: 10 }}>{kicker}</Kicker> : null}
      <Text style={styles.pageTitle}>{title}</Text>
      {subtitle ? <Text style={styles.pageSubtitle} numberOfLines={2}>{subtitle}</Text> : null}
      {rule ? <RuleRough style={styles.pageHeaderRule} /> : null}
    </View>
  );
}

interface EditorialCardProps {
  children: ReactNode;
  tone?: 'paper' | 'ink';
  style?: StyleProp<ViewStyle>;
}

export function EditorialCard({ children, tone = 'paper', style }: EditorialCardProps) {
  return (
    <View
      style={[
        styles.card,
        CARD_SHADOW,
        tone === 'ink' ? styles.cardInk : styles.cardPaper,
        style,
      ]}
    >
      {children}
    </View>
  );
}

interface EditorialButtonProps {
  children: ReactNode;
  onPress: () => void;
  tone?: 'forest' | 'cream' | 'disabled';
  style?: StyleProp<ViewStyle>;
}

export function EditorialButton({ children, onPress, tone = 'forest', style }: EditorialButtonProps) {
  const disabled = tone === 'disabled';
  const anim = useRef(new Animated.Value(0)).current;
  const [pressed, setPressed] = useState(false);

  const toPressed = () => {
    if (disabled) return;
    setPressed(true);
    Animated.timing(anim, { toValue: 1, duration: 90, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  };
  const toReleased = () => {
    setPressed(false);
    Animated.spring(anim, { toValue: 0, useNativeDriver: true, speed: 40, bounciness: 2 }).start();
  };

  const translate = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 2] });

  return (
    <Animated.View style={{ transform: [{ translateY: translate }, { translateX: translate }] }}>
      <Pressable
        onPress={disabled ? undefined : onPress}
        onPressIn={toPressed}
        onPressOut={toReleased}
        accessibilityRole="button"
        style={[
          styles.btn,
          ROUGH_BTN,
          BTN_SHADOW,
          disabled ? styles.btnDisabled : tone === 'cream' ? styles.btnCream : styles.btnForest,
          pressed && !disabled && { boxShadow: '1px 1px 0 0 ' + EDITORIAL.ink },
          style,
        ]}
      >
        <Text style={[styles.btnText, disabled ? styles.btnTextDisabled : tone === 'cream' ? styles.btnTextCream : styles.btnTextForest]}>
          {children}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

interface EditorialPressableProps {
  children: ReactNode;
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  disabled?: boolean;
  pressShadow?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityRole?: 'button' | 'radio' | 'checkbox';
  accessibilityLabel?: string;
  accessibilityState?: { selected?: boolean; disabled?: boolean };
  hitSlop?: number | { top?: number; bottom?: number; left?: number; right?: number };
}

export function EditorialPressable({
  children, onPress, onPressIn, onPressOut, disabled,
  pressShadow, style, accessibilityRole, accessibilityLabel, accessibilityState, hitSlop,
}: EditorialPressableProps) {
  const anim = useRef(new Animated.Value(0)).current;
  const [pressed, setPressed] = useState(false);

  const hold = (v: number) =>
    Animated.timing(anim, { toValue: v, duration: 80, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();

  const translate = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 2] });

  return (
    <Animated.View style={{ transform: [{ translateY: translate }, { translateX: translate }] }}>
      <Pressable
        onPress={disabled ? undefined : onPress}
        onPressIn={disabled ? undefined : () => { setPressed(true); hold(1); onPressIn?.(); }}
        onPressOut={disabled ? undefined : () => { setPressed(false); Animated.spring(anim, { toValue: 0, speed: 46, bounciness: 2, useNativeDriver: true }).start(); onPressOut?.(); }}
        disabled={disabled}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        accessibilityState={accessibilityState}
        hitSlop={hitSlop}
        style={[style, pressed && !disabled && pressShadow ? { boxShadow: pressShadow } : null]}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

interface EditorialInputProps {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  style?: StyleProp<TextStyle>;
}

export function EditorialInput({ value, onChangeText, placeholder, style }: EditorialInputProps) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={EDITORIAL.inkMuted}
      style={[styles.input, style]}
    />
  );
}

const styles = StyleSheet.create({
  stamp: {
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderRadius: 6,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 3,
    borderBottomLeftRadius: 7,
    borderBottomRightRadius: 2,
    paddingHorizontal: 10,
    paddingVertical: 3,
    boxShadow: '2px 2px 0 0 rgba(63,92,58,0.18)',
  },
  stampText: {
    fontFamily: SERIF,
    fontWeight: '600',
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  kicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  kickerText: {
    fontFamily: SERIF,
    fontWeight: '600',
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  ruleRough: {
    width: 40,
    height: 2,
    borderRadius: 1,
    transform: [{ rotate: '-1deg' }],
    opacity: 0.7,
  },
  pageHeader: {
    marginBottom: 26,
  },
  pageTitle: {
    fontFamily: SERIF,
    fontSize: 34,
    fontWeight: '700',
    color: EDITORIAL.ink,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontFamily: SERIF,
    fontSize: 15,
    fontWeight: '400',
    color: EDITORIAL.inkMuted,
    marginTop: 6,
    lineHeight: 21,
  },
  pageHeaderRule: {
    width: 40,
    height: 2,
    borderRadius: 1,
    marginTop: 14,
    transform: [{ rotate: '-1deg' }],
    opacity: 0.7,
  },
  card: {
    alignSelf: 'stretch',
    borderWidth: 2,
    padding: 18,
    ...ROUGH_CARD,
  },
  cardPaper: {
    borderColor: EDITORIAL.ink,
    backgroundColor: EDITORIAL.cream,
  },
  cardInk: {
    borderColor: EDITORIAL.ink,
    backgroundColor: EDITORIAL.ink,
  },
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 2,
  },
  btnForest: {
    backgroundColor: EDITORIAL.forest,
    borderColor: EDITORIAL.ink,
  },
  btnCream: {
    backgroundColor: EDITORIAL.cream,
    borderColor: EDITORIAL.ink,
  },
  btnDisabled: {
    backgroundColor: '#E3DCCE',
    borderColor: '#C9C2B4',
  },
  btnText: {
    fontFamily: SERIF,
    fontWeight: '700',
    fontSize: 17,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  btnTextForest: { color: EDITORIAL.cream },
  btnTextCream: { color: EDITORIAL.forest },
  btnTextDisabled: { color: '#A49C8D' },
  input: {
    backgroundColor: EDITORIAL.cream,
    borderColor: EDITORIAL.ink,
    borderWidth: 2,
    ...ROUGH_INPUT,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: EDITORIAL.ink,
    fontSize: 15,
    fontFamily: SERIF,
  },
});