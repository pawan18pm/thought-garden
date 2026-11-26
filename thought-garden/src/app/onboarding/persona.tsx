import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PressableScale } from '@/ui/PressableScale';
import { useRouter } from 'expo-router';
import { OnboardingScreen } from '@/features/onboarding/OnboardingScreen';
import { useOnboardingDraft } from '@/features/onboarding/useOnboardingDraft';
import { PERSONA_LABELS } from '@/domain/personas';
import type { Persona } from '@/domain/types';
import { BED_COLOR_ORDER, bedColors, border, colors, flowerColors, fonts } from '@/ui/tokens';

const CARDS: { id: Persona; sub: string }[] = [
  { id: 'student', sub: 'Subjects · Exams · Assignments' },
  { id: 'jobPrep', sub: 'Interview · DSA · Resume' },
  { id: 'professional', sub: 'Work · Upskilling · Side project' },
  { id: 'builder', sub: 'Ideas to explore · Build · Learn · Launch' },
  { id: 'other', sub: "I'll make my own beds" },
];

export default function PersonaScreen() {
  const router = useRouter();
  const setPersona = useOnboardingDraft((s) => s.setPersona);
  return (
    <OnboardingScreen step="persona" title="What are you growing right now?" progress={1} back>
      <View style={styles.list}>
        {CARDS.map((c, i) => {
          const own = c.id === 'other';
          const key = BED_COLOR_ORDER[i];
          return (
            <PressableScale
              key={c.id}
              accessibilityRole="button"
              accessibilityLabel={PERSONA_LABELS[c.id]}
              onPress={() => {
                setPersona(c.id);
                router.push('/onboarding/beds');
              }}
              style={[
                styles.card,
                { borderStyle: own ? 'dashed' : 'solid', borderBottomColor: own ? colors.ink : flowerColors[key] },
                !own && styles.cardShadow,
              ]}
            >
              <View
                style={[
                  styles.dot,
                  { backgroundColor: own ? '#FFFFFF' : bedColors[key], borderStyle: own ? 'dashed' : 'solid' },
                ]}
              >
                {own ? <Text style={styles.plus}>+</Text> : null}
              </View>
              <View style={styles.text}>
                <Text style={styles.label}>{PERSONA_LABELS[c.id]}</Text>
                <Text numberOfLines={1} style={styles.sub}>{c.sub}</Text>
              </View>
            </PressableScale>
          );
        })}
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 14 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    height: 76,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: border,
    borderColor: colors.ink,
    borderRadius: 22,
  },
  cardShadow: { borderBottomWidth: border + 5 },
  dot: {
    width: 46,
    height: 46,
    borderRadius: 999,
    borderWidth: border,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, minWidth: 0 },
  plus: { fontSize: 22, fontWeight: '700', color: colors.ink },
  label: { fontFamily: fonts.titleBold, fontSize: 20, color: colors.ink },
  sub: { fontFamily: fonts.body, fontSize: 14, color: colors.muted },
});
