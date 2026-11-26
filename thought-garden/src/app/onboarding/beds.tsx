import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputInstance } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useShallow } from 'zustand/react/shallow';
import {
  OnboardingScreen,
  BigButton,
  onboardingStyles,
  useRevealOnFocus,
} from '@/features/onboarding/OnboardingScreen';
import { MAX_BEDS, useOnboardingDraft, type DraftBed } from '@/features/onboarding/useOnboardingDraft';
import { PressableScale } from '@/ui/PressableScale';
import { useGarden, useRepos } from '@/store/AppProvider';
import { bedColors, border, colors, flowerColors, fonts } from '@/ui/tokens';
import { MAX_BED_NAME } from '@/domain/validate';

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
  const { persona, beds, rename, recolor, remove, addNamed, clear, setBedId, setFirstBedId } = useOnboardingDraft(
    useShallow((s) => ({
      persona: s.persona,
      beds: s.beds,
      rename: s.rename,
      recolor: s.recolor,
      remove: s.remove,
      addNamed: s.addNamed,
      clear: s.clear,
      setBedId: s.setBedId,
      setFirstBedId: s.setFirstBedId,
    })),
  );
  const busy = useRef(false);
  // Stay busy from Continue until this screen is shown again (Back), so a double tap can't push twice.
  useFocusEffect(
    useCallback(() => {
      busy.current = false;
    }, []),
  );

  const hasBeds = beds.length > 0;
  const valid = hasBeds && beds.length <= MAX_BEDS && beds.every((b) => b.name.trim().length > 0);
  const names = beds.map((b) => b.name.trim().toLowerCase());
  const ideas = IDEAS.filter((n) => !names.includes(n.toLowerCase())).slice(0, 5);

  const create = async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      // Saved alongside the bed writes rather than ahead of them.
      const savePersona = Promise.resolve(persona ? repos.settings.set('persona', persona) : undefined);
      savePersona.catch(() => {}); // still awaited below; this just keeps an early bed failure from leaving it unhandled
      const existingUser = storeBeds.filter((b) => !b.isIdeas);
      if (existingUser.length > 0 && useOnboardingDraft.getState().createdIds.length === 0) {
        // Onboarding was interrupted earlier (app killed after the beds were made). Adopt those
        // beds: pair each draft bed with one (same name first, then in order) so the edits made
        // now are applied to them instead of being skipped or duplicated.
        const free = [...existingUser];
        const unpaired: DraftBed[] = [];
        for (const b of useOnboardingDraft.getState().beds) {
          if (b.bedId) continue;
          const i = free.findIndex((x) => x.name.trim().toLowerCase() === b.name.trim().toLowerCase());
          if (i >= 0) setBedId(b.key, free.splice(i, 1)[0].id);
          else unpaired.push(b);
        }
        for (const b of unpaired) {
          const match = free.shift();
          if (match) setBedId(b.key, match.id);
        }
        useOnboardingDraft.getState().adopt(existingUser.map((b) => b.id));
      }
      const st = useOnboardingDraft.getState();
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
      await savePersona;
      router.push('/onboarding/first-plant');
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
        <PressableScale accessibilityRole="button" accessibilityLabel="Skip" onPress={onSkip} style={styles.skip}>
          <Text style={styles.skipText}>Skip</Text>
        </PressableScale>
      }
      footer={<BigButton label={label} disabled={!valid} onPress={onContinue} />}
    >
      <Text style={onboardingStyles.sub}>
        {persona === 'other'
          ? 'Start with one bed for each kind of thought. Name them your way.'
          : 'We suggested these for you. Rename, recolor, remove or add your own.'}
      </Text>
      <View style={styles.list}>
        {beds.map((b) => (
          <BedRow key={b.key} bed={b} onRename={rename} onRecolor={recolor} onRemove={remove} />
        ))}
        {beds.length < MAX_BEDS ? <AddBed hasBeds={hasBeds} ideas={ideas} onAdd={addNamed} /> : null}
        {hasBeds ? (
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Clear all and start blank"
            onPress={clear}
            style={styles.clear}
          >
            <Text style={styles.clearText}>Clear all and start blank</Text>
          </PressableScale>
        ) : null}
      </View>
    </OnboardingScreen>
  );
}

/** One editable bed. Its own component so typing in one name doesn't redraw the others. */
function BedRow({
  bed,
  onRename,
  onRecolor,
  onRemove,
}: {
  bed: DraftBed;
  onRename: (key: string, name: string) => void;
  onRecolor: (key: string) => void;
  onRemove: (key: string) => void;
}) {
  const ref = useRef<TextInputInstance>(null);
  const reveal = useRevealOnFocus();
  return (
    <View style={[styles.row, { borderBottomColor: flowerColors[bed.color] }]}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`Change color of ${bed.name}`}
        onPress={() => onRecolor(bed.key)}
        pressScale={0.9}
        style={[styles.swatch, { backgroundColor: bedColors[bed.color] }]}
      />
      <TextInput
        ref={ref}
        accessibilityLabel="Bed name"
        value={bed.name}
        maxLength={MAX_BED_NAME}
        onChangeText={(t) => onRename(bed.key, t)}
        onFocus={() => reveal(ref)}
        returnKeyType="done"
        style={styles.name}
      />
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`Remove ${bed.name}`}
        onPress={() => onRemove(bed.key)}
        pressScale={0.9}
        style={styles.remove}
      >
        <Text style={styles.removeText}>✕</Text>
      </PressableScale>
    </View>
  );
}

/** The "add a bed" field and idea chips. Holds its own text so keystrokes stay local. */
function AddBed({ hasBeds, ideas, onAdd }: { hasBeds: boolean; ideas: string[]; onAdd: (name: string) => boolean }) {
  const [text, setText] = useState('');
  const ref = useRef<TextInputInstance>(null);
  const reveal = useRevealOnFocus();
  const add = (name: string) => {
    if (!onAdd(name)) return;
    setText('');
    // The new row pushes this field down; keep it above the keyboard.
    reveal(ref);
  };
  const ready = text.trim().length > 0;
  return (
    <>
      <View style={styles.addRow}>
        <TextInput
          ref={ref}
          accessibilityLabel="New bed name"
          placeholder={hasBeds ? 'Name another bed…' : 'Name your first bed…'}
          placeholderTextColor="#6F685C"
          value={text}
          maxLength={MAX_BED_NAME}
          onChangeText={setText}
          onFocus={() => reveal(ref)}
          onSubmitEditing={() => add(text)}
          returnKeyType="done"
          style={styles.addInput}
        />
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Add"
          onPress={() => add(text)}
          pressScale={0.94}
          style={[styles.addBtn, ready ? { backgroundColor: colors.ink } : null]}
        >
          <Text style={[styles.addText, ready ? { color: '#FFFFFF' } : null]}>Add</Text>
        </PressableScale>
      </View>
      <View style={styles.ideas}>
        {ideas.map((n) => (
          <PressableScale
            key={n}
            accessibilityRole="button"
            accessibilityLabel={`Add ${n}`}
            onPress={() => add(n)}
            pressScale={0.94}
            style={styles.idea}
          >
            <Text style={styles.ideaText}>+ {n}</Text>
          </PressableScale>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  skip: { height: 44, paddingHorizontal: 4, justifyContent: 'center' },
  skipText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.muted },
  list: { gap: 12 },
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
