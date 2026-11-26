import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import PlantTab from '../../../app/(tabs)/plant';
import { bedA, bedB, ideas, mkPlant } from '../__fixtures__/fixtures';
import type { Plant } from '@/domain/types';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('../PlantDetailSheet', () => ({ PlantDetailSheet: () => null }));

const state: Record<string, unknown> = {};
jest.mock('@/store/AppProvider', () => ({
  useGarden: (sel: (s: unknown) => unknown) => sel(state),
}));

const fns = {
  plant: jest.fn(),
  water: jest.fn(),
  bloom: jest.fn(),
  addBed: jest.fn(),
  renameBed: jest.fn(),
  recolorBed: jest.fn(),
  removeBed: jest.fn(),
};

const setPlants = (plants: Plant[]) =>
  Object.assign(state, { plants, plantsInBed: (id: string) => plants.filter((p) => p.bedId === id) });

beforeEach(() => {
  Object.values(fns).forEach((f) => f.mockReset().mockResolvedValue(undefined));
  fns.plant.mockResolvedValue({ id: 'new', bedId: 'bB' });
  mockPush.mockReset();
  Object.assign(state, { beds: [bedA, bedB, ideas], bloomedToday: [], ...fns });
  setPlants([mkPlant()]);
});

const input = () => screen.getByLabelText("What's on your mind?");
const plantBtn = () => screen.getByLabelText('Plant');

describe('Plant tab', () => {
  it('shows the summary and gear opens settings', async () => {
    await render(<PlantTab />);
    expect(screen.getByText('1 growing · 0 bloomed')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Settings'));
    expect(mockPush).toHaveBeenCalledWith('/settings');
  });

  it('Plant is disabled when the text is empty', async () => {
    await render(<PlantTab />);
    expect(plantBtn().props.accessibilityState.disabled).toBe(true);
    await fireEvent.changeText(input(), '   ');
    expect(plantBtn().props.accessibilityState.disabled).toBe(true);
    await fireEvent.press(plantBtn());
    expect(fns.plant).not.toHaveBeenCalled();
    expect(screen.getByText('Into Interview')).toBeTruthy();
  });

  it('typing + Plant plants into the selected bed and confirms', async () => {
    await render(<PlantTab />);
    await fireEvent.press(screen.getByLabelText('Plant into DSA'));
    expect(screen.getByText('Into DSA')).toBeTruthy();
    await fireEvent.changeText(input(), 'Two pointers');
    await fireEvent.press(plantBtn());
    expect(fns.plant).toHaveBeenCalledWith('Two pointers', 'bB', null, 'fab');
    expect(screen.getByText('Planted in DSA')).toBeTruthy();
    expect(input().props.value).toBe('');
  });

  it('Enter submits', async () => {
    await render(<PlantTab />);
    await fireEvent.changeText(input(), 'Learn graphs');
    await fireEvent(input(), 'submitEditing');
    expect(fns.plant).toHaveBeenCalledWith('Learn graphs', 'bA', null, 'fab');
  });

  it('empty soil selects that bed in the box', async () => {
    await render(<PlantTab />);
    await fireEvent.press(screen.getByLabelText('Empty soil · plant a thought here in DSA'));
    expect(screen.getByText('Planting into DSA')).toBeTruthy();
    expect(screen.getByLabelText('Plant into DSA').props.accessibilityState.selected).toBe(true);
    await fireEvent.changeText(input(), 'Heaps');
    expect(screen.getByText('Into DSA')).toBeTruthy();
  });

  it('chips offer user beds only, never Ideas', async () => {
    setPlants([mkPlant({ id: 'p2', bedId: 'bI', text: 'Side idea' })]);
    await render(<PlantTab />);
    expect(screen.getByLabelText('Plant into Interview')).toBeTruthy();
    expect(screen.getByLabelText('Plant into DSA')).toBeTruthy();
    expect(screen.queryByLabelText('Plant into Ideas')).toBeNull();
  });

  it('caps the quick-plant input at 140 characters', async () => {
    await render(<PlantTab />);
    expect(input().props.maxLength).toBe(140);
  });

  it('hides the Ideas bed when it has no active plants', async () => {
    await render(<PlantTab />);
    expect(screen.queryByLabelText('Ideas bed')).toBeNull();
    expect(screen.getByLabelText('Interview bed')).toBeTruthy();
  });

  it('shows the Ideas bed when it has active plants', async () => {
    setPlants([mkPlant({ id: 'p2', bedId: 'bI', text: 'Side idea' })]);
    await render(<PlantTab />);
    expect(screen.getByLabelText('Ideas bed')).toBeTruthy();
    expect(screen.getByText('Side idea')).toBeTruthy();
  });

  it('Edit beds shows rename inputs and Done', async () => {
    await render(<PlantTab />);
    expect(screen.queryAllByLabelText('Bed name')).toHaveLength(0);
    await fireEvent.press(screen.getByText('Edit beds'));
    expect(screen.getAllByLabelText('Bed name')).toHaveLength(2);
    expect(screen.getByText('Done')).toBeTruthy();
    expect(screen.getByText('+ Add a bed')).toBeTruthy();
  });

  it('renaming commits on end editing', async () => {
    await render(<PlantTab />);
    await fireEvent.press(screen.getByText('Edit beds'));
    const [first] = screen.getAllByLabelText('Bed name');
    await fireEvent.changeText(first, 'Interviews');
    await fireEvent(first, 'endEditing');
    expect(fns.renameBed).toHaveBeenCalledWith('bA', 'Interviews');
  });

  it('pressing Done saves a name still being typed', async () => {
    await render(<PlantTab />);
    await fireEvent.press(screen.getByText('Edit beds'));
    const [first] = screen.getAllByLabelText('Bed name');
    await fireEvent.changeText(first, 'Mock interviews');
    await fireEvent.press(screen.getByText('Done'));
    expect(fns.renameBed).toHaveBeenCalledTimes(1);
    expect(fns.renameBed).toHaveBeenCalledWith('bA', 'Mock interviews');
  });

  it('blur saves the name once even when Done follows', async () => {
    await render(<PlantTab />);
    await fireEvent.press(screen.getByText('Edit beds'));
    const [first] = screen.getAllByLabelText('Bed name');
    await fireEvent.changeText(first, 'Interviews');
    await fireEvent(first, 'blur');
    await fireEvent(first, 'endEditing');
    await fireEvent.press(screen.getByText('Done'));
    expect(fns.renameBed).toHaveBeenCalledTimes(1);
    expect(fns.renameBed).toHaveBeenCalledWith('bA', 'Interviews');
  });

  it('an empty or unchanged name is not saved', async () => {
    await render(<PlantTab />);
    await fireEvent.press(screen.getByText('Edit beds'));
    const [first, second] = screen.getAllByLabelText('Bed name');
    await fireEvent.changeText(first, '   ');
    await fireEvent.changeText(second, 'DSA');
    await fireEvent.press(screen.getByText('Done'));
    expect(fns.renameBed).not.toHaveBeenCalled();
  });

  it('hides ✕ when only one user bed remains', async () => {
    Object.assign(state, { beds: [bedA, ideas] });
    await render(<PlantTab />);
    await fireEvent.press(screen.getByText('Edit beds'));
    expect(screen.getAllByLabelText('Bed name')).toHaveLength(1);
    expect(screen.queryByLabelText('Remove Interview')).toBeNull();
  });

  it('removing a bed with thoughts asks first, Move moves them', async () => {
    await render(<PlantTab />);
    await fireEvent.press(screen.getByText('Edit beds'));
    await fireEvent.press(screen.getByLabelText('Remove Interview'));
    expect(fns.removeBed).not.toHaveBeenCalled();
    expect(screen.getByText('Interview has 1 thought. What should happen to them?')).toBeTruthy();
    await fireEvent.press(screen.getByText('Move them to DSA, remove bed'));
    expect(fns.removeBed).toHaveBeenCalledWith('bA', { moveTo: 'bB' });
  });

  it('Delete bed and its thoughts deletes them', async () => {
    await render(<PlantTab />);
    await fireEvent.press(screen.getByText('Edit beds'));
    await fireEvent.press(screen.getByLabelText('Remove Interview'));
    await fireEvent.press(screen.getByText('Delete bed and its thoughts'));
    expect(fns.removeBed).toHaveBeenCalledWith('bA', { deleteThoughts: true });
  });

  it('removing an empty bed removes it directly', async () => {
    await render(<PlantTab />);
    await fireEvent.press(screen.getByText('Edit beds'));
    await fireEvent.press(screen.getByLabelText('Remove DSA'));
    expect(fns.removeBed).toHaveBeenCalledWith('bB');
  });

  it('+ Add a bed adds a bed with the next free colour', async () => {
    await render(<PlantTab />);
    await fireEvent.press(screen.getByText('Edit beds'));
    await fireEvent.press(screen.getByText('+ Add a bed'));
    expect(fns.addBed).toHaveBeenCalledWith('New bed', 'purple');
  });

  it('watering flashes the row briefly, then the tint clears', async () => {
    jest.useFakeTimers();
    try {
      await render(<PlantTab />);
      expect(screen.queryByTestId('row-flash')).toBeNull();
      await fireEvent.press(screen.getByLabelText('Water Learn SQL'));
      expect(fns.water).toHaveBeenCalled();
      expect(screen.getByTestId('row-flash')).toBeTruthy();
      await act(async () => {
        jest.advanceTimersByTime(1400);
      });
      expect(screen.queryByTestId('row-flash')).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });
});
