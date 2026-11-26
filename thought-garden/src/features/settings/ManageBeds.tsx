import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useGarden } from '@/store/AppProvider';
import { BED_COLOR_ORDER, bedColors, colors, fonts, type BedColorKey } from '@/ui/tokens';
import type { Bed } from '@/domain/types';
import { MAX_BED_NAME } from '@/domain/validate';

const MAX_BEDS = 6;
const validName = (s: string): string | null => {
  const t = s.trim();
  return t.length > 0 && t.length <= MAX_BED_NAME ? t : null;
};
const nextColor = (c: string): BedColorKey => {
  const i = BED_COLOR_ORDER.indexOf(c as BedColorKey);
  return BED_COLOR_ORDER[(i + 1) % BED_COLOR_ORDER.length];
};

function BedRow({ bed, index, ids, count, last }: { bed: Bed; index: number; ids: string[]; count: number; last: boolean }) {
  const renameBed = useGarden((s) => s.renameBed);
  const recolorBed = useGarden((s) => s.recolorBed);
  const reorderBeds = useGarden((s) => s.reorderBeds);
  const [name, setName] = useState(bed.name);
  const saved = useRef(bed.name);
  useEffect(() => {
    saved.current = bed.name;
    setName(bed.name);
  }, [bed.name]);

  const commitName = () => {
    const clean = validName(name);
    if (!clean) {
      setName(saved.current);
      return;
    }
    setName(clean);
    // Submit, blur and end-editing can all fire for one edit; save only once.
    if (clean !== saved.current) {
      saved.current = clean;
      void renameBed(bed.id, clean);
    }
  };

  const moveUp = () => {
    const next = [...ids];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    void reorderBeds(next);
  };

  return (
    <View style={[styles.row, !last && styles.rowLine]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Move ${bed.name} up`}
        accessibilityState={{ disabled: index === 0 }}
        disabled={index === 0}
        onPress={moveUp}
        style={[styles.up, index === 0 && { opacity: 0.3 }]}
      >
        <Text style={styles.upGlyph}>↑</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Change color of ${bed.name}`}
        onPress={() => void recolorBed(bed.id, nextColor(bed.color))}
        style={[styles.dot, { backgroundColor: bedColors[bed.color as BedColorKey] ?? '#FFFFFF' }]}
      />
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        onEndEditing={commitName}
        onBlur={commitName}
        onSubmitEditing={commitName}
        maxLength={MAX_BED_NAME}
        accessibilityLabel={`Rename ${bed.name}`}
        returnKeyType="done"
      />
      <Text style={styles.count}>{count} {count === 1 ? 'thought' : 'thoughts'}</Text>
    </View>
  );
}

export function ManageBeds() {
  const beds = useGarden((s) => s.beds);
  const plants = useGarden((s) => s.plants) ?? [];
  const userBeds = beds.filter((b) => !b.isIdeas);
  const ids = userBeds.map((b) => b.id);

  return (
    <View style={styles.wrap}>
      <View style={styles.shadow} />
      <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.title} accessibilityRole="header">Manage beds</Text>
        <Text style={styles.meta}>{userBeds.length} of {MAX_BEDS}</Text>
      </View>
      {userBeds.map((b, i) => (
        <BedRow
          key={b.id}
          bed={b}
          index={i}
          ids={ids}
          last={i === userBeds.length - 1}
          count={plants.filter((p) => p.bedId === b.id && !p.bloomedAt).length}
        />
      ))}
      <Text style={styles.hint}>Add or remove beds with Edit beds on the Plant tab.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 5 },
  // Green offset shadow (0 5px 0 #8ACB72) as an absolute view so it renders on Android too.
  shadow: { position: 'absolute', left: 0, right: 0, top: 5, bottom: -5, borderRadius: 22, backgroundColor: '#8ACB72' },
  card: { padding: 14, backgroundColor: colors.bg, borderWidth: 2, borderColor: colors.ink, borderRadius: 22 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  title: { fontFamily: fonts.titleXBold, fontSize: 20, color: colors.ink },
  meta: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.muted },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52 },
  rowLine: { borderBottomWidth: 1.5, borderBottomColor: colors.line },
  up: { width: 32, height: 44, alignItems: 'center', justifyContent: 'center' },
  upGlyph: { fontSize: 16, color: colors.muted },
  dot: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: colors.ink },
  input: {
    flex: 1,
    minWidth: 0,
    height: 40,
    paddingHorizontal: 6,
    fontFamily: fonts.titleBold,
    fontSize: 17,
    color: colors.ink,
  },
  count: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.muted },
  hint: { marginTop: 8, fontFamily: fonts.body, fontSize: 12, color: colors.muted },
});
