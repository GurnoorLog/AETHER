import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Icon } from '@/components/glass/Icon';
import { ChevronRight, LogOut, Settings2, UserRound } from '@/components/glass/icons';
import { BottomNav } from '@/components/BottomNav';
import { SERIF, EDITORIAL, Stamp, EditorialCard, EditorialPressable, EditorialPageHeader } from '@/components/editorial';

export default function MoreTab() {
  const { session: authSession } = useAuth();

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <EditorialPageHeader kicker="Account" title="More" subtitle="Your profile, settings, and account." />

        <EditorialCard style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>
              {(authSession?.user.email?.[0] || 'A').toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{authSession?.user.email?.split('@')[0] || 'Learner'}</Text>
            <Text style={styles.profileEmail} numberOfLines={1}>{authSession?.user.email || ''}</Text>
          </View>
          <Stamp tone="forest" rotate={2}>Learner</Stamp>
        </EditorialCard>

        <EditorialCard style={styles.menuCard}>
          <Pressable
            onPress={() => router.push('/settings')}
            accessibilityRole="button"
            style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
          >
            <Icon icon={Settings2} size={20} color={EDITORIAL.forest} strokeWidth={2} />
            <Text style={styles.menuLabel}>Settings</Text>
            <ChevronRightIcon />
          </Pressable>
        </EditorialCard>

        <EditorialPressable
          onPress={() => supabase.auth.signOut()}
          accessibilityRole="button"
          style={styles.signOutButton}
          pressShadow="1px 1px 0 0 #2D3436"
        >
          <Icon icon={LogOut} size={18} color={EDITORIAL.ink} strokeWidth={2} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </EditorialPressable>

        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomNav />
    </View>
  );
}

function ChevronRightIcon() {
  return <Icon icon={ChevronRight} size={16} color={EDITORIAL.inkMuted} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: EDITORIAL.cream },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  eyebrow: { marginBottom: 8 },
  title: { fontSize: 30, fontWeight: '700', color: EDITORIAL.ink, fontFamily: SERIF, letterSpacing: 0.2 },
  subtitle: { fontFamily: SERIF, fontSize: 15, color: EDITORIAL.inkMuted, marginTop: 4, opacity: 0.8, marginBottom: 24 },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, marginBottom: 20 },
  avatar: { width: 56, height: 56, borderRadius: 20, borderTopLeftRadius: 20, borderTopRightRadius: 8, borderBottomLeftRadius: 22, borderBottomRightRadius: 7, backgroundColor: '#EFEAE0', borderWidth: 2, borderColor: EDITORIAL.ink, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontFamily: SERIF, fontSize: 24, fontWeight: '700', color: EDITORIAL.forest },
  profileInfo: { flex: 1 },
  profileName: { fontFamily: SERIF, fontSize: 16, fontWeight: '700', color: EDITORIAL.ink },
  profileEmail: { fontFamily: SERIF, fontSize: 13, color: EDITORIAL.inkMuted, marginTop: 2 },
  menuCard: { padding: 0, overflow: 'hidden', marginBottom: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  menuLabel: { flex: 1, fontFamily: SERIF, fontSize: 15, fontWeight: '600', color: EDITORIAL.ink },
  pressed: { opacity: 0.8 },
  signOutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: EDITORIAL.cream, borderWidth: 2, borderColor: EDITORIAL.ink, borderRadius: 255, borderTopLeftRadius: 255, borderTopRightRadius: 15, borderBottomLeftRadius: 225, borderBottomRightRadius: 15, paddingVertical: 16, boxShadow: '3px 3px 0 0 #2D3436' },
  signOutText: { fontFamily: SERIF, fontSize: 15, fontWeight: '700', color: EDITORIAL.ink, textTransform: 'uppercase', letterSpacing: 0.3 },
});
