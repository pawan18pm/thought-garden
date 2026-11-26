import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { bedColors, border, colors, flowerColors, fonts } from '@/ui/tokens';

interface Props {
  /** Active thoughts with fewer than two waters. */
  thirsty: number;
  /** Active thoughts with two or more waters. */
  ready: number;
  onPress: () => void;
}

export function nextUpTitle(thirsty: number, ready: number): string {
  if (thirsty > 0) return `Next up: ${thirsty} ${thirsty === 1 ? 'thought is' : 'thoughts are'} thirsty`;
  if (ready > 0) return `Next up: ${ready} ready to bloom`;
  return 'Next up: plant a new thought';
}

export function NextUpCard({ thirsty, ready, onPress }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.shadow} />
      <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}>
        <View style={styles.drop}>
          <Svg width={22} height={22} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <Path
              d="M12 3 C12 3 5 11 5 15 a7 7 0 0 0 14 0 C19 11 12 3 12 3 Z"
              fill={flowerColors.blue}
              stroke={colors.ink}
              strokeWidth={1.8}
            />
          </Svg>
        </View>
        <View style={styles.text}>
          <Text style={styles.title}>{nextUpTitle(thirsty, ready)}</Text>
          <Text style={styles.sub}>Go to the Plant tab</Text>
        </View>
        <Text style={styles.chev} importantForAccessibility="no" accessibilityElementsHidden>
          ›
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: 20, marginTop: 20 },
  shadow: { position: 'absolute', left: 0, right: 0, top: 5, bottom: -5, backgroundColor: flowerColors.blue, borderRadius: 22 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    height: 72,
    paddingHorizontal: 16,
    backgroundColor: colors.bg,
    borderWidth: border,
    borderColor: colors.ink,
    borderRadius: 22,
  },
  drop: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: bedColors.blue,
    borderWidth: border,
    borderColor: colors.ink,
    borderRadius: 999,
  },
  text: { flex: 1 },
  title: { fontFamily: fonts.titleBold, fontSize: 18, color: colors.ink },
  sub: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  chev: { fontFamily: fonts.bodyBold, fontSize: 22, color: colors.ink },
});
