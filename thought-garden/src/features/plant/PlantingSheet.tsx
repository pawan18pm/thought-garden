import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Sheet } from '@/ui/Sheet';
import { ChunkyButton } from '@/ui/ChunkyButton';
import { useGarden } from '@/store/AppProvider';
import { MAX_THOUGHT_LENGTH, validateThought } from '@/domain/validate';
import { orderBeds } from '@/domain/ordering';
import type { Priority } from '@/domain/types';
import { colors, fonts } from '@/ui/tokens';
import { Chip } from './Chip';

interface Props {
  visible: boolean;
  initialBedId?: string;
  onClose: () => void;
}

export const PRIORITY_CHIPS: { label: string; value: Priority }[] = [
  { label: '▲▲', value: 3 },
  { label: '▲', value: 2 },
  { label: '–', value: null },
];

export function PlantingSheet({ visible, initialBedId, onClose }: Props) {
  const beds = useGarden((s) => s.beds);
  const lastBedId = useGarden((s) => s.lastBedId);
  const plant = useGarden((s) => s.plant);
  const toggleFold = useGarden((s) => s.toggleFold);

  const [text, setText] = useState('');
  const [chosenBedId, setChosenBedId] = useState<string | undefined>(undefined);
  const [priority, setPriority] = useState<Priority>(null);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  useEffect(() => {
    if (visible) {
      setText('');
      setChosenBedId(undefined);
      setPriority(null);
    }
  }, [visible]);

  const ordered = orderBeds(beds);
  const ideasId = beds.find((b) => b.isIdeas)?.id;
  const explicitBedId = chosenBedId ?? initialBedId;
  const effectiveBedId = explicitBedId ?? lastBedId ?? ideasId;
  const valid = validateThought(text) !== null;

  const submit = async () => {
    if (savingRef.current || validateThought(text) === null) return;
    savingRef.current = true;
    setSaving(true);
    try {
      const created = await plant(text, explicitBedId, priority, initialBedId ? 'bed_plus' : 'fab');
      if (created) {
        const target = beds.find((b) => b.id === created.bedId);
        if (target?.folded) await toggleFold(target.id);
        onClose();
      }
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
      <Text style={styles.title}>Plant a thought</Text>
      <TextInput
        accessibilityLabel="Thought"
        style={styles.input}
        value={text}
        onChangeText={setText}
        autoFocus
        placeholder="What's on your mind?"
        placeholderTextColor={colors.muted}
        returnKeyType="done"
        blurOnSubmit
        onSubmitEditing={() => void submit()}
      />
      <Text style={[styles.counter, text.length > MAX_THOUGHT_LENGTH && styles.over]}>
        {text.length}/{MAX_THOUGHT_LENGTH}
      </Text>

      <Text style={styles.label}>Bed</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} keyboardShouldPersistTaps="handled">
        {ordered.map((b) => (
          <Chip
            key={b.id}
            label={b.name}
            accessibilityLabel={`Bed ${b.name}`}
            selected={b.id === effectiveBedId}
            onPress={() => setChosenBedId(b.id)}
          />
        ))}
      </ScrollView>

      <Text style={styles.label}>Priority</Text>
      <View style={styles.row}>
        {PRIORITY_CHIPS.map((c) => (
          <Chip
            key={c.label}
            label={c.label}
            accessibilityLabel={`Priority ${c.label}`}
            selected={priority === c.value}
            onPress={() => setPriority(c.value)}
          />
        ))}
      </View>

      <View style={styles.cta}>
        <ChunkyButton label="Plant it" tone="primary" disabled={!valid || saving} onPress={() => void submit()} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.titleBold, fontSize: 24, color: colors.ink, marginBottom: 12 },
  input: {
    minHeight: 48,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
  },
  counter: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, textAlign: 'right', marginTop: 4 },
  over: { color: '#C0392B' },
  label: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.muted, marginTop: 12, marginBottom: 6 },
  row: { flexDirection: 'row', gap: 8 },
  cta: { marginTop: 20 },
});
