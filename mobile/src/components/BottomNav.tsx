import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { Home, MessageSquareText, LineChart, MoreHorizontal, Map, BookOpen, Music, Trophy, LayoutDashboard } from 'lucide-react-native';
import { useActiveSession } from '@/lib/activeSession';
import { SERIF } from '@/components/editorial';

const GREEN = '#3F5C3A';

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
  { key: 'more', label: 'More', icon: MoreHorizontal, route: '/(tabs)/more' },
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
                <tab.icon size={22} color="#8A8478" />
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
  container: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FDFBF7', paddingHorizontal: 16, paddingBottom: 8, borderTopWidth: 2, borderTopColor: '#2D3436' },
  indicator: { width: 134, height: 5, backgroundColor: '#000', borderRadius: 100, opacity: 0.1, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  bar: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', height: 72 },
  item: { alignItems: 'center', gap: 6 },
  activePill: { backgroundColor: '#FDFBF7', borderRadius: 255, borderTopLeftRadius: 255, borderTopRightRadius: 15, borderBottomLeftRadius: 225, borderBottomRightRadius: 15, paddingHorizontal: 16, paddingVertical: 6, borderWidth: 2, borderColor: '#2D3436', boxShadow: '3px 3px 0 0 #2D3436' },
  label: { fontFamily: SERIF, fontSize: 11, fontWeight: '600', color: '#8A8478' },
  labelActive: { fontFamily: SERIF, fontSize: 11, fontWeight: '700', color: GREEN },
});
