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
      title="Your best ideas deserve to grow."
      topPadding={72}
      hero={
        <View style={styles.logo}>
          <LogoMark size={64} />
        </View>
      }
      footer={<BigButton label="Start my garden" onPress={() => router.push('/onboarding/persona')} />}
    >
      <View style={styles.paras}>
        <Text style={styles.p}>
          Every day you think of things to learn, build or try. Most of them get lost in notes, tabs and chats.
        </Text>
        <Text style={styles.p}>
          Thought Garden gives each one a home. Plant it in a bed, water it when you make progress, and watch it bloom
          when it&apos;s done.
        </Text>
        <Text style={[styles.p, styles.em]}>Small steps. Real progress.</Text>
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  logo: {
    width: 84,
    height: 84,
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: bedColors.green,
    borderWidth: border,
    borderColor: colors.ink,
    borderRadius: 26,
  },
  paras: { gap: 16 },
  p: { fontFamily: fonts.body, fontSize: 18, lineHeight: 26, color: colors.ink },
  // Leaf green, darkened to keep AA contrast on white.
  em: { fontFamily: fonts.bodyBold, color: '#2E6B30' },
});
