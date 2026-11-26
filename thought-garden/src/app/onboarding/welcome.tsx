import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingScreen, BigButton } from '@/features/onboarding/OnboardingScreen';
import { LogoMark } from '@/ui/Logo';
import { bedColors, border, colors, fonts } from '@/ui/tokens';

export default function Welcome() {
  const router = useRouter();
  return (
    <OnboardingScreen
      step="welcome"
      title="hey, welcome to Thought Garden."
      titleSize={30}
      footer={<BigButton width={220} label="let's grow" onPress={() => router.push('/onboarding/persona')} />}
    >
      <View style={styles.paras}>
        <Text style={styles.p}>your head is full of good thoughts. most of them are gone by tomorrow.</Text>
        <Text style={styles.p}>
          here, every thought gets planted in a bed. water it a little each day. when it's done, it blooms.
        </Text>
        <Text style={styles.p}>that's the whole app. simple on purpose.</Text>
      </View>
      <View style={styles.logo}>
        <LogoMark size={64} />
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  logo: {
    width: 84,
    height: 84,
    marginTop: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: bedColors.green,
    borderWidth: border,
    borderColor: colors.ink,
    borderRadius: 26,
  },
  paras: { gap: 16 },
  p: { fontFamily: fonts.body, fontSize: 18, lineHeight: 26, color: colors.ink },
});
