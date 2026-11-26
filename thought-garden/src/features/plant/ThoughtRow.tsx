import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import type { Bed, Plant } from '@/domain/types';
import { canBloomNow, stageOf } from '@/domain/stages';
import { PlantArt } from '@/ui/PlantArt';
import { PressableScale } from '@/ui/PressableScale';
import { bedColors, colors, flowerColors, fonts } from '@/ui/tokens';
import { WaterDrops } from './WaterDrops';

interface Props {
  plant: Plant;
  bed: Bed;
  onWater: () => void;
  onBloom: () => void;
  onPress: () => void;
  /** Just planted / watered / bloomed: a soft tint flashes and fades out. The screen clears it. */
  highlight?: boolean;
}

export const FLASH_MS = 1200;

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
  const tint = bedColors[bed.color as keyof typeof bedColors] ?? '#FFF3F6';
  const flash = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!highlight) return;
    flash.setValue(1);
    const anim = Animated.timing(flash, {
      toValue: 0,
      duration: FLASH_MS,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    });
    anim.start();
    return () => {
      anim.stop();
      flash.setValue(0);
    };
  }, [highlight, flash]);

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
      }}
    >
      {highlight ? (
        <Animated.View
          testID="row-flash"
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { borderRadius: 12, backgroundColor: tint, opacity: flash }]}
        />
      ) : null}
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
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={`Water ${title}`}
            pressScale={0.94}
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
          </PressableScale>
          {canBloomNow(plant) && (
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={`Bloom ${title} now`}
              pressScale={0.92}
              onPress={onBloom}
              style={[btn, { width: 44, backgroundColor: bedColors.pink }]}
            >
              <Svg width={22} height={22} viewBox="0 0 24 24">
                {[[12, 6], [18, 12], [6, 12], [12, 18]].map(([cx, cy]) => (
                  <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={4} fill="#F28AA8" stroke={colors.ink} strokeWidth={1.6} />
                ))}
                <Circle cx={12} cy={12} r={3} fill="#FFD84D" stroke={colors.ink} strokeWidth={1.6} />
              </Svg>
            </PressableScale>
          )}
        </>
      )}
    </View>
  );
}
