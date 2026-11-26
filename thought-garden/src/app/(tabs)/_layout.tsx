import { Redirect, Tabs } from 'expo-router';
import { PillTabBar } from '@/ui/PillTabBar';
import { useOnboardingState } from '@/store/onboardingState';

export default function TabsLayout() {
  // After Reset the garden is empty: a back gesture or stale history entry must not land here.
  const done = useOnboardingState((s) => s.done);
  if (done === false) return <Redirect href="/onboarding/welcome" />;
  return (
    <Tabs tabBar={(p) => <PillTabBar {...p} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="plant" />
      <Tabs.Screen name="garden" />
    </Tabs>
  );
}
