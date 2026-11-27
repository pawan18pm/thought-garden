import React from 'react';
import { Keyboard, Platform, Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { OnboardingScreen } from '../OnboardingScreen';

jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn() }) }));
jest.mock('@/ui/useReducedMotion', () => ({ useReducedMotion: () => true }));
jest.mock('@/analytics/analytics', () => ({ track: jest.fn() }));

const realOS = Platform.OS;
const setOS = (os: string) => Object.defineProperty(Platform, 'OS', { value: os, configurable: true });

afterEach(() => {
  setOS(realOS);
  jest.restoreAllMocks();
});

const renderScreen = () =>
  render(
    <OnboardingScreen step="first_plant" title="Plant your first thought">
      <Text>inside the body</Text>
    </OnboardingScreen>,
  );

describe('OnboardingScreen tap-outside keyboard dismiss', () => {
  it('dismisses the keyboard on a body tap on native', async () => {
    setOS('ios');
    const dismiss = jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {});
    await renderScreen();
    await fireEvent.press(screen.getByText('inside the body'));
    expect(dismiss).toHaveBeenCalled();
  });

  // Regression: on web a click inside a TextInput bubbled to this handler and
  // Keyboard.dismiss blurred the field, so nothing could be typed.
  it('does not dismiss (blur) on a body click on web', async () => {
    setOS('web');
    const dismiss = jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {});
    await renderScreen();
    await fireEvent.press(screen.getByText('inside the body'));
    expect(dismiss).not.toHaveBeenCalled();
  });
});
