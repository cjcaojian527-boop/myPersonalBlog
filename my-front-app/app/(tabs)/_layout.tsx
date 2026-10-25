import { Tabs } from 'expo-router';

import CustomTabBar from '@/components/ui/CustomTabBar'

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {/* CustomTabBar 只渲染文字，不需要 tabBarIcon */}
      <Tabs.Screen name="index" options={{ title: '首页' }} />
      <Tabs.Screen name="explore" options={{ title: '消息' }} />
      <Tabs.Screen name="myspace" options={{ title: '我' }} />
    </Tabs>
  );
}
