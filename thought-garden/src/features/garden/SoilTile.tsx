import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PlantArt } from '@/ui/PlantArt';
import { colors, fonts } from '@/ui/tokens';
import type { DayCell } from './useActivity';

interface Props {
  cell?: DayCell;
  label?: string;
  dayNum?: number;
  isToday: boolean;
  future: boolean;
  size: 'week' | 'month';
  /** testID for the art wrapper, e.g. `day-2026-11-18-bloomed`. */
  artTestID?: string;
}

const DIM = {
  week: { height: 52, strip: 8, art: 34, seed: 30 },
  month: { height: 44, strip: 6, art: 24, seed: 22 },
} as const;

/** One day as a little soil bed: paper tile, soil strip at the bottom, plant art on top. */
export function SoilTile({ cell, label, dayNum, isToday, future, size, artTestID }: Props) {
  const d = DIM[size];
  const state = cell?.state ?? 'empty';
  return (
    <View style={styles.wrap}>
      {label !== undefined && <Text style={[styles.label, isToday && styles.labelToday]}>{label}</Text>}
      <View
        style={[
          styles.tile,
          { height: d.height, borderRadius: size === 'week' ? 12 : 10 },
          isToday && styles.today,
          future && styles.future,
        ]}
      >
        {!future && (
          <>
            <View testID={artTestID} style={[styles.art, { bottom: d.strip - 2 }]}>
              {state === 'planted' && <PlantArt stage="seed" size={d.seed} />}
              {state === 'watered' && <PlantArt stage="watered" size={d.art} />}
              {state === 'bloomed' && <PlantArt stage="bloom" size={d.art} flowerColor={cell?.flower} />}
            </View>
            <View style={[styles.strip, { height: d.strip }]} />
          </>
        )}
        {dayNum !== undefined && (
          <Text style={[styles.num, isToday && styles.numToday, future && styles.numFuture]}>{dayNum}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'stretch', gap: 4 },
  label: { textAlign: 'center', fontFamily: fonts.bodySemi, fontSize: 11, color: colors.muted },
  labelToday: { color: '#2E6B30' },
  tile: {
    backgroundColor: colors.paper,
    borderWidth: 2,
    borderColor: colors.ink,
    overflow: 'hidden',
  },
  today: { borderWidth: 3, borderColor: colors.leaf },
  future: { borderStyle: 'dashed', borderColor: '#B9B1A3', backgroundColor: 'transparent', opacity: 0.45 },
  art: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  strip: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.soil,
    borderTopWidth: 2,
    borderTopColor: colors.ink,
  },
  num: { position: 'absolute', top: 1, left: 3, fontFamily: fonts.bodySemi, fontSize: 11, color: colors.ink },
  numToday: { color: '#2E6B30' },
  numFuture: { color: '#6F685C' },
});
