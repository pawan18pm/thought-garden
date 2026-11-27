import React, { useCallback, useEffect, useState, type ReactNode } from 'react';
import { AppState, Linking, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { REMINDERS_SUPPORTED } from '@/notifications/support';
import { useOnboardingState } from '@/store/onboardingState';
import { useOnboardingDraft } from '@/features/onboarding/useOnboardingDraft';
import { setAnalyticsEnabled } from '@/analytics/analytics';

const DEFAULT_TIME = '21:00';
const PRESETS = [
  { id: 'am', label: 'Morning', shown: '8:00', time: '08:00' },
  { id: 'pm', label: 'Evening', shown: '9:00', time: '21:00' },
];
const DANGER = '#B3261E';
const pad = (n: number) => String(n).padStart(2, '0');
const toHHmm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const toDate = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
};

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

  const applyTime = async (t: string) => {
    setTime(t);
    if (enabled) {
      setEnabled(await enableReminder(t));
      await checkPermission();
    } else await repos.settings.set('reminder_time', t);
  };

  // Android shows the picker as a dialog the moment it mounts, so only mount it on demand.
  const [picking, setPicking] = useState(false);
  const android = Platform.OS === 'android';

  const changeTime = async (type: string | undefined, d?: Date) => {
    setPicking(false);
    if (d && type !== 'dismissed') await applyTime(toHHmm(d));
  };

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.h2} accessibilityRole="header">Daily reminder</Text>
        <Switch
          value={enabled}
          onValueChange={toggle}
          accessibilityLabel="Remind me daily"
          trackColor={{ true: colors.leaf, false: undefined }}
        />
      </View>
      {enabled && (
        <View style={styles.times}>
          {PRESETS.map((p) => {
            const on = time === p.time;
            return (
              <Pressable
                key={p.id}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() => void applyTime(p.time)}
                style={[styles.timeBtn, on && styles.timeBtnOn]}
              >
                <Text style={styles.timeText}>{`${p.label} ${p.shown}`}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
      {enabled && (
        <View style={styles.customRow}>
          <Text style={styles.label}>Custom time</Text>
          {android && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Pick a custom time"
              onPress={() => setPicking(true)}
              style={styles.timeBtn}
            >
              <Text style={styles.timeText}>{time}</Text>
            </Pressable>
          )}
          {(!android || picking) && (
            <DateTimePicker
              value={toDate(time)}
              mode="time"
              display={Platform.OS === 'ios' ? 'compact' : 'default'}
              onChange={(e, d) => void changeTime(e?.type, d)}
            />
          )}
        </View>
      )}
      {denied && (
        <View style={styles.gap}>
          <Text style={styles.note}>Notifications are off for Thought Garden. Turn them on in iOS Settings.</Text>
          <ChunkyButton label="Open iOS Settings" onPress={() => void Linking.openSettings()} />
        </View>
      )}
    </View>
  );
}

function WebReminderNote() {
  return (
    <View style={styles.card}>
      <Text style={styles.h2} accessibilityRole="header">Daily reminder</Text>
      <Text style={[styles.note, styles.gap]}>Reminders work in the phone app.</Text>
    </View>
  );
}

function ListRow({ title, value, onPress, last, children }: { title: string; value: string; onPress?: () => void; last?: boolean; children?: ReactNode }) {
  return (
    <View style={last ? undefined : styles.rowLine}>
      {onPress ? (
        <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={styles.listRow}>
          <Text style={styles.rowTitle}>{title}</Text>
          <Text style={styles.rowValue}>{value} ›</Text>
        </Pressable>
      ) : (
        // Info only: no press target, no chevron.
        <View accessible accessibilityLabel={`${title}, ${value}`} style={styles.listRow}>
          <Text style={styles.rowTitle}>{title}</Text>
          <Text style={styles.rowValue}>{value}</Text>
        </View>
      )}
      {children}
    </View>
  );
}

function ListRows() {
  const repos = useRepos();
  const setAnalytics = useGarden((s) => s.setAnalytics);
  const [persona, setPersona] = useState<string | null>(null);
  const [analytics, setAnalyticsOn] = useState(true);
  const [open, setOpen] = useState<'who' | 'privacy' | null>(null);
  useEffect(() => {
    void repos.settings.get('persona').then(setPersona);
    void repos.settings.get('analytics_enabled').then((v) => setAnalyticsOn(v !== '0'));
  }, [repos]);
  const pick = async (p: Persona) => {
    setPersona(p);
    await repos.settings.set('persona', p);
  };
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const toggle = (k: 'who' | 'privacy') => setOpen((o) => (o === k ? null : k));
  return (
    <View style={styles.listCard}>
      <ListRow title="Who are you" value={(persona && PERSONA_LABELS[persona as Persona]) || 'Not set'} onPress={() => toggle('who')}>
        {open === 'who' && (
          <View style={styles.panel}>
            <View style={styles.chips}>
              {(Object.keys(PERSONA_LABELS) as Persona[]).map((p) => (
                <Chip key={p} label={PERSONA_LABELS[p]} accessibilityLabel={PERSONA_LABELS[p]} selected={persona === p} onPress={() => void pick(p)} />
              ))}
            </View>
            <Text style={styles.note}>This only changes the suggestions you see next time.</Text>
          </View>
        )}
      </ListRow>
      <ListRow title="Privacy" value="Stays on this phone" onPress={() => toggle('privacy')}>
        {open === 'privacy' && (
          <View style={styles.panel}>
            <View style={styles.customRow}>
              <Text style={styles.label}>Share anonymous usage data</Text>
              <Switch
                value={analytics}
                onValueChange={(v) => {
                  setAnalyticsOn(v);
                  void setAnalytics(v);
                }}
                accessibilityLabel="Share anonymous usage data"
                trackColor={{ true: colors.leaf, false: undefined }}
              />
            </View>
            <Text style={styles.note}>Only actions like 'planted' or 'watered', never what you write.</Text>
          </View>
        )}
      </ListRow>
      <ListRow title="About & feedback" value={`v${version}`} last />
    </View>
  );
}

function ResetBlock() {
  const repos = useRepos();
  const router = useRouter();
  const load = useGarden((s) => s.load);
  const [ask, setAsk] = useState(false);
  const [failed, setFailed] = useState(false);
  const doReset = async () => {
    setFailed(false);
    try {
      await disableReminder();
      await repos.resetAll();
    } catch {
      setFailed(true);
      return;
    }
    try {
      await repos.beds.ensureIdeas();
      await load();
    } catch {
      /* data is wiped; onboarding will reload the store */
    }
    // Settings no longer exist, so the client goes back to the default (sharing on), matching the toggle.
    setAnalyticsEnabled(true);
    useOnboardingDraft.getState().reset();
    // Drop the tabs underneath first so back / swipe from Welcome can't return to an empty garden.
    if (router.canDismiss()) router.dismissAll();
    router.replace('/onboarding/welcome');
    useOnboardingState.getState().setDone(false);
  };
  if (!ask) {
    return (
      <Pressable accessibilityRole="button" accessibilityLabel="Reset all data" onPress={() => setAsk(true)} style={styles.resetBtn}>
        <Text style={styles.resetText}>Reset all data</Text>
      </Pressable>
    );
  }
  return (
    <View style={styles.confirm} accessibilityRole="alert" accessibilityLabel="Confirm reset">
      <Text style={styles.confirmText}>Delete every bed, thought and bloom? This can't be undone.</Text>
      {failed && <Text style={styles.errorText}>Couldn't reset. Try again.</Text>}
      <View style={styles.confirmRow}>
        <Pressable accessibilityRole="button" accessibilityLabel="Keep my garden" onPress={() => setAsk(false)} style={[styles.confirmBtn, styles.keepBtn]}>
          <Text style={[styles.confirmBtnText, { color: colors.ink }]}>Keep my garden</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Reset all data and delete everything" onPress={() => void doReset()} style={[styles.confirmBtn, styles.doBtn]}>
          <Text style={[styles.confirmBtnText, { color: '#FFFFFF' }]}>Reset</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function Settings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      testID="settings-scroll"
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      automaticallyAdjustKeyboardInsets
    >
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.backWrap}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
      </View>
      <Text style={styles.title} accessibilityRole="header">Settings</Text>
      <View style={[styles.block, { marginTop: 24 }]}>
        <ManageBeds />
      </View>
      <View style={[styles.block, { marginTop: 18 }]}>
        {REMINDERS_SUPPORTED ? <ReminderSection /> : <WebReminderNote />}
      </View>
      <View style={[styles.block, { marginTop: 18 }]}>
        <ListRows />
      </View>
      <Text style={styles.version}>Thought Garden v{Constants.expoConfig?.version ?? '1.0.0'}</Text>
      <View style={[styles.block, { marginTop: 22 }]}>
        <ResetBlock />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 60 },
  backWrap: { paddingHorizontal: 20 },
  back: {
    alignSelf: 'flex-start',
    height: 44,
    paddingHorizontal: 16,
    justifyContent: 'center',
    backgroundColor: colors.bg,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  backText: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink },
  title: { marginTop: 18, marginHorizontal: 20, fontFamily: fonts.titleXBold, fontSize: 44, lineHeight: 44, color: colors.ink },
  block: { marginHorizontal: 20 },
  card: { padding: 14, borderWidth: 2, borderColor: colors.ink, borderRadius: 22, backgroundColor: colors.bg },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  h2: { fontFamily: fonts.titleXBold, fontSize: 20, color: colors.ink },
  times: { flexDirection: 'row', gap: 8, marginTop: 12 },
  timeBtn: { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, borderWidth: 2, borderColor: colors.ink, borderRadius: 14 },
  timeBtnOn: { backgroundColor: '#DDF2D1' },
  timeText: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink },
  customRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44, gap: 12, marginTop: 6 },
  label: { flexShrink: 1, fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink },
  note: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  gap: { gap: 10, marginTop: 10 },
  listCard: { borderWidth: 2, borderColor: colors.ink, borderRadius: 22, overflow: 'hidden', backgroundColor: colors.bg },
  rowLine: { borderBottomWidth: 1.5, borderBottomColor: colors.line },
  listRow: { height: 60, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  rowTitle: { fontFamily: fonts.bodySemi, fontSize: 16, color: colors.ink },
  rowValue: { flexShrink: 1, fontFamily: fonts.body, fontSize: 14, color: colors.muted },
  panel: { paddingHorizontal: 16, paddingBottom: 14, gap: 10 },
  chips: { gap: 10, alignItems: 'flex-start' },
  version: { marginTop: 14, textAlign: 'center', fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  resetBtn: { height: 52, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, borderWidth: 2, borderColor: DANGER, borderRadius: 16 },
  resetText: { fontFamily: fonts.bodyBold, fontSize: 15, color: DANGER },
  confirm: { padding: 14, backgroundColor: '#FFF6F5', borderWidth: 2, borderColor: DANGER, borderRadius: 18 },
  confirmText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  errorText: { marginTop: 6, fontFamily: fonts.bodySemi, fontSize: 13, color: DANGER },
  confirmRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  confirmBtn: { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderRadius: 14 },
  keepBtn: { backgroundColor: colors.bg, borderColor: colors.ink },
  doBtn: { backgroundColor: DANGER, borderColor: DANGER },
  confirmBtnText: { fontFamily: fonts.bodyBold, fontSize: 14 },
});
