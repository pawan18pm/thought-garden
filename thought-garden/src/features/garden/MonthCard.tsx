import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { format } from 'date-fns';
import { PlantArt } from '@/ui/PlantArt';
import { border, colors, fonts } from '@/ui/tokens';
import { MonthCalendar, type MonthCalendarProps } from './MonthCalendar';
import type { MonthSummary } from './useActivity';

interface Props extends MonthCalendarProps {
  summary: MonthSummary;
  onShift: (delta: number) => void;
  /** Rendered under the legend, inside the card (the day dropdown). */
  children?: React.ReactNode;
}

export function MonthCard({ summary, onShift, children, ...calendar }: Props) {
  const title = format(new Date(calendar.year, calendar.month0, 1), 'MMMM yyyy');
  return (
    <View style={styles.wrap} accessibilityLabel={title}>
      <View style={styles.shadow} />
      <View style={styles.card}>
        <View style={styles.head}>
          <Pressable onPress={() => onShift(-1)} accessibilityRole="button" accessibilityLabel="Previous month" style={styles.arrow}>
            <Text style={styles.arrowText}>‹</Text>
          </Pressable>
          <View style={styles.titleGroup}>
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
            {summary.bloomed > 0 && (
              <View style={styles.badge} accessibilityLabel={`${summary.bloomed} ${summary.bloomed === 1 ? 'bloom' : 'blooms'} this month`}>
                <PlantArt stage="bloom" size={18} soil={false} />
                <Text style={styles.badgeText}>{summary.bloomed}</Text>
              </View>
            )}
          </View>
          <Pressable onPress={() => onShift(1)} accessibilityRole="button" accessibilityLabel="Next month" style={styles.arrow}>
            <Text style={styles.arrowText}>›</Text>
          </Pressable>
        </View>
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
  titleGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 28, paddingHorizontal: 8, borderRadius: 999, backgroundColor: '#FFEFF4' },
  badgeText: { fontFamily: fonts.titleXBold, fontSize: 14, color: colors.ink },
});
