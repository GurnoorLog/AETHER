import { Tabs } from 'expo-router';
import { ActiveSessionProvider } from '@/lib/activeSession';

export default function TabsLayout() {
  return (
    <ActiveSessionProvider>
      <Tabs
        screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}
      >
        <Tabs.Screen name="index" options={{ title: 'Hub' }} />
        <Tabs.Screen name="sessions" options={{ title: 'Sessions' }} />
        <Tabs.Screen name="progress" options={{ title: 'Progress' }} />
        <Tabs.Screen name="more" options={{ title: 'More' }} />
        <Tabs.Screen name="home" options={{ title: 'Session' }} />
        <Tabs.Screen name="tutor" options={{ title: 'Tutor' }} />
        <Tabs.Screen name="roadmap" options={{ title: 'Roadmap' }} />
        <Tabs.Screen name="music" options={{ title: 'Music' }} />
        <Tabs.Screen name="quizzes" options={{ title: 'Quizzes' }} />
      </Tabs>
    </ActiveSessionProvider>
  );
}
