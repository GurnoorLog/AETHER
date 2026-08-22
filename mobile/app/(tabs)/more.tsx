import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Icon } from '@/components/glass/Icon';
import { UserRound, Settings2, LogOut } from '@/components/glass/icons';
import { BottomNav } from '@/components/BottomNav';

const GREEN = '#6B8E61';

const MENU_ITEMS = [
  { label: 'Account', icon: UserRound },
  { label: 'Settings', icon: Settings2 },
];

export default function MoreTab() {
  const { session: authSession } = useAuth();

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>More</Text>
        <Text style={styles.subtitle}>Account and settings</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Icon icon={UserRound} size={28} color={GREEN} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{authSession?.user.email?.split('@')[0] || 'User'}</Text>
            <Text style={styles.profileEmail}>{authSession?.user.email || ''}</Text>
          </View>
        </View>

        <View style={styles.menuCard}>
          {MENU_ITEMS.map((item, i) => (
            <Pressable
              key={item.label}
              style={[styles.menuItem, i < MENU_ITEMS.length - 1 && styles.menuBorder]}
            >
              <Icon icon={item.icon} size={20} color="#666" />
              <Text style={styles.menuLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.signOutButton} onPress={() => supabase.auth.signOut()}>
          <Icon icon={LogOut} size={18} color="#EF4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>

        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FDFBF7' },
  scrollContent: { flex: 1, paddingHorizontal: 24, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: '700', color: '#333', fontFamily: 'Outfit_700Bold' },
  subtitle: { fontSize: 15, color: '#666', marginTop: 4, opacity: 0.8, marginBottom: 24 },
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: '#F3EDE3', padding: 16, marginBottom: 20 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#E8F0E5', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: '700', color: '#333' },
  profileEmail: { fontSize: 13, color: '#999', marginTop: 2 },
  menuCard: { backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: '#F3EDE3', overflow: 'hidden', marginBottom: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: '#F3EDE3' },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: '#333' },
  signOutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: '#FEE2E2', padding: 16 },
  signOutText: { fontSize: 15, fontWeight: '700', color: '#EF4444' },
});
