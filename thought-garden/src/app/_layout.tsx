import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as Crypto from 'expo-crypto';
import {
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { colors } from '@/ui/tokens';
import { openExpoDb } from '@/db/expoDb';
import { migrate } from '@/db/schema';
import { createRepos } from '@/db/repos';
import { nowIso } from '@/domain/dates';
import { createGardenStore, type GardenStore, type Repos } from '@/store/garden';
import { AppProvider } from '@/store/AppProvider';
import { initAnalytics, setAnalyticsEnabled, track } from '@/analytics/analytics';

interface Boot {
  store: GardenStore;
  repos: Repos;
}

export default function RootLayout() {
  const [loaded] = useFonts({
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
    Inter_400Regular,
    Inter_600SemiBold,
  });
  const [boot, setBoot] = useState<Boot | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!loaded) return;
    let cancelled = false;
    (async () => {
      try {
        const db = await openExpoDb();
        await migrate(db);
        const repos = createRepos(db, () => Crypto.randomUUID(), nowIso);
        await repos.beds.ensureIdeas();
        const store = createGardenStore(repos);
        await store.getState().load();
        initAnalytics();
        if ((await repos.settings.get('analytics_enabled')) === '0') setAnalyticsEnabled(false);
        track('app_opened', {});
        if (!cancelled) setBoot({ store, repos });
      } catch (e) {
        console.error('Startup failed', e);
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loaded]);

  if (!loaded) return null;
  if (failed) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Something went wrong</Text>
      </View>
    );
  }
  if (!boot) return <View style={{ flex: 1, backgroundColor: colors.paper }} />;
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.paper }}>
      <AppProvider store={boot.store} repos={boot.repos}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper } }} />
      </AppProvider>
    </GestureHandlerRootView>
  );
}
