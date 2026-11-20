import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import RootLayout from '../_layout';

const mockBootOnce = jest.fn();
jest.mock('@/store/boot', () => ({ bootOnce: () => mockBootOnce() }));
jest.mock('expo-router', () => ({ Stack: () => null }));
jest.mock('expo-font', () => ({ useFonts: () => [false, new Error('font')] }));
jest.mock('@expo-google-fonts/bricolage-grotesque', () => ({}));
jest.mock('@expo-google-fonts/inter', () => ({}));
jest.mock('react-native-gesture-handler', () => ({ GestureHandlerRootView: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('@/store/AppProvider', () => ({ AppProvider: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('@/notifications/useReminderLifecycle', () => ({ useReminderLifecycle: jest.fn() }));

describe('RootLayout', () => {
  it('renders despite a font error and offers Try again after boot failure', async () => {
    const err = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockBootOnce.mockRejectedValueOnce(new Error('boom'));
    mockBootOnce.mockResolvedValueOnce({ store: {}, repos: { settings: {} }, onboardingDone: false });
    await render(<RootLayout />);
    await waitFor(() => expect(screen.getByLabelText('Try again')).toBeTruthy());
    await fireEvent.press(screen.getByLabelText('Try again'));
    await waitFor(() => expect(screen.queryByLabelText('Try again')).toBeNull());
    expect(mockBootOnce).toHaveBeenCalledTimes(2);
    err.mockRestore();
  });
});
