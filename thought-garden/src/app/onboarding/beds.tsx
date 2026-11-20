import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingScreen, onboardingStyles } from '@/features/onboarding/OnboardingScreen';
import { MAX_BEDS, useOnboardingDraft } from '@/features/onboarding/useOnboardingDraft';
import { Chip } from '@/features/plant/Chip';
import { ChunkyButton } from '@/ui/ChunkyButton';
import { useGarden, useRepos } from '@/store/AppProvider';
import { border, colors, fonts } from '@/ui/tokens';

export default function Beds() {
  const router = useRouter();
  const repos = useRepos();
  const addBed = useGarden((s) => s.addBed);
  const { persona, beds, toggle, rename, addCustom, setFirstBedId } = useOnboardingDraft();
  const [editing, setEditing] = useState<string | null>(null);
  const busy = useRef(false);

  const selected = beds.filter((b) => b.selected);
  const valid = selected.length >= 1 && selected.length <= MAX_BEDS && selected.every((b) => b.name.trim().length > 0);

  const onContinue = async () => {
    if (busy.current || !valid) return;
    busy.current = true;
    try {
      if (persona) await repos.settings.set('persona', persona);
      let first: string | null = null;
      for (const b of selected) {
        const bed = await addBed(b.name.trim());
        if (first === null) first = bed.id;
      }
      if (first) setFirstBedId(first);
      router.push('/onboarding/first-plant');
    } catch (e) {
      console.error('Onboarding beds failed', e);
      busy.current = false;
    }
  };

  return (
    <OnboardingScreen
      step="beds"
      title="What are you growing right now?"
      footer={<ChunkyButton tone="primary" label="Continue" disabled={!valid} onPress={onContinue} />}
    >
      <Text style={onboardingStyles.sub}>Keep between 1 and {MAX_BEDS}. Tap the pencil to rename.</Text>
      <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
        {beds.map((b) =>
          editing === b.key ? (
            <TextInput
              key={b.key}
              accessibilityLabel="Bed name"
              autoFocus
              value={b.name}
              maxLength={30}
              onChangeText={(t) => rename(b.key, t)}
              onSubmitEditing={() => setEditing(null)}
              onBlur={() => setEditing(null)}
              returnKeyType="done"
              style={styles.input}
            />
          ) : (
            <View key={b.key} style={styles.row}>
              <Chip label={b.name} accessibilityLabel={b.name} selected={b.selected} onPress={() => toggle(b.key)} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Rename ${b.name}`}
                hitSlop={8}
                onPress={() => setEditing(b.key)}
                style={styles.pencil}
              >
                <Text style={styles.pencilText}>✎</Text>
              </Pressable>
            </View>
          ),
        )}
        <Chip label="+ Add bed" accessibilityLabel="Add bed" onPress={() => setEditing(addCustom())} />
      </ScrollView>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pencil: { minWidth: 32, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  pencilText: { fontSize: 16, color: colors.muted },
  input: {
    minHeight: 44,
    minWidth: 140,
    paddingHorizontal: 16,
    borderWidth: border,
    borderColor: colors.ink,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.ink,
  },
});
