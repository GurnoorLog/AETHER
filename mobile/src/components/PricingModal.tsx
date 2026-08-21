import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

import { createCheckoutSession, getSubscription } from '@/lib/api';
import { glassRadius, spacing, useTheme, type GlassTheme } from '@/theme';
import { GlassButton } from '@/components/glass/GlassButton';
import { GlassSurface } from '@/components/glass/GlassSurface';
import { Icon } from '@/components/glass/Icon';
import { Check, X } from '@/components/glass/icons';

const PLANS: {
  name: string;
  tier: null | 'pro' | 'unlimited';
  price: string;
  period: string;
  desc: string;
  features: string[];
  popular: boolean;
}[] = [
  {
    name: 'Free',
    tier: null,
    price: '$0',
    period: 'forever',
    desc: 'Dip your toes into personalized AI learning.',
    features: [
      '1 active learning session',
      '10 AI chat messages / day',
      '3 knowledge uploads total',
      '2 quizzes / day',
      '5 min voice tutor / day',
    ],
    popular: false,
  },
  {
    name: 'Pro',
    tier: 'pro',
    price: '$12',
    period: '/month',
    desc: 'For serious learners who want depth and flexibility.',
    features: [
      'Up to 10 active sessions',
      '200 AI chat messages / day',
      '50 knowledge uploads / month',
      'Unlimited quizzes',
      '60 min voice tutor / day',
      'AI music generation (5/mo)',
      'Code challenges & runner',
    ],
    popular: true,
  },
  {
    name: 'Unlimited',
    tier: 'unlimited',
    price: '$29',
    period: '/month',
    desc: 'Zero limits. For power users who want it all.',
    features: [
      'Unlimited sessions',
      'Unlimited AI chat',
      'Unlimited quizzes',
      'Unlimited voice tutor',
      'Unlimited music generation',
      'Priority AI model access',
      'Priority support',
    ],
    popular: false,
  },
];

export function PricingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [currentTier, setCurrentTier] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    getSubscription()
      .then((s) => setCurrentTier(s.tier))
      .catch(() => {});
  }, [open]);

  const subscribe = async (tier: 'pro' | 'unlimited') => {
    setLoading(tier);
    setError('');
    try {
      const url = await createCheckoutSession(tier);
      await WebBrowser.openBrowserAsync(url);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>WELCOME TO AETHER</Text>
              <Text style={styles.title}>Choose Your Plan</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Close">
              <Icon icon={X} size={22} color={theme.light.inkMuted} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.sub}>Start free, upgrade when you outgrow it. No hidden fees.</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {PLANS.map((plan) => {
              const selected = currentTier === plan.tier;
              return (
                <GlassSurface
                  key={plan.name}
                  radius={glassRadius.card}
                  intensity={plan.popular ? 'thick' : 'regular'}
                  fill={plan.popular ? theme.glass.fillStrong : theme.glass.fill}
                  style={[styles.planCard, plan.popular && styles.popularCard]}
                >
                  <View style={styles.planTop}>
                    <View style={styles.planNameRow}>
                      <Text style={styles.planName}>{plan.name}</Text>
                      {plan.popular ? (
                        <View style={[styles.badge, { backgroundColor: theme.accents.home.solid }]}>
                          <Text style={styles.badgeText}>MOST POPULAR</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.planDesc}>{plan.desc}</Text>
                    <View style={styles.priceRow}>
                      <Text style={styles.planPrice}>{plan.price}</Text>
                      <Text style={styles.planPeriod}>{plan.period}</Text>
                    </View>
                  </View>

                  {plan.features.map((f) => (
                    <View key={f} style={styles.feature}>
                      <Icon icon={Check} size={13} color={theme.accents.home.solid} />
                      <Text style={styles.featureText}>{f}</Text>
                    </View>
                  ))}

                  <GlassButton
                    label={selected ? 'Current Plan' : plan.tier ? 'Subscribe' : 'Start Free'}
                    onPress={() => (plan.tier ? subscribe(plan.tier) : onClose())}
                    disabled={!plan.tier && false}
                    loading={loading === plan.tier}
                    size="md"
                    accent="home"
                    style={styles.cta}
                  />
                </GlassSurface>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (theme: GlassTheme) => StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(24,20,37,0.45)' },
  sheet: {
    backgroundColor: theme.light.base,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '92%',
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xs,
  },
  eyebrow: { ...theme.glassType.overline, color: theme.accents.home.solid },
  title: { ...theme.glassType.title, fontSize: 24 },
  sub: { ...theme.glassType.body, color: theme.light.inkMuted, paddingHorizontal: spacing.xl, marginBottom: spacing.md },
  content: { paddingHorizontal: spacing.xl, gap: spacing.md },
  errorBox: {
    backgroundColor: theme.accents.data.wash,
    borderColor: 'rgba(224,90,84,0.3)',
    borderWidth: 1,
    borderRadius: glassRadius.lozenge,
    padding: spacing.md,
  },
  errorText: { ...theme.glassType.body, color: theme.accents.data.solid },
  planCard: { padding: spacing.lg, gap: spacing.sm },
  popularCard: { borderWidth: 1.5, borderColor: theme.accents.home.solid },
  planTop: { gap: spacing.xs, marginBottom: spacing.sm },
  planNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  planName: { ...theme.glassType.label, fontSize: 16 },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: glassRadius.pill },
  badgeText: { ...theme.glassType.overline, fontSize: 8, color: '#FFFFFF' },
  planDesc: { ...theme.glassType.caption, color: theme.light.inkMuted },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs, marginTop: spacing.xs },
  planPrice: { ...theme.glassType.label, fontSize: 26, color: theme.light.ink },
  planPeriod: { ...theme.glassType.caption },
  feature: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  featureText: { ...theme.glassType.body, flex: 1 },
  cta: { marginTop: spacing.sm },
});