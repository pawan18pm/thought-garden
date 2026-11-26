import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ThoughtRow } from '../ThoughtRow';
import { bedA, mkPlant } from '../__fixtures__/fixtures';

const setup = async (over = {}, handlers: Partial<Record<'onWater' | 'onBloom' | 'onPress', () => void>> = {}) => {
  const h = { onWater: jest.fn(), onBloom: jest.fn(), onPress: jest.fn(), ...handlers };
  await render(<ThoughtRow plant={mkPlant(over)} bed={bedA} {...h} />);
  return h;
};

describe('ThoughtRow', () => {
  it('seed shows Water but no bloom button', async () => {
    await setup();
    expect(screen.getByLabelText('Water Learn SQL')).toBeTruthy();
    expect(screen.queryByLabelText('Bloom Learn SQL now')).toBeNull();
  });

  it('1 water shows both buttons', async () => {
    await setup({ waterCount: 1 });
    expect(screen.getByLabelText('Water Learn SQL')).toBeTruthy();
    expect(screen.getByLabelText('Bloom Learn SQL now')).toBeTruthy();
  });

  it('drops label reflects count', async () => {
    await setup({ waterCount: 2 });
    expect(screen.getByLabelText('2 of 3 waters')).toBeTruthy();
  });

  it('bloomed shows pill and no buttons', async () => {
    await setup({ waterCount: 3, bloomedAt: '2026-01-02T00:00:00Z' });
    expect(screen.getByText('Bloomed')).toBeTruthy();
    expect(screen.queryByLabelText('Water Learn SQL')).toBeNull();
    expect(screen.queryByLabelText('Bloom Learn SQL now')).toBeNull();
    expect(screen.queryByLabelText(/of 3 waters/)).toBeNull();
  });

  it('pressing calls handlers', async () => {
    const h = await setup({ waterCount: 1 });
    await fireEvent.press(screen.getByLabelText('Water Learn SQL'));
    await fireEvent.press(screen.getByLabelText('Bloom Learn SQL now'));
    await fireEvent.press(screen.getByText('Learn SQL'));
    expect(h.onWater).toHaveBeenCalledTimes(1);
    expect(h.onBloom).toHaveBeenCalledTimes(1);
    expect(h.onPress).toHaveBeenCalledTimes(1);
  });

  it('long title is one line', async () => {
    await setup({ text: 'x'.repeat(200) });
    expect(screen.getByText('x'.repeat(200)).props.numberOfLines).toBe(1);
  });
});
