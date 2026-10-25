import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

// 静态渲染（web 首屏）时先返回 light，客户端水合后再用系统的真实值。
// 用 useSyncExternalStore 拿「是否已水合」，不用在 effect 里 setState，
// 也就不会触发级联渲染（react-hooks/set-state-in-effect 规则）。
const subscribe = () => () => { };

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const colorScheme = useRNColorScheme();

  return hydrated ? colorScheme : 'light';
}
