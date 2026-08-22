import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';

import { useRevenueCat, getTierFromCustomerInfo } from '@/hooks/useRevenueCat';
import { Icon } from '@/components/glass/Icon';
import { Check, Sparkles, X, RefreshCw } from '@/components/glass/icons';

const GREEN = '#6B8E61';

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
              <Icon icon={Sparkles} size={20} color={GREEN} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.eyebrow}>WELCOME TO AETHER</Text>
              <Text style={styles.title}>Choose Your Plan</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <Icon icon={X} size={22} color="#999" />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.sub}>Start free, upgrade when you outgrow it. No hidden fees.</Text>

            {displayError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{displayError}</Text>
              </View>
            ) : null}

            {PLANS.map((plan) => {
              const selected = currentTier === plan.tier;
              return (
                <View key={plan.name} style={[styles.planCard, plan.popular && styles.popularCard]}>
                  <View style={styles.planTop}>
                    <View style={styles.planNameRow}>
                      <Text style={styles.planName}>{plan.name}</Text>
                      {plan.popular ? (
                        <View style={styles.badge}>
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
                      <Icon icon={Check} size={13} color={GREEN} />
                      <Text style={styles.featureText}>{f}</Text>
                    </View>
                  ))}

                  <Pressable
                    style={[styles.cta, selected && styles.ctaDisabled]}
                    onPress={() => subscribe(plan)}
                    disabled={!plan.tier || selected || !!purchasing}
                  >
                    {purchasing === plan.rcIdentifier ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <Text style={styles.ctaText}>{selected ? 'Current Plan' : plan.tier ? 'Subscribe' : 'Start Free'}</Text>
                    )}
                  </Pressable>
                </View>
              );
            })}

            <Pressable style={styles.restoreBtn} onPress={handleRestore}>
              <Icon icon={RefreshCw} size={14} color="#999" />
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
    backgroundColor: '#FDFBF7',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '92%',
    paddingTop: 24,
    paddingBottom: 40,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, marginBottom: 8 },
  headerIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E8F0E5', alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1 },
  eyebrow: { fontSize: 11, fontWeight: '700', color: GREEN, textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: 22, fontWeight: '700', color: '#333' },
  sub: { fontSize: 14, color: '#999', paddingHorizontal: 24, marginBottom: 16 },
  content: { paddingHorizontal: 24, gap: 14 },

  errorBox: { backgroundColor: '#FFF0F0', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#FDD' },
  errorText: { fontSize: 14, color: '#C05050', textAlign: 'center' },

  planCard: { backgroundColor: '#FFF', borderRadius: 24, borderWidth: 1.5, borderColor: '#F3EDE3', padding: 20, gap: 12 },
  popularCard: { borderColor: GREEN, shadowColor: GREEN, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
  planTop: { gap: 6, marginBottom: 4 },
  planNameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  planName: { fontSize: 17, fontWeight: '700', color: '#333' },
  badge: { backgroundColor: GREEN, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 9, fontWeight: '700', color: '#FFF', textTransform: 'uppercase', letterSpacing: 0.5 },
  planDesc: { fontSize: 13, color: '#999' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 4 },
  planPrice: { fontSize: 28, fontWeight: '700', color: '#333' },
  planPeriod: { fontSize: 13, color: '#999' },

  feature: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { fontSize: 14, color: '#555', flex: 1 },

  cta: { backgroundColor: GREEN, borderRadius: 20, height: 50, alignItems: 'center', justifyContent: 'center', marginTop: 8, shadowColor: GREEN, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { color: '#FFF', fontSize: 15, fontWeight: '700' },

  restoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  restoreText: { fontSize: 13, color: '#999', textDecorationLine: 'underline' },

  footnote: { fontSize: 12, color: '#CCC', textAlign: 'center', marginTop: 8 },
});
