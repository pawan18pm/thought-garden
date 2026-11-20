import { Tabs } from 'expo-router';
import { PillTabBar } from '@/ui/PillTabBar';

export default function TabsLayout() {
  return <Tabs tabBar={(p) => <PillTabBar {...p} />} screenOptions={{ headerShown: false }} />;
}
