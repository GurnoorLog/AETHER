import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { spacing, useTheme, type GlassTheme, type AccentKey } from '@/theme';
import { AURA_VOICES, getVoice, setVoice } from '@/lib/prefs';
import { getEntitlementTier } from '@/lib/revenuecat';
import { GlassScreen } from '@/components/glass/GlassScreen';
import { Icon } from '@/components/glass/Icon';
import { Check, ChevronLeft } from '@/components/glass/icons';
import { SERIF, EDITORIAL, Stamp, EditorialButton, EditorialCard } from '@/components/editorial';

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
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityRole="button">
          <Icon icon={ChevronLeft} size={26} color={EDITORIAL.forest} />
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <Text style={styles.sectionLabel}>Appearance</Text>
          </View>
          <EditorialCard style={styles.card}>
            <Pressable style={styles.row} onPress={() => setDark(!dark)} accessibilityRole="button" accessibilityState={{ checked: dark }}>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>Dark mode</Text>
                <Text style={styles.rowCaption}>Deep indigo surfaces, easier on the eyes</Text>
              </View>
              <Switch value={dark} onValueChange={setDark} trackColor={{ true: EDITORIAL.forest, false: '#C9C2B4' }} thumbColor={EDITORIAL.cream} />
            </Pressable>
          </EditorialCard>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <Text style={styles.sectionLabel}>Accent color</Text>
          </View>
          <EditorialCard style={styles.card}>
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
                    <View style={[styles.swatchOuter, selected && styles.swatchSelected]}>
                      <View style={[styles.swatchInner, { backgroundColor: a.solid }]} />
                    </View>
                    <Text style={[styles.swatchLabel, selected && styles.swatchLabelSelected]}>{opt.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </EditorialCard>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <Text style={styles.sectionLabel}>Voice tutor</Text>
          </View>
          <EditorialCard style={styles.card}>
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
                  {selected ? <Icon icon={Check} size={18} color={EDITORIAL.forest} /> : null}
                </Pressable>
              );
            })}
          </EditorialCard>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <Text style={styles.sectionLabel}>Subscription</Text>
          </View>
          <EditorialCard style={styles.card}>
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
              <Stamp tone="ink">{tier === 'free' ? 'Free' : tier}</Stamp>
            </View>
            {tier !== 'free' ? (
              <EditorialButton
                onPress={openPortal}
                tone="cream"
                style={styles.manageBtn}
              >
                Manage Subscription
              </EditorialButton>
            ) : (
              <EditorialButton
                onPress={() => router.push('/pricing')}
                tone="forest"
                style={styles.manageBtn}
              >
                View Plans & Upgrade
              </EditorialButton>
            )}
          </EditorialCard>
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
  title: { fontFamily: SERIF, fontWeight: '700', fontSize: 22, color: EDITORIAL.ink, flex: 1 },
  headerSpacer: { width: 26 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.lg },
  section: { gap: spacing.sm },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.xs },
  sectionLabel: { fontFamily: SERIF, fontWeight: '600', fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: EDITORIAL.inkMuted },
  card: { padding: spacing.md, gap: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowDivider: { borderTopWidth: 1, borderTopColor: '#DCD5C6' },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontFamily: SERIF, fontWeight: '700', fontSize: 15, color: EDITORIAL.ink },
  rowCaption: { fontFamily: SERIF, fontSize: 12, color: EDITORIAL.inkMuted },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, paddingVertical: spacing.xs },
  swatchWrap: { alignItems: 'center', gap: 4, width: 52 },
  swatchOuter: {
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: 2,
  },
  swatchSelected: { borderColor: EDITORIAL.ink },
  swatchInner: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(45,52,54,0.25)' },
  swatchLabel: { fontFamily: SERIF, fontSize: 11, color: EDITORIAL.inkMuted },
  swatchLabelSelected: { color: EDITORIAL.ink, fontWeight: '700' },
  manageBtn: { marginTop: spacing.sm },
});
