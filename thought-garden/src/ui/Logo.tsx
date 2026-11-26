import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { bedColors, border, colors, fonts } from '@/ui/tokens';

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 72 72">
      <Path d="M36 62 V38" stroke={colors.ink} strokeWidth={3.5} fill="none" />
      <Path d="M36 44 C26 44 20 36 21 29 C29 29 36 34 36 44 Z" fill={colors.leafLight} stroke={colors.ink} strokeWidth={3} />
      <Path d="M36 40 C46 40 52 32 51 25 C43 25 36 30 36 40 Z" fill={colors.leaf} stroke={colors.ink} strokeWidth={3} />
      <Path d="M14 62 H58" stroke={colors.ink} strokeWidth={3.5} strokeLinecap="round" />
    </Svg>
  );
}

export function LogoRow({ onSettings }: { onSettings: () => void }) {
  return (
    <View style={styles.row}>
      <View style={styles.mark}>
        <LogoMark />
      </View>
      <Text style={styles.name}>Thought Garden</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Settings" onPress={onSettings} style={styles.gear}>
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.ink} strokeWidth={2} strokeLinecap="round">
          <Circle cx={12} cy={12} r={3.2} />
          <Path d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" />
        </Svg>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20 },
  mark: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: bedColors.green,
    borderWidth: border,
    borderColor: colors.ink,
    borderRadius: 11,
  },
  name: { flex: 1, fontFamily: fonts.titleXBold, fontSize: 19, color: colors.ink },
  gear: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});
