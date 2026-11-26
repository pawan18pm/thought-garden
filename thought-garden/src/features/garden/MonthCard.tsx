import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { format } from 'date-fns';
import { PlantArt } from '@/ui/PlantArt';
import { border, colors, fonts } from '@/ui/tokens';
import { MonthCalendar, type MonthCalendarProps } from './MonthCalendar';
import type { MonthSummary } from './useActivity';

interface Props extends MonthCalendarProps {
  summary: MonthSummary;
  daysTended: number;
  onShift: (delta: number) => void;
  /** Rendered under the legend, inside the card (the day dropdown). */
  children?: React.ReactNode;
}

export function monthLine(summary: MonthSummary, daysTended: number): string {
  const lead =
    summary.bloomed > 0 ? 'Your garden is blooming.' : daysTended > 0 ? 'Nice start.' : 'Your garden starts today. Plant something.';
  return daysTended > 0 ? `${lead} ${daysTended} ${daysTended === 1 ? 'day' : 'days'} tended this month.` : lead;
}

export function MonthCard({ summary, daysTended, onShift, children, ...calendar }: Props) {
  const title = format(new Date(calendar.year, calendar.month0, 1), 'MMMM yyyy');
  return (
    <View style={styles.wrap} accessibilityLabel={title}>
      <View style={styles.shadow} />
      <View style={styles.card}>
        <View style={styles.head}>
          <Pressable onPress={() => onShift(-1)} accessibilityRole="button" accessibilityLabel="Previous month" style={styles.arrow}>
            <Text style={styles.arrowText}>‹</Text>
          </Pressable>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          <Pressable onPress={() => onShift(1)} accessibilityRole="button" accessibilityLabel="Next month" style={styles.arrow}>
            <Text style={styles.arrowText}>›</Text>
          </Pressable>
        </View>
        <View style={styles.chips}>
          <View style={[styles.chip, { backgroundColor: '#FFEFF4' }]}>
            <PlantArt stage="bloom" size={18} />
            <Text style={styles.chipText}>{`${summary.bloomed} bloomed`}</Text>
          </View>
          <View style={[styles.chip, { backgroundColor: '#EEF4FF' }]}>
            <PlantArt stage="watered" size={18} />
            <Text style={styles.chipText}>{`${summary.watered} watered`}</Text>
          </View>
          <View style={[styles.chip, { backgroundColor: '#F3F9EE' }]}>
            <PlantArt stage="seed" size={18} />
            <Text style={styles.chipText}>{`${summary.planted} planted`}</Text>
          </View>
        </View>
        <Text style={styles.line}>{monthLine(summary, daysTended)}</Text>
        <MonthCalendar {...calendar} />
        {children}
      </View>
    </View>
  );
}

const softShadow = {
  shadowColor: '#000',
  shadowOpacity: 0.1,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 2 },
  elevation: 3,
} as const;

const styles = StyleSheet.create({
  wrap: { marginHorizontal: 20, marginTop: 26, marginBottom: 6 },
  shadow: { position: 'absolute', left: 0, right: 0, top: 6, bottom: -6, backgroundColor: '#8ACB72', borderRadius: 24 },
  card: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: colors.bg,
    borderWidth: border,
    borderColor: colors.ink,
    borderRadius: 24,
  },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: fonts.titleXBold, fontSize: 22, color: colors.ink },
  arrow: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, borderRadius: 999, ...softShadow },
  arrowText: { fontFamily: fonts.bodyBold, fontSize: 20, color: colors.ink },
  chips: { flexDirection: 'row', gap: 6, marginTop: 12 },
  chip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, height: 36, borderRadius: 12 },
  chipText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink },
  line: { marginTop: 8, marginHorizontal: 2, fontFamily: fonts.bodySemi, fontSize: 13, color: '#2E6B30' },
});
