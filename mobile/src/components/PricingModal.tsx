import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';

import { useRevenueCat, getTierFromCustomerInfo } from '@/hooks/useRevenueCat';
import { Icon } from '@/components/glass/Icon';
import { Check, Sparkles, X, RefreshCw } from '@/components/glass/icons';
import { EditorialCard, EditorialButton, Stamp, Kicker, RuleRough, SERIF, EDITORIAL } from '@/components/editorial';

const PLANS = [
  {
    name: 'Free',
    tier: null as null | 'pro' | 'unlimited',
    price: '$0',
    period: 'forever',
    desc: 'Dip your toes into personalized AI learning.',
    features: ['1 active learning session', '10 AI chat messages / day', '3 knowledge uploads total', '2 quizzes / day', '5 min voice tutor / day'],
    popular: false,
    rcIdentifier: null as string | null,
  },
  {
    name: 'Pro',
    tier: 'pro' as const,
    price: '$12',
    period: '/month',
    desc: 'For serious learners who want depth and flexibility.',
    features: ['Up to 10 active sessions', '200 AI chat messages / day', '50 knowledge uploads / month', 'Unlimited quizzes', '60 min voice tutor / day', 'AI music generation (5/mo)', 'Code challenges & runner'],
    popular: true,
    rcIdentifier: 'pro_monthly',
  },
  {
    name: 'Unlimited',
    tier: 'unlimited' as const,
    price: '$29',
    period: '/month',
    desc: 'Zero limits. For power users who want it all.',
    features: ['Unlimited sessions', 'Unlimited AI chat', 'Unlimited quizzes', 'Unlimited voice tutor', 'Unlimited music generation', 'Priority AI model access', 'Priority support'],
    popular: false,
    rcIdentifier: 'unlimited_monthly',
  },
];

export function PricingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { offerings, customerInfo, purchasing, error, refresh, purchasePackage, restorePurchases } = useRevenueCat();
  const currentTier = getTierFromCustomerInfo(customerInfo);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (open) {
      setLocalError('');
      refresh();
    }
  }, [open, refresh]);

  const displayError = localError || error;

  const subscribe = async (plan: typeof PLANS[number]) => {
    if (!plan.tier) { onClose(); return; }
    setLocalError('');
    const pkg = offerings.find(o => o.identifier === plan.rcIdentifier);
    if (!pkg) {
      setLocalError('Subscription products are loading. Please try again in a moment.');
      return;
    }
    const ok = await purchasePackage(pkg);
    if (ok) onClose();
  };

  const handleRestore = async () => {
    setLocalError('');
    const ok = await restorePurchases();
    if (ok) onClose();
  };

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Icon icon={Sparkles} size={20} color={EDITORIAL.forest} />
            </View>
            <View style={styles.headerText}>
              <Kicker color={EDITORIAL.forest}>WELCOME TO AETHER</Kicker>
              <Text style={styles.title}>Choose Your Plan</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <Icon icon={X} size={22} color={EDITORIAL.inkMuted} />
            </Pressable>
          </View>

          <RuleRough color={EDITORIAL.forest} />

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.sub}>Start free, upgrade when you outgrow it. No hidden fees.</Text>

            {displayError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{displayError}</Text>
              </View>
            ) : null}

            {PLANS.map((plan) => {
              const selected = currentTier === plan.tier;
              const isSelectedPlan = plan.popular || selected;
              return (
                <EditorialCard key={plan.name} tone={isSelectedPlan ? 'ink' : 'paper'} style={styles.planCard}>
                  <View style={styles.planTop}>
                    <View style={styles.planNameRow}>
                      <Text style={[styles.planName, isSelectedPlan && styles.planNameLight]}>{plan.name}</Text>
                      {plan.popular ? (
                        <Stamp tone="forest" rotate={-1.5}>MOST POPULAR</Stamp>
                      ) : null}
                    </View>
                    <Text style={[styles.planDesc, isSelectedPlan && styles.planDescLight]}>{plan.desc}</Text>
                    <View style={styles.priceRow}>
                      <Text style={[styles.planPrice, isSelectedPlan && styles.planPriceLight]}>{plan.price}</Text>
                      <Text style={[styles.planPeriod, isSelectedPlan && styles.planPeriodLight]}>{plan.period}</Text>
                    </View>
                  </View>

                  {plan.features.map((f) => (
                    <View key={f} style={styles.feature}>
                      <Icon icon={Check} size={13} color={isSelectedPlan ? EDITORIAL.cream : EDITORIAL.forest} />
                      <Text style={[styles.featureText, isSelectedPlan && styles.featureTextLight]}>{f}</Text>
                    </View>
                  ))}

                  <EditorialButton
                    tone={selected ? 'disabled' : 'forest'}
                    onPress={() => subscribe(plan)}
                    style={styles.cta}
                  >
                    {purchasing === plan.rcIdentifier ? (
                      <ActivityIndicator color={EDITORIAL.cream} size="small" />
                    ) : (
                      selected ? 'Current Plan' : plan.tier ? 'Subscribe' : 'Start Free'
                    )}
                  </EditorialButton>
                </EditorialCard>
              );
            })}

            <Pressable style={styles.restoreBtn} onPress={handleRestore}>
              <Icon icon={RefreshCw} size={14} color={EDITORIAL.inkMuted} />
              <Text style={styles.restoreText}>Restore purchases</Text>
            </Pressable>

            <Text style={styles.footnote}>Prices in USD. Subscriptions managed by RevenueCat. Cancel anytime.</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: {
    backgroundColor: EDITORIAL.cream,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '92%',
    paddingTop: 24,
    paddingBottom: 40,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, marginBottom: 8 },
  headerIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#E8F0E5', alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1 },
  title: { fontFamily: SERIF, fontSize: 22, fontWeight: '700', color: EDITORIAL.ink },
  sub: { fontFamily: SERIF, fontSize: 14, color: EDITORIAL.inkMuted, paddingHorizontal: 24, marginBottom: 16 },
  content: { paddingHorizontal: 24, gap: 14, paddingTop: 16 },

  errorBox: { backgroundColor: '#FFF0F0', borderRadius: 8, padding: 14, borderWidth: 2, borderColor: '#C05050' },
  errorText: { fontFamily: SERIF, fontSize: 14, color: '#C05050', textAlign: 'center' },

  planCard: { padding: 20, gap: 12 },
  planTop: { gap: 6, marginBottom: 4 },
  planNameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  planName: { fontFamily: SERIF, fontSize: 17, fontWeight: '700', color: EDITORIAL.ink },
  planNameLight: { color: EDITORIAL.cream },
  planDesc: { fontFamily: SERIF, fontSize: 13, color: EDITORIAL.inkMuted },
  planDescLight: { color: '#A49C8D' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 4 },
  planPrice: { fontFamily: SERIF, fontSize: 28, fontWeight: '700', color: EDITORIAL.ink },
  planPriceLight: { color: EDITORIAL.cream },
  planPeriod: { fontFamily: SERIF, fontSize: 13, color: EDITORIAL.inkMuted },
  planPeriodLight: { color: '#A49C8D' },

  feature: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { fontFamily: SERIF, fontSize: 14, color: EDITORIAL.inkMuted, flex: 1 },
  featureTextLight: { color: EDITORIAL.cream },

  cta: { marginTop: 8 },

  restoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  restoreText: { fontFamily: SERIF, fontSize: 13, color: EDITORIAL.inkMuted, textDecorationLine: 'underline' },

  footnote: { fontFamily: SERIF, fontSize: 12, color: '#A49C8D', textAlign: 'center', marginTop: 8 },
});
