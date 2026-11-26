import React, { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Alert, AppState, DevSettings, Linking, Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ManageBeds } from '@/features/settings/ManageBeds';
import { Chip } from '@/features/plant/Chip';
import { ChunkyButton } from '@/ui/ChunkyButton';
import { colors, fonts } from '@/ui/tokens';
import { useGarden, useRepos } from '@/store/AppProvider';
import { PERSONA_LABELS } from '@/domain/personas';
import type { Persona } from '@/domain/types';
import { disableReminder, enableReminder } from '@/notifications/reminders';

const DEFAULT_TIME = '21:00';
const pad = (n: number) => String(n).padStart(2, '0');
const toHHmm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const toDate = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.heading} accessibilityRole="header">{title}</Text>
      {children}
    </View>
  );
}

function ReminderSection() {
  const repos = useRepos();
  const [enabled, setEnabled] = useState(false);
  const [time, setTime] = useState(DEFAULT_TIME);
  const [denied, setDenied] = useState(false);

  const checkPermission = useCallback(async () => {
    try {
      setDenied((await Notifications.getPermissionsAsync()).status === 'denied');
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void (async () => {
      setEnabled((await repos.settings.get('reminder_enabled')) === '1');
      setTime((await repos.settings.get('reminder_time')) ?? DEFAULT_TIME);
      await checkPermission();
    })();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && void checkPermission());
    return () => sub.remove();
  }, [repos, checkPermission]);

  const toggle = async (on: boolean) => {
    if (on) {
      const ok = await enableReminder(time);
      setEnabled(ok);
      await checkPermission();
    } else {
      setEnabled(false);
      await disableReminder();
    }
  };

  const changeTime = async (d?: Date) => {
    if (!d) return;
    const t = toHHmm(d);
    setTime(t);
    if (enabled) {
      setEnabled(await enableReminder(t));
      await checkPermission();
    } else await repos.settings.set('reminder_time', t);
  };

  return (
    <Section title="Daily reminder">
      <View style={styles.row}>
        <Text style={styles.label}>Remind me daily</Text>
        <Switch
          value={enabled}
          onValueChange={toggle}
          accessibilityLabel="Remind me daily"
          trackColor={{ true: colors.leaf, false: undefined }}
        />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Reminder time</Text>
        <DateTimePicker
          value={toDate(time)}
          mode="time"
          display={Platform.OS === 'ios' ? 'compact' : 'default'}
          onChange={(_e, d) => void changeTime(d)}
        />
      </View>
      {denied && (
        <View style={styles.gap}>
          <Text style={styles.note}>Notifications are off for Thought Garden. Turn them on in iOS Settings.</Text>
          <ChunkyButton label="Open iOS Settings" onPress={() => void Linking.openSettings()} />
        </View>
      )}
    </Section>
  );
}

function PersonaSection() {
  const repos = useRepos();
  const [persona, setPersona] = useState<string | null>(null);
  useEffect(() => {
    void repos.settings.get('persona').then(setPersona);
  }, [repos]);
  const pick = async (p: Persona) => {
    setPersona(p);
    await repos.settings.set('persona', p);
  };
  return (
    <Section title="Who are you">
      <View style={styles.chips}>
        {(Object.keys(PERSONA_LABELS) as Persona[]).map((p) => (
          <Chip key={p} label={PERSONA_LABELS[p]} accessibilityLabel={PERSONA_LABELS[p]} selected={persona === p} onPress={() => void pick(p)} />
        ))}
      </View>
      <Text style={styles.note}>This only changes the suggestions you see next time.</Text>
    </Section>
  );
}

function PrivacySection() {
  const repos = useRepos();
  const setAnalytics = useGarden((s) => s.setAnalytics);
  const [on, setOn] = useState(true);
  useEffect(() => {
    void repos.settings.get('analytics_enabled').then((v) => setOn(v !== '0'));
  }, [repos]);
  return (
    <Section title="Privacy">
      <View style={styles.row}>
        <Text style={styles.label}>Share anonymous usage data</Text>
        <Switch
          value={on}
          onValueChange={(v) => {
            setOn(v);
            void setAnalytics(v);
          }}
          accessibilityLabel="Share anonymous usage data"
          trackColor={{ true: colors.leaf, false: undefined }}
        />
      </View>
      <Text style={styles.note}>Only actions like 'planted' or 'watered', never what you write.</Text>
    </Section>
  );
}

function DevSection() {
  const repos = useRepos();
  const reset = () =>
    Alert.alert('Reset all data?', 'This deletes every plant, bed and setting, then restarts the app.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          await repos.resetAll();
          DevSettings.reload();
        },
      },
    ]);
  return (
    <Section title="Developer">
      <ChunkyButton label="Reset all data" onPress={reset} />
    </Section>
  );
}

export default function Settings() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      automaticallyAdjustKeyboardInsets
    >
      <Stack.Screen options={{ headerShown: true, title: 'Settings' }} />
      <ReminderSection />
      <Section title="Manage beds">
        <ManageBeds />
      </Section>
      <PersonaSection />
      <PrivacySection />
      <Section title="About">
        <Text style={styles.label}>Thought Garden v{Constants.expoConfig?.version ?? '1.0.0'}</Text>
      </Section>
      {__DEV__ && <DevSection />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 20, gap: 28, paddingBottom: 60 },
  section: { gap: 10 },
  heading: { fontFamily: fonts.titleBold, fontSize: 20, color: colors.ink },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44, gap: 12 },
  label: { flexShrink: 1, fontFamily: fonts.bodySemi, fontSize: 16, color: colors.ink },
  note: { fontFamily: fonts.body, fontSize: 14, color: colors.muted },
  gap: { gap: 10 },
  chips: { gap: 10, alignItems: 'flex-start' },
});
