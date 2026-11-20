import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingScreen } from '@/features/onboarding/OnboardingScreen';
import { useOnboardingDraft } from '@/features/onboarding/useOnboardingDraft';
import { ChunkyButton } from '@/ui/ChunkyButton';
import { PlantArt } from '@/ui/PlantArt';
import { useReducedMotion } from '@/ui/useReducedMotion';
import { useGarden } from '@/store/AppProvider';
import { validateThought } from '@/domain/validate';
import { border, colors, fonts } from '@/ui/tokens';

const GROW_MS = 900;

export default function FirstPlant() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const firstBedId = useOnboardingDraft((s) => s.firstBedId);
  const bedName = useGarden((s) => s.beds.find((b) => b.id === firstBedId)?.name ?? '');
  const plant = useGarden((s) => s.plant);
  const water = useGarden((s) => s.water);
  const [text, setText] = useState('');
  const [grown, setGrown] = useState(false);
  const busy = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const valid = validateThought(text) !== null && !!firstBedId;

  const submit = async () => {
    if (busy.current || !valid || !firstBedId) return;
    busy.current = true;
    try {
      const p = await plant(text, firstBedId, null, 'onboarding');
      if (!p) {
        busy.current = false;
        return;
      }
      await water(p.id);
      setGrown(true);
      if (reduced) router.push('/onboarding/reminder');
      else timer.current = setTimeout(() => router.push('/onboarding/reminder'), GROW_MS);
    } catch (e) {
      console.error('First plant failed', e);
      busy.current = false;
    }
  };

  return (
    <OnboardingScreen
      step="first_plant"
      title="Let's plant your first thought"
      footer={<ChunkyButton tone="primary" label="Plant it" disabled={!valid || grown} onPress={submit} />}
    >
      <Text style={styles.bed}>Into</Text>
      <Text style={styles.bedName}>{bedName}</Text>
      <TextInput
        accessibilityLabel="Your first thought"
        autoFocus
        multiline
        value={text}
        onChangeText={setText}
        maxLength={140}
        editable={!grown}
        placeholder="What's on your mind?"
        placeholderTextColor={colors.muted}
        style={styles.input}
      />
      <View style={styles.art}>
        <PlantArt stage={grown ? 'watered' : 'seed'} size={96} />
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  bed: { fontFamily: fonts.body, fontSize: 14, color: colors.muted },
  bedName: { fontFamily: fonts.titleBold, fontSize: 20, color: colors.ink, marginBottom: 16 },
  input: {
    minHeight: 96,
    padding: 14,
    borderWidth: border,
    borderColor: colors.ink,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    fontFamily: fonts.body,
    fontSize: 17,
    color: colors.ink,
    textAlignVertical: 'top',
  },
  art: { alignItems: 'center', marginTop: 20 },
});
