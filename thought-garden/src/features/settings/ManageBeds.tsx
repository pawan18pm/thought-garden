import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useGarden } from '@/store/AppProvider';
import { ChunkyButton } from '@/ui/ChunkyButton';
import { BED_COLOR_ORDER, bedColors, border, colors, fonts, type BedColorKey } from '@/ui/tokens';
import type { Bed } from '@/domain/types';

const MAX_NAME = 40;
const validName = (s: string): string | null => {
  const t = s.trim();
  return t.length > 0 && t.length <= MAX_NAME ? t : null;
};

function IconButton({ label, glyph, disabled, onPress }: { label: string; glyph: string; disabled?: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.iconBtn, disabled && { opacity: 0.35 }]}
    >
      <Text style={styles.iconGlyph}>{glyph}</Text>
    </Pressable>
  );
}

function BedRow({ bed, index, count, ids }: { bed: Bed; index: number; count: number; ids: string[] }) {
  const renameBed = useGarden((s) => s.renameBed);
  const recolorBed = useGarden((s) => s.recolorBed);
  const removeBed = useGarden((s) => s.removeBed);
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

  const move = (delta: number) => {
    const next = [...ids];
    const j = index + delta;
    [next[index], next[j]] = [next[j], next[index]];
    void reorderBeds(next);
  };

  const confirmDelete = () =>
    Alert.alert(`Delete ${bed.name}?`, 'Its plants will move to Ideas', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void removeBed(bed.id) },
    ]);

  return (
    <View style={[styles.row, { backgroundColor: bedColors[bed.color as BedColorKey] ?? '#FFFFFF' }]}>
      <View style={styles.rowTop}>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          onEndEditing={commitName}
          onBlur={commitName}
          onSubmitEditing={commitName}
          maxLength={MAX_NAME}
          accessibilityLabel={`Rename ${bed.name}`}
          returnKeyType="done"
        />
        <IconButton label={`Move ${bed.name} up`} glyph="↑" disabled={index === 0} onPress={() => move(-1)} />
        <IconButton label={`Move ${bed.name} down`} glyph="↓" disabled={index === count - 1} onPress={() => move(1)} />
        <IconButton label={`Delete ${bed.name}`} glyph="🗑" onPress={confirmDelete} />
      </View>
      <View style={styles.swatches}>
        {BED_COLOR_ORDER.map((c) => (
          <Pressable
            key={c}
            accessibilityRole="button"
            accessibilityLabel={`${bed.name} color ${c}`}
            accessibilityState={{ selected: bed.color === c }}
            onPress={() => void recolorBed(bed.id, c)}
            style={styles.swatchHit}
          >
            <View style={[styles.swatch, { backgroundColor: bedColors[c] }, bed.color === c && styles.swatchOn]} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function ManageBeds() {
  const beds = useGarden((s) => s.beds);
  const addBed = useGarden((s) => s.addBed);
  const [newName, setNewName] = useState('');
  const userBeds = beds.filter((b) => !b.isIdeas);
  const ideas = beds.find((b) => b.isIdeas);
  const ids = userBeds.map((b) => b.id);
  const clean = validName(newName);

  const add = async () => {
    if (!clean) return;
    await addBed(clean);
    setNewName('');
  };

  return (
    <View style={styles.wrap}>
      {userBeds.map((b, i) => (
        <BedRow key={b.id} bed={b} index={i} count={userBeds.length} ids={ids} />
      ))}
      {ideas && (
        <View style={[styles.row, { backgroundColor: colors.ideasBed }]}>
          <View style={styles.rowTop}>
            <Text style={styles.ideasName}>🔒 {ideas.name}</Text>
            <Text style={styles.note}>Always here</Text>
          </View>
        </View>
      )}
      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          value={newName}
          onChangeText={setNewName}
          maxLength={MAX_NAME}
          placeholder="New bed name"
          placeholderTextColor={colors.muted}
          accessibilityLabel="New bed name"
          onSubmitEditing={add}
          returnKeyType="done"
        />
        <ChunkyButton label="Add bed" onPress={add} disabled={!clean} />
      </View>
      {userBeds.length >= 6 && <Text style={styles.note}>Gardens grow best with a few beds 🌱</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  row: { borderWidth: border, borderColor: colors.ink, borderRadius: 16, padding: 10, gap: 6 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  input: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 12,
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    color: colors.ink,
    backgroundColor: '#FFFFFF',
    borderWidth: border,
    borderColor: colors.ink,
    borderRadius: 12,
  },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  iconGlyph: { fontSize: 20, color: colors.ink },
  swatches: { flexDirection: 'row' },
  swatchHit: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  swatch: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: colors.ink },
  swatchOn: { borderWidth: 3 },
  ideasName: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 16, color: colors.ink, minHeight: 28 },
  note: { fontFamily: fonts.body, fontSize: 14, color: colors.muted },
});
