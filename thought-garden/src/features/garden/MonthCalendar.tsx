import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { format } from 'date-fns';
import { monthGrid } from '@/domain/dates';
import { PlantArt } from '@/ui/PlantArt';
import { colors, fonts } from '@/ui/tokens';
import { SoilTile } from './SoilTile';
import type { DayCell } from './useActivity';

export interface MonthCalendarProps {
  year: number;
  month0: number;
  cells: Record<string, DayCell>;
  todayKey: string;
  selectedKey: string | null;
  onDayPress: (key: string) => void;
}

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function labelFor(key: string, cell: DayCell | undefined, isToday: boolean): string {
  const [y, m, d] = key.split('-').map(Number);
  const state = cell?.state ?? 'empty';
  return `${format(new Date(y, m - 1, d), 'MMMM d')}${isToday ? ', today' : ''}${state === 'empty' ? '' : `, ${state}`}`;
}

/** Weekday header, soil-tile grid and legend. Past days and today are pressable; future days are not. */
export function MonthCalendar({ year, month0, cells, todayKey, selectedKey, onDayPress }: MonthCalendarProps) {
  const grid = monthGrid(year, month0);
  const rows: (string | null)[][] = [];
  for (let i = 0; i < 42; i += 7) {
    const row = grid.slice(i, i + 7);
    if (row.some(Boolean)) rows.push(row);
  }
  return (
    <View>
      <View style={[styles.row, { marginTop: 12 }]}>
        {WEEKDAYS.map((d, i) => (
          <Text key={i} style={styles.weekday}>
            {d}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {rows.map((row, r) => (
          <View key={r} style={styles.row}>
            {row.map((key, c) => {
              if (!key) return <View key={`pad-${r}-${c}`} style={styles.cell} />;
              const cell = cells[key];
              const isToday = key === todayKey;
              const future = key > todayKey;
              const selected = key === selectedKey;
              const dayNum = Number(key.slice(8));
              const tile = (
                <SoilTile dateKey={key} cell={cell} dayNum={dayNum} isToday={isToday} future={future} selected={selected} />
              );
              if (future) {
                return (
                  <View key={key} testID={`cell-${key}`} style={styles.cell}>
                    {tile}
                  </View>
                );
              }
              return (
                <Pressable
                  key={key}
                  testID={`cell-${key}`}
                  onPress={() => onDayPress(key)}
                  accessibilityRole="button"
                  accessibilityLabel={labelFor(key, cell, isToday)}
                  accessibilityState={{ expanded: selected }}
                  style={styles.cell}
                >
                  {tile}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
      <View style={styles.legend}>
        <View style={[styles.legendItem, { gap: 4 }]}>
          <View style={styles.legendSoil} />
          <Text style={styles.legendText}>Rest day</Text>
        </View>
        <View style={styles.legendItem}>
          <PlantArt stage="seed" size={18} soil={false} />
          <Text style={styles.legendText}>Planted</Text>
        </View>
        <View style={styles.legendItem}>
          <PlantArt stage="watered" size={18} soil={false} />
          <Text style={styles.legendText}>Watered</Text>
        </View>
        <View style={styles.legendItem}>
          <PlantArt stage="bloom" size={18} soil={false} />
          <Text style={styles.legendText}>Bloomed</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 5 },
  grid: { gap: 5, marginTop: 6 },
  weekday: { flex: 1, textAlign: 'center', fontFamily: fonts.bodySemi, fontSize: 12, color: colors.muted },
  cell: { flex: 1 },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 10,
    paddingHorizontal: 8,
    borderTopWidth: 2,
    borderTopColor: colors.line,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  legendSoil: {
    width: 18,
    height: 7,
    backgroundColor: colors.restSoil,
    borderWidth: 1.5,
    borderColor: colors.restSoilLine,
    borderRadius: 3,
  },
  legendText: { fontFamily: fonts.bodySemi, fontSize: 12, color: '#4A463F' },
});
