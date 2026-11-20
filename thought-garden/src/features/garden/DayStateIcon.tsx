import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { DayState } from '@/domain/dayState';
import { PlantArt } from '@/ui/PlantArt';
import { colors } from '@/ui/tokens';

export function DayStateIcon({ state, testID }: { state: DayState; testID: string }) {
  return (
    <View testID={testID} style={styles.box}>
      {state === 'empty' && <View style={styles.dot} />}
      {state === 'planted' && <PlantArt stage="seed" size={22} />}
      {state === 'watered' && <Text style={styles.emoji}>💧</Text>}
      {state === 'bloomed' && <Text style={styles.emoji}>🌸</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { height: 22, width: 22, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.muted, opacity: 0.25 },
  emoji: { fontSize: 16 },
});
