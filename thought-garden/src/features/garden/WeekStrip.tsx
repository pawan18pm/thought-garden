import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors, fonts } from '@/ui/tokens';

export function WeekStrip({ blooms, waters }: { blooms: number; waters: number }) {
  return <Text style={styles.text}>{`🌸 ${blooms} bloomed · 💧 ${waters} waters this week`}</Text>;
}

const styles = StyleSheet.create({
  text: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink, marginBottom: 16 },
});
