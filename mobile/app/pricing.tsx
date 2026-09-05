import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { useRevenueCat, getTierFromCustomerInfo } from '@/hooks/useRevenueCat';
import { spacing, useTheme, type AccentKey, type GlassTheme } from '@/theme';
import { GlassScreen } from '@/components/glass/GlassScreen';
import { Icon } from '@/components/glass/Icon';
import { Check, ChevronLeft } from '@/components/glass/icons';
import { SERIF, EDITORIAL, Stamp, EditorialButton, EditorialCard } from '@/components/editorial';

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
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityRole="button">
          <Icon icon={ChevronLeft} size={26} color={EDITORIAL.forest} />
        </Pressable>
        <Text style={styles.title}>Pricing</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.hero}>
        <Stamp tone="ink" rotate={-1.5}><SparklesIcon /></Stamp>
        <Text style={styles.heroTitle}>Simple Plans for{'\n'}Serious Learning</Text>
        <Text style={styles.heroSub}>Start free, upgrade when you outgrow it. No hidden fees.</Text>
      </View>

      {error ? (
        <EditorialCard style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </EditorialCard>
      ) : null}

      {PLANS.map((plan) => {
        const selected = currentTier === plan.tier;
        const isPopular = plan.popular;
        return (
          <EditorialCard
            key={plan.name}
            style={[styles.planCard, isPopular && styles.popularCard]}
          >
            <View style={styles.planTop}>
              <View style={styles.planNameRow}>
                <Text style={styles.planName}>{plan.name}</Text>
              </View>
              {isPopular ? (
                <Stamp tone="forest" rotate={2}>Most Popular</Stamp>
              ) : null}
              <Text style={styles.planDesc}>{plan.desc}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.planPrice}>{plan.price}</Text>
                <Text style={styles.planPeriod}>{plan.period}</Text>
              </View>
            </View>

            {plan.features.map((f) => (
              <View key={f} style={styles.feature}>
                <Icon icon={Check} size={13} color={EDITORIAL.forest} />
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}

            <EditorialButton
              onPress={() => subscribe(plan)}
              tone={selected ? 'disabled' : plan.tier ? 'forest' : 'cream'}
              style={styles.cta}
            >
              {selected ? 'Current Plan' : plan.tier ? 'Subscribe' : 'Free'}
            </EditorialButton>
          </EditorialCard>
        );
      })}

      <Text style={styles.footnote}>Prices in USD. Subscriptions managed by RevenueCat. Cancel anytime.</Text>
    </GlassScreen>
  );
}

function SparklesIcon() {
  return <Text style={{ fontFamily: SERIF, fontWeight: '700', fontSize: 11, letterSpacing: 0.4, textTransform: 'uppercase', color: EDITORIAL.cream }}>✦</Text>;
}

const makeStyles = (theme: GlassTheme) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: { fontFamily: SERIF, fontWeight: '700', fontSize: 22, color: EDITORIAL.ink, flex: 1 },
  headerSpacer: { width: 26 },
  hero: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.lg, marginBottom: spacing.sm },
  heroTitle: { fontFamily: SERIF, fontWeight: '700', fontSize: 26, color: EDITORIAL.ink, textAlign: 'center', lineHeight: 32 },
  heroSub: { fontFamily: SERIF, fontSize: 14, color: EDITORIAL.inkMuted, textAlign: 'center' },
  errorCard: { marginBottom: spacing.md },
  errorText: { fontFamily: SERIF, color: '#A9533A' },
  planCard: { gap: spacing.sm, marginBottom: spacing.md },
  popularCard: { borderWidth: 2, borderColor: EDITORIAL.forest },
  planTop: { gap: spacing.xs, marginBottom: spacing.sm },
  planNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  planName: { fontFamily: SERIF, fontWeight: '700', fontSize: 19, color: EDITORIAL.ink },
  planDesc: { fontFamily: SERIF, fontSize: 13, color: EDITORIAL.inkMuted },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs, marginTop: spacing.xs },
  planPrice: { fontFamily: SERIF, fontWeight: '700', fontSize: 30, color: EDITORIAL.ink },
  planPeriod: { fontFamily: SERIF, fontSize: 14, color: EDITORIAL.inkMuted },
  feature: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  featureText: { fontFamily: SERIF, fontSize: 14, color: EDITORIAL.ink, flex: 1 },
  cta: { marginTop: spacing.md },
  footnote: { fontFamily: SERIF, fontSize: 12, color: EDITORIAL.inkMuted, textAlign: 'center', marginTop: spacing.lg },
});
