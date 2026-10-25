import { useState } from 'react';
import { StyleSheet, Pressable, View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Constants from 'expo-constants';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { publicStyles } from '@/utils/const';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { LEGAL_DOCS, type LegalLanguage } from '@/constants/legal';

/**
 * 隐私政策 / 用户协议 共用页（中英双语）
 *   /legal?type=privacy  隐私政策
 *   /legal?type=terms    用户协议（缺省也回落到隐私政策）
 *
 * 正文来自 constants/legal.ts，这里只管排版和语言切换：
 * 顶栏右侧按钮在「中 / EN」之间来回切，整页文案跟着换，滚动位置不动。
 */
export default function LegalScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];

  const version = Constants.expoConfig?.version ?? '1.0.0';
  const lineColor = colorScheme === 'light' ? '#ececec' : '#2a2a30';

  const { type } = useLocalSearchParams<{ type?: string }>();
  const [lang, set_lang] = useState<LegalLanguage>('zh');

  const doc = LEGAL_DOCS[type === 'terms' ? 'terms' : 'privacy'];
  const text = doc[lang];

  // 按钮上显示「另一种语言」：中文时写 EN，英文时写「中」，一眼就知道点了会变成什么
  const switchLabel = lang === 'zh' ? 'EN' : '中';
  const updatedLabel = lang === 'zh' ? '更新日期' : 'Updated';
  const effectiveLabel = lang === 'zh' ? '生效日期' : 'Effective';

  const switchLang = () => set_lang(lang === 'zh' ? 'en' : 'zh');

  return (
    <ThemedView style={[publicStyles.flex_1, { paddingTop: insets.top, backgroundColor: theme.home_bg_color }]}>
      {/* 顶栏：返回 + 标题 + 语言切换。左右两侧同宽，标题才能严格居中 */}
      <View style={[styles.header, { borderBottomColor: lineColor }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.headerSide}>
          <SimpleLineIcons name="arrow-left" size={22} color={theme.text} />
        </Pressable>

        <ThemedText numberOfLines={1} style={styles.headerTitle}>
          {text.title}
        </ThemedText>

        <Pressable
          onPress={switchLang}
          hitSlop={10}
          style={styles.headerSide}
          accessibilityRole="button"
          accessibilityLabel={lang === 'zh' ? 'Switch to English' : '切换到中文'}
        >
          <ThemedText style={[styles.langLabel, { color: theme.tint }]}>{switchLabel}</ThemedText>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 版本信息：条款类页面必须让人一眼看到「哪一版、何时生效」 */}
        <ThemedText style={[styles.meta, { color: theme.tabIconDefault }]}>
          {updatedLabel}: {text.updatedAt}
        </ThemedText>
        <ThemedText style={[styles.meta, { color: theme.tabIconDefault }]}>
          {effectiveLabel}: {text.effectiveAt}
        </ThemedText>

        {text.sections.map(section => (
          <View key={section.heading} style={styles.section}>
            <ThemedText style={styles.heading}>{section.heading}</ThemedText>

            {section.paragraphs?.map((paragraph, index) => (
              <ThemedText
                key={index}
                style={[styles.paragraph, { color: theme.text }]}
              >
                {paragraph}
              </ThemedText>
            ))}

            {section.items?.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <ThemedText style={[styles.bullet, { color: theme.tabIconDefault }]}>·</ThemedText>
                <ThemedText style={[styles.itemText, { color: theme.text }]}>{item}</ThemedText>
              </View>
            ))}
          </View>
        ))}

        <ThemedText style={[styles.footer, { color: theme.tabIconDefault }]}>
          {lang === 'zh' ? '大藍本' : 'Dalanben'} V{version}
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
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerSide: {
    width: 32,
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '600',
  },
  langLabel: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
    textAlign: 'right',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 48,
  },
  meta: {
    fontSize: 12,
    lineHeight: 18,
  },
  section: {
    marginTop: 24,
  },
  heading: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 23,
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  bullet: {
    fontSize: 14,
    lineHeight: 23,
    width: 14,
  },
  itemText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 23,
  },
  footer: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 36,
  },
});
