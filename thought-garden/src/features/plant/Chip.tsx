import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { border, colors, fonts } from '@/ui/tokens';

interface Props {
  label: string;
  accessibilityLabel: string;
  selected?: boolean;
  onPress: () => void;
}

export function Chip({ label, accessibilityLabel, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: !!selected }}
      style={[styles.chip, selected && styles.selected]}
    >
      <Text style={[styles.text, selected && styles.selectedText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 44,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderWidth: border,
    borderColor: colors.ink,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  selected: { backgroundColor: colors.ink },
  text: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink },
  selectedText: { color: colors.paper },
});
