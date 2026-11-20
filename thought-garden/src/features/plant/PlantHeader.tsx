import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import Svg, { Circle, Path } from 'react-native-svg';
import { greetingFor } from '@/domain/greeting';
import { colors, fonts } from '@/ui/tokens';

interface Props {
  hour: number;
  growing: number;
  bloomedToday: number;
}

const ink = colors.ink;
const hidden = { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' } as const;

function GreetingIcon({ day }: { day: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" {...hidden}>
      {day ? (
        <>
          <Circle cx={12} cy={12} r={5} fill="#FFD84D" stroke={ink} strokeWidth={2} />
          <Path
            d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"
            stroke={ink}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </>
      ) : (
        <Path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" fill="#FFD84D" stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      )}
    </Svg>
  );
}

function Gear() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={ink} strokeWidth={2} {...hidden}>
      <Circle cx={12} cy={12} r={3} />
      <Path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" />
    </Svg>
  );
}

function SproutIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" {...hidden}>
      <Path d="M12 22V11" stroke={ink} strokeWidth={2} />
      <Path d="M12 14c-4 0-6-3-6-6 4 0 6 3 6 6zM12 11c0-4 3-6 6-6 0 4-3 6-6 6z" fill={colors.leafLight} stroke={ink} strokeWidth={1.6} />
    </Svg>
  );
}

function BloomIcon() {
  const p = { fill: colors.pink, stroke: ink, strokeWidth: 1.6 };
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" {...hidden}>
      <Circle cx={12} cy={6} r={4} {...p} />
      <Circle cx={18} cy={12} r={4} {...p} />
      <Circle cx={6} cy={12} r={4} {...p} />
      <Circle cx={12} cy={18} r={4} {...p} />
      <Circle cx={12} cy={12} r={3} fill="#FFD84D" stroke={ink} strokeWidth={1.6} />
    </Svg>
  );
}

export function PlantHeader({ hour, growing, bloomedToday }: Props) {
  return (
    <View>
      <View style={styles.row}>
        <View style={styles.greetWrap}>
          <GreetingIcon day={hour >= 5 && hour <= 16} />
          <Text style={styles.greeting}>{greetingFor(hour)}</Text>
        </View>
        <Link href="/settings" asChild>
          <Pressable accessibilityRole="button" accessibilityLabel="Settings" style={styles.settings}>
            <Gear />
            <Text style={styles.settingsText}>Settings</Text>
          </Pressable>
        </Link>
      </View>
      <Text style={styles.title}>Plant</Text>
      <View style={styles.chips}>
        <View style={styles.chip}>
          <SproutIcon />
          <Text style={styles.chipText}>{growing} growing</Text>
        </View>
        <View style={styles.chip}>
          <BloomIcon />
          <Text style={styles.chipText}>{bloomedToday} bloomed today</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greetWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  greeting: { fontFamily: fonts.bodySemi, fontSize: 15, color: ink },
  settings: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: ink,
    borderRadius: 999,
    shadowColor: ink,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  settingsText: { fontFamily: fonts.bodySemi, fontSize: 14, color: ink },
  title: { fontFamily: fonts.titleXBold, fontSize: 44, lineHeight: 46, letterSpacing: -0.9, color: ink, marginTop: 10 },
  chips: { flexDirection: 'row', gap: 8, marginTop: 10, marginBottom: 18 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: ink,
    borderRadius: 999,
  },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 13, color: ink },
});
