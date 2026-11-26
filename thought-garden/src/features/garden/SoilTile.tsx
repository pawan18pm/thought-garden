import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { PlantArt } from '@/ui/PlantArt';
import { colors, fonts } from '@/ui/tokens';
import type { DayCell } from './useActivity';

interface Props {
  dateKey: string;
  cell?: DayCell;
  dayNum: number;
  isToday: boolean;
  future: boolean;
  selected: boolean;
}

const HEIGHT = 52;
const RADIUS = 12;

function Sparkle({ testID }: { testID: string }) {
  return (
    <View testID={testID} style={styles.sparkle}>
      <Svg width={10} height={10} viewBox="0 0 10 10" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Path d="M5 0 L6 4 L10 5 L6 6 L5 10 L4 6 L0 5 L4 4 Z" fill="#FFD84D" stroke={colors.ink} strokeWidth={0.8} />
      </Svg>
    </View>
  );
}

/** One calendar day as a little soil bed: date top-left, plant art rooted in a soil strip. */
export function SoilTile({ dateKey, cell, dayNum, isToday, future, selected }: Props) {
  if (future) {
    return (
      <View style={styles.future}>
        <Text style={[styles.num, styles.numFuture]}>{dayNum}</Text>
      </View>
    );
  }

  const state = cell?.state ?? 'empty';
  const active = state !== 'empty';
  const bloomed = state === 'bloomed';
  const shadow = selected ? { color: colors.ink, y: 4 } : bloomed ? { color: colors.pink, y: 3 } : null;

  return (
    <View style={{ height: HEIGHT }}>
      {shadow && <View style={[styles.shadow, { top: shadow.y, bottom: -shadow.y, backgroundColor: shadow.color }]} />}
      <View
        style={[
          styles.tile,
          {
            backgroundColor: selected ? '#F3F9EE' : bloomed ? '#FFF3F6' : active ? colors.bg : colors.paper,
            borderColor: isToday ? colors.leaf : active ? colors.ink : colors.restSoil,
            borderWidth: isToday ? 3 : 2,
          },
        ]}
      >
        <View
          style={[
            styles.strip,
            active
              ? { backgroundColor: colors.soil, borderTopColor: colors.ink }
              : { backgroundColor: colors.restSoil, borderTopColor: colors.restSoilLine },
          ]}
        />
        {active && (
          <View testID={`day-${dateKey}-${state}`} style={styles.art}>
            {state === 'planted' && <PlantArt stage="seed" size={30} />}
            {state === 'watered' && <PlantArt stage={cell?.growing ? 'growing' : 'watered'} size={30} />}
            {bloomed && <PlantArt stage="bloom" size={30} flowerColor={cell?.flower} />}
          </View>
        )}
        {bloomed && <Sparkle testID={`sparkle-${dateKey}`} />}
        <Text
          style={[
            styles.num,
            { fontFamily: fonts.bodyBold, color: isToday ? '#2E6B30' : active ? colors.ink : '#8A8173' },
          ]}
        >
          {dayNum}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  future: {
    height: HEIGHT,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D8D3CA',
    borderRadius: RADIUS,
  },
  shadow: { position: 'absolute', left: 0, right: 0, borderRadius: RADIUS },
  tile: { height: HEIGHT, borderRadius: RADIUS, overflow: 'hidden' },
  strip: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 9, borderTopWidth: 2 },
  art: { position: 'absolute', left: 0, right: 0, bottom: 6, alignItems: 'center' },
  sparkle: { position: 'absolute', top: 4, right: 4 },
  num: { position: 'absolute', top: 3, left: 5, fontSize: 10, lineHeight: 12 },
  numFuture: { fontFamily: fonts.bodySemi, color: '#8A8173' },
});
