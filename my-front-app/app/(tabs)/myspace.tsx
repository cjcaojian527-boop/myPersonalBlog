import { StyleSheet, Pressable, TextInput, View, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';
import { SvgXml } from 'react-native-svg';
import { useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { toast } from 'sonner-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { publicStyles, FILE_BASEURI } from '@/utils/const';
import { postRequest, getRequest } from '@/utils/api';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useAuthStore } from '@/store';
// 小红书那个红，跟详情页的「关注」按钮保持一致
const XHS_RED = '#3d8af5';
// 邮箱格式，前端先挡一道，省一次没必要的请求
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 登录 / 注册 切换区：宽度和间距写死，指示条靠 translateX 平移过去。
// 不按文字量测宽度，是因为标签固定两个字，量出来反而会带来首帧抖动
const SWITCH_ITEM_WIDTH = 56;
// 标签文字实际宽约 32，item 两侧各留 12 的点击余量；
// gap 取 8 是为了让两个标签的视觉间距仍然等于原来的 32
const SWITCH_GAP = 8;
const SWITCH_BAR_WIDTH = 20;
const SWITCH_BAR_LEFT = (SWITCH_ITEM_WIDTH - SWITCH_BAR_WIDTH) / 2;
// 登录 → 注册，指示条要走的距离
const SWITCH_BAR_TRAVEL = SWITCH_ITEM_WIDTH + SWITCH_GAP;
// 左右滑判定：位移或甩动速度任一超标就切换
const SWIPE_TRIGGER = 60;
const SWIPE_VELOCITY = 350;

// 后端这几个字段是逗号分隔的 id 串，数一下非空项就是条数
const countOf = (s?: string) => (s ? s.split(',').filter(Boolean).length : 0);

// createdAt 是 ISO 串，转成 2026-10-19。
// 没用 toLocaleDateString，Hermes 上的时区/格式不保证跟预期一致
const formatDate = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

type Mode = 'login' | 'register';

export default function MySpace() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];

  // 用 hook 选，token 变化时页面才会跟着重新渲染；
  // getState() 只取一次，登录成功后页面不会自己切到已登录状态
  const TouristsToken = useAuthStore(state => state.TouristsToken);
  const TouristsAuth = useAuthStore(state => state.TouristsAuth);

  // 登录 / 注册 两个模式共用同一套表单，验证码只在注册时出现
  const [mode, set_mode] = useState<Mode>('login');

  const [email, set_email] = useState<string>('');
  const [nickName, set_nickName] = useState<string>('');
  const [loading, set_loading] = useState<boolean>(false);

  // 验证码：svg 是图片本体，captchaId 是后端找答案的钥匙，两个都带着才能注册
  const [captchaSvg, set_captchaSvg] = useState<string>('');
  const [captchaId, set_captchaId] = useState<string>('');
  const [captchaCode, set_captchaCode] = useState<string>('');
  const [captchaLoading, set_captchaLoading] = useState<boolean>(false);

  // 键盘弹起来时把表单整体往上抬
  const scrollRef = useRef<ScrollView>(null);

  // 指示条位置：0 = 登录，SWITCH_BAR_TRAVEL = 注册
  const barX = useSharedValue(0);
  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: barX.get() }],
  }));

  // 任何一个输入框准备输入，都把页面滚到底：
  // 「登录 / 注册」按钮就停在键盘上沿，验证码行也不会被压住。
  // 等 300ms 是让键盘动画走完，否则滚的是「键盘弹起前」的高度
  const handleInputFocus = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
  };

  // 输入框的浅灰底，跟搜索页保持一套
  const boxBg = colorScheme === 'light' ? '#f5f5f5' : '#26262e';
  const lineColor = colorScheme === 'light' ? '#e5e5e5' : '#33333a';

  // 该填的都填了才能点，避免点了才发现少东西
  const canSubmit = email.trim().length > 0
    && nickName.trim().length > 0
    && (mode === 'login' || captchaCode.trim().length > 0);

  // ── 验证码 ────────────────────────────────────
  const loadCaptcha = async () => {
    set_captchaLoading(true);
    try {
      const resp = await getRequest('/api/auth/getCaptchaCode');
      if (resp.code === 0) {
        set_captchaSvg(resp.data.svg);
        set_captchaId(resp.data.captchaId);
        set_captchaCode('');       // 换了一张，旧的输入作废
      } else {
        toast.error('提示', {
          description: resp.message || '验证码加载失败',
          duration: 1500,
          position: 'top-center',
        });
      }
    } catch (error) {
      console.warn('验证码加载失败：', error);
    } finally {
      set_captchaLoading(false);
    }
  };

  const switchMode = (m: Mode) => {
    set_mode(m);
    // 指示条滑到对应标签下面，spring 带一点回弹，手感更活
    barX.set(withSpring(m === 'login' ? 0 : SWITCH_BAR_TRAVEL, {
      damping: 18,
      stiffness: 180,
      mass: 0.8,
    }));
    // 切到注册、手上还没有验证码时，去要一张
    if (m === 'register' && !captchaId) loadCaptcha();
  };

  // ── 登录 ──────────────────────────────────────
  const doLogin = async (mail: string, name: string) => {
    // 后端：POST /api/touristsAuth/Login  { nickName, email }
    // 成功时游客 token 放在响应头 TouristsAuthorization 里
    const resp = await postRequest<{ nickName: string, email: string }>(
      '/api/touristsAuth/Login',
      { nickName: name, email: mail }
    );

    if (resp.code === 0) {
      toast.success('提示', {
        description: '登录成功',
        duration: 1500,
        position: 'top-center',
      });
      // token 已经由 utils/api.ts 的响应拦截器从响应头存进 store，
      // 这里补上游客信息
      useAuthStore.setState({ 'TouristsAuth': resp.data });
      return true;
    }

    toast.error('提示', {
      description: resp.message || '登录失败',
      duration: 1800,
      position: 'top-center',
    });
    return false;
  };

  // ── 提交：按当前模式走登录或注册 ──────────────
  const handleSubmit = async () => {
    const mail = email.trim();
    const name = nickName.trim();

    if (!EMAIL_REGEX.test(mail)) {
      toast.error('提示', {
        description: '请输入正确的邮箱地址',
        duration: 1500,
        position: 'top-center',
      });
      return;
    }

    if (!name) {
      toast.error('提示', {
        description: '请输入昵称',
        duration: 1500,
        position: 'top-center',
      });
      return;
    }

    if (mode === 'register') {
      if (!captchaId) {
        toast.error('提示', {
          description: '验证码还没加载出来，点图片刷新一下',
          duration: 1500,
          position: 'top-center',
        });
        return;
      }
      if (!captchaCode.trim()) {
        toast.error('提示', {
          description: '请输入验证码',
          duration: 1500,
          position: 'top-center',
        });
        return;
      }
    }

    set_loading(true);
    try {
      if (mode === 'login') {
        await doLogin(mail, name);
        return;
      }

      // 后端：POST /api/touristsAuth/Register
      // 必须带 code + captchaId，verifyCaptcha 中间件会校验
      const resp = await postRequest<
        { nickName: string, email: string, code: string, captchaId: string }
      >('/api/touristsAuth/Register', {
        nickName: name,
        email: mail,
        code: captchaCode.trim(),
        captchaId,
      });

      if (resp.code === 0) {
        toast.success('提示', {
          description: '注册成功，正在登录…',
          duration: 1200,
          position: 'top-center',
        });
        // 注册完直接帮他登进去，省得再手点一次
        await doLogin(mail, name);
      } else {
        toast.error('提示', {
          description: resp.message || '注册失败',
          duration: 1800,
          position: 'top-center',
        });
        // 验证码是一次性的，后端验过就删了，这里换一张新的
        loadCaptcha();
      }
    } catch (error) {
      console.warn('游客操作失败：', error);
      toast.error('提示', {
        description: '网络异常，请稍后再试',
        duration: 1800,
        position: 'top-center',
      });
    } finally {
      set_loading(false);
    }
  };

  // ── 左右滑动切换登录 / 注册 ──────────────────
  // 只认横向：纵向偏移超过 16 就让给 ScrollView，不抢页面滚动。
  // runOnJS(true)：判定逻辑直接跑在 JS 线程，能读最新的 mode / loading
  const swipeGesture = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-16, 16])
    .failOffsetY([-16, 16])
    .onEnd((e) => {
      // 请求还在飞的时候别切，免得登录结果落到注册模式上
      if (loading) return;
      if (
        mode === 'login'
        && (e.translationX < -SWIPE_TRIGGER || e.velocityX < -SWIPE_VELOCITY)
      ) {
        switchMode('register');
      } else if (
        mode === 'register'
        && (e.translationX > SWIPE_TRIGGER || e.velocityX > SWIPE_VELOCITY)
      ) {
        switchMode('login');
      }
    });

  // ── 已登录：有 token 就只看这一屏，不再显示表单 ──
  if (TouristsToken) {
    const joinedDate = formatDate(TouristsAuth.createdAt);
    const stats = [
      { label: '点赞', value: countOf(TouristsAuth.likeStrings) },
      { label: '收藏', value: countOf(TouristsAuth.collects) },
      { label: '浏览', value: countOf(TouristsAuth.viewStrings) },
    ];

    return (
      <ThemedView style={[publicStyles.flex_1, { paddingTop: insets.top, backgroundColor: theme.home_bg_color }]}>
        <View style={styles.loggedBody}>
          {/* 右上角设置入口：进站内设置页 */}
          <View style={styles.topBar}>
            <Pressable
              hitSlop={12}
              onPress={() => router.push('/settings')}
              style={({ pressed }) => pressed && styles.iconPressed}
            >
              <SimpleLineIcons name="settings" size={20} color={theme.tabIconDefault} />
            </Pressable>
          </View>

          {/* 资料卡 */}
          <ThemedView
            lightColor="#ffffff"
            darkColor="#26262e"
            style={[styles.profileCard, colorScheme === 'light' && styles.cardShadow]}
          >
            <View style={styles.profileTop}>
              {TouristsAuth.avatar ? (
                <Image
                  source={{ uri: FILE_BASEURI + TouristsAuth.avatar }}
                  style={styles.bigAvatar}
                />
              ) : (
                <View style={[styles.bigAvatar, styles.avatarFallback, { backgroundColor: boxBg }]}>
                  <SimpleLineIcons name="user" size={30} color={theme.tabIconDefault} />
                </View>
              )}

              <View style={styles.profileInfo}>
                <View style={styles.nameRow}>
                  <ThemedText style={styles.loggedName} numberOfLines={1}>
                    {TouristsAuth.nickName || '游客'}
                  </ThemedText>
                  {/* 游客身份徽章：淡蓝底 + 主题蓝字，透明度用 8 位 hex 拼，
                      不额外写死一套颜色 */}
                  <View style={[styles.guestBadge, { backgroundColor: XHS_RED + '1a' }]}>
                    <ThemedText style={[styles.guestBadgeText, { color: XHS_RED }]}>游客</ThemedText>
                  </View>
                </View>
                <ThemedText
                  style={[styles.loggedEmail, { color: theme.tabIconDefault }]}
                  numberOfLines={1}
                >
                  {TouristsAuth.email || ''}
                </ThemedText>
              </View>
            </View>

            {/* 数据栏：从后端那串逗号分隔的 id 里数出来的 */}
            <View style={[styles.statsRow, { borderTopColor: lineColor }]}>
              {stats.map(item => (
                <View key={item.label} style={styles.statItem}>
                  <ThemedText style={styles.statValue}>{item.value}</ThemedText>
                  <ThemedText style={[styles.statLabel, { color: theme.tabIconDefault }]}>
                    {item.label}
                  </ThemedText>
                </View>
              ))}
            </View>
          </ThemedView>

          {/* 登录状态 + 加入时间 */}
          <View style={styles.statusRow}>
            <View style={styles.onlineDot} />
            <ThemedText style={[styles.statusText, { color: theme.tabIconDefault }]}>
              游客已登录{joinedDate ? ` · 加入于 ${joinedDate}` : ''}
            </ThemedText>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.logoutBtn,
              { borderColor: lineColor },
              pressed && styles.logoutBtnPressed,
            ]}
            onPress={() => {
              // 退出不可逆，token 一清就得重走登录，先让老大确认一手
              Alert.alert(
                '退出登录',
                '退出后需要重新登录，确定吗？',
                [
                  { text: '取消', style: 'cancel' },
                  {
                    text: '退出',
                    style: 'destructive',
                    onPress: () => useAuthStore.setState({ TouristsToken: '', TouristsAuth: {} }),
                  },
                ],
              );
            }}
          >
            {/* 前面配个出门口的小图标，光一行字太像普通文本 */}
            <SimpleLineIcons name="logout" size={14} color={theme.tabIconDefault} />
            <ThemedText style={[styles.logoutText, { color: theme.tabIconDefault }]}>退出登录</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  // ── 未登录：登录 / 注册表单 ──────────────────
  return (
    <ThemedView style={[publicStyles.flex_1, { paddingTop: insets.top, backgroundColor: theme.home_bg_color }]}>
      {/* 设置入口跟登录态无关：没登录也能进设置页。
          绝对定位在右上角，键盘弹起 / 表单滚动时都常驻 */}
      <Pressable
        hitSlop={12}
        onPress={() => router.push('/settings')}
        style={({ pressed }) => [
          styles.guestSettingsBtn,
          { top: insets.top + 12 },
          pressed && styles.iconPressed,
        ]}
      >
        <SimpleLineIcons name="settings" size={20} color={theme.tabIconDefault} />
      </Pressable>

      {/* iOS 交给 ScrollView 的 automaticallyAdjustKeyboardInsets 自己处理，
          Android 用 KAV 撑开（SDK 54+ 默认 edge-to-edge，窗口不会自动缩） */}
      <KeyboardAvoidingView
        style={publicStyles.flex_1}
        behavior={Platform.OS === 'android' ? 'height' : undefined}
      >
        <GestureDetector gesture={swipeGesture}>
          <ScrollView
            ref={scrollRef}
            automaticallyAdjustKeyboardInsets
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
          {/* 顶部头像占位：游客还没有头像，先给个圆底人像 */}
          <View style={[styles.logo, { backgroundColor: boxBg }]}>
            <SimpleLineIcons name="user" size={36} color={theme.tabIconDefault} />
          </View>

          <ThemedText style={styles.title}>游客登录</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.tabIconDefault }]}>
            登录后即可评论、点赞和收藏
          </ThemedText>

          {/* ── 登录 / 注册 切换 ────────────────────── */}
          <View style={styles.switchRow}>
            {([
              { key: 'login' as Mode, label: '登录' },
              { key: 'register' as Mode, label: '注册' },
            ]).map(item => (
              <Pressable
                key={item.key}
                style={styles.switchItem}
                onPress={() => switchMode(item.key)}
              >
                <ThemedText
                  style={[
                    styles.switchText,
                    { color: mode === item.key ? theme.text : theme.tabIconDefault },
                    mode === item.key && publicStyles.font_bold,
                  ]}
                >
                  {item.label}
                </ThemedText>
                {/* 透明占位，撑住文字到指示条的高度，防止切换时文字上下跳 */}
                <View style={styles.switchBar} />
              </Pressable>
            ))}

            {/* 唯一一条指示条：跟着 mode 在「登录 / 注册」下面平移 */}
            <Animated.View style={[styles.switchIndicator, indicatorStyle]} />
          </View>

          {/* ── 表单 ───────────────────────────────── */}
          <View style={styles.form}>
           

            <View style={[styles.inputBox, { backgroundColor: boxBg }]}>
              <SimpleLineIcons name="user" size={17} color={theme.tabIconDefault} />
              {/* 语义告诉系统「这是账号字段」：iOS 走 iCloud 钥匙串，Android 走 Autofill。
                  系统里存过记录时，聚焦会直接给出填充建议 */}
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={nickName}
                onFocus={handleInputFocus}
                onChangeText={set_nickName}
                placeholder="请输入昵称"
                placeholderTextColor={theme.tabIconDefault}
                autoCapitalize="none"
                textContentType="username"
                autoComplete="username"
                importantForAutofill="yes"
                returnKeyType={mode === 'login' ? 'done' : 'next'}
                onSubmitEditing={mode === 'login' ? handleSubmit : undefined}
              />
            </View>
             <View style={[styles.inputBox, { backgroundColor: boxBg }]}>
              <SimpleLineIcons name="envelope" size={17} color={theme.tabIconDefault} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={email}
                onFocus={handleInputFocus}
                onChangeText={set_email}
                placeholder="请输入邮箱"
                placeholderTextColor={theme.tabIconDefault}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                autoComplete="email"
                importantForAutofill="yes"
                returnKeyType="next"
              />
            </View>

            {/* 验证码只在注册时出现 */}
            {mode === 'register' && (
              <View style={styles.captchaRow}>
                <View style={[styles.inputBox, publicStyles.flex_1, { backgroundColor: boxBg }]}>
                  <SimpleLineIcons name="lock" size={17} color={theme.tabIconDefault} />
                  {/* 图片验证码不是系统能记的凭据，明确排除，
                      免得 Autofill 把它当成账号字段去填 */}
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    value={captchaCode}
                    onChangeText={set_captchaCode}
                    onFocus={handleInputFocus}
                    placeholder="请输入验证码"
                    placeholderTextColor={theme.tabIconDefault}
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="none"
                    autoComplete="off"
                    importantForAutofill="no"
                    maxLength={6}
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                  />
                </View>

                {/* 点图片换一张 */}
                <Pressable
                  style={[styles.captchaBox, { backgroundColor: boxBg }]}
                  onPress={loadCaptcha}
                >
                  {captchaLoading || !captchaSvg
                    ? <ActivityIndicator size="small" color={theme.tabIconDefault} />
                    : <SvgXml xml={captchaSvg} width={88} height={30} />
                  }
                </Pressable>
              </View>
            )}

            <Pressable
              style={[styles.submitBtn, { opacity: canSubmit && !loading ? 1 : 0.45 }]}
              disabled={!canSubmit || loading}
              onPress={handleSubmit}
            >
              {loading
                ? <ActivityIndicator color="#ffffff" />
                : <ThemedText style={styles.submitText}>{mode === 'login' ? '登 录' : '注 册'}</ThemedText>
              }
            </Pressable>
          </View>

          <ThemedText style={[styles.tip, { color: theme.tabIconDefault }]}>
            {mode === 'login'
              ? '还没有游客账号？切到「注册」马上建一个'
              : '看不清验证码？点图片换一张'}
          </ThemedText>
          </ScrollView>
        </GestureDetector>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  // ── 已登录 ───────────────────────────────────
  loggedBody: {
    flex: 1,
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  // 设置入口：右对齐，齿轮单独占一行
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  iconPressed: {
    opacity: 0.5,
  },
  // 未登录页的齿轮：浮在表单右上角，不占表单流
  guestSettingsBtn: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
  },
  // 资料卡：页面底色是 home_bg_color，这里浮一张白/深灰卡片
  profileCard: {
    borderRadius: 16,
    padding: 18,
  },
  // 卡面浮起：iOS 走 shadow；Android 的 elevation 在深色底上会发亮，
  // 所以这条只在浅色主题下挂（见 JSX 里的条件）
  cardShadow: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
    },
    android: {
      elevation: 2,
    },
    default: {},
  }),
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  bigAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e9e9e9',   // 图片没加载出来时的灰底
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  loggedName: {
    flexShrink: 1,     // 昵称太长先压自己，别把徽章挤出卡片
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
  },
  // 游客徽章：字号压到 10，纯装饰不抢昵称的视觉权重
  guestBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  guestBadgeText: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
  },
  loggedEmail: {
    fontSize: 13,
    lineHeight: 18,
  },

  // 数据栏：三列平分，顶上一根细分割线
  statsRow: {
    flexDirection: 'row',
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    lineHeight: 16,
  },

  // 登录状态：一个绿点 + 一行小灰字
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 22,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  statusText: {
    fontSize: 12,
    lineHeight: 16,
  },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: 6,
    marginTop: 30,
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 9999,
    borderWidth: 1,
  },
  logoutBtnPressed: {
    opacity: 0.55,     // 按下去变淡，给手指一个回声
  },
  logoutText: {
    fontSize: 14,
    lineHeight: 20,
  },

  // flexGrow + 上下留白：内容少时居中偏上，键盘弹起还能滚
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 56,
    paddingBottom: 40,
  },

  // ── 顶部 ─────────────────────────────────────
  logo: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  title: {
    fontSize: 24,
    lineHeight: 34,          // 中文必须跟字号成对写
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
  },

  // ── 登录 / 注册 切换 ──────────────────────────
  switchRow: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: SWITCH_GAP,
    marginTop: 28,
  },
  switchItem: {
    width: SWITCH_ITEM_WIDTH,
    alignItems: 'center',
    paddingVertical: 6,
  },
  switchText: {
    fontSize: 16,
    lineHeight: 22,
  },
  // 透明占位：只负责撑高度，真正可见的是下面那条指示条
  switchBar: {
    width: SWITCH_BAR_WIDTH,
    height: 3,
    borderRadius: 2,
    marginTop: 6,
  },
  // 指示条：绝对定位在 switchRow 底部，translateX 由动画驱动
  switchIndicator: {
    position: 'absolute',
    left: SWITCH_BAR_LEFT,
    bottom: 6,
    width: SWITCH_BAR_WIDTH,
    height: 3,
    borderRadius: 2,
    backgroundColor: XHS_RED,
  },

  // ── 表单 ─────────────────────────────────────
  form: {
    marginTop: 28,
    gap: 14,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    // Android 的 TextInput 自带内边距，不清掉文字会往下偏
    padding: 0,
  },

  // 验证码这一行：左边输入框吃掉剩余宽度，右边一张图
  captchaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  captchaBox: {
    width: 104,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  submitBtn: {
    height: 48,
    borderRadius: 24,        // 高度的一半 = 胶囊
    backgroundColor: XHS_RED,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  submitText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    color: '#ffffff',        // 红底白字，压过 ThemedText 的主题色
  },

  tip: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 20,
  },
});
