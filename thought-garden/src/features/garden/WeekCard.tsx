import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { addDays, format } from 'date-fns';
import { dayKey, weekRange } from '@/domain/dates';
import { colors, fonts } from '@/ui/tokens';
import { SoilTile } from './SoilTile';
import type { DayCell } from './useActivity';

interface Props {
  blooms: number;
  waters: number;
  cells: Record<string, DayCell>;
  todayKey: string;
  onDayPress: (key: string) => void;
}

const LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function parse(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function WeekCard({ blooms, waters, cells, todayKey, onDayPress }: Props) {
  const start = parse(weekRange(parse(todayKey)).startKey);
  const days = LETTERS.map((_, i) => dayKey(addDays(start, i)));
  return (
    <View style={styles.shadow}>
      <View style={styles.card} accessibilityLabel="This week">
        <View style={styles.head}>
          <Text style={styles.title}>This week</Text>
          <Text style={styles.stats}>{`${blooms} bloomed · ${waters} waters`}</Text>
        </View>
        <View style={styles.row}>
          {days.map((key, i) => {
            const cell = cells[key];
            const state = cell?.state ?? 'empty';
            const isToday = key === todayKey;
            const future = key > todayKey;
            return (
              <Pressable
                key={key}
                testID={`week-${key}`}
                disabled={future}
                onPress={() => onDayPress(key)}
                accessibilityRole="button"
                accessibilityLabel={`${format(parse(key), 'MMMM d')}, ${state}`}
                accessibilityState={{ selected: isToday, disabled: future }}
                style={styles.tilePress}
              >
                <SoilTile
                  size="week"
                  cell={cell}
                  isToday={isToday}
                  future={future}
                  label={isToday ? 'Today' : LETTERS[i]}
                  artTestID={`day-${key}-${state}`}
                />
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    shadowColor: colors.leaf,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  card: { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: colors.ink, borderRadius: 22, padding: 12 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: 4 },
  title: { fontFamily: fonts.titleBold, fontSize: 20, color: colors.ink },
  stats: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink },
  row: { flexDirection: 'row', gap: 5, marginTop: 10 },
  tilePress: { flex: 1 },
});
