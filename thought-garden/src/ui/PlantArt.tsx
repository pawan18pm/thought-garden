import React from 'react';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import type { Stage } from '@/domain/types';
import { colors } from '@/ui/tokens';

const DEFAULT_FLOWER = '#F28AA8';
const sw = { stroke: colors.ink, strokeWidth: 2 };
const PETALS: [number, number][] = [[36, 12], [45, 20], [27, 20], [41, 29], [31, 29]];

interface Props {
  stage: Stage;
  size?: number;
  flowerColor?: string;
}

export function PlantArt({ stage, size = 48, flowerColor = DEFAULT_FLOWER }: Props) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 72 72"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Ellipse cx={36} cy={64} rx={28} ry={6} fill={colors.soil} />
      {stage === 'seed' && <Ellipse cx={36} cy={58} rx={9} ry={6} fill={colors.seed} {...sw} />}
      {stage === 'watered' && (
        <>
          <Path d="M36 62 V44" stroke={colors.ink} strokeWidth={2.5} fill="none" />
          <Path d="M36 48 C28 48 24 42 25 37 C31 37 36 41 36 48 Z" fill={colors.leafLight} {...sw} />
          <Path d="M36 46 C44 46 48 40 47 35 C41 35 36 39 36 46 Z" fill={colors.leafLight} {...sw} />
        </>
      )}
      {stage === 'growing' && (
        <>
          <Path d="M36 62 V18" stroke={colors.ink} strokeWidth={2.5} fill="none" />
          <Path d="M36 52 C27 52 22 45 23 40 C30 40 36 44 36 52 Z" fill={colors.leaf} {...sw} />
          <Path d="M36 40 C45 40 50 33 49 28 C42 28 36 32 36 40 Z" fill={colors.leaf} {...sw} />
          <Path d="M36 28 C29 28 25 22 26 18 C32 18 36 21 36 28 Z" fill={colors.leafLight} {...sw} />
        </>
      )}
      {stage === 'bloom' && (
        <>
          <Path d="M36 62 V26" stroke={colors.ink} strokeWidth={2.5} fill="none" />
          <Path d="M36 50 C27 50 22 43 23 38 C30 38 36 42 36 50 Z" fill={colors.leaf} {...sw} />
          {PETALS.map(([cx, cy]) => (
            <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={7} fill={flowerColor} {...sw} />
          ))}
          <Circle cx={36} cy={22} r={5} fill="#FFD84D" {...sw} />
        </>
      )}
    </Svg>
  );
}
