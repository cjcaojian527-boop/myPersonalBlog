import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { Toaster } from 'sonner-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // 窗口根视图默认是白色的，页面转场（尤其侧滑返回）时会在两屏之间露出来。
  // 跟随明暗模式把它改成 App 的背景色，暗黑模式下就不再闪白
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(Colors[colorScheme].background).catch(() => {
      // 个别平台不支持时忽略，不能因为设背景色失败影响渲染
    });
  }, [colorScheme]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    // sonner-native 内部拿 GestureDetector 做滑动关闭，祖先节点上必须有这个根容器，
    // 否则报 "GestureDetector must be used as a descendant of GestureHandlerRootView"。
    // 它得包在最外层（要能盖住 Stack 和 Toaster 两边），style 给 flex:1 撑满屏幕
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors[colorScheme].background }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        {/* contentStyle 让转场中的每一屏容器也是 App 背景色，
            和根视图一起兜住，任何一帧都不会露白 */}
        <Stack screenOptions={{ contentStyle: { backgroundColor: Colors[colorScheme].background } }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="search" options={{
            headerShown: false,
            animation: 'slide_from_right'
          }} />
          <Stack.Screen name="articlePreview" options={{
            headerShown: false,
            animation: 'slide_from_right'
          }} />
          <Stack.Screen name="settings" options={{
            headerShown: false,
            animation: 'slide_from_right'
          }} />
          <Stack.Screen name="about" options={{
            headerShown: false,
            animation: 'slide_from_right'
          }} />
          <Stack.Screen name="legal" options={{
            headerShown: false,
            animation: 'slide_from_right'
          }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <Toaster />
        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
