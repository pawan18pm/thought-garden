import React, { useEffect, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts } from '@/ui/tokens';
import { track } from '@/analytics/analytics';
import type { EventMap } from '@/analytics/events';

interface Props {
  step: EventMap['onboarding_step_viewed']['step'];
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** Shared frame: tracks the step view once on mount, renders title, body and footer. */
export function OnboardingScreen({ step, title, children, footer }: Props) {
  useEffect(() => {
    track('onboarding_step_viewed', { step });
  }, [step]);
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.body}>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        {children}
      </View>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

export const onboardingStyles = StyleSheet.create({
  sub: { fontFamily: fonts.body, fontSize: 16, color: colors.muted, marginBottom: 20 },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 32 },
  title: { fontFamily: fonts.titleXBold, fontSize: 32, color: colors.ink, marginBottom: 20 },
  footer: { paddingHorizontal: 24, paddingBottom: 24, flexDirection: 'row', gap: 16, alignItems: 'center' },
});
