import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { format } from 'date-fns';
import type { DayState } from '@/domain/dayState';
import { monthGrid } from '@/domain/dates';
import { colors, fonts } from '@/ui/tokens';
import { DayStateIcon } from './DayStateIcon';

interface Props {
  year: number;
  month0: number;
  states: Record<string, DayState>;
  todayKey: string;
  onDayPress: (key: string) => void;
}

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function MonthCalendar({ year, month0, states, todayKey, onDayPress }: Props) {
  const cells = monthGrid(year, month0);
  const rows: (string | null)[][] = [];
  for (let i = 0; i < 42; i += 7) rows.push(cells.slice(i, i + 7));
  return (
    <View>
      <View style={styles.row}>
        {WEEKDAYS.map((d, i) => (
          <Text key={i} style={styles.weekday}>
            {d}
          </Text>
        ))}
      </View>
      {rows.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((key, c) => {
            if (!key) return <View key={`pad-${r}-${c}`} testID={`cell-pad-${r}-${c}`} style={styles.cell} />;
            const state = states[key] ?? 'empty';
            const isToday = key === todayKey;
            const future = key > todayKey;
            const [y, m, d] = key.split('-').map(Number);
            const label = `${format(new Date(y, m - 1, d), 'MMMM d')}, ${state}`;
            return (
              <Pressable
                key={key}
                testID={`cell-${key}`}
                disabled={future}
                onPress={() => onDayPress(key)}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityState={{ selected: isToday, disabled: future }}
                style={[styles.cell, isToday && styles.today, future && styles.future]}
              >
                <Text style={styles.num}>{d}</Text>
                <DayStateIcon state={state} testID={`day-${key}-${state}`} />
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center', fontFamily: fonts.bodySemi, fontSize: 13, color: colors.muted, paddingBottom: 6 },
  cell: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 2, borderColor: 'transparent' },
  today: { borderColor: colors.leaf },
  future: { opacity: 0.4 },
  num: { fontFamily: fonts.body, fontSize: 12, color: colors.ink },
});
