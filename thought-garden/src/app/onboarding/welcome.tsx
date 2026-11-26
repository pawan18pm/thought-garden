import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingScreen, BigButton } from '@/features/onboarding/OnboardingScreen';
import { LogoMark } from '@/ui/Logo';
import { PlantArt } from '@/ui/PlantArt';
import { useReducedMotion } from '@/ui/useReducedMotion';
import { bedColors, border, colors, flowerColors, fonts } from '@/ui/tokens';
import type { Stage } from '@/domain/types';

const STEPS: { stage: Stage; label: string }[] = [
  { stage: 'seed', label: 'Plant' },
  { stage: 'watered', label: 'Water' },
  { stage: 'growing', label: 'Grow' },
  { stage: 'bloom', label: 'Bloom' },
];

/** One stage that pops in (scale + fade), staggered by its position in the row. */
function GrowStage({ stage, label, index, reduced }: { stage: Stage; label: string; index: number; reduced: boolean }) {
  const v = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  useEffect(() => {
    if (reduced) {
      v.setValue(1);
      return;
    }
    const anim = Animated.timing(v, {
      toValue: 1,
      duration: 380,
      delay: 350 + index * 160,
      easing: Easing.out(Easing.back(1.6)),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [reduced, index, v]);
  return (
    <View style={styles.cell}>
      <Animated.View
        style={{
          opacity: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 1] }),
          transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
        }}
      >
        <PlantArt stage={stage} size={68} soil={false} flowerColor={flowerColors.pink} />
      </Animated.View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

export default function Welcome() {
  const router = useRouter();
  const reduced = useReducedMotion();
  return (
    <OnboardingScreen
      step="welcome"
      title="Your best ideas deserve to grow."
      hideTitle
      topPadding={40}
      footer={<BigButton label="Start my garden" onPress={() => router.push('/onboarding/persona')} />}
    >
      <View style={styles.center}>
        <View style={styles.logo}>
          <LogoMark size={52} />
        </View>
        <Text style={styles.brand}>Thought Garden</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <View pointerEvents="none" style={styles.soil} />
            {STEPS.map((s, i) => (
              <GrowStage key={s.stage} stage={s.stage} label={s.label} index={i} reduced={reduced} />
            ))}
          </View>
        </View>

        <Text accessibilityRole="header" style={styles.headline}>
          Your best ideas deserve to grow.
        </Text>
        <Text style={styles.line}>Plant a thought. Watch it bloom.</Text>
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center' },
  logo: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: bedColors.green,
    borderWidth: border,
    borderColor: colors.ink,
    borderRadius: 22,
  },
  brand: { fontFamily: fonts.titleXBold, fontSize: 28, lineHeight: 34, color: colors.ink, marginTop: 14 },
  card: {
    alignSelf: 'stretch',
    marginTop: 28,
    paddingHorizontal: 8,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: border,
    borderColor: colors.ink,
    borderRadius: 22,
    borderBottomWidth: border + 6,
    borderBottomColor: '#8ACB72',
  },
  row: { flexDirection: 'row' },
  // Soil strip the plants stand on, behind the labels (plant art leaves ~10px under its stem).
  soil: {
    position: 'absolute',
    left: 4,
    right: 4,
    top: 58,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.soil,
  },
  cell: { flex: 1, alignItems: 'center' },
  label: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink, marginTop: 14 },
  headline: {
    fontFamily: fonts.titleXBold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.4,
    color: colors.ink,
    textAlign: 'center',
    marginTop: 28,
  },
  line: { fontFamily: fonts.body, fontSize: 17, lineHeight: 24, color: colors.muted, textAlign: 'center', marginTop: 8 },
});
