import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { useRevenueCat, getTierFromCustomerInfo } from '@/hooks/useRevenueCat';
import { glassRadius, spacing, useTheme, type AccentKey, type GlassTheme } from '@/theme';
import { GlassButton } from '@/components/glass/GlassButton';
import { GlassCard } from '@/components/glass/GlassCard';
import { GlassIconButton } from '@/components/glass/GlassIconButton';
import { GlassScreen } from '@/components/glass/GlassScreen';
import { GlassSurface } from '@/components/glass/GlassSurface';
import { Icon } from '@/components/glass/Icon';
import { Check, ChevronLeft, Sparkles } from '@/components/glass/icons';

const ACCENT = 'home';

const PLANS: {
  name: string;
  tier: null | 'pro' | 'unlimited';
  price: string;
  period: string;
  desc: string;
  features: string[];
  accent: AccentKey;
  popular: boolean;
  rcIdentifier: string | null;
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
      'Basic progress tracking',
    ],
    accent: 'field',
    popular: false,
    rcIdentifier: null,
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
      'Full analytics & mastery tracking',
    ],
    accent: 'home',
    popular: true,
    rcIdentifier: 'pro_monthly',
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
      'Unlimited knowledge uploads',
      'Unlimited quizzes',
      'Unlimited voice tutor',
      'Unlimited music generation',
      'Priority AI model access',
      'Early access to new features',
      'Priority support',
    ],
    accent: 'voice',
    popular: false,
    rcIdentifier: 'unlimited_monthly',
  },
];

export default function PricingScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { offerings, customerInfo, purchasing, error, purchasePackage } = useRevenueCat();
  const currentTier = getTierFromCustomerInfo(customerInfo);

  const subscribe = async (plan: typeof PLANS[number]) => {
    if (!plan.tier) return;
    const pkg = offerings.find(o => o.identifier === plan.rcIdentifier);
    if (!pkg) return;
    const ok = await purchasePackage(pkg);
    if (ok) router.back();
  };

  return (
    <GlassScreen scroll accent={ACCENT}>
      <View style={styles.header}>
        <GlassIconButton icon={ChevronLeft} onPress={() => router.back()} accessibilityLabel="Back" accent={ACCENT} size={40} />
        <Text style={styles.title}>Pricing</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.hero}>
        <Icon icon={Sparkles} size={22} color={theme.accents[ACCENT].solid} />
        <Text style={styles.heroTitle}>Simple Plans for Serious Learning</Text>
        <Text style={styles.heroSub}>Start free, upgrade when you outgrow it. No hidden fees.</Text>
      </View>

      {error ? (
        <GlassCard style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </GlassCard>
      ) : null}

      {PLANS.map((plan) => {
        const selected = currentTier === plan.tier;
        const isPopular = plan.popular;
        return (
          <GlassSurface
            key={plan.name}
            radius={glassRadius.card}
            intensity={isPopular ? 'thick' : 'regular'}
            fill={isPopular ? theme.glass.fillStrong : theme.glass.fill}
            tintColor={isPopular ? theme.accents[plan.accent].wash : undefined}
            style={[styles.planCard, isPopular && styles.popularCard]}
          >
            <View style={styles.planTop}>
              <View style={styles.planNameRow}>
                <Text style={styles.planName}>{plan.name}</Text>
                {isPopular ? (
                  <View style={[styles.badge, { backgroundColor: theme.accents[plan.accent].solid }]}>
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
                <Icon icon={Check} size={13} color={theme.accents[plan.accent].solid} />
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}

            <GlassButton
              label={selected ? 'Current Plan' : plan.tier ? 'Subscribe' : 'Free'}
              onPress={() => subscribe(plan)}
              disabled={!plan.tier || selected || !!purchasing}
              loading={purchasing === plan.rcIdentifier}
              size="lg"
              accent={plan.accent}
              style={styles.cta}
            />
          </GlassSurface>
        );
      })}

      <Text style={styles.footnote}>Prices in USD. Subscriptions managed by RevenueCat. Cancel anytime.</Text>
    </GlassScreen>
  );
}

const makeStyles = (theme: GlassTheme) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: { ...theme.glassType.title, flex: 1 },
  headerSpacer: { width: 40 },
  hero: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.lg, marginBottom: spacing.sm },
  heroTitle: { ...theme.glassType.title, fontSize: 24, textAlign: 'center' },
  heroSub: { ...theme.glassType.body, color: theme.light.inkMuted, textAlign: 'center' },
  errorCard: { marginBottom: spacing.md },
  errorText: { ...theme.glassType.body, color: theme.accents.data.solid },
  planCard: { padding: spacing.lg, gap: spacing.sm, marginBottom: spacing.md },
  popularCard: { borderWidth: 1.5, borderColor: theme.accents.home.solid },
  planTop: { gap: spacing.xs, marginBottom: spacing.sm },
  planNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  planName: { ...theme.glassType.label, fontSize: 17 },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: glassRadius.pill },
  badgeText: { ...theme.glassType.overline, fontSize: 8, color: '#FFFFFF' },
  planDesc: { ...theme.glassType.caption, color: theme.light.inkMuted },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs, marginTop: spacing.xs },
  planPrice: { ...theme.glassType.label, fontSize: 30, color: theme.light.ink },
  planPeriod: { ...theme.glassType.caption },
  feature: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  featureText: { ...theme.glassType.body, flex: 1 },
  cta: { marginTop: spacing.md },
  footnote: { ...theme.glassType.caption, color: theme.light.inkFaint, textAlign: 'center', marginTop: spacing.lg },
});
