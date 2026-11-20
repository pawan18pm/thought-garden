import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { border, colors, fonts, shadowOffset } from '@/ui/tokens';

interface Props {
  label: string;
  onPress: () => void;
  tone?: 'default' | 'primary';
  disabled?: boolean;
}

export function ChunkyButton({ label, onPress, tone = 'default', disabled }: Props) {
  return (
    <View style={[styles.wrap, disabled && styles.disabled]}>
      <View style={[styles.shadow, { backgroundColor: tone === 'primary' ? colors.leaf : colors.ink }]} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: !!disabled }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [styles.button, pressed && { transform: [{ translateX: 2 }, { translateY: 2 }] }]}
      >
        <Text style={[styles.label, tone === 'primary' && styles.primaryLabel]}>{label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'flex-start', marginRight: shadowOffset, marginBottom: shadowOffset },
  disabled: { opacity: 0.45 },
  shadow: {
    position: 'absolute',
    left: shadowOffset,
    top: shadowOffset,
    right: -shadowOffset,
    bottom: -shadowOffset,
    borderRadius: 16,
  },
  button: {
    minHeight: 44,
    paddingHorizontal: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: border,
    borderColor: colors.ink,
    borderRadius: 16,
  },
  label: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink },
  primaryLabel: { fontFamily: fonts.titleBold, fontSize: 16 },
});
