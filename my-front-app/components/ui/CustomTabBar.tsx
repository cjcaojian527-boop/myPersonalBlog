import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';
import { Pressable, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const toPath = (route: { name: string, key: string }, isFocused: boolean): void => {
        const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
        });
        if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
        }
    }



    return (<ThemedView style={styles.bar}>
        {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];   // 这个 tab 的配置
            const isFocused = state.index === index;

            return (<Pressable style={styles.item} key={route.key} onPress={() => toPath(route, isFocused)}>
                <ThemedText style={[styles.barText, { color: isFocused ? theme.tabIconSelected : theme.tabIconDefault, fontSize: isFocused ? 20 : 18 }]} >{options.title}</ThemedText>
            </Pressable>)
        })}
    </ThemedView>)

}

const styles = StyleSheet.create({
    bar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    item: {
        flex: 1,               // ← 关键：我要占一份
        alignItems: 'center',  // 内容水平居中
        justifyContent: 'center', // 内容垂直居中
        height: 50,
    },

    barText: {
        fontSize: 18,
        lineHeight: 32,

    },
});
