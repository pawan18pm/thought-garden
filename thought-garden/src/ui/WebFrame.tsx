import React, { type ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { colors } from '@/ui/tokens';

/** Max width of the app column on web, so a laptop browser shows it like the phone app. */
export const WEB_MAX_WIDTH = 430;

/** On web, centres the app in a phone-width white column. On native it renders children as-is. */
export function WebFrame({ children }: { children: ReactNode }) {
  if (Platform.OS !== 'web') return <>{children}</>;
  return (
    <View style={styles.page}>
      <View style={styles.column}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, alignItems: 'center', backgroundColor: '#F4F2EE' },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: WEB_MAX_WIDTH,
    backgroundColor: colors.bg,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    overflow: 'hidden',
  },
});
