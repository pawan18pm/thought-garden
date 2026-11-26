import React, { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Bed, Plant } from '@/domain/types';
import { PlantArt } from '@/ui/PlantArt';
import { border, colors, flowerColors, fonts, type BedColorKey } from '@/ui/tokens';
import { MAX_BED_NAME } from '@/domain/validate';
import { ThoughtRow } from './ThoughtRow';
import { tintOf } from './QuickPlantBox';

const DARK: Record<BedColorKey | 'ideas', string> = {
  blue: '#2F5DA8',
  orange: '#A8521A',
  purple: '#6A4BB8',
  yellow: '#8A6A00',
  green: '#2E6B30',
  pink: '#B23A64',
  ideas: '#B23A64',
};

interface Props {
  bed: Bed;
  /** Rows to show: active plants, then anything bloomed today. */
  plants: Plant[];
  growing: number;
  editing: boolean;
  canRemove: boolean;
  /** Unsaved name typed in edit mode (held by the screen so Done can flush it). */
  nameDraft?: string;
  onChangeName: (name: string) => void;
  /** Save the draft name; safe to call more than once. */
  onCommitName: () => void;
  onRecolor: () => void;
  onRemove: () => void;
  onPickForPlanting: () => void;
  onWater: (id: string) => void;
  onBloom: (id: string) => void;
  onPressPlant: (id: string) => void;
  highlightId?: string | null;
  /** Rendered under the bed card (the remove prompt). */
  footer?: ReactNode;
}

export function BedSection({
  bed,
  plants,
  growing,
  editing,
  canRemove,
  nameDraft,
  onChangeName,
  onCommitName,
  onRecolor,
  onRemove,
  onPickForPlanting,
  onWater,
  onBloom,
  onPressPlant,
  highlightId,
  footer,
}: Props) {
  const accent = flowerColors[bed.color];
  const editable = editing && !bed.isIdeas;

  return (
    <View accessibilityLabel={`${bed.name} bed`} style={styles.section}>
      <View>
        <View style={[styles.shadow, { backgroundColor: accent }]} />
        <View style={styles.card}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Change color of ${bed.name}`}
            disabled={bed.isIdeas}
            onPress={onRecolor}
            style={[styles.tint, { backgroundColor: tintOf(bed) }]}
          >
            <PlantArt stage="bloom" size={34} flowerColor={accent} />
          </Pressable>
          {editable ? (
            <>
              <TextInput
                accessibilityLabel="Bed name"
                value={nameDraft ?? bed.name}
                onChangeText={onChangeName}
                onBlur={onCommitName}
                onEndEditing={onCommitName}
                onSubmitEditing={onCommitName}
                maxLength={MAX_BED_NAME}
                style={styles.nameInput}
              />
              {canRemove && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${bed.name}`}
                  onPress={onRemove}
                  style={styles.remove}
                >
                  <Text style={styles.removeText}>✕</Text>
                </Pressable>
              )}
            </>
          ) : (
            <>
              <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
                {bed.name}
              </Text>
              <View style={styles.count}>
                <Text style={[styles.countNum, { color: DARK[bed.color] }]}>{growing}</Text>
                <Text style={styles.countLabel}>growing</Text>
              </View>
            </>
          )}
        </View>
      </View>
      {footer}
      {plants.length === 0 && !editing && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Empty soil · plant a thought here in ${bed.name}`}
          onPress={onPickForPlanting}
          style={styles.empty}
        >
          <Text style={styles.emptyText}>Empty soil · plant a thought here</Text>
        </Pressable>
      )}
      {plants.length > 0 && (
        <View style={styles.rows}>
          {plants.map((p) => (
            <ThoughtRow
              key={p.id}
              plant={p}
              bed={bed}
              onWater={() => onWater(p.id)}
              onBloom={() => onBloom(p.id)}
              onPress={() => onPressPlant(p.id)}
              highlight={p.id === highlightId}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {},
  shadow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 5,
    bottom: -5,
    borderRadius: 22,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 72,
    paddingHorizontal: 14,
    backgroundColor: colors.bg,
    borderWidth: border,
    borderColor: colors.ink,
    borderRadius: 22,
  },
  tint: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderWidth: border,
    borderColor: colors.ink,
    borderRadius: 999,
    overflow: 'hidden',
  },
  name: { flex: 1, minWidth: 0, fontFamily: fonts.titleBold, fontSize: 21, color: colors.ink },
  nameInput: {
    flex: 1,
    minWidth: 0,
    height: 44,
    paddingHorizontal: 10,
    backgroundColor: '#F7F6F3',
    borderWidth: border,
    borderColor: colors.ink,
    borderRadius: 12,
    fontFamily: fonts.titleBold,
    fontSize: 18,
    color: colors.ink,
  },
  remove: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    borderWidth: border,
    borderColor: colors.ink,
    borderRadius: 999,
  },
  removeText: { fontFamily: fonts.bodySemi, fontSize: 15, color: '#B3261E' },
  count: { alignItems: 'flex-end' },
  countNum: { fontFamily: fonts.titleXBold, fontSize: 22, lineHeight: 24 },
  countLabel: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.ink },
  empty: {
    height: 52,
    marginTop: 12,
    marginHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: border,
    borderStyle: 'dashed',
    borderColor: '#A39B8E',
    borderRadius: 18,
  },
  emptyText: { fontFamily: fonts.bodySemi, fontSize: 14, color: '#4A453D' },
  rows: { marginTop: 6, marginHorizontal: 6 },
});
