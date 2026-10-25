import { StyleSheet, Pressable, View, ScrollView, Alert, Image } from 'react-native';
import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, Paths } from 'expo-file-system';
import { toast } from 'sonner-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { publicStyles } from '@/utils/const';
import { postRequest } from '@/utils/api';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useAuthStore } from '@/store';

// 只清这些 key，登录态 auth-store 和 SecureStore 里的密钥绝不碰
const CACHE_KEY_PREFIX = 'message_read_';

/** 字节数 → 人类可读的大小 */
const formatBytes = (bytes: number): string => {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

/** 统计能清掉的那部分缓存：消息已读记录 + 应用缓存目录 */
const getCacheSize = async (): Promise<number> => {
  let total = 0;

  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
    if (cacheKeys.length) {
      const pairs = await AsyncStorage.multiGet(cacheKeys);
      pairs.forEach(([, value]) => {
        // AsyncStorage 用 UTF-16 存字符串，一个字符约 2 字节
        if (value) total += value.length * 2;
      });
    }
  } catch (error) {
    console.warn('统计本地记录失败：', error);
  }

  try {
    const cacheDir = new Directory(Paths.cache);
    if (cacheDir.exists) total += cacheDir.size ?? 0;
  } catch (error) {
    console.warn('统计缓存目录失败：', error);
  }

  return total;
};

/**
 * 清理缓存：
 *   1. AsyncStorage 里的消息已读记录（白名单前缀，登录态不动）
 *   2. Paths.cache 下的临时文件和图片缓存（逐个删，保留目录本身）
 * 登录态和 SecureStore 密钥都不碰，清完不用重新登录。
 */
const clearAppCache = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
    if (cacheKeys.length) await AsyncStorage.multiRemove(cacheKeys);
  } catch (error) {
    console.warn('清理本地记录失败：', error);
  }

  try {
    const entries = Paths.cache.exists ? Paths.cache.list() : [];
    entries.forEach(entry => {
      try {
        entry.delete();
      } catch (error) {
        // 某个文件正被系统占用时删不掉，跳过就好，不影响其它缓存
        console.warn('删除缓存项失败：', error);
      }
    });
  } catch (error) {
    console.warn('读取缓存目录失败：', error);
  }
};

// 设置项先占位，后面接功能时只改这一张表和对应的 onPress
const SETTING_ROWS = [
  { key: 'notify', icon: 'bell', label: '通知设置' },
  { key: 'cache', icon: 'refresh', label: '清理缓存' },
  { key: 'about', icon: 'info', label: '关于我们' },
] as const;

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const TouristsAuth = useAuthStore(state => state.TouristsAuth);

  const lineColor = colorScheme === 'light' ? '#ececec' : '#2a2a30';
  const version = Constants.expoConfig?.version ?? '1.0.0';

  // 缓存大小：进页面算一次，清理完再算一次
  const [cacheSize, set_cacheSize] = useState<number>(0);
  const [cacheSizeLoaded, set_cacheSizeLoaded] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    // 放进定时器避开「effect 内同步 setState」的规则，也不挡首屏渲染
    const timer = setTimeout(async () => {
      const size = await getCacheSize();
      if (cancelled) return;
      set_cacheSize(size);
      set_cacheSizeLoaded(true);
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  const onRowPress = (row: (typeof SETTING_ROWS)[number]) => {
    if (row.key === 'about') {
      router.push('/about');
      return;
    }

    if (row.key === 'cache') {
      Alert.alert(
        '清理缓存',
        `将清除消息已读记录和临时文件${cacheSizeLoaded ? `（约 ${formatBytes(cacheSize)}）` : ''}，不会退出登录。`,
        [
          { text: '取消', style: 'cancel' },
          {
            text: '清理',
            style: 'destructive',
            onPress: async () => {
              await clearAppCache();
              const size = await getCacheSize();
              set_cacheSize(size);
              toast.success('提示', {
                description: '缓存已清理',
                duration: 1500,
                position: 'top-center',
              });
            },
          },
        ],
      );
      return;
    }

    toast.info('提示', {
      description: `${row.label}正在开发中`,
      duration: 1200,
      position: 'top-center',
    });
  };

  /**
   * 注销账号
   * 后端 destroyUser 要求 body 里的 id / nickName / email 三者
   * 与 token 里的游客信息完全一致，所以这里直接从登录态取，不让用户填。
   * 注销不可逆：成功后立刻清掉本地登录态，回到「我的」页（自动切回登录表单）。
   */
  const onDestroyAccount = () => {
    const { id, nickName, email } = TouristsAuth || {};
    if (!id) {
      toast.info('提示', {
        description: '当前未登录',
        duration: 1200,
        position: 'top-center',
      });
      return;
    }

    Alert.alert(
      '注销账号',
      '注销后账号与相关数据将无法恢复，你的评论会保留但不再关联到该账号。确定要继续吗？',
      [
        { text: '再想想', style: 'cancel' },
        {
          text: '确认注销',
          style: 'destructive',
          onPress: async () => {
            const toastId = toast.loading('正在注销…', { position: 'top-center' });
            try {
              const resp = await postRequest('/api/touristsAuth/destroyUser', {
                id,
                nickName,
                email,
              });

              if (resp?.code === 0) {
                // 服务端已删除，本地登录态必须同步清掉，否则重启后还会显示"已登录"
                useAuthStore.setState({ TouristsToken: '', TouristsAuth: {} });
                toast.success('账号已注销', {
                  id: toastId,
                  description: '感谢曾经的陪伴',
                  duration: 1600,
                  position: 'top-center',
                });
                // 回到「我的」页，此时 store 已空，会自动渲染成登录表单
                router.back();
              } else {
                toast.error('注销失败', {
                  id: toastId,
                  description: resp?.message || '请稍后重试',
                  duration: 2000,
                  position: 'top-center',
                });
              }
            } catch (error) {
              console.warn('注销账号失败：', error);
              toast.error('注销失败', {
                id: toastId,
                description: '网络异常，请检查连接后重试',
                duration: 2000,
                position: 'top-center',
              });
            }
          },
        },
      ],
    );
  };

  return (
    <ThemedView style={[publicStyles.flex_1, { paddingTop: insets.top, backgroundColor: theme.home_bg_color }]}>
      {/* 顶栏：返回 + 标题 + 右侧等宽占位，保证标题严格居中 */}
      <View style={[styles.header, { borderBottomColor: lineColor }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <SimpleLineIcons name="arrow-left" size={22} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>设置</ThemedText>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 账号信息：只读，改资料以后单独做编辑页 */}
        <ThemedText style={[styles.sectionTitle, { color: theme.tabIconDefault }]}>账号</ThemedText>
        <ThemedView
          lightColor="#ffffff"
          darkColor="#26262e"
          style={[styles.card, colorScheme === 'light' && styles.cardShadow]}
        >
          <View style={styles.infoRow}>
            <ThemedText style={[styles.infoLabel, { color: theme.tabIconDefault }]}>昵称</ThemedText>
            <ThemedText style={styles.infoValue} numberOfLines={1}>
              {TouristsAuth.nickName || '未登录'}
            </ThemedText>
          </View>
          <View style={[styles.divider, { backgroundColor: lineColor }]} />
          <View style={styles.infoRow}>
            <ThemedText style={[styles.infoLabel, { color: theme.tabIconDefault }]}>邮箱</ThemedText>
            <ThemedText style={styles.infoValue} numberOfLines={1}>
              {TouristsAuth.email || '—'}
            </ThemedText>
          </View>
        </ThemedView>

        {/* 注销账号：不可逆操作，单独一行、单独颜色，不混进普通设置列表 */}
        {TouristsAuth?.id ? (
          <Pressable
            style={({ pressed }) => [styles.destroyBtn, pressed && styles.destroyPressed]}
            onPress={onDestroyAccount}
            accessibilityRole="button"
            accessibilityLabel="注销账号"
          >
            <ThemedText style={styles.destroyText}>注销账号</ThemedText>
          </Pressable>
        ) : null}

        {/* 通用设置：先把位置占住，功能随后接 */}
        <ThemedText style={[styles.sectionTitle, { color: theme.tabIconDefault }]}>通用</ThemedText>
        <ThemedView
          lightColor="#ffffff"
          darkColor="#26262e"
          style={[styles.card, colorScheme === 'light' && styles.cardShadow]}
        >
          {SETTING_ROWS.map((row, index) => (
            <View key={row.key}>
              {index > 0 && <View style={[styles.divider, { backgroundColor: lineColor }]} />}
              <Pressable
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                onPress={() => onRowPress(row)}
              >
                <SimpleLineIcons name={row.icon} size={18} color={theme.tabIconDefault} />
                <ThemedText style={styles.rowLabel}>{row.label}</ThemedText>
                <ThemedText style={[styles.rowHint, { color: theme.tabIconDefault }]}>
                  {row.key === 'cache'
                    ? (cacheSizeLoaded ? formatBytes(cacheSize) : '计算中…')
                    : row.key === 'about'
                      ? `V${version}`
                      : '即将上线'}
                </ThemedText>
                <SimpleLineIcons name="arrow-right" size={14} color={theme.tabIconDefault} />
              </Pressable>
            </View>
          ))}
        </ThemedView>

        {/* 页脚：小 logo + 版本号，比纯文字更有品牌感 */}
        <View style={styles.footerRow}>
          <Image
            source={require('../assets/images/logo-small.png')}
            style={styles.footerLogo}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
          <ThemedText style={[styles.footerText, { color: theme.tabIconDefault }]}>
            大藍本 V{version}
          </ThemedText>
        </View>
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
    paddingTop: 24,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  // 卡片：浅色下浮一点阴影，深色下保持干净
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  infoLabel: {
    fontSize: 14,
    lineHeight: 20,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'right',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  rowPressed: {
    opacity: 0.55,     // 按下变淡，给手指一个回声
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
  // 注销账号：居中的红色文字按钮，视觉上与上方卡片明确分开
  destroyBtn: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: -8,
    marginBottom: 20,
  },
  destroyPressed: {
    opacity: 0.55,
  },
  destroyText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#E5484D',
  },
  // 页脚：小 logo + 版本号，整体居中
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  footerLogo: {
    width: 20,
    height: 20,
    borderRadius: 6,     // 方形 logo 收个圆角，像小型 App 图标
  },
  footerText: {
    fontSize: 12,
    lineHeight: 16,
  },
});
