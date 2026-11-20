import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingScreen } from '@/features/onboarding/OnboardingScreen';
import { ChunkyButton } from '@/ui/ChunkyButton';
import { PlantArt } from '@/ui/PlantArt';
import { colors, fonts } from '@/ui/tokens';

export default function Welcome() {
  const router = useRouter();
  return (
    <OnboardingScreen
      step="welcome"
      title="Every thought is a seed."
      footer={<ChunkyButton tone="primary" label="Start growing" onPress={() => router.push('/onboarding/persona')} />}
    >
      <Text style={styles.line}>Plant it, water it, watch it bloom.</Text>
      <View style={styles.art}>
        <PlantArt stage="bloom" size={160} />
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  line: { fontFamily: fonts.body, fontSize: 18, color: colors.muted },
  art: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
