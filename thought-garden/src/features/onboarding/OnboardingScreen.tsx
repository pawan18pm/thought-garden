import React, { createContext, useContext, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import {
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type HostInstance,
  type ScrollViewInstance,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { border, colors, fonts } from '@/ui/tokens';
import { PressableScale } from '@/ui/PressableScale';
import { useReducedMotion } from '@/ui/useReducedMotion';
import { track } from '@/analytics/analytics';
import type { EventMap } from '@/analytics/events';

type Measurable = Pick<HostInstance, 'measureLayout'>;

/** Scrolls a focused input into view once the keyboard is up. */
const RevealContext = createContext<(target: RefObject<Measurable | null>) => void>(() => {});
export const useRevealOnFocus = () => useContext(RevealContext);

interface Props {
  step: EventMap['onboarding_step_viewed']['step'];
  title: string;
  children: ReactNode;
  /** The primary button. It sits in the same place on every step. */
  footer?: ReactNode;
  /** Optional quiet action under the primary button (e.g. "Not now"); its slot is always reserved. */
  footerSecondary?: ReactNode;
  /** 1-4 shows the progress bar; omit on the welcome screen. */
  progress?: 1 | 2 | 3 | 4;
  /** Show the round back button (with the progress bar). */
  back?: boolean;
  headerRight?: ReactNode;
  /** Rendered above the title (welcome logo tile). */
  hero?: ReactNode;
  /** The screen renders its own title inside children. */
  hideTitle?: boolean;
  topPadding?: number;
  hideBack?: boolean;
}

const ENTER_MS = 220;
const SHOW = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
const HIDE = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

/** Progress bar that grows from the previous step to this one when the screen appears. */
function Progress({ step }: { step: 1 | 2 | 3 | 4 }) {
  const reduced = useReducedMotion();
  const v = useRef(new Animated.Value(reduced ? step : step - 1)).current;
  useEffect(() => {
    if (reduced) {
      v.setValue(step);
      return;
    }
    const anim = Animated.timing(v, {
      toValue: step,
      duration: 420,
      delay: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    anim.start();
    return () => anim.stop();
  }, [step, reduced, v]);
  return (
    <View accessibilityRole="progressbar" accessibilityLabel={`Step ${step} of 4`} style={styles.track}>
      <Animated.View
        style={[styles.fill, { width: v.interpolate({ inputRange: [0, 4], outputRange: ['0%', '100%'] }) }]}
      />
    </View>
  );
}

/** Shared frame: tracks the step view once on mount, renders progress, title, body and footer. */
export function OnboardingScreen({
  step,
  title,
  children,
  footer,
  footerSecondary,
  progress,
  back,
  headerRight,
  hero,
  hideTitle,
  topPadding = 24,
  hideBack,
}: Props) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const enter = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  const [keyboardUp, setKeyboardUp] = useState(false);

  const scrollRef = useRef<ScrollViewInstance>(null);
  const contentRef = useRef<HostInstance>(null);
  const viewH = useRef(0);
  const scrollY = useRef(0);
  const pending = useRef<RefObject<Measurable | null> | null>(null);

  useEffect(() => {
    track('onboarding_step_viewed', { step });
  }, [step]);

  useEffect(() => {
    if (reduced) {
      enter.setValue(1);
      return;
    }
    const anim = Animated.timing(enter, {
      toValue: 1,
      duration: ENTER_MS,
      delay: 60,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [reduced, enter]);

  const reveal = () => {
    const target = pending.current?.current;
    const content = contentRef.current;
    if (!target || !content || !viewH.current) return;
    try {
      target.measureLayout(
        content,
        (_x, y, _w, h) => {
          const pad = 20;
          const top = scrollY.current;
          if (y + h + pad > top + viewH.current) {
            scrollRef.current?.scrollTo({ y: y + h + pad - viewH.current, animated: !reduced });
          } else if (y - pad < top) {
            scrollRef.current?.scrollTo({ y: Math.max(0, y - pad), animated: !reduced });
          }
        },
        () => {},
      );
    } catch {
      // measuring can fail mid-unmount; nothing to scroll then
    }
  };

  useEffect(() => {
    const show = Keyboard.addListener(SHOW, () => setKeyboardUp(true));
    // By keyboardDidShow the KeyboardAvoidingView has re-laid out, so the visible height is final.
    const shown = Keyboard.addListener('keyboardDidShow', () => reveal());
    const hide = Keyboard.addListener(HIDE, () => setKeyboardUp(false));
    return () => {
      show.remove();
      shown.remove();
      hide.remove();
    };
    // reveal only reads refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestReveal = (target: RefObject<Measurable | null>) => {
    pending.current = target;
    // Already up (moving between fields, or after adding a row): scroll right away.
    if (Keyboard.isVisible()) setTimeout(reveal, 60);
  };

  const rise = enter.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {progress ? (
          <View style={styles.header}>
            {back && !hideBack ? (
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Back"
                onPress={() => router.back()}
                pressScale={0.92}
                style={styles.back}
              >
                <Text style={styles.backText}>‹</Text>
              </PressableScale>
            ) : null}
            <Progress step={progress} />
            {headerRight}
          </View>
        ) : null}
        <RevealContext.Provider value={requestReveal}>
          <ScrollView
            ref={scrollRef}
            style={styles.flex}
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={(e) => {
              scrollY.current = e.nativeEvent.contentOffset.y;
            }}
            onLayout={(e) => {
              viewH.current = e.nativeEvent.layout.height;
            }}
          >
            <Pressable
              ref={contentRef}
              accessible={false}
              onPress={Keyboard.dismiss}
              style={[styles.body, { paddingTop: topPadding }]}
            >
              <Animated.View style={{ opacity: enter, transform: [{ translateY: rise }] }}>
                {hero}
                {hideTitle ? null : (
                  <Text accessibilityRole="header" style={styles.title}>
                    {title}
                  </Text>
                )}
                {children}
              </Animated.View>
            </Pressable>
          </ScrollView>
        </RevealContext.Provider>
        {footer ? (
          <View style={[styles.footer, keyboardUp && styles.footerKeyboard]}>
            {footer}
            {footerSecondary || !keyboardUp ? <View style={styles.secondary}>{footerSecondary}</View> : null}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface BigButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  /** 'ink' is the filled enabled state used by Plant it. */
  tone?: 'white' | 'ink';
}

/** v6 primary button: one size on every step, white with a green drop shadow, greyed when disabled. */
export function BigButton({ label, onPress, disabled, tone = 'white' }: BigButtonProps) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.big, tone === 'ink' && styles.bigInk, disabled && styles.bigOff]}
    >
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        style={[styles.bigText, tone === 'ink' && !disabled && { color: '#FFFFFF' }, disabled && { color: '#6F685C' }]}
      >
        {label}
      </Text>
    </PressableScale>
  );
}

export const onboardingStyles = StyleSheet.create({
  sub: { fontFamily: fonts.body, fontSize: 16, lineHeight: 22, color: colors.muted, marginTop: -10, marginBottom: 18 },
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, height: 56, paddingHorizontal: 20, paddingTop: 12 },
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
  fill: { height: '100%', backgroundColor: '#8ACB72', borderRadius: 999 },
  scroll: { flexGrow: 1 },
  body: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 24 },
  title: {
    fontFamily: fonts.titleXBold,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.6,
    color: colors.ink,
    marginBottom: 20,
  },
  footer: { paddingTop: 12, paddingBottom: 12, alignItems: 'center', backgroundColor: colors.bg },
  footerKeyboard: { paddingBottom: 4 },
  secondary: { height: 44, marginTop: 8, alignItems: 'center', justifyContent: 'center' },
  big: {
    width: 280,
    maxWidth: '100%',
    height: 64,
    paddingHorizontal: 16,
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
