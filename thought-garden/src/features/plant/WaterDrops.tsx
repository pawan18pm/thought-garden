import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '@/ui/tokens';

export function WaterDrops({ count }: { count: number }) {
  const n = Math.max(0, Math.min(count, 3));
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${n} of 3 waters`}
      style={{ flexDirection: 'row', gap: 5, marginTop: 5 }}
    >
      {[0, 1, 2].map((i) => (
        <Svg key={i} width={14} height={17} viewBox="0 0 24 28">
          <Path
            d="M12 2 C12 2 3 12 3 18 a9 9 0 0 0 18 0 C21 12 12 2 12 2 Z"
            fill={i < n ? '#7FA8E8' : '#FFFFFF'}
            stroke={colors.ink}
            strokeWidth={2.2}
          />
        </Svg>
      ))}
    </View>
  );
}
