import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { format } from 'date-fns';
import type { Bed, Plant } from '@/domain/types';
import type { DayActivity } from '@/domain/dayGroups';
import { dayKey } from '@/domain/dates';
import { stageOf } from '@/domain/stages';
import { PlantArt } from '@/ui/PlantArt';
import { bedColors, colors, flowerColors, fonts } from '@/ui/tokens';

interface Props {
  dateKey: string;
  /** Defaults to the real today. */
  todayKey?: string;
  /** Output of groupDay: each plant once, in its furthest group. */
  groups: DayActivity;
  beds: Bed[];
  onClose: () => void;
}

type GroupKey = keyof DayActivity;

const SECTIONS: { key: GroupKey; label: string; dot: string }[] = [
  { key: 'bloomed', label: 'Bloomed', dot: flowerColors.pink },
  { key: 'watered', label: 'Watered', dot: flowerColors.blue },
  { key: 'planted', label: 'Planted', dot: flowerColors.green },
];

const COUNTS: { key: GroupKey; bg: string }[] = [
  { key: 'planted', bg: '#F3F9EE' },
  { key: 'watered', bg: '#EEF4FF' },
  { key: 'bloomed', bg: '#FFEFF4' },
];

export function dayTitle(key: string, todayKey: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return `${key === todayKey ? 'Today · ' : ''}${format(new Date(y, m - 1, d), 'EEEE, d MMMM')}`;
}

function Item({ plant, bed }: { plant: Plant; bed: Bed | undefined }) {
  const color = bed?.color ?? 'ideas';
  const tint = color === 'ideas' ? colors.ideasBed : bedColors[color];
  return (
    <View style={styles.item}>
      <PlantArt stage={stageOf(plant)} size={32} flowerColor={flowerColors[color]} />
      <Text style={styles.itemTitle} numberOfLines={2}>
        {plant.text}
      </Text>
      <View style={[styles.tag, { backgroundColor: tint }]}>
        <Text style={styles.tagText} numberOfLines={1}>
          {bed?.name ?? 'Ideas'}
        </Text>
      </View>
    </View>
  );
}

export function DayDropdown({ dateKey, todayKey = dayKey(new Date()), groups, beds, onClose }: Props) {
  const title = dayTitle(dateKey, todayKey);
  const visible = SECTIONS.filter((s) => groups[s.key].length > 0);
  return (
    <View style={styles.wrap} accessibilityRole="summary" accessibilityLabel={title}>
      <View style={styles.shadow} />
      <View style={styles.card}>
        <View style={styles.head}>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Close day" onPress={onClose} style={styles.close}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>
        {visible.length === 0 ? (
          <Text style={styles.quiet}>Nothing happened this day. That's okay.</Text>
        ) : (
          <>
            <View style={styles.counts}>
              {COUNTS.map((c) => (
                <View key={c.key} testID={`count-${c.key}`} style={[styles.count, { backgroundColor: c.bg }]}>
                  <Text style={styles.countNum}>{groups[c.key].length}</Text>
                  <Text style={styles.countLabel}>{c.key}</Text>
                </View>
              ))}
            </View>
            {visible.map((s) => (
              <View key={s.key} style={styles.section}>
                <View style={styles.sectionHead}>
                  <View style={[styles.dot, { backgroundColor: s.dot }]} />
                  <Text style={styles.sectionTitle}>{`${s.label} (${groups[s.key].length})`}</Text>
                </View>
                {groups[s.key].map((p) => (
                  <Item key={p.id} plant={p} bed={beds.find((b) => b.id === p.bedId)} />
                ))}
              </View>
            ))}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 16, marginBottom: 5 },
  shadow: { position: 'absolute', left: 0, right: 0, top: 5, bottom: -5, backgroundColor: '#8ACB72', borderRadius: 22 },
  card: { padding: 16, backgroundColor: colors.bg, borderWidth: 2, borderColor: colors.ink, borderRadius: 22 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontFamily: fonts.titleXBold, fontSize: 20, color: colors.ink },
  close: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  closeText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  quiet: { marginTop: 8, fontFamily: fonts.body, fontSize: 15, color: colors.muted },
  counts: { flexDirection: 'row', gap: 8, marginTop: 10 },
  count: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 14 },
  countNum: { fontFamily: fonts.titleXBold, fontSize: 26, lineHeight: 28, color: colors.ink },
  countLabel: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.ink },
  section: { marginTop: 14 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  dot: { width: 10, height: 10, borderRadius: 999, borderWidth: 1.5, borderColor: colors.ink },
  sectionTitle: { fontFamily: fonts.titleXBold, fontSize: 16, color: colors.ink },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.line,
  },
  itemTitle: { flex: 1, minWidth: 0, fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink },
  tag: { maxWidth: 120, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1.5, borderColor: colors.ink, borderRadius: 8 },
  tagText: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.ink },
});
