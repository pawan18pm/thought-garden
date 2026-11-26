import React, { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { dayKey } from '@/domain/dates';
import { track } from '@/analytics/analytics';
import { useGarden } from '@/store/AppProvider';
import { LogoRow } from '@/ui/Logo';
import { DayDropdown } from '@/features/garden/DayDropdown';
import { MonthCard } from '@/features/garden/MonthCard';
import { NextUpCard } from '@/features/garden/NextUpCard';
import { monthBounds, useActivity, useDayDetail } from '@/features/garden/useActivity';
import { colors, fonts } from '@/ui/tokens';

export default function Garden() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const now = new Date();
  const todayKey = dayKey(now);
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month0: now.getMonth() });
  // Today's dropdown is open by default; tapping the open day closes it.
  const [selected, setSelected] = useState<string | null>(todayKey);
  const { cells, summary, reload } = useActivity(cursor.year, cursor.month0);
  const day = useDayDetail(selected);
  const plants = useGarden((s) => s.plants);
  const beds = useGarden((s) => s.beds);

  // Focus handling has stable deps: it must not re-run when the month changes.
  const reloadRef = useRef({ month: reload, day: day.reload });
  reloadRef.current = { month: reload, day: day.reload };
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      track('garden_viewed', {});
      // The first load comes from the hooks' mount effects; later focuses refresh.
      if (firstFocus.current) firstFocus.current = false;
      else {
        void reloadRef.current.month();
        void reloadRef.current.day();
      }
    }, []),
  );

  const shift = (delta: number) => {
    const d = new Date(cursor.year, cursor.month0 + delta, 1);
    setCursor({ year: d.getFullYear(), month0: d.getMonth() });
  };

  const pick = (key: string) => {
    if (key === selected) {
      setSelected(null);
      return;
    }
    setSelected(key);
    track('day_opened', {});
  };

  const thirsty = plants.filter((p) => !p.bloomedAt && p.waterCount < 2).length;
  const ready = plants.filter((p) => !p.bloomedAt && p.waterCount >= 2).length;

  const { startKey, endKey } = monthBounds(cursor.year, cursor.month0);
  const inMonth = (k: string) => k >= startKey && k <= endKey;
  // Shows the last loaded day until the newly tapped one arrives (no collapse between days).
  const shown = selected !== null && inMonth(selected) && day.loaded && inMonth(day.loaded.key) ? day.loaded : null;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <LogoRow onSettings={() => router.push('/settings')} />
        <Text style={styles.title} accessibilityRole="header">
          Garden
        </Text>
        <NextUpCard thirsty={thirsty} ready={ready} onPress={() => router.push('/(tabs)/plant')} />
        <MonthCard
          year={cursor.year}
          month0={cursor.month0}
          cells={cells}
          todayKey={todayKey}
          selectedKey={selected}
          onDayPress={pick}
          onShift={shift}
          summary={summary}
        >
          {shown && (
            <DayDropdown
              dateKey={shown.key}
              todayKey={todayKey}
              groups={shown.groups}
              beds={beds}
              onClose={() => setSelected(null)}
            />
          )}
        </MonthCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 140 },
  title: {
    marginTop: 18,
    marginHorizontal: 20,
    fontFamily: fonts.titleXBold,
    fontSize: 44,
    lineHeight: 44,
    letterSpacing: -0.9,
    color: colors.ink,
  },
});
