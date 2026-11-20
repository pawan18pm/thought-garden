import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import type { Bed, Plant } from '@/domain/types';
import { track } from '@/analytics/analytics';
import { useGarden, useRepos } from '@/store/AppProvider';
import { PlantArt } from '@/ui/PlantArt';
import { bedColors, colors, flowerColors, fonts } from '@/ui/tokens';

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

type SectionKey = keyof Detail;
const SECTIONS: { key: SectionKey; title: string; shadow: string }[] = [
  { key: 'bloomed', title: 'Bloomed', shadow: colors.pink },
  { key: 'watered', title: 'Watered', shadow: colors.ink },
  { key: 'planted', title: 'Planted', shadow: colors.ink },
];

function SectionIcon({ kind }: { kind: SectionKey }) {
  const sw = { stroke: colors.ink, strokeWidth: 1.6 };
  if (kind === 'bloomed') {
    return (
      <Svg width={22} height={22} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Circle cx={12} cy={6} r={4} fill={colors.pink} {...sw} />
        <Circle cx={18} cy={12} r={4} fill={colors.pink} {...sw} />
        <Circle cx={6} cy={12} r={4} fill={colors.pink} {...sw} />
        <Circle cx={12} cy={18} r={4} fill={colors.pink} {...sw} />
        <Circle cx={12} cy={12} r={3} fill="#FFD84D" {...sw} />
      </Svg>
    );
  }
  if (kind === 'watered') {
    return (
      <Svg width={20} height={20} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Path d="M12 3 C12 3 5 11 5 15 a7 7 0 0 0 14 0 C19 11 12 3 12 3 Z" fill={flowerColors.blue} stroke={colors.ink} strokeWidth={1.8} />
      </Svg>
    );
  }
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Ellipse cx={12} cy={15} rx={6} ry={5} fill={colors.seed} stroke={colors.ink} strokeWidth={1.8} />
    </Svg>
  );
}

function tagColor(bed: Bed | undefined): string {
  return !bed || bed.color === 'ideas' ? colors.ideasBed : bedColors[bed.color];
}

function summary(d: Detail): string {
  const parts: string[] = [];
  if (d.bloomed.length) parts.push(`${d.bloomed.length} bloomed`);
  if (d.watered.length) parts.push(`${d.watered.length} watered`);
  if (d.planted.length) parts.push(`${d.planted.length} planted`);
  return parts.join(' · ');
}

export default function DayDetail() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const parsed = parseKey(date);
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  const title = parsed ? format(parsed, 'EEE, d MMM') : 'Day';
  const loaded = !parsed || detail !== null;
  const visible = parsed && detail ? SECTIONS.filter((s) => detail[s.key].length > 0) : [];
  const tileStage = detail && detail.bloomed.length ? 'bloom' : detail && detail.watered.length ? 'watered' : detail && detail.planted.length ? 'seed' : null;
  const earliestBloom = detail?.bloomed.reduce<Plant | undefined>(
    (min, p) => (!min || (p.bloomedAt ?? '') < (min.bloomedAt ?? '') ? p : min),
    undefined,
  );
  const firstBloomBed = earliestBloom ? beds.find((b) => b.id === earliestBloom.bedId) : undefined;
  const tileFlower = flowerColors[(firstBloomBed?.color ?? 'pink') as keyof typeof flowerColors];

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Back to Garden"
        style={styles.back}
      >
        <Text style={styles.backText}>‹ Garden</Text>
      </Pressable>
      <View style={styles.headRow}>
        <View style={styles.dayTile}>
          {tileStage && <PlantArt stage={tileStage} size={52} flowerColor={tileFlower} />}
          <View style={styles.dayStrip} />
        </View>
        <View style={styles.headText}>
          <Text style={styles.title}>{title}</Text>
          {detail && visible.length > 0 && <Text style={styles.summary}>{summary(detail)}</Text>}
        </View>
      </View>
      <View style={styles.sections}>
        {loaded && visible.length === 0 && <Text style={styles.empty}>Nothing happened this day. That's okay.</Text>}
        {visible.map((s) => (
          <View key={s.key} style={[styles.shadow, { shadowColor: s.shadow }]}>
            <View style={styles.card} testID={`section-${s.key}`} accessibilityLabel={s.title}>
              <View style={styles.cardHead}>
                <SectionIcon kind={s.key} />
                <Text style={styles.cardTitle}>{s.title}</Text>
              </View>
              {detail![s.key].map((p) => {
                const bed = beds.find((b) => b.id === p.bedId);
                return (
                  <View key={p.id} style={styles.item}>
                    <View style={[styles.tag, { backgroundColor: tagColor(bed) }]}>
                      <Text style={styles.tagText} numberOfLines={1}>
                        {bed?.name ?? 'Ideas'}
                      </Text>
                    </View>
                    <Text style={styles.text}>{p.text}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  back: {
    alignSelf: 'flex-start',
    height: 44,
    paddingHorizontal: 16,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 999,
    shadowColor: colors.ink,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  backText: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 16 },
  dayTile: {
    width: 72,
    height: 80,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  dayStrip: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 12, backgroundColor: colors.soil, borderTopWidth: 2, borderTopColor: colors.ink },
  headText: { flex: 1 },
  title: { fontFamily: fonts.titleXBold, fontSize: 36, lineHeight: 38, letterSpacing: -0.7, color: colors.ink },
  summary: { fontFamily: fonts.body, fontSize: 14, color: colors.muted, marginTop: 4 },
  sections: { gap: 16, paddingTop: 22 },
  empty: { fontFamily: fonts.body, fontSize: 16, color: colors.muted, textAlign: 'center', marginTop: 20 },
  shadow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  card: { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: colors.ink, borderRadius: 22, paddingVertical: 14, paddingHorizontal: 16 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  cardTitle: { fontFamily: fonts.titleBold, fontSize: 20, color: colors.ink },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 32, marginBottom: 8 },
  tag: { maxWidth: 120, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 2, borderColor: colors.ink, borderRadius: 8 },
  tagText: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.ink },
  text: { flex: 1, fontFamily: fonts.body, fontSize: 15, color: colors.ink },
});
