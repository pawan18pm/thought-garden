import React from 'react';
import { act, render, screen } from '@testing-library/react-native';
import TabsLayout from '../(tabs)/_layout';
import { useOnboardingState } from '@/store/onboardingState';

jest.mock('expo-router', () => {
  const { Text: T } = require('react-native');
  const Tabs = () => <T>tabs</T>;
  Tabs.Screen = () => null;
  return { Tabs, Redirect: ({ href }: { href: string }) => <T>{`redirect:${href}`}</T> };
});
jest.mock('@/ui/PillTabBar', () => ({ PillTabBar: () => null }));

describe('Tabs layout guard', () => {
  it('shows the tabs once onboarding is done', async () => {
    useOnboardingState.setState({ done: true });
    await render(<TabsLayout />);
    expect(screen.getByText('tabs')).toBeTruthy();
  });

  it('sends a reset (not onboarded) user back to welcome, e.g. on back after Reset', async () => {
    useOnboardingState.setState({ done: true });
    await render(<TabsLayout />);
    await act(async () => useOnboardingState.getState().setDone(false));
    expect(screen.getByText('redirect:/onboarding/welcome')).toBeTruthy();
    expect(screen.queryByText('tabs')).toBeNull();
  });
});
