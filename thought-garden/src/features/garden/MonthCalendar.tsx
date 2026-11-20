import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { format } from 'date-fns';
import { monthGrid } from '@/domain/dates';
import { PlantArt } from '@/ui/PlantArt';
import { colors, fonts } from '@/ui/tokens';
import { SoilTile } from './SoilTile';
import type { DayCell } from './useActivity';

interface Props {
  year: number;
  month0: number;
  cells: Record<string, DayCell>;
  todayKey: string;
  onDayPress: (key: string) => void;
  onShift: (delta: number) => void;
}

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function MonthCalendar({ year, month0, cells, todayKey, onDayPress, onShift }: Props) {
  const grid = monthGrid(year, month0);
  const rows: (string | null)[][] = [];
  for (let i = 0; i < 42; i += 7) rows.push(grid.slice(i, i + 7));
  return (
    <View style={styles.shadow}>
      <View style={styles.card}>
        <View style={styles.head}>
          <Pressable onPress={() => onShift(-1)} accessibilityRole="button" accessibilityLabel="Previous month" style={styles.arrow}>
            <Text style={styles.arrowText}>‹</Text>
          </Pressable>
          <Text style={styles.title}>{format(new Date(year, month0, 1), 'MMMM yyyy')}</Text>
          <Pressable onPress={() => onShift(1)} accessibilityRole="button" accessibilityLabel="Next month" style={styles.arrow}>
            <Text style={styles.arrowText}>›</Text>
          </Pressable>
        </View>
        <View style={[styles.row, { marginTop: 8 }]}>
          {WEEKDAYS.map((d, i) => (
            <Text key={i} style={styles.weekday}>
              {d}
            </Text>
          ))}
        </View>
        {rows.map((row, r) => (
          <View key={r} style={[styles.row, { marginTop: 4 }]}>
            {row.map((key, c) => {
              if (!key) return <View key={`pad-${r}-${c}`} testID={`cell-pad-${r}-${c}`} style={styles.cell} />;
              const cell = cells[key];
              const state = cell?.state ?? 'empty';
              const isToday = key === todayKey;
              const future = key > todayKey;
              const [y, m, d] = key.split('-').map(Number);
              return (
                <Pressable
                  key={key}
                  testID={`cell-${key}`}
                  disabled={future}
                  onPress={() => onDayPress(key)}
                  accessibilityRole="button"
                  accessibilityLabel={`${format(new Date(y, m - 1, d), 'MMMM d')}, ${state}`}
                  accessibilityState={{ selected: isToday, disabled: future }}
                  style={styles.cell}
                >
                  <SoilTile
                    size="month"
                    cell={cell}
                    dayNum={d}
                    isToday={isToday}
                    future={future}
                    artTestID={`day-${key}-${state}`}
                  />
                </Pressable>
              );
            })}
          </View>
        ))}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={styles.legendSoil} />
            <Text style={styles.legendText}>Nothing</Text>
          </View>
          <View style={styles.legendItem}>
            <PlantArt stage="seed" size={16} />
            <Text style={styles.legendText}>Planted</Text>
          </View>
          <View style={styles.legendItem}>
            <PlantArt stage="watered" size={16} />
            <Text style={styles.legendText}>Watered</Text>
          </View>
          <View style={styles.legendItem}>
            <PlantArt stage="bloom" size={16} />
            <Text style={styles.legendText}>Bloomed</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    marginTop: 16,
    shadowColor: colors.ink,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  card: { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: colors.ink, borderRadius: 22, paddingTop: 10, paddingHorizontal: 12, paddingBottom: 12 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: fonts.titleBold, fontSize: 20, color: colors.ink },
  arrow: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 999,
  },
  arrowText: { fontFamily: fonts.titleBold, fontSize: 20, color: colors.ink },
  row: { flexDirection: 'row', gap: 4 },
  weekday: { flex: 1, textAlign: 'center', fontFamily: fonts.bodySemi, fontSize: 11, color: colors.muted },
  cell: { flex: 1 },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    paddingHorizontal: 6,
    borderTopWidth: 2,
    borderTopColor: '#EFE7DA',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  legendSoil: { width: 14, height: 6, marginRight: 2, backgroundColor: colors.soil, borderWidth: 1.5, borderColor: colors.ink, borderRadius: 2 },
  legendText: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.ink },
});
