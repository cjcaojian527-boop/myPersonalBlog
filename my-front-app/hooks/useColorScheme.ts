import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * RN 0.86 起 ColorSchemeName 多了一个 'unspecified'。
 * 原来的 `useColorScheme() ?? 'light'` 只挡得住 null/undefined，
 * 挡不住 'unspecified' —— 那会让 Colors['unspecified'] 变成 undefined，
 * 取 theme.background 时直接崩。这里统一收窄成 'light' | 'dark'。
 */
export function useColorScheme(): 'light' | 'dark' {
  return useRNColorScheme() === 'dark' ? 'dark' : 'light';
}
