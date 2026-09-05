import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { supabase } from '@/lib/supabase';
import { spacing } from '@/theme';
import { Icon } from '@/components/glass/Icon';
import { ChevronRight, LogOut, Settings2, UserRound, X } from '@/components/glass/icons';
import { SERIF, EDITORIAL } from '@/components/editorial';

export function ProfileSheet({ open, onClose, email }: { open: boolean; onClose: () => void; email?: string | null }) {
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState('');
  const [fullName, setFullName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setFullName(null);
    setAvatarUrl(null);
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.from('user_profiles').select('full_name, avatar_url').maybeSingle();
        if (!mounted || !data) return;
        if (data.full_name) setFullName(data.full_name);
        if (data.avatar_url) setAvatarUrl(data.avatar_url);
      } catch {
      }
    })();
    return () => {
      mounted = false;
    };
  }, [open]);

  const close = () => {
    setError('');
    onClose();
  };

  const signOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    setError('');
    try {
      await supabase.auth.signOut();
      close();
      router.replace('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign out failed');
      setSigningOut(false);
    }
  };

  const initial = (fullName || email || 'A').trim().charAt(0).toUpperCase();

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={close} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Account</Text>
            <Pressable onPress={close} hitSlop={8} accessibilityRole="button" accessibilityLabel="Close" style={styles.closeBtn}>
              <Icon icon={X} size={18} color={EDITORIAL.ink} strokeWidth={2} />
            </Pressable>
          </View>

          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarInitial}>{initial}</Text>
              )}
            </View>
            <View style={styles.profileText}>
              <Text style={styles.initial}>{fullName || 'Learner'}</Text>
              <Text style={styles.email} numberOfLines={1}>{email ?? 'Signed in'}</Text>
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            onPress={() => {
              close();
              router.push('/settings');
            }}
            accessibilityRole="button"
            accessibilityLabel="Open settings"
            style={({ pressed }) => [styles.settings, pressed && styles.pressed]}
          >
            <Icon icon={Settings2} size={18} color={EDITORIAL.forest} strokeWidth={2} />
            <Text style={styles.settingsText}>Settings</Text>
            <Icon icon={ChevronRight} size={16} color={EDITORIAL.inkMuted} />
          </Pressable>

          <Pressable
            onPress={signOut}
            disabled={signingOut}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}
          >
            {signingOut ? (
              <ActivityIndicator color={EDITORIAL.ink} />
            ) : (
              <Icon icon={LogOut} size={18} color={EDITORIAL.ink} strokeWidth={2} />
            )}
            <Text style={styles.signOutText}>{signingOut ? 'Signing out…' : 'Sign Out'}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(24,20,37,0.45)' },
  sheet: {
    backgroundColor: EDITORIAL.cream,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 8,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
    borderColor: EDITORIAL.ink,
    borderWidth: 2,
    boxShadow: '4px 4px 0 0 #2D3436',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontFamily: SERIF, fontSize: 22, fontWeight: '700', color: EDITORIAL.ink },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 6,
    borderWidth: 2,
    borderColor: EDITORIAL.ink,
    backgroundColor: EDITORIAL.cream,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '3px 3px 0 0 #2D3436',
  },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 7,
    borderWidth: 2,
    borderColor: EDITORIAL.ink,
    backgroundColor: '#EFEAE0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarInitial: { fontFamily: SERIF, fontSize: 24, fontWeight: '700', color: EDITORIAL.forest },
  profileText: { flex: 1, gap: 2 },
  initial: { fontFamily: SERIF, fontSize: 18, fontWeight: '700', color: EDITORIAL.ink },
  email: { fontFamily: SERIF, fontSize: 14, color: EDITORIAL.inkMuted },
  error: { fontFamily: SERIF, fontSize: 13, color: '#A9533A' },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: EDITORIAL.cream,
    borderWidth: 2,
    borderColor: EDITORIAL.ink,
    borderRadius: 255,
    borderTopLeftRadius: 255,
    borderTopRightRadius: 15,
    borderBottomLeftRadius: 225,
    borderBottomRightRadius: 15,
    paddingVertical: spacing.md,
    boxShadow: '3px 3px 0 0 #2D3436',
  },
  settings: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#EFEAE0',
    borderWidth: 2,
    borderColor: EDITORIAL.ink,
    borderRadius: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 7,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    boxShadow: '3px 3px 0 0 #2D3436',
  },
  settingsText: { fontFamily: SERIF, color: EDITORIAL.forest, fontSize: 15, fontWeight: '700', flex: 1 },
  pressed: { opacity: 0.8 },
  signOutText: { fontFamily: SERIF, color: EDITORIAL.ink, fontSize: 15, fontWeight: '700' },
});
