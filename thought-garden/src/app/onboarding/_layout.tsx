import { Stack } from 'expo-router';
import { colors } from '@/ui/tokens';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="reminder" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
