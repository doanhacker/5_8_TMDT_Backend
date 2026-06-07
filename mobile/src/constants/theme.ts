/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#111827',
    background: '#fcfcfc',
    backgroundElement: '#ffffff',
    backgroundSelected: '#fef2f2', // red-50
    textSecondary: '#6b7280',
    primary: '#dc2626', // red-600
    secondary: '#ef4444', // red-500
    accent: '#b91c1c', // red-700
    danger: '#e53935',
    success: '#10b981',
    border: '#fca5a5', // red-300
    white: '#ffffff',
  },
  dark: {
    text: '#ffffff',
    background: '#450a0a', // red-950
    backgroundElement: '#7f1d1d', // red-900
    backgroundSelected: '#991b1b', // red-800
    textSecondary: '#fca5a5', // red-300
    primary: '#fef2f2', // red-50
    secondary: '#f87171', // red-400
    accent: '#ef4444', // red-500
    danger: '#f87171',
    success: '#34d399',
    border: '#991b1b', // red-800
    white: '#ffffff',
  },
} as const;

export const Gradients = {
  hero: ['#7f1d1d', '#dc2626', '#ef4444'], // red-900 to red-500
  heroDark: ['#450a0a', '#7f1d1d', '#991b1b'], // red-950 to red-800
  accent: ['#dc2626', '#ef4444'],
  accentDark: ['#b91c1c', '#dc2626'],
  card: ['#ffffff', '#fef2f2'],
  cardDark: ['#7f1d1d', '#450a0a'],
};

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  pill: 9999,
};

export const Shadows = {
  light: {
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  medium: {
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 6,
  },
};

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
