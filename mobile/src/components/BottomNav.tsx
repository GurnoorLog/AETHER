import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { Home, MessageSquareText, LineChart, MoreHorizontal, Map, BookOpen, Music, Trophy, LayoutDashboard } from 'lucide-react-native';
import { useActiveSession } from '@/lib/activeSession';

const GREEN = '#6B8E61';

const DEFAULT_TABS = [
  { key: 'hub', label: 'Hub', icon: Home, route: '/(tabs)' },
  { key: 'sessions', label: 'Sessions', icon: BookOpen, route: '/(tabs)/sessions' },
  { key: 'progress', label: 'Progress', icon: LineChart, route: '/(tabs)/progress' },
  { key: 'music', label: 'Music', icon: Music, route: '/(tabs)/music' },
  { key: 'quizzes', label: 'Quizzes', icon: Trophy, route: '/(tabs)/quizzes' },
  { key: 'more', label: 'More', icon: MoreHorizontal, route: '/(tabs)/more' },
];

const SESSION_TABS = [
  { key: 'hub', label: 'Home', icon: Home, route: '/(tabs)' },
  { key: 'home', label: 'Session', icon: LayoutDashboard, route: '/(tabs)/home' },
  { key: 'progress', label: 'Progress', icon: LineChart, route: '/(tabs)/progress' },
  { key: 'roadmap', label: 'Roadmap', icon: Map, route: '/(tabs)/roadmap' },
  { key: 'tutor', label: 'Chat', icon: MessageSquareText, route: '/(tabs)/tutor' },
  { key: 'quizzes', label: 'Quizzes', icon: Trophy, route: '/(tabs)/quizzes' },
];

export function BottomNav() {
  const pathname = usePathname();
  const { session } = useActiveSession();
  const tabs = session ? SESSION_TABS : DEFAULT_TABS;

  const isActive = (route: string, key: string) => {
    if (key === 'hub') return pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/index';
    if (key === 'home') return pathname.includes('home');
    if (key === 'tutor') return pathname.includes('tutor');
    if (key === 'music') return pathname.includes('music');
    if (key === 'quizzes') return pathname.includes('quizzes');
    return pathname.includes(key);
  };

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        {tabs.map((tab) => {
          const active = isActive(tab.route, tab.key);
          return (
            <Pressable
              key={tab.key}
              style={styles.item}
              onPress={() => router.push(tab.route as any)}
            >
              {active ? (
                <View style={styles.activePill}>
                  <tab.icon size={22} color={GREEN} />
                </View>
              ) : (
                <tab.icon size={22} color="#999" />
              )}
              <Text style={[styles.label, active && styles.labelActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', paddingHorizontal: 16, paddingBottom: 8 },
  indicator: { width: 134, height: 5, backgroundColor: '#000', borderRadius: 100, opacity: 0.1, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  bar: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', height: 72, borderTopWidth: 1, borderTopColor: '#F3EDE3' },
  item: { alignItems: 'center', gap: 6 },
  activePill: { backgroundColor: '#E8F0E5', borderRadius: 30, paddingHorizontal: 16, paddingVertical: 6 },
  label: { fontSize: 11, fontWeight: '500', color: '#999' },
  labelActive: { fontSize: 11, fontWeight: '700', color: GREEN },
});
