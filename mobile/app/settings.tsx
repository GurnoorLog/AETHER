import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { glassRadius, spacing, useTheme, type GlassTheme, type AccentKey } from '@/theme';
import { AURA_VOICES, getVoice, setVoice } from '@/lib/prefs';
import { getEntitlementTier } from '@/lib/revenuecat';
import { GlassIconButton } from '@/components/glass/GlassIconButton';
import { GlassScreen } from '@/components/glass/GlassScreen';
import { GlassSurface } from '@/components/glass/GlassSurface';
import { GlassButton } from '@/components/glass/GlassButton';
import { Icon } from '@/components/glass/Icon';
import { Check, ChevronLeft, Database, Sun, Volume2 } from '@/components/glass/icons';

const ACCENT_OPTIONS: { key: AccentKey; label: string }[] = [
  { key: 'home', label: 'Bloom' },
  { key: 'audio', label: 'Mint' },
  { key: 'voice', label: 'Violet' },
  { key: 'vocab', label: 'Amber' },
  { key: 'field', label: 'Sky' },
  { key: 'feedback', label: 'Rose' },
];

export default function SettingsScreen() {
  const { theme, dark, setDark, accent, setAccent } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [voice, setVoiceState] = useState<string | null>(null);
  const [tier, setTier] = useState<'free' | 'pro' | 'unlimited'>('free');

  useEffect(() => {
    getVoice().then(setVoiceState);
  }, []);

  useEffect(() => {
    getEntitlementTier().then(setTier).catch(() => {});
  }, []);

  const openPortal = async () => {
    try {
      const RevenueCatUI = (await import('react-native-purchases-ui')).default;
      await RevenueCatUI.presentCustomerCenter();
    } catch {
      router.push('/pricing');
    }
  };

  const selectVoice = useCallback(async (v: string) => {
    setVoiceState(v);
    await setVoice(v);
  }, []);

  return (
    <GlassScreen accent={accent}>
      <View style={styles.header}>
        <GlassIconButton icon={ChevronLeft} onPress={() => router.back()} accessibilityLabel="Back" accent={accent} size={40} />
        <Text style={styles.title}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <Icon icon={Sun} size={15} color={theme.accents[accent].solid} />
            <Text style={styles.sectionLabel}>APPEARANCE</Text>
          </View>
          <GlassSurface radius={glassRadius.card} intensity="regular" fill={theme.glass.fill} style={styles.card}>
            <Pressable style={styles.row} onPress={() => setDark(!dark)} accessibilityRole="button" accessibilityState={{ checked: dark }}>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>Dark mode</Text>
                <Text style={styles.rowCaption}>Deep indigo surfaces, easier on the eyes</Text>
              </View>
              <Switch value={dark} onValueChange={setDark} trackColor={{ true: theme.accents[accent].solid }} />
            </Pressable>
          </GlassSurface>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <Icon icon={Check} size={15} color={theme.accents[accent].solid} />
            <Text style={styles.sectionLabel}>ACCENT COLOR</Text>
          </View>
          <GlassSurface radius={glassRadius.card} intensity="regular" fill={theme.glass.fill} style={styles.card}>
            <View style={styles.swatches}>
              {ACCENT_OPTIONS.map((opt) => {
                const selected = accent === opt.key;
                const a = theme.accents[opt.key];
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => setAccent(opt.key)}
                    accessibilityRole="button"
                    accessibilityLabel={`${opt.label} accent`}
                    accessibilityState={{ selected }}
                    style={styles.swatchWrap}
                  >
                    <View style={[styles.swatchOuter, selected && { borderColor: theme.light.ink }]}>
                      <GlassSurface radius={999} intensity="regular" fill="transparent" style={styles.swatch}>
                        <View style={[styles.swatchInner, { backgroundColor: a.solid }]} />
                      </GlassSurface>
                    </View>
                    <Text style={[styles.swatchLabel, selected && { color: theme.light.ink }]}>{opt.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </GlassSurface>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <Icon icon={Volume2} size={15} color={theme.accents[accent].solid} />
            <Text style={styles.sectionLabel}>VOICE TUTOR</Text>
          </View>
          <GlassSurface radius={glassRadius.card} intensity="regular" fill={theme.glass.fill} style={styles.card}>
            {AURA_VOICES.map((v, i) => {
              const selected = voice === v;
              const label = v.replace('aura-', '').replace('-en', '');
              return (
                <Pressable
                  key={v}
                  onPress={() => selectVoice(v)}
                  accessibilityRole="button"
                  accessibilityLabel={`Voice ${label}`}
                  accessibilityState={{ selected }}
                  style={[styles.row, i > 0 && styles.rowDivider]}
                >
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>{label.charAt(0).toUpperCase() + label.slice(1)}</Text>
                  </View>
                  {selected ? <Icon icon={Check} size={18} color={theme.accents[accent].solid} /> : null}
                </Pressable>
              );
            })}
          </GlassSurface>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <Icon icon={Database} size={15} color={theme.accents[accent].solid} />
            <Text style={styles.sectionLabel}>SUBSCRIPTION</Text>
          </View>
          <GlassSurface radius={glassRadius.card} intensity="regular" fill={theme.glass.fill} style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>
                  {tier === 'pro'
                    ? 'Pro'
                    : tier === 'unlimited'
                      ? 'Unlimited'
                      : 'Free'}
                </Text>
                <Text style={styles.rowCaption}>
                  {tier !== 'free'
                    ? 'Active subscription'
                    : 'Upgrade for more sessions, chat, and features.'}
                </Text>
              </View>
            </View>
            {tier !== 'free' ? (
              <GlassButton
                label="Manage Subscription"
                onPress={openPortal}
                variant="secondary"
                size="md"
                style={styles.manageBtn}
              />
            ) : (
              <GlassButton
                label="View Plans & Upgrade"
                onPress={() => router.push('/pricing')}
                variant="primary"
                size="md"
                accent="home"
                style={styles.manageBtn}
              />
            )}
          </GlassSurface>
        </View>
      </ScrollView>
    </GlassScreen>
  );
}

const makeStyles = (theme: GlassTheme) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: { ...theme.glassType.title, flex: 1 },
  headerSpacer: { width: 40 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.lg },
  section: { gap: spacing.sm },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.xs },
  sectionLabel: { ...theme.glassType.overline, color: theme.light.inkMuted },
  card: { padding: spacing.md, gap: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowDivider: { borderTopWidth: 1, borderTopColor: theme.light.hairline },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { ...theme.glassType.label, fontSize: 15 },
  rowCaption: { ...theme.glassType.caption },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, paddingVertical: spacing.xs },
  swatchWrap: { alignItems: 'center', gap: 4, width: 52 },
  swatchOuter: {
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: 2,
  },
  swatch: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  swatchInner: { width: 26, height: 26, borderRadius: 13 },
  swatchLabel: { ...theme.glassType.caption, color: theme.light.inkFaint },
  manageBtn: { marginTop: spacing.sm },
});
