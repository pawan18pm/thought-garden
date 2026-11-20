import React, { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, Path, Text as SvgText, TextPath } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '@/ui/tokens';
import { useReducedMotion } from '@/ui/useReducedMotion';

export function PlantItButton({ onPress }: { onPress: () => void }) {
  const reduced = useReducedMotion();
  const rot = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      cancelAnimation(rot);
      rot.value = 0;
    } else {
      rot.value = withRepeat(withTiming(360, { duration: 18000, easing: Easing.linear }), -1, false);
    }
    return () => cancelAnimation(rot);
  }, [reduced, rot]);

  const spin = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }] }));

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Plant a thought" style={styles.button}>
      <Animated.View style={[StyleSheet.absoluteFill, spin]}>
        <Svg width={112} height={112} viewBox="0 0 112 112">
          <Defs>
            <Path id="ring" d="M56,56 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" />
          </Defs>
          <Circle cx={56} cy={56} r={54} fill={colors.paper} />
          <SvgText fontFamily="Inter_600SemiBold" fontSize={11} fontWeight="600" letterSpacing={3} fill={colors.ink}>
            <TextPath href="#ring">PLANT IT · PLANT IT · PLANT IT ·</TextPath>
          </SvgText>
        </Svg>
      </Animated.View>
      <Svg width={112} height={112} viewBox="0 0 112 112" style={StyleSheet.absoluteFill}>
        <Circle cx={56} cy={56} r={28} fill="#FFFFFF" stroke={colors.ink} strokeWidth={2} />
        <Path d="M56 44 V68 M44 56 H68" stroke={colors.ink} strokeWidth={3} strokeLinecap="round" />
        <Path d="M30 70 A28 28 0 0 0 82 70" fill="none" stroke={colors.leaf} strokeWidth={4} />
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 112, height: 112 },
});
