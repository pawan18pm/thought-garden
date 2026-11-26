import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { colors } from '@/ui/tokens';
import { bootOnce, type Boot } from '@/store/boot';
import { AppProvider } from '@/store/AppProvider';
import { useReminderLifecycle } from '@/notifications/useReminderLifecycle';
import { useDayRollover } from '@/store/useDayRollover';
import { useOnboardingState } from '@/store/onboardingState';
import { primeReducedMotion } from '@/ui/useReducedMotion';
import { WebFrame } from '@/ui/WebFrame';

// Hold the splash until fonts and the database are ready, so launch goes splash -> first
// screen instead of splash -> blank frame -> placeholder -> first screen.
try {
  SplashScreen.setOptions({ fade: true, duration: 250 });
  void SplashScreen.preventAutoHideAsync().catch(() => {});
} catch {
  // no native splash module (tests, web)
}
primeReducedMotion();

function hideSplash() {
  try {
    SplashScreen.hide();
  } catch {
    // ignore
  }
}

function ReminderLifecycle({ settings }: { settings: Boot['repos']['settings'] }) {
  useReminderLifecycle(settings);
  return null;
}

function DayRollover({ store }: { store: Boot['store'] }) {
  useDayRollover(store);
  return null;
}

export default function RootLayout() {
  return (
    <WebFrame>
      <RootContent />
    </WebFrame>
  );
}

function RootContent() {
  const [fontsLoaded, fontError] = useFonts({
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const loaded = fontsLoaded || !!fontError;
  const [attempt, setAttempt] = useState(0);
  const [boot, setBoot] = useState<Boot | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!loaded) return;
    let cancelled = false;
    bootOnce().then(
      (b) => {
        useOnboardingState.getState().seed(b.onboardingDone);
        if (!cancelled) setBoot(b);
        // Let the first screen paint underneath before the splash fades.
        requestAnimationFrame(hideSplash);
      },
      (e) => {
        console.error('Startup failed', e);
        if (!cancelled) setFailed(true);
        hideSplash();
      },
    );
    return () => {
      cancelled = true;
    };
  }, [loaded, attempt]);

  if (!loaded) return null;
  if (failed) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 16, color: colors.ink, marginBottom: 16 }}>Something went wrong. Let's try that again.</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Try again"
          onPress={() => {
            setFailed(false);
            setAttempt((n) => n + 1);
          }}
          style={{ minHeight: 44, paddingHorizontal: 24, justifyContent: 'center' }}
        >
          <Text style={{ fontSize: 16, color: colors.ink }}>Try again</Text>
        </Pressable>
      </View>
    );
  }
  if (!boot) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppProvider store={boot.store} repos={boot.repos}>
        <ReminderLifecycle settings={boot.repos.settings} />
        <DayRollover store={boot.store} />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
          {/* Finishing onboarding replaces the stack with the tabs: cross-fade rather than slide. */}
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        </Stack>
      </AppProvider>
    </GestureHandlerRootView>
  );
}
