import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Bed } from '@/domain/types';
import { MAX_THOUGHT_LENGTH, validateThought } from '@/domain/validate';
import { bedColors, border, colors, fonts } from '@/ui/tokens';

interface Props {
  beds: Bed[];
  onPlant: (text: string, bedId: string) => Promise<void>;
  /** Controlled target bed; falls back to the first bed. */
  selectedBedId?: string | null;
  onSelectBed?: (bedId: string) => void;
  /** Confirmation shown in the hint (e.g. "Planting into X"); cleared via onClearNotice. */
  notice?: string | null;
  onClearNotice?: () => void;
}

/** Chips stay 38pt tall visually; slop brings the touch target to 44pt. */
const CHIP_SLOP = { top: 3, bottom: 3 };

export const tintOf = (bed: Bed): string => (bed.color === 'ideas' ? colors.ideasBed : bedColors[bed.color]);

export function QuickPlantBox({ beds, onPlant, selectedBedId, onSelectBed, notice, onClearNotice }: Props) {
  const [text, setText] = useState('');
  const [localBedId, setLocalBedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const busy = useRef(false);

  const wanted = selectedBedId !== undefined ? selectedBedId : localBedId;
  const target = beds.find((b) => b.id === wanted) ?? beds[0];
  const ok = validateThought(text) !== null && !!target;

  const clearHint = () => {
    setToast(null);
    onClearNotice?.();
  };

  const pick = (id: string) => {
    clearHint();
    if (onSelectBed) onSelectBed(id);
    else setLocalBedId(id);
  };

  const submit = async () => {
    const clean = validateThought(text);
    if (clean === null || !target || busy.current) return;
    busy.current = true;
    try {
      await onPlant(clean, target.id);
      setText('');
      onClearNotice?.();
      setToast(`Planted in ${target.name}`);
    } finally {
      busy.current = false;
    }
  };

  const message = toast ?? notice ?? null;
  const hint = message ?? (target ? `Into ${target.name}` : 'Add a bed first');

  return (
    <View style={styles.wrap} accessibilityLabel="Plant a thought">
      <View style={styles.shadow} />
      <View style={styles.box}>
        <TextInput
          accessibilityLabel="What's on your mind?"
          placeholder="What's on your mind?"
          placeholderTextColor="#8A8173"
          value={text}
          maxLength={MAX_THOUGHT_LENGTH}
          onChangeText={(t) => {
            setText(t);
            clearHint();
          }}
          onSubmitEditing={() => void submit()}
          returnKeyType="done"
          submitBehavior="submit"
          style={styles.input}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.chips}
        >
          {beds.map((b) => {
            const on = target?.id === b.id;
            return (
              <Pressable
                key={b.id}
                accessibilityRole="button"
                accessibilityLabel={`Plant into ${b.name}`}
                accessibilityState={{ selected: on }}
                onPress={() => pick(b.id)}
                hitSlop={CHIP_SLOP}
                style={[
                  styles.chip,
                  { backgroundColor: on ? tintOf(b) : colors.bg, borderColor: on ? colors.ink : '#D8D3CA' },
                ]}
              >
                <Text style={styles.chipText}>{b.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <View style={styles.footer}>
          <Text style={[styles.hint, { color: message ? '#2E6B30' : colors.muted }]} numberOfLines={1}>
            {hint}
          </Text>
          <View>
            <View style={styles.plantShadow} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Plant"
              accessibilityState={{ disabled: !ok }}
              disabled={!ok}
              onPress={() => void submit()}
              style={[styles.plant, { backgroundColor: ok ? colors.ink : colors.line }]}
            >
              <Text style={[styles.plantText, { color: ok ? '#FFFFFF' : '#6F685C' }]}>+ Plant</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: 20, marginTop: 16, marginBottom: 6 },
  shadow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 6,
    bottom: -6,
    backgroundColor: '#8ACB72',
    borderRadius: 24,
  },
  box: {
    padding: 14,
    backgroundColor: colors.bg,
    borderWidth: border,
    borderColor: colors.ink,
    borderRadius: 24,
  },
  input: {
    height: 52,
    paddingHorizontal: 4,
    fontFamily: fonts.titleBold,
    fontSize: 21,
    color: colors.ink,
  },
  chips: { gap: 8, paddingTop: 4, paddingBottom: 6 },
  chip: {
    height: 38,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderWidth: border,
    borderRadius: 999,
  },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, gap: 12 },
  hint: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 13 },
  plant: {
    height: 48,
    paddingHorizontal: 22,
    justifyContent: 'center',
    borderWidth: border,
    borderColor: colors.ink,
    borderRadius: 16,
  },
  plantShadow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 4,
    bottom: -4,
    backgroundColor: colors.leaf,
    borderRadius: 16,
  },
  plantText: { fontFamily: fonts.titleXBold, fontSize: 17 },
});
