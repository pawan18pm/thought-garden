import React, { useEffect, type ReactNode } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { border, colors, fonts } from '@/ui/tokens';
import { track } from '@/analytics/analytics';
import type { EventMap } from '@/analytics/events';

interface Props {
  step: EventMap['onboarding_step_viewed']['step'];
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  /** 1-4 shows the progress bar; omit on the welcome screen. */
  progress?: 1 | 2 | 3 | 4;
  /** Show the round back button (with the progress bar). */
  back?: boolean;
  headerRight?: ReactNode;
  titleSize?: number;
  /** Rendered above the title (welcome logo tile). */
  hero?: ReactNode;
  /** The screen renders its own title inside children. */
  hideTitle?: boolean;
  topPadding?: number;
  hideBack?: boolean;
}

/** Shared frame: tracks the step view once on mount, renders progress, title, body and footer. */
export function OnboardingScreen({
  step,
  title,
  children,
  footer,
  progress,
  back,
  headerRight,
  titleSize = 32,
  hero,
  hideTitle,
  topPadding = 24,
  hideBack,
}: Props) {
  const router = useRouter();
  useEffect(() => {
    track('onboarding_step_viewed', { step });
  }, [step]);
  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {progress ? (
          <View style={styles.header}>
            {back && !hideBack ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back"
                onPress={() => router.back()}
                style={styles.back}
              >
                <Text style={styles.backText}>‹</Text>
              </Pressable>
            ) : null}
            <View accessibilityRole="progressbar" accessibilityLabel={`Step ${progress} of 4`} style={styles.track}>
              <View style={[styles.fill, { width: `${progress * 25}%` }]} />
            </View>
            {headerRight}
          </View>
        ) : null}
        <Pressable accessible={false} onPress={Keyboard.dismiss} style={[styles.body, { paddingTop: topPadding }]}>
          {hero}
          {hideTitle ? null : (
            <Text accessibilityRole="header" style={[styles.title, { fontSize: titleSize }]}>
              {title}
            </Text>
          )}
          {children}
        </Pressable>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface BigButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  width?: number;
  /** 'ink' is the filled enabled state used by Plant it. */
  tone?: 'white' | 'ink';
  fontSize?: number;
}

/** v6 white button with a green drop shadow; greyed when disabled. */
export function BigButton({ label, onPress, disabled, width = 260, tone = 'white', fontSize = 19 }: BigButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.big, { width }, tone === 'ink' && styles.bigInk, disabled && styles.bigOff]}
    >
      <Text style={[styles.bigText, { fontSize }, tone === 'ink' && !disabled && { color: '#FFFFFF' }, disabled && { color: '#6F685C' }]}>{label}</Text>
    </Pressable>
  );
}

export const onboardingStyles = StyleSheet.create({
  sub: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: colors.muted, marginTop: -12, marginBottom: 16 },
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 12 },
  back: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  backText: { fontSize: 22, fontWeight: '700', color: colors.ink },
  track: { flex: 1, height: 14, backgroundColor: colors.line, borderRadius: 999, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#8ACB72' },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },
  title: { fontFamily: fonts.titleXBold, color: colors.ink, marginBottom: 20, lineHeight: 36, letterSpacing: -0.6 },
  footer: { paddingBottom: 32, paddingTop: 12, alignItems: 'center', backgroundColor: colors.bg },
  big: {
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: border,
    borderColor: colors.ink,
    borderRadius: 22,
    borderBottomWidth: border + 6,
    borderBottomColor: '#8ACB72',
  },
  bigInk: { backgroundColor: colors.ink },
  bigOff: { backgroundColor: '#F3F1EC', borderColor: '#D8D3CA', borderBottomWidth: border },
  bigText: { fontFamily: fonts.titleBold, fontSize: 19, color: colors.ink },
});
