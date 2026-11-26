import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { LogoRow } from '@/ui/Logo';

describe('LogoRow', () => {
  it('renders the app name', async () => {
    await render(<LogoRow onSettings={() => {}} />);
    expect(screen.getByText('Thought Garden')).toBeTruthy();
  });
  it('calls onSettings when Settings is pressed', async () => {
    const onSettings = jest.fn();
    await render(<LogoRow onSettings={onSettings} />);
    await fireEvent.press(screen.getByLabelText('Settings'));
    expect(onSettings).toHaveBeenCalledTimes(1);
  });
});
