import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Bed, Plant } from '@/domain/types';
import { stageOf } from '@/domain/stages';
import { bedColors, border, colors, fonts, radius, shadowOffset } from '@/ui/tokens';
import { PlantArt } from '@/ui/PlantArt';
import { PlantStake } from '@/ui/PlantStake';

interface Props {
  bed: Bed;
  plants: Plant[];
  onPlantPress: (id: string) => void;
  onAddPress: () => void;
  onToggleFold: () => void;
}

const PRIORITY_WORD = { 3: 'High priority: ', 2: 'Medium priority: ', 1: '' } as const;

export function plantLabel(p: Plant): string {
  const prefix = p.priority ? PRIORITY_WORD[p.priority] : '';
  return `${prefix}${p.text}, ${stageOf(p)}`;
}

export function BedCard({ bed, plants, onPlantPress, onAddPress, onToggleFold }: Props) {
  const fill = bed.color === 'ideas' ? colors.ideasBed : bedColors[bed.color];
  const flower = bed.color === 'ideas' ? undefined : bedColors[bed.color];
  const count = `${plants.length} ${plants.length === 1 ? 'plant' : 'plants'}`;
  return (
    <View style={styles.wrap}>
      <View style={styles.shadow} />
      <View style={[styles.card, { backgroundColor: fill }]}>
        <View style={styles.header}>
          <Pressable
            style={styles.titleArea}
            onPress={onToggleFold}
            accessibilityRole="button"
            accessibilityLabel={`${bed.name}, ${bed.folded ? 'expand' : 'collapse'}`}
          >
            <Text style={styles.name} numberOfLines={1}>
              {bed.name}
            </Text>
            <Text style={styles.count}>{count}</Text>
            <Text style={styles.chevron}>{bed.folded ? '▸' : '▾'}</Text>
          </Pressable>
          <Pressable
            style={styles.add}
            onPress={onAddPress}
            accessibilityRole="button"
            accessibilityLabel={`Add plant to ${bed.name}`}
          >
            <Text style={styles.addText}>+</Text>
          </Pressable>
        </View>
        {!bed.folded && (
          <>
            {plants.length === 0 ? (
              <Text style={styles.empty}>Empty soil · plant your first thought here</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
                {plants.map((p) => (
                  <Pressable
                    key={p.id}
                    style={styles.plant}
                    onPress={() => onPlantPress(p.id)}
                    accessibilityRole="button"
                    accessibilityLabel={plantLabel(p)}
                  >
                    <PlantArt stage={stageOf(p)} size={48} flowerColor={flower} />
                    <PlantStake text={p.text} priority={p.priority} />
                  </Pressable>
                ))}
              </ScrollView>
            )}
            <View style={styles.soil} />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginRight: shadowOffset, marginBottom: shadowOffset },
  shadow: {
    position: 'absolute',
    left: shadowOffset,
    top: shadowOffset,
    right: -shadowOffset,
    bottom: -shadowOffset,
    borderRadius: radius.card,
    backgroundColor: colors.ink,
  },
  card: { borderWidth: border, borderColor: colors.ink, borderRadius: radius.card, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', paddingLeft: 16, paddingRight: 4 },
  titleArea: { flex: 1, minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { fontFamily: fonts.titleBold, fontSize: 20, color: colors.ink, flexShrink: 1 },
  count: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.ink },
  chevron: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink },
  add: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  addText: { fontFamily: fonts.bodySemi, fontSize: 26, color: colors.ink },
  row: { gap: 14, paddingHorizontal: 14, paddingTop: 6, paddingBottom: 8, alignItems: 'flex-end' },
  plant: { width: 96, alignItems: 'center', gap: 4 },
  empty: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, paddingHorizontal: 16, paddingVertical: 18 },
  soil: { height: 14, backgroundColor: colors.soil, borderTopWidth: border, borderTopColor: colors.ink },
});
