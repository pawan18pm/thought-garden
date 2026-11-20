import React, { useEffect, useRef } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import type { Bed, Plant } from '@/domain/types';
import { bloomLine } from '@/domain/bloomCopy';
import { PlantArt } from '@/ui/PlantArt';
import { useReducedMotion } from '@/ui/useReducedMotion';
import { bedColors, colors, flowerColors, fonts, type BedColorKey } from '@/ui/tokens';

interface Props {
  plants: Plant[];
  beds: Bed[];
  onUndo: (id: string) => void;
}

function Badge({ count }: { count: number }) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const prev = useRef(count);
  useEffect(() => {
    if (count > prev.current && !reduced) {
      scale.value = withSequence(withTiming(1.25, { duration: 120 }), withTiming(1, { duration: 160 }));
    }
    prev.current = count;
  }, [count, reduced, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View testID="bloom-badge" style={[styles.badge, style]}>
      <Text style={styles.badgeText}>{count}</Text>
    </Animated.View>
  );
}

export function BloomedTodayCard({ plants, beds, onUndo }: Props) {
  const ask = (p: Plant) =>
    Alert.alert(p.text, undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Undo bloom', onPress: () => onUndo(p.id) },
    ]);

  if (plants.length === 0) {
    return (
      <View style={styles.shadow}>
        <View style={[styles.card, styles.emptyCard]}>
          <Text style={styles.emptyText}>Your first bloom today is one tap away 🌱</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.shadow}>
      <View style={styles.card} accessibilityLabel="Bloomed today">
        <View style={styles.head}>
          <Text style={styles.title}>Bloomed today</Text>
          <Badge count={plants.length} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.flowers}>
          {plants.map((p) => {
            const bed = beds.find((b) => b.id === p.bedId);
            const key = (bed?.color ?? 'pink') as BedColorKey | 'ideas';
            const labelBg = key === 'ideas' ? colors.ideasBed : bedColors[key];
            return (
              <Pressable
                key={p.id}
                onPress={() => ask(p)}
                accessibilityRole="button"
                accessibilityLabel={`Bloomed: ${p.text}`}
                style={styles.flower}
              >
                <PlantArt stage="bloom" size={64} flowerColor={flowerColors[key]} />
                <View style={[styles.label, { backgroundColor: labelBg }]}>
                  <Text style={styles.labelText} numberOfLines={1}>
                    {p.text}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
        <View style={styles.soil} />
        <Text style={styles.line}>
          {bloomLine(plants.length)} <Text style={styles.hint}>Tap one to undo.</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    marginBottom: 20,
    shadowColor: colors.pink,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 22,
    overflow: 'hidden',
  },
  emptyCard: { paddingVertical: 14, paddingHorizontal: 16 },
  emptyText: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 14 },
  title: { fontFamily: fonts.titleXBold, fontSize: 22, color: colors.ink },
  badge: {
    minWidth: 32,
    height: 32,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.pink,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 999,
  },
  badgeText: { fontFamily: fonts.titleXBold, fontSize: 16, color: colors.ink },
  flowers: { gap: 10, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4, alignItems: 'flex-end' },
  flower: { minHeight: 44, minWidth: 64, maxWidth: 96, alignItems: 'center', gap: 4 },
  label: { paddingHorizontal: 8, paddingVertical: 4, borderWidth: 2, borderColor: colors.ink, borderRadius: 8, maxWidth: 96 },
  labelText: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.ink },
  soil: { height: 12, backgroundColor: colors.soil, borderTopWidth: 2, borderTopColor: colors.ink },
  line: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12 },
  hint: { fontFamily: fonts.body, color: colors.muted },
});
