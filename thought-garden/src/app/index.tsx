import { Redirect } from 'expo-router';
import { useOnboardingState } from '@/store/onboardingState';

export default function Index() {
  const done = useOnboardingState((s) => s.done);
  if (done === null) return null;
  return <Redirect href={done ? '/(tabs)/plant' : '/onboarding/welcome'} />;
}
