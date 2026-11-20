import React, { useEffect } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { border, colors } from '@/ui/tokens';
import { useReducedMotion } from '@/ui/useReducedMotion';

interface Props {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const OFFSCREEN = 600;

export function Sheet({ visible, onClose, children }: Props) {
  const reduced = useReducedMotion();
  const y = useSharedValue(reduced ? 0 : OFFSCREEN);

  useEffect(() => {
    if (!visible) return;
    if (reduced) {
      y.value = 0;
    } else {
      y.value = OFFSCREEN;
      y.value = withTiming(0, { duration: 260 });
    }
  }, [visible, reduced, y]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" accessibilityRole="button" />
        <Animated.View style={[styles.sheet, style]}>
          <View style={styles.handle} />
          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(28,27,25,0.4)' },
  sheet: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: border,
    borderBottomWidth: 0,
    borderColor: colors.ink,
    padding: 20,
    paddingBottom: 32,
    maxHeight: '90%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.muted,
    marginBottom: 12,
  },
});
