import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingScreen, BigButton } from '@/features/onboarding/OnboardingScreen';
import { useOnboardingDraft } from '@/features/onboarding/useOnboardingDraft';
import { PlantArt } from '@/ui/PlantArt';
import { useReducedMotion } from '@/ui/useReducedMotion';
import { useGarden, useRepos } from '@/store/AppProvider';
import { useOnboardingState } from '@/store/onboardingState';
import { validateThought } from '@/domain/validate';
import { bedColors, border, colors, flowerColors, fonts } from '@/ui/tokens';

const GROW_MS = 900;

export default function FirstPlant() {
  const router = useRouter();
  const repos = useRepos();
  const reduced = useReducedMotion();
  const firstBedId = useOnboardingDraft((s) => s.firstBedId);
  const draftBeds = useOnboardingDraft((s) => s.beds);
  const storeBeds = useGarden((s) => s.beds);
  const plant = useGarden((s) => s.plant);
  const [text, setText] = useState('');
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [grown, setGrown] = useState(false);
  const busy = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  // Only the beds created during onboarding; on a resume they are the user's existing beds.
  const createdIds = draftBeds.filter((b) => b.bedId).map((b) => b.bedId);
  const candidates = storeBeds.filter((b) => !b.isIdeas && (createdIds.length === 0 || createdIds.includes(b.id)));
  const target = candidates.find((b) => b.id === (pickedId ?? firstBedId)) ?? candidates[0];
  const tint = target && target.color !== 'ideas' ? bedColors[target.color] : '#FFFFFF';
  const accent = target && target.color !== 'ideas' ? flowerColors[target.color] : colors.line;

  const valid = validateThought(text) !== null && !!target;

  const submit = async () => {
    if (busy.current || !valid || !target) return;
    busy.current = true;
    try {
      const p = await plant(text, target.id, null, 'onboarding');
      if (!p) {
        busy.current = false;
        return;
      }
      useOnboardingDraft.getState().setPlanted({ bedName: target.name, text: text.trim() });
      // Mark onboarding complete now so an app kill on Reminder cannot rerun it.
      await repos.settings.set('onboarding_done', '1');
      useOnboardingState.getState().setDone(true);
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
      title="Plant your first thought"
      progress={3}
      back
      hideBack={grown}
      footer={
        <BigButton
          width={280}
          tone="ink"
          label={`Plant it in ${target?.name ?? ''}`}
          disabled={!valid || grown}
          onPress={submit}
        />
      }
    >
      <View style={[styles.card, { backgroundColor: tint, borderBottomColor: accent }]}>
        <View style={styles.cardHead}>
          <Text style={styles.cardName}>{target?.name ?? ''}</Text>
          <Text style={styles.badge}>new seed</Text>
        </View>
        <TextInput
          accessibilityLabel="Your first thought"
          autoFocus
          multiline
          submitBehavior="submit"
          returnKeyType="done"
          onSubmitEditing={() => void submit()}
          value={text}
          onChangeText={setText}
          maxLength={140}
          editable={!grown}
          placeholder="Type a thought you want to grow…"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />
        <View style={styles.art}>
          <PlantArt stage="seed" size={54} />
        </View>
        <View style={styles.soil} />
      </View>
      <Text style={styles.which}>Which bed does it go in?</Text>
      <View style={styles.chips}>
        {candidates.map((b) => {
          const on = b.id === target?.id;
          const k = b.color === 'ideas' ? null : b.color;
          return (
            <Pressable
              key={b.id}
              accessibilityRole="button"
              accessibilityLabel={b.name}
              accessibilityState={{ selected: on }}
              onPress={() => setPickedId(b.id)}
              style={[
                styles.chip,
                on && k
                  ? { backgroundColor: bedColors[k], borderColor: colors.ink, borderBottomColor: flowerColors[k] }
                  : null,
              ]}
            >
              <Text style={styles.chipText}>{b.name}</Text>
            </Pressable>
          );
        })}
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: border,
    borderBottomWidth: border + 6,
    borderColor: colors.ink,
    borderRadius: 26,
    overflow: 'hidden',
  },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, paddingBottom: 0 },
  cardName: { fontFamily: fonts.titleXBold, fontSize: 18, color: colors.ink },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: border,
    borderColor: colors.ink,
    borderRadius: 999,
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.ink,
  },
  input: {
    minHeight: 96,
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: border,
    borderColor: colors.ink,
    borderRadius: 16,
    fontFamily: fonts.titleBold,
    fontSize: 20,
    color: colors.ink,
    textAlignVertical: 'top',
  },
  art: { alignItems: 'center', paddingTop: 10 },
  soil: { height: 16, backgroundColor: colors.soil, borderTopWidth: border, borderTopColor: colors.ink },
  which: { marginTop: 22, marginBottom: 10, fontFamily: fonts.bodySemi, fontSize: 14, color: colors.muted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    height: 46,
    paddingHorizontal: 18,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: border,
    borderBottomWidth: border + 2,
    borderColor: colors.ink,
    borderBottomColor: colors.line,
    borderRadius: 999,
  },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink },
});
