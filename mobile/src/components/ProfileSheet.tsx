import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { supabase } from '@/lib/supabase';
import { glassRadius, spacing, useTheme, type GlassTheme } from '@/theme';
import { GlassIconButton } from '@/components/glass/GlassIconButton';
import { Icon } from '@/components/glass/Icon';
import { ChevronRight, LogOut, Settings2, UserRound, X } from '@/components/glass/icons';

export function ProfileSheet({ open, onClose, email }: { open: boolean; onClose: () => void; email?: string | null }) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
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
        // profile read is best-effort
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
            <GlassIconButton icon={X} onPress={close} accessibilityLabel="Close" size={34} />
          </View>

          <View style={styles.profileRow}>
            <View style={[styles.avatar, { backgroundColor: theme.accents.home.wash }]}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Icon icon={UserRound} size={24} color={theme.accents.home.solid} />
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
            <Icon icon={Settings2} size={18} color={theme.accents.home.solid} strokeWidth={2} />
            <Text style={styles.settingsText}>Settings</Text>
            <Icon icon={ChevronRight} size={16} color={theme.light.inkFaint} />
          </Pressable>

          <Pressable
            onPress={signOut}
            disabled={signingOut}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}
          >
            {signingOut ? (
              <ActivityIndicator color={theme.accents.data.solid} />
            ) : (
              <Icon icon={LogOut} size={18} color={theme.accents.data.solid} strokeWidth={2} />
            )}
            <Text style={styles.signOutText}>{signingOut ? 'Signing out…' : 'Sign Out'}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (theme: GlassTheme) => StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(24,20,37,0.45)' },
  sheet: {
    backgroundColor: '#F6F2FA',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { ...theme.glassType.title, fontSize: 22 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  profileText: { flex: 1, gap: 2 },
  initial: { ...theme.glassType.subtitle, fontSize: 18 },
  email: { ...theme.glassType.body },
  error: { ...theme.glassType.body, color: theme.accents.data.solid },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(224,90,84,0.1)',
    borderRadius: glassRadius.card,
    paddingVertical: spacing.md,
  },
  settings: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(142,119,230,0.08)',
    borderRadius: glassRadius.card,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  settingsText: { ...theme.glassType.label, color: theme.accents.home.solid, fontSize: 15, flex: 1 },
  pressed: { opacity: 0.8 },
  signOutText: { ...theme.glassType.label, color: theme.accents.data.solid, fontSize: 15 },
});
