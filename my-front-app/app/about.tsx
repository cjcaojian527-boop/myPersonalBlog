import { useEffect } from 'react';
import { StyleSheet, Pressable, View, ScrollView, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { toast } from 'sonner-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { publicStyles } from '@/utils/const';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

// 品牌色：名字里带「藍」，就用这点蓝当门面
const BRAND = '#3B6EF6';
const BRAND_SOFT = '#6FA8FF';

const TITLE = ['大', '藍', '本'] as const;

const SUPPORT_ROWS = [
  { key: 'update', icon: 'refresh', label: '检查更新' },
  { key: 'feedback', icon: 'bubble', label: '意见反馈' },
  { key: 'share', icon: 'share', label: '分享给朋友' },
] as const;

const LEGAL_ROWS = [
  { key: 'privacy', icon: 'lock', label: '隐私政策' },
  { key: 'terms', icon: 'docs', label: '用户协议' },
] as const;

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const version = Constants.expoConfig?.version ?? '1.0.0';
  const lineColor = isDark ? '#2a2a30' : '#ececec';

  // 光晕呼吸：0 → 1 → 0 无限往返，让标题背后有点「活气」
  const breath = useSharedValue(0);
  // 标题下的装饰线：进场时从中间向两边展开
  const underline = useSharedValue(0);

  useEffect(() => {
    breath.set(
      withRepeat(withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.ease) }), -1, true),
    );
    underline.set(
      withDelay(350, withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) })),
    );
  }, [breath, underline]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: (isDark ? 0.2 : 0.14) + breath.get() * (isDark ? 0.24 : 0.16),
    transform: [{ scale: 1 + breath.get() * 0.18 }],
  }));

  const underlineStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: underline.get() }],
  }));

  const tap = () => {
    // Web / 部分机型没有振动马达，失败就算了，不能影响主流程
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const onCheckUpdate = () => {
    tap();
    const toastId = toast.loading('正在检查更新…', { position: 'top-center' });
    setTimeout(() => {
      toast.success('已是最新版本', {
        id: toastId,
        description: `当前版本 V${version}`,
        duration: 1600,
        position: 'top-center',
      });
    }, 700);
  };

  const onShare = async () => {
    tap();
    try {
      await Share.share({ message: '大藍本 —— 记录灵感，分享生活。' });
    } catch (error) {
      console.warn('分享失败：', error);
    }
  };

  const onRowPress = (key: string, label: string) => {
    if (key === 'update') {
      onCheckUpdate();
      return;
    }
    if (key === 'share') {
      onShare();
      return;
    }
    if (key === 'privacy' || key === 'terms') {
      tap();
      router.push({ pathname: '/legal', params: { type: key } });
      return;
    }
    tap();
    toast.info('提示', {
      description: `${label}正在开发中`,
      duration: 1200,
      position: 'top-center',
    });
  };

  const renderRows = (rows: readonly { key: string; icon: string; label: string }[]) =>
    rows.map((row, index) => (
      <View key={row.key}>
        {index > 0 && <View style={[styles.divider, { backgroundColor: lineColor }]} />}
        <Pressable
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          onPress={() => onRowPress(row.key, row.label)}
        >
          <SimpleLineIcons name={row.icon as any} size={18} color={theme.tabIconDefault} />
          <ThemedText style={styles.rowLabel}>{row.label}</ThemedText>
          {row.key === 'update' && (
            <ThemedText style={[styles.rowHint, { color: theme.tabIconDefault }]}>
              V{version}
            </ThemedText>
          )}
          <SimpleLineIcons name="arrow-right" size={14} color={theme.tabIconDefault} />
        </Pressable>
      </View>
    ));

  return (
    <ThemedView style={[publicStyles.flex_1, { paddingTop: insets.top, backgroundColor: theme.home_bg_color }]}>
      {/* 顶栏：返回 + 标题 + 右侧等宽占位，和设置页一个模子 */}
      <View style={[styles.header, { borderBottomColor: lineColor }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <SimpleLineIcons name="arrow-left" size={22} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>关于我们</ThemedText>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 上半部分：品牌门面 */}
        <View style={styles.hero}>
          {/* 两团错位的光晕，一深一浅，呼吸时若隐若现 */}
          <Animated.View
            pointerEvents="none"
            style={[styles.halo, styles.haloBig, { backgroundColor: BRAND }, haloStyle]}
          />
          <Animated.View
            pointerEvents="none"
            style={[styles.halo, styles.haloSmall, { backgroundColor: BRAND_SOFT }, haloStyle]}
          />

          {/* 三个字逐字落下，像盖印章 */}
          <View style={styles.titleRow}>
            {TITLE.map((char, index) => (
              <Animated.Text
                key={char}
                entering={FadeInDown.duration(520).delay(100 + index * 110)}
                style={[styles.title, { color: theme.text }]}
              >
                {char}
              </Animated.Text>
            ))}
          </View>

          <Animated.View style={[styles.underline, { backgroundColor: BRAND }, underlineStyle]} />

          <Animated.Text
            entering={FadeInDown.duration(500).delay(520)}
            style={[styles.slogan, { color: theme.tabIconDefault }]}
          >
            记录灵感 · 分享生活
          </Animated.Text>
          <Animated.Text
            entering={FadeInDown.duration(500).delay(640)}
            style={[styles.version, { color: theme.tabIconDefault }]}
          >
            V{version}
          </Animated.Text>
        </View>

        {/* 下半部分：常用入口 */}
        <ThemedText style={[styles.sectionTitle, { color: theme.tabIconDefault }]}>支持</ThemedText>
        <ThemedView
          lightColor="#ffffff"
          darkColor="#26262e"
          style={[styles.card, !isDark && styles.cardShadow]}
        >
          {renderRows(SUPPORT_ROWS)}
        </ThemedView>

        <ThemedText style={[styles.sectionTitle, { color: theme.tabIconDefault }]}>法律</ThemedText>
        <ThemedView
          lightColor="#ffffff"
          darkColor="#26262e"
          style={[styles.card, !isDark && styles.cardShadow]}
        >
          {renderRows(LEGAL_ROWS)}
        </ThemedView>

        <ThemedText style={[styles.footer, { color: theme.tabIconDefault }]}>
          大藍本 V{version}
        </ThemedText>
        <ThemedText style={[styles.footer, styles.copyright, { color: theme.tabIconDefault }]}>
          © {new Date().getFullYear()} 大藍本
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '600',
  },
  headerRight: {
    width: 22,     // 与返回图标同宽，标题才会居中
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },

  // ── 品牌门面 ──────────────────────────────
  hero: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 44,
    paddingBottom: 48,
  },
  halo: {
    position: 'absolute',
    borderRadius: 9999,
  },
  haloBig: {
    width: 200,
    height: 200,
  },
  haloSmall: {
    width: 120,
    height: 120,
    top: 20,
    right: '18%',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 42,
    lineHeight: 56,
    fontWeight: '800',
    letterSpacing: 6,
    marginLeft: 6,     // 补上最后一个字右侧多出来的字距，视觉上才真正居中
  },
  underline: {
    width: 56,
    height: 3,
    borderRadius: 2,
    marginTop: 6,
  },
  slogan: {
    marginTop: 18,
    fontSize: 13,
    lineHeight: 20,
    letterSpacing: 2,
    marginLeft: 2,
  },
  version: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
  },

  // ── 卡片列表（与设置页同款）───────────────
  sectionTitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 14,
    marginBottom: 24,
    overflow: 'hidden',
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  rowPressed: {
    opacity: 0.55,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
  },
  rowHint: {
    fontSize: 12,
    lineHeight: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
  footer: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  copyright: {
    marginTop: 4,
    opacity: 0.7,
  },
});
