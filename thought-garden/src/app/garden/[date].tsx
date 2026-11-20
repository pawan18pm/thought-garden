import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { format } from 'date-fns';
import type { Bed, Plant } from '@/domain/types';
import { track } from '@/analytics/analytics';
import { useGarden, useRepos } from '@/store/AppProvider';
import { bedColors, colors, fonts } from '@/ui/tokens';

interface Detail {
  bloomed: Plant[];
  watered: Plant[];
  planted: Plant[];
}

function parseKey(raw: unknown): Date | null {
  if (typeof raw !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const [y, m, d] = raw.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d ? date : null;
}

const SECTIONS: { key: keyof Detail; title: string }[] = [
  { key: 'bloomed', title: '🌸 Bloomed' },
  { key: 'watered', title: '💧 Watered' },
  { key: 'planted', title: '🌱 Planted' },
];

function dotColor(bed: Bed | undefined): string {
  return !bed || bed.color === 'ideas' ? colors.ideasBed : bedColors[bed.color];
}

export default function DayDetail() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const parsed = parseKey(date);
  const { activity } = useRepos();
  const beds = useGarden((s) => s.beds);
  const [detail, setDetail] = useState<Detail | null>(null);

  useEffect(() => {
    track('day_opened', {});
  }, []);

  useEffect(() => {
    if (!parsed) return;
    let cancelled = false;
    activity.detail(date).then(
      (d) => {
        if (!cancelled) setDetail(d);
      },
      (e) => console.error('Failed to load day detail', e),
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const title = parsed ? format(parsed, 'EEE, MMM d') : 'Day';
  const loaded = !parsed || detail !== null;
  const visible = parsed && detail ? SECTIONS.filter((s) => detail[s.key].length > 0) : [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ headerShown: true, title, headerBackTitle: 'Garden' }} />
      {loaded && visible.length === 0 && <Text style={styles.empty}>Nothing happened this day — that's okay 🌿</Text>}
      {visible.map((s) => (
        <View key={s.key} style={styles.section}>
          <Text style={styles.sectionTitle}>{s.title}</Text>
          {detail![s.key].map((p) => (
            <View key={p.id} style={styles.item}>
              <View style={[styles.dot, { backgroundColor: dotColor(beds.find((b) => b.id === p.bedId)) }]} />
              <Text style={styles.text}>{p.text}</Text>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 16 },
  empty: { fontFamily: fonts.body, fontSize: 16, color: colors.muted, textAlign: 'center', marginTop: 40 },
  section: { marginBottom: 20 },
  sectionTitle: { fontFamily: fonts.titleBold, fontSize: 20, color: colors.ink, marginBottom: 8 },
  item: { flexDirection: 'row', alignItems: 'center', minHeight: 40, gap: 10 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: colors.ink },
  text: { flex: 1, fontFamily: fonts.body, fontSize: 15, color: colors.ink },
});
