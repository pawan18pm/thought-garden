import React, { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { dayKey } from '@/domain/dates';
import { track } from '@/analytics/analytics';
import { MonthCalendar } from '@/features/garden/MonthCalendar';
import { WeekCard } from '@/features/garden/WeekCard';
import { useActivity } from '@/features/garden/useActivity';
import { colors, fonts } from '@/ui/tokens';

export default function Garden() {
  const router = useRouter();
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month0: now.getMonth() });
  const { cells, weekCells, week, reload } = useActivity(cursor.year, cursor.month0);

  // Focus handling has stable deps: it must not re-run when the month changes.
  const reloadRef = useRef(reload);
  reloadRef.current = reload;
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      track('garden_viewed', {});
      // The first load comes from useActivity's mount effect; later focuses refresh.
      if (firstFocus.current) firstFocus.current = false;
      else void reloadRef.current();
    }, []),
  );

  const shift = (delta: number) => {
    const d = new Date(cursor.year, cursor.month0 + delta, 1);
    setCursor({ year: d.getFullYear(), month0: d.getMonth() });
  };

  const todayKey = dayKey(new Date());
  const open = (key: string) => router.push({ pathname: '/garden/[date]', params: { date: key } });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title} accessibilityRole="header">
        Garden
      </Text>
      <Text style={styles.subtitle}>Every day you tended, growing.</Text>
      <WeekCard blooms={week.blooms} waters={week.waters} cells={weekCells} todayKey={todayKey} onDayPress={open} />
      <MonthCalendar
        year={cursor.year}
        month0={cursor.month0}
        cells={cells}
        todayKey={todayKey}
        onDayPress={open}
        onShift={shift}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 120 },
  title: { fontFamily: fonts.titleXBold, fontSize: 44, lineHeight: 46, letterSpacing: -0.9, color: colors.ink },
  subtitle: { fontFamily: fonts.body, fontSize: 14, color: colors.muted, marginTop: 4, marginBottom: 14 },
});
