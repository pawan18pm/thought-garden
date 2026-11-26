import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingScreen, BigButton, onboardingStyles } from '@/features/onboarding/OnboardingScreen';
import { MAX_BEDS, useOnboardingDraft } from '@/features/onboarding/useOnboardingDraft';
import { useGarden, useRepos } from '@/store/AppProvider';
import { bedColors, border, colors, flowerColors, fonts } from '@/ui/tokens';

const IDEAS = ['Health', 'Reading', 'Work', 'Side project', 'Money', 'Learning', 'Family'];

export default function Beds() {
  const router = useRouter();
  const repos = useRepos();
  const addBed = useGarden((s) => s.addBed);
  const storeBeds = useGarden((s) => s.beds);
  const renameBed = useGarden((s) => s.renameBed);
  const recolorBed = useGarden((s) => s.recolorBed);
  const removeBed = useGarden((s) => s.removeBed);
  const plantsInBed = useGarden((s) => s.plantsInBed);
  const { persona, beds, rename, recolor, remove, addNamed, clear, setBedId, setFirstBedId } = useOnboardingDraft();
  const [newBed, setNewBed] = useState('');
  const busy = useRef(false);

  const hasBeds = beds.length > 0;
  const valid = hasBeds && beds.length <= MAX_BEDS && beds.every((b) => b.name.trim().length > 0);
  const names = beds.map((b) => b.name.trim().toLowerCase());
  const ideas = IDEAS.filter((n) => !names.includes(n.toLowerCase())).slice(0, 5);

  const add = (name: string) => {
    if (addNamed(name)) setNewBed('');
  };

  const create = async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      if (persona) await repos.settings.set('persona', persona);
      const st = useOnboardingDraft.getState();
      const existingUser = storeBeds.filter((b) => !b.isIdeas);
      if (existingUser.length > 0 && st.createdIds.length === 0) {
        // Onboarding was interrupted earlier: beds already exist, do not recreate them.
        if (!st.firstBedId) setFirstBedId(existingUser[0].id);
        router.push('/onboarding/first-plant');
        return;
      }
      // Reconcile: add new beds and apply edits first, then remove dropped ones
      // (the store refuses to remove the last bed, so removals come last).
      for (const b of st.beds) {
        const name = b.name.trim();
        if (!b.bedId) {
          const bed = await addBed(name, b.color);
          setBedId(b.key, bed.id);
          continue;
        }
        const current = storeBeds.find((x) => x.id === b.bedId);
        if (!current) continue;
        if (current.name !== name) await renameBed(b.bedId, name);
        if (current.color !== b.color) await recolorBed(b.bedId, b.color);
      }
      const keptIds = useOnboardingDraft.getState().beds.map((b) => b.bedId);
      for (const id of st.createdIds) {
        if (keptIds.includes(id)) continue;
        // Keep a dropped bed that already holds a thought rather than lose it.
        if (plantsInBed(id).length === 0) await removeBed(id);
      }
      const first = useOnboardingDraft.getState().beds[0]?.bedId;
      if (first) setFirstBedId(first);
      router.push('/onboarding/first-plant');
      busy.current = false;
    } catch (e) {
      console.error('Onboarding beds failed', e);
      busy.current = false;
    }
  };

  const onContinue = () => {
    if (!valid) return;
    void create();
  };

  const onSkip = () => {
    if (busy.current) return;
    const kept = beds.filter((b) => b.name.trim().length > 0);
    useOnboardingDraft.setState({
      beds: kept.length ? kept : [{ key: 'mine', name: 'My thoughts', color: 'green' }],
    });
    void create();
  };

  const label = !hasBeds
    ? 'Add at least one bed'
    : `Continue with ${beds.length} ${beds.length === 1 ? 'bed' : 'beds'}`;

  return (
    <OnboardingScreen
      step="beds"
      title="Make your beds"
      progress={2}
      back
      headerRight={
        <Pressable accessibilityRole="button" accessibilityLabel="Skip" onPress={onSkip} style={styles.skip}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      }
      footer={<BigButton label={label} disabled={!valid} onPress={onContinue} />}
    >
      <Text style={onboardingStyles.sub}>
        {persona === 'other'
          ? 'Start with one bed for each kind of thought. Name them your way.'
          : 'We suggested these for you. Rename, recolor, remove or add your own.'}
      </Text>
      <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
        {beds.map((b) => (
          <View key={b.key} style={[styles.row, { borderBottomColor: flowerColors[b.color] }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Change color of ${b.name}`}
              onPress={() => recolor(b.key)}
              style={[styles.swatch, { backgroundColor: bedColors[b.color] }]}
            />
            <TextInput
              accessibilityLabel="Bed name"
              value={b.name}
              maxLength={30}
              onChangeText={(t) => rename(b.key, t)}
              style={styles.name}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remove ${b.name}`}
              onPress={() => remove(b.key)}
              style={styles.remove}
            >
              <Text style={styles.removeText}>✕</Text>
            </Pressable>
          </View>
        ))}
        {beds.length < MAX_BEDS ? (
          <>
            <View style={styles.addRow}>
              <TextInput
                accessibilityLabel="New bed name"
                placeholder={hasBeds ? 'Name another bed…' : 'Name your first bed…'}
                placeholderTextColor="#6F685C"
                value={newBed}
                maxLength={30}
                onChangeText={setNewBed}
                onSubmitEditing={() => add(newBed)}
                returnKeyType="done"
                style={styles.addInput}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add"
                onPress={() => add(newBed)}
                style={[styles.addBtn, newBed.trim() ? { backgroundColor: colors.ink } : null]}
              >
                <Text style={[styles.addText, newBed.trim() ? { color: '#FFFFFF' } : null]}>Add</Text>
              </Pressable>
            </View>
            <View style={styles.ideas}>
              {ideas.map((n) => (
                <Pressable
                  key={n}
                  accessibilityRole="button"
                  accessibilityLabel={`Add ${n}`}
                  onPress={() => add(n)}
                  style={styles.idea}
                >
                  <Text style={styles.ideaText}>+ {n}</Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}
        {hasBeds ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Clear all and start blank" onPress={clear} style={styles.clear}>
            <Text style={styles.clearText}>Clear all and start blank</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  skip: { height: 44, paddingHorizontal: 4, justifyContent: 'center' },
  skipText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.muted },
  list: { gap: 12, paddingBottom: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 64,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: border,
    borderBottomWidth: border + 5,
    borderColor: colors.ink,
    borderRadius: 22,
  },
  swatch: { width: 44, height: 44, borderRadius: 999, borderWidth: border, borderColor: colors.ink },
  name: {
    flex: 1,
    minWidth: 0,
    height: 44,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderStyle: 'dashed',
    borderBottomColor: '#D8D3CA',
    fontFamily: fonts.titleBold,
    fontSize: 19,
    color: colors.ink,
  },
  remove: {
    width: 44,
    height: 44,
    borderRadius: 999,
    borderWidth: border,
    borderColor: '#D8D3CA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: { fontSize: 14, fontWeight: '700', color: colors.muted },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 64,
    paddingLeft: 12,
    paddingRight: 8,
    borderWidth: border,
    borderStyle: 'dashed',
    borderColor: colors.ink,
    borderRadius: 22,
  },
  addInput: { flex: 1, minWidth: 0, height: 44, fontFamily: fonts.titleBold, fontSize: 18, color: colors.ink },
  addBtn: {
    height: 44,
    paddingHorizontal: 16,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: border,
    borderColor: colors.ink,
    borderRadius: 14,
  },
  addText: { fontFamily: fonts.bodyBold, fontSize: 15, color: '#6F685C' },
  ideas: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  idea: {
    minHeight: 44,
    paddingHorizontal: 14,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: border,
    borderColor: '#D8D3CA',
    borderRadius: 999,
  },
  ideaText: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink },
  clear: { alignSelf: 'center', height: 44, justifyContent: 'center' },
  clearText: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.muted, textDecorationLine: 'underline' },
});
