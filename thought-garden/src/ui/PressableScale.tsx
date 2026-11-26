import React, { useRef } from 'react';
import { Animated, Easing, Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { useReducedMotion } from './useReducedMotion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  /** How far the button shrinks while held (default 0.97). */
  pressScale?: number;
};

/**
 * The one pressable pattern for tappable cards and buttons: a quick shrink on
 * press-in and a soft spring back on release, on the native driver. With
 * Reduce Motion on it dims slightly instead of moving.
 */
export function PressableScale({ style, pressScale = 0.97, onPressIn, onPressOut, ...rest }: Props) {
  const reduced = useReducedMotion();
  const v = useRef(new Animated.Value(0)).current;

  const to = (toValue: number) => {
    if (toValue === 1) {
      Animated.timing(v, { toValue, duration: 90, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    } else {
      Animated.spring(v, { toValue, speed: 40, bounciness: 6, useNativeDriver: true }).start();
    }
  };

  const motion = reduced
    ? { opacity: v.interpolate({ inputRange: [0, 1], outputRange: [1, 0.7] }) }
    : { transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, pressScale] }) }] };

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(e) => {
        to(1);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        to(0);
        onPressOut?.(e);
      }}
      style={[style, motion]}
    />
  );
}
