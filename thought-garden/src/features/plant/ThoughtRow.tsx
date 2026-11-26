import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import type { Bed, Plant } from '@/domain/types';
import { canBloomNow, stageOf } from '@/domain/stages';
import { PlantArt } from '@/ui/PlantArt';
import { bedColors, colors, flowerColors, fonts } from '@/ui/tokens';
import { WaterDrops } from './WaterDrops';

interface Props {
  plant: Plant;
  bed: Bed;
  onWater: () => void;
  onBloom: () => void;
  onPress: () => void;
  highlight?: boolean;
}

const btn = {
  height: 44,
  alignItems: 'center',
  justifyContent: 'center',
  borderWidth: 2,
  borderColor: colors.ink,
  borderRadius: 14,
  borderBottomWidth: 5,
} as const;

export function ThoughtRow({ plant, bed, onWater, onBloom, onPress, highlight }: Props) {
  const bloomed = !!plant.bloomedAt;
  const title = plant.text;
  const bloomColor = flowerColors[bed.color] ?? flowerColors.ideas;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 68,
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderBottomWidth: 1.5,
        borderBottomColor: colors.line,
        borderRadius: 12,
        backgroundColor: highlight ? bedColors[bed.color as keyof typeof bedColors] ?? colors.paper : 'transparent',
      }}
    >
      <PlantArt stage={stageOf(plant)} size={44} flowerColor={bloomColor} />
      <Pressable onPress={onPress} style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={{ fontFamily: fonts.bodySemi, fontSize: 17, lineHeight: 21, color: colors.ink }}
        >
          {title}
        </Text>
        {bloomed ? (
          <View
            style={{
              alignSelf: 'flex-start',
              marginTop: 5,
              paddingVertical: 2,
              paddingHorizontal: 8,
              backgroundColor: '#FFD9E4',
              borderRadius: 999,
            }}
          >
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 12, color: '#8A2448' }}>Bloomed</Text>
          </View>
        ) : (
          <WaterDrops count={plant.waterCount} />
        )}
      </Pressable>
      {!bloomed && (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Water ${title}`}
            onPress={onWater}
            style={[btn, { flexDirection: 'row', gap: 5, paddingHorizontal: 12, backgroundColor: bedColors.blue }]}
          >
            <Svg width={13} height={16} viewBox="0 0 24 28">
              <Path
                d="M12 2 C12 2 3 12 3 18 a9 9 0 0 0 18 0 C21 12 12 2 12 2 Z"
                fill="#7FA8E8"
                stroke={colors.ink}
                strokeWidth={2.4}
              />
            </Svg>
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink }}>Water</Text>
          </Pressable>
          {canBloomNow(plant) && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Bloom ${title} now`}
              onPress={onBloom}
              style={[btn, { width: 44, backgroundColor: bedColors.pink }]}
            >
              <Svg width={22} height={22} viewBox="0 0 24 24">
                {[[12, 6], [18, 12], [6, 12], [12, 18]].map(([cx, cy]) => (
                  <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={4} fill="#F28AA8" stroke={colors.ink} strokeWidth={1.6} />
                ))}
                <Circle cx={12} cy={12} r={3} fill="#FFD84D" stroke={colors.ink} strokeWidth={1.6} />
              </Svg>
            </Pressable>
          )}
        </>
      )}
    </View>
  );
}
