import React from 'react';
import { render } from '@testing-library/react-native';
import { PlantArt } from '@/ui/PlantArt';

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: { View },
    useSharedValue: (v: number) => ({ value: v }),
    useAnimatedStyle: (fn: () => object) => fn(),
    withRepeat: (v: unknown) => v,
    withTiming: (v: unknown) => v,
    cancelAnimation: () => {},
    Easing: { linear: (t: number) => t },
  };
});

describe('PlantArt soil option', () => {
  it('draws the soil mound by default and omits it when soil={false}', async () => {
    // Seed art = soil mound ellipse + seed ellipse; bare = seed ellipse only.
    const ellipses = (node: unknown): number => {
      if (!node || typeof node !== 'object') return 0;
      const n = node as { type?: string; children?: unknown[] | null };
      return (n.type === 'RNSVGEllipse' ? 1 : 0) + (n.children ?? []).reduce<number>((t, c) => t + ellipses(c), 0);
    };
    const withSoil = await render(<PlantArt stage="seed" />);
    expect(ellipses(withSoil.toJSON())).toBe(2);
    const bare = await render(<PlantArt stage="seed" soil={false} />);
    expect(ellipses(bare.toJSON())).toBe(1);
  });
});
