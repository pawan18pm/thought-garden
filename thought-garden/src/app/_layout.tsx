import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import {
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { colors } from '@/ui/tokens';
import { bootOnce, type Boot } from '@/store/boot';
import { AppProvider } from '@/store/AppProvider';

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
    bootOnce().then(
      (b) => {
        if (!cancelled) setBoot(b);
      },
      (e) => {
        console.error('Startup failed', e);
        if (!cancelled) setFailed(true);
      },
    );
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
