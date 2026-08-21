import { Tabs } from 'expo-router';
import { GlassTabBar } from '@/components/glass/GlassTabBar';
import { ActiveSessionProvider } from '@/lib/activeSession';

export default function TabsLayout() {
  return (
    <ActiveSessionProvider>
      <Tabs
        tabBar={(props) => <GlassTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="index" options={{ title: 'Hub' }} />
        <Tabs.Screen name="home" options={{ title: 'Home' }} />
        <Tabs.Screen name="roadmap" options={{ title: 'Roadmap' }} />
        <Tabs.Screen name="tutor" options={{ title: 'Tutor' }} />
        <Tabs.Screen name="progress" options={{ title: 'Progress' }} />
        <Tabs.Screen name="quizzes" options={{ title: 'Quizzes' }} />
        <Tabs.Screen name="music" options={{ title: 'Music' }} />
      </Tabs>
    </ActiveSessionProvider>
  );
}
