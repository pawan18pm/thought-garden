import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingScreen } from '@/features/onboarding/OnboardingScreen';
import { useOnboardingDraft } from '@/features/onboarding/useOnboardingDraft';
import { Chip } from '@/features/plant/Chip';
import { PERSONA_LABELS } from '@/domain/personas';
import type { Persona } from '@/domain/types';

const ORDER: Persona[] = ['student', 'jobPrep', 'professional', 'builder'];

export default function PersonaScreen() {
  const router = useRouter();
  const current = useOnboardingDraft((s) => s.persona);
  const setPersona = useOnboardingDraft((s) => s.setPersona);
  return (
    <OnboardingScreen step="persona" title="What describes you best?">
      <View style={{ gap: 12, alignItems: 'flex-start' }}>
        {ORDER.map((p) => (
          <Chip
            key={p}
            label={PERSONA_LABELS[p]}
            accessibilityLabel={PERSONA_LABELS[p]}
            selected={current === p}
            onPress={() => {
              setPersona(p);
              router.push('/onboarding/beds');
            }}
          />
        ))}
      </View>
    </OnboardingScreen>
  );
}
