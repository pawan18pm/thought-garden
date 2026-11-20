import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabBarProps } from 'expo-router/build/layouts/Tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { border, colors, fonts } from '@/ui/tokens';

const LABELS: Record<string, string> = { index: '🌰 Plant', garden: '🌳 Garden' };

export function PillTabBar({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={[styles.outer, { bottom: Math.max(insets.bottom, 12) + 4 }]}>
      <View style={styles.pill}>
        {state.routes.map((route, i) => {
          const label = LABELS[route.name];
          if (!label) return null;
          const focused = state.index === i;
          const onPress = () => {
            const e = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !e.defaultPrevented) navigateToTab(route.key);
          };
          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              style={[styles.tab, focused && styles.tabActive]}
            >
              <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: border,
    borderColor: colors.ink,
    borderRadius: 999,
  },
  tab: { minHeight: 44, paddingHorizontal: 22, borderRadius: 999, justifyContent: 'center' },
  tabActive: { backgroundColor: colors.ink },
  label: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink },
  labelActive: { color: colors.paper },
});
