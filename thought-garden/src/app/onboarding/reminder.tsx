import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PressableScale } from '@/ui/PressableScale';
import { useRouter } from 'expo-router';
import { OnboardingScreen, BigButton } from '@/features/onboarding/OnboardingScreen';
import { useOnboardingDraft } from '@/features/onboarding/useOnboardingDraft';
import { PlantArt } from '@/ui/PlantArt';
import { useRepos } from '@/store/AppProvider';
import { useOnboardingState } from '@/store/onboardingState';
import { track } from '@/analytics/analytics';
import { enableReminder } from '@/notifications/reminders';
import { REMINDERS_SUPPORTED } from '@/notifications/support';
import { bedColors, border, colors, flowerColors, fonts } from '@/ui/tokens';

type Choice = 'morning' | 'evening';
type HHmm = `${number}:${number}`;

const TIMES: { id: Choice; label: string; time: string; hhmm: HHmm }[] = [
  { id: 'morning', label: 'Morning', time: '8:00', hhmm: '08:00' },
  { id: 'evening', label: 'Evening', time: '9:00', hhmm: '21:00' },
];

export default function Reminder() {
  const router = useRouter();
  const repos = useRepos();
  const persona = useOnboardingDraft((s) => s.persona);
  const bedsCount = useOnboardingDraft((s) => s.beds.length);
  const planted = useOnboardingDraft((s) => s.planted);
  const [choice, setChoice] = useState<Choice | null>('evening');
  const busy = useRef(false);

  const time = TIMES.find((t) => t.id === choice)?.hhmm ?? null;

  const finish = async (enable: boolean) => {
    if (busy.current) return;
    busy.current = true;
    try {
      if (enable && time) {
        // Triggers the iOS permission prompt; if denied we still finish onboarding normally.
        await enableReminder(time);
      } else {
        await repos.settings.set('reminder_enabled', '0');
      }
      await repos.settings.set('onboarding_done', '1');
      useOnboardingState.getState().setDone(true);
      if (persona) track('onboarding_completed', { persona, beds_count: bedsCount });
      router.replace('/(tabs)/plant');
    } catch (e) {
      console.error('Onboarding finish failed', e);
      busy.current = false;
    }
  };

  if (!REMINDERS_SUPPORTED) {
    return (
      <OnboardingScreen
        step="reminder"
        title="Your first thought is planted"
        progress={4}
        hideTitle
        footer={<BigButton label="Go to my garden" onPress={() => finish(false)} />}
      >
        <View style={styles.planted}>
          <PlantArt stage="seed" size={96} />
          {planted ? (
            <>
              <Text style={styles.plantedIn}>Planted in {planted.bedName}</Text>
              <Text style={styles.quote}>"{planted.text}"</Text>
            </>
          ) : null}
          <Text accessibilityRole="header" style={styles.h1}>
            Your first thought is planted
          </Text>
          <Text style={[styles.quote, styles.webNote]}>Daily reminders work in the phone app.</Text>
        </View>
      </OnboardingScreen>
    );
  }

  return (
    <OnboardingScreen
      step="reminder"
      title="Want a daily nudge to water it?"
      progress={4}
      hideTitle
      footer={<BigButton label="Yes, nudge me" disabled={!time} onPress={() => finish(true)} />}
      footerSecondary={
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Not now"
          onPress={() => finish(false)}
          style={styles.notNow}
        >
          <Text style={styles.notNowText}>Not now</Text>
        </PressableScale>
      }
    >
      <View style={styles.planted}>
        <PlantArt stage="seed" size={96} />
        {planted ? (
          <>
            <Text style={styles.plantedIn}>Planted in {planted.bedName}</Text>
            <Text style={styles.quote}>"{planted.text}"</Text>
          </>
        ) : null}
        <Text accessibilityRole="header" style={styles.h1}>
          Want a daily nudge to water it?
        </Text>
      </View>
      <View style={styles.times}>
        {TIMES.map((t) => {
          const on = t.id === choice;
          return (
            <PressableScale
              key={t.id}
              accessibilityRole="button"
              accessibilityLabel={`${t.label} ${t.time}`}
              accessibilityState={{ selected: on }}
              onPress={() => setChoice(t.id)}
              style={[
                styles.time,
                { backgroundColor: on ? bedColors.green : '#FFFFFF', borderBottomColor: on ? flowerColors.green : colors.line },
              ]}
            >
              <Text style={styles.timeLabel}>{t.label}</Text>
              <Text style={styles.timeValue}>{t.time}</Text>
            </PressableScale>
          );
        })}
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  planted: { alignItems: 'center', paddingHorizontal: 8, marginTop: 16 },
  h1: { marginTop: 18, fontFamily: fonts.titleXBold, fontSize: 32, lineHeight: 35, color: colors.ink, textAlign: 'center' },
  plantedIn: { marginTop: 8, fontFamily: fonts.bodySemi, fontSize: 15, color: '#2E6B30' },
  quote: { marginTop: 4, fontFamily: fonts.body, fontSize: 15, color: colors.muted, textAlign: 'center' },
  times: { flexDirection: 'row', gap: 12, marginTop: 28 },
  time: {
    flex: 1,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: border,
    borderBottomWidth: border + 5,
    borderColor: colors.ink,
    borderRadius: 22,
  },
  timeLabel: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.muted },
  timeValue: { fontFamily: fonts.titleXBold, fontSize: 22, color: colors.ink },
  webNote: { marginTop: 12 },
  notNow: { height: 44, paddingHorizontal: 16, justifyContent: 'center' },
  notNowText: { fontFamily: fonts.bodySemi, fontSize: 16, color: colors.muted },
});
