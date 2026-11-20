import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { format } from 'date-fns';
import { dayKey } from '@/domain/dates';
import { track } from '@/analytics/analytics';
import { MonthCalendar } from '@/features/garden/MonthCalendar';
import { WeekStrip } from '@/features/garden/WeekStrip';
import { useActivity } from '@/features/garden/useActivity';
import { colors, fonts } from '@/ui/tokens';

export default function Garden() {
  const router = useRouter();
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month0: now.getMonth() });
  const { states, week, reload } = useActivity(cursor.year, cursor.month0);

  useFocusEffect(
    useCallback(() => {
      track('garden_viewed', {});
      void reload();
    }, [reload]),
  );

  const shift = (delta: number) => {
    const d = new Date(cursor.year, cursor.month0 + delta, 1);
    setCursor({ year: d.getFullYear(), month0: d.getMonth() });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <WeekStrip blooms={week.blooms} waters={week.waters} />
      <View style={styles.header}>
        <Pressable onPress={() => shift(-1)} accessibilityRole="button" accessibilityLabel="Previous month" style={styles.arrow}>
          <Text style={styles.arrowText}>‹</Text>
        </Pressable>
        <Text style={styles.title}>{format(new Date(cursor.year, cursor.month0, 1), 'MMMM yyyy')}</Text>
        <Pressable onPress={() => shift(1)} accessibilityRole="button" accessibilityLabel="Next month" style={styles.arrow}>
          <Text style={styles.arrowText}>›</Text>
        </Pressable>
      </View>
      <MonthCalendar
        year={cursor.year}
        month0={cursor.month0}
        states={states}
        todayKey={dayKey(new Date())}
        onDayPress={(key) => router.push({ pathname: '/garden/[date]', params: { date: key } })}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 16, paddingTop: 64, paddingBottom: 120 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  title: { fontFamily: fonts.titleXBold, fontSize: 24, color: colors.ink },
  arrow: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  arrowText: { fontFamily: fonts.titleBold, fontSize: 28, color: colors.ink },
});
