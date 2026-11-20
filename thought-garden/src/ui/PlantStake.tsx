import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Priority } from '@/domain/types';
import { border, colors, fonts } from '@/ui/tokens';

export function priorityPrefix(p: Priority): string {
  return p === 3 ? '▲▲ ' : p === 2 ? '▲ ' : '';
}

export function PlantStake({ text, priority }: { text: string; priority: Priority }) {
  return (
    <View style={styles.stake}>
      <Text style={[styles.text, priority === 3 || priority === 2 ? styles.bold : null]} numberOfLines={2}>
        {priorityPrefix(priority) + text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stake: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: border,
    borderColor: colors.ink,
    borderRadius: 8,
    maxWidth: 96,
  },
  text: { fontFamily: fonts.body, fontSize: 11, color: colors.ink, textAlign: 'center' },
  bold: { fontFamily: fonts.bodySemi },
});
