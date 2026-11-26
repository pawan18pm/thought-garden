import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { PlantStake } from '@/ui/PlantStake';
import { BedCard, plantLabel } from '@/ui/BedCard';
import { PlantItButton } from '@/ui/PlantItButton';
import { PlantArt } from '@/ui/PlantArt';
import type { Bed, Plant } from '@/domain/types';

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

const bed: Bed = {
  id: 'b1',
  name: 'Interview',
  color: 'blue',
  position: 0,
  isIdeas: false,
  folded: false,
  createdAt: '2026-01-01T00:00:00Z',
};

const mk = (i: number): Plant => ({
  id: `p${i}`,
  bedId: 'b1',
  text: `Thought ${i}`,
  priority: null,
  createdAt: '2026-01-01T00:00:00Z',
  bloomedAt: null,
  waterCount: 0,
});

const noop = () => {};
const renderBed = (b: Bed, plants: Plant[]) =>
  render(<BedCard bed={b} plants={plants} onPlantPress={noop} onAddPress={noop} onToggleFold={noop} />);

describe('PlantStake', () => {
  it('prefixes ▲▲ for priority 3', async () => {
    await render(<PlantStake text="STAR answers" priority={3} />);
    expect(screen.getByText(/^▲▲ /)).toBeTruthy();
  });
  it('prefixes ▲ for priority 2', async () => {
    await render(<PlantStake text="Mock" priority={2} />);
    expect(screen.getByText('▲ Mock')).toBeTruthy();
  });
  it('has no triangle for null', async () => {
    await render(<PlantStake text="Case study" priority={null} />);
    expect(screen.getByText('Case study')).toBeTruthy();
    expect(screen.queryByText(/▲/)).toBeNull();
  });
});

describe('BedCard', () => {
  it('shows empty soil copy with no plants', async () => {
    await renderBed(bed, []);
    expect(screen.getByText('Empty soil · plant your first thought here')).toBeTruthy();
  });
  it('hides stakes when folded', async () => {
    await renderBed({ ...bed, folded: true }, [mk(1), mk(2)]);
    expect(screen.queryByText('Thought 1')).toBeNull();
    expect(screen.getByText('2 plants')).toBeTruthy();
  });
  it('pluralizes the header', async () => {
    await renderBed(bed, [mk(1), mk(2), mk(3)]);
    expect(screen.getByText('3 plants')).toBeTruthy();
    expect(screen.getByText('Thought 3')).toBeTruthy();
  });
  it('says 1 plant for one', async () => {
    await renderBed(bed, [mk(1)]);
    expect(screen.getByText('1 plant')).toBeTruthy();
  });
});

describe('PlantItButton', () => {
  it('has the accessibility label', async () => {
    await render(<PlantItButton onPress={noop} />);
    expect(screen.getByLabelText('Plant a thought')).toBeTruthy();
  });
});

describe('plantLabel', () => {
  it('includes priority and stage', () => {
    expect(plantLabel({ ...mk(1), text: 'Learn SQL', priority: 3, waterCount: 3 })).toBe('High priority: Learn SQL, growing');
    expect(plantLabel({ ...mk(1), text: 'Mock', priority: 2 })).toBe('Medium priority: Mock, seed');
    expect(plantLabel({ ...mk(1), text: 'Case', priority: null, bloomedAt: '2026-01-02T00:00:00Z' })).toBe('Case, bloom');
  });
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
