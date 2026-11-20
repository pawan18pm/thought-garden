import React, { useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { OnboardingScreen, onboardingStyles } from '@/features/onboarding/OnboardingScreen';
import { useOnboardingDraft } from '@/features/onboarding/useOnboardingDraft';
import { Chip } from '@/features/plant/Chip';
import { ChunkyButton } from '@/ui/ChunkyButton';
import { useRepos } from '@/store/AppProvider';
import { useOnboardingState } from '@/store/onboardingState';
import { track } from '@/analytics/analytics';
import { enableReminder } from '@/notifications/reminders';

type Choice = 'morning' | 'evening' | 'custom';
type HHmm = `${number}:${number}`;

const pad = (n: number) => String(n).padStart(2, '0');
const fmt = (d: Date): HHmm => `${pad(d.getHours())}:${pad(d.getMinutes())}` as HHmm;

function defaultCustom(): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  return d;
}

export default function Reminder() {
  const router = useRouter();
  const repos = useRepos();
  const persona = useOnboardingDraft((s) => s.persona);
  const bedsCount = useOnboardingDraft((s) => s.beds.filter((b) => b.selected).length);
  const [choice, setChoice] = useState<Choice | null>(null);
  const [custom, setCustom] = useState<Date>(defaultCustom);
  const busy = useRef(false);

  const time: HHmm | null =
    choice === 'morning' ? '08:00' : choice === 'evening' ? '21:00' : choice === 'custom' ? fmt(custom) : null;

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

  return (
    <OnboardingScreen
      step="reminder"
      title="Want a gentle nudge?"
      footer={
        <>
          <ChunkyButton tone="primary" label="Yes, remind me" disabled={!time} onPress={() => finish(true)} />
          <ChunkyButton label="Not now" onPress={() => finish(false)} />
        </>
      }
    >
      <Text style={onboardingStyles.sub}>One quiet reminder a day, at a time you pick.</Text>
      <View style={styles.options}>
        <Chip label="Morning 8:00" accessibilityLabel="Morning 8:00" selected={choice === 'morning'} onPress={() => setChoice('morning')} />
        <Chip label="Evening 9:00" accessibilityLabel="Evening 9:00" selected={choice === 'evening'} onPress={() => setChoice('evening')} />
        <Chip label="Pick a time" accessibilityLabel="Pick a time" selected={choice === 'custom'} onPress={() => setChoice('custom')} />
      </View>
      {choice === 'custom' && (
        <DateTimePicker
          value={custom}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_e, d) => d && setCustom(d)}
        />
      )}
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  options: { gap: 12, alignItems: 'flex-start' },
});
