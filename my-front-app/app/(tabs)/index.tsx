import { StyleSheet, RefreshControl, Platform, Pressable, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useRef, type ReactElement } from 'react';
import { useRouter } from 'expo-router';
import { FlashList, FlashListRef } from "@shopify/flash-list";
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemedScrollView } from '@/components/ThemedScrollView';
import { publicStyles } from '@/utils/const';
import { postRequest, getRequest } from '@/utils/api';
import { ArticleCard, type ArticleItem } from '@/components/ArticleCard';
import { useCurrentArticle, useAuthStore } from '@/store';
import { toast } from 'sonner-native';


import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

import { observe } from 'react-native-observable-list';

// 1. 用 observe 包装原组件，生成一个可观测版本
const ObservableMasonryFlashList = observe(FlashList);
type tabs1Type = { name: string, key: number };


interface artcleOpt {
  pageSize: number;
  pageNum: number;
  formData?: { [key: string]: unknown }
}
interface articleType {
  typeId: string;
  typeName: string;
}

const _page_template = { pageSize: 10, pageNum: 1 };

// 卡片最小舒适宽度：手机维持 2 列，平板 / 折叠屏按屏宽自动铺更多列
const CARD_MIN_WIDTH = 180;
const LIST_H_PADDING = 8;   // contentContainer 左右各 4
const MAX_COLUMNS = 6;      // 再宽也别铺得太密

/**
 * 列表加载失败的三种情形，空状态据此给不同提示：
 *   offline → 手机没网 / 服务器连不上
 *   timeout → 请求超时（网络慢）
 *   server  → 有响应但后端报错
 */
type LoadErrorKind = 'offline' | 'timeout' | 'server' | null;

const classifyLoadError = (error: any): Exclude<LoadErrorKind, null> => {
    // 没有 response，说明请求根本没到服务器：断网、DNS 失败或域名不可达
    if (!error?.response) {
        return error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT'
            ? 'timeout'
            : 'offline';
    }
    return 'server';
};

export default function HomeScreen() {


  const [tabs1key, set_tabs1key] = useState(2);
  const [loding, set_loding] = useState<boolean>(false);
  const [DATA, set_DATA] = useState<ArticleItem[]>([]);
  // 列表加载失败的类型：非 null 时，空状态会切成「网络异常」而不是「没有文章」
  const [loadError, set_loadError] = useState<LoadErrorKind>(null);
  // DATA 的同步副本：catch 里要知道「是首屏失败还是刷新失败」，闭包里的 DATA 可能是旧值
  const dataLenRef = useRef<number>(0);
  const [, set_total] = useState<number>(0);
  const [ListFooterComponent, set_ListFooterComponent] = useState<ReactElement | null>(null);
  const [pageData, set_pageData] = useState<{ pageSize: number, pageNum: number }>(_page_template);
  const [articleTypeList, set_articleTypeList] = useState<articleType[]>([]);
  const [FocuseType, set_FocuseType] = useState<articleType>({ typeId: '-1', typeName: '推荐' });
  const router = useRouter();
  // 窗口宽度一变（平板 / 折叠屏 / 分屏）就重算列数：手机 2 列，平板自动铺开
  const { width: screenWidth } = useWindowDimensions();
  const numColumns = Math.min(
    MAX_COLUMNS,
    Math.max(2, Math.floor((screenWidth - LIST_H_PADDING) / CARD_MIN_WIDTH)),
  );
  const userHasScrolled = useRef<boolean>(false);
  const listRef = useRef<FlashListRef<ArticleItem>>(null);
  // 请求序号：切分类 / 刷新时递增，响应回来对不上号就说明已经过期了
  const requestIdRef = useRef<number>(0);
  // 当前分类的同步副本：翻页请求发出后用它判断期间有没有切过分类
  const focuseTypeRef = useRef<articleType>({ typeId: '-1', typeName: '推荐' });
  // 顶部 tab 的同步副本：翻页请求发出后用它判断期间有没有切过 tab
  const tabKeyRef = useRef<number>(2);

  const TouristsToken = useAuthStore(state => state.TouristsToken);
  const TouristsAuth = useAuthStore(state => state.TouristsAuth);
  // 关注博主的 User id 串、收藏文章的 id 串（都是逗号分隔）。
  // 真正作数的是进对应 tab 时从数据库拉回来的那份；store 里的值只当首屏占位。
  // 这样在数据库里手动改过 focus / collects，前台点一下 tab 就能对上。
  const [focusString, set_focusString] = useState<string>(String(TouristsAuth.focus ?? ''));
  const [collectsString, set_collectsString] = useState<string>(String(TouristsAuth.collects ?? ''));
  // 发请求 / 翻页用的同步副本：setState 是异步的，不能等它生效再查
  const focusRef = useRef<string>(String(TouristsAuth.focus ?? ''));
  const collectsRef = useRef<string>(String(TouristsAuth.collects ?? ''));
  const tabs1: tabs1Type[] = [
    { name: '关注', key: 1 },
    { name: '发现', key: 2 },
    { name: '收藏', key: 3 },
  ];
  const insets = useSafeAreaInsets();
  //insets.top     ← iPhone 刘海/药丸、Android 状态栏的高度
  // insets.bottom  ← 底部手势条 / 导航栏高度
  // insets.left    ← 横屏时的左侧凹陷
  // insets.right

  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  // 库里有些串是 ",11,7" 这种前后带逗号的，先清洗成 "11,7" 再发给后端
  const cleanIds = (value: unknown): string =>
    String(value ?? '')
      .split(',')
      .map(id => id.trim())
      .filter(Boolean)
      .join(',');

  /**
   * 去数据库取当前游客最新的关注 / 收藏串。
   * 「关注」「收藏」tab 每次进入 / 下拉刷新都先调它，保证和后台一致——
   * 在数据库里手动改过 focus / collects，前台也能马上对上，不会被本地缓存骗了。
   */
  const fetchRelations = async (): Promise<{ focus: string; collects: string }> => {
    const fallback = { focus: focusRef.current, collects: collectsRef.current };
    if (!TouristsToken || !TouristsAuth.id) return fallback;

    try {
      const resp = await postRequest('/api/touristsAuth/queryUsers', {
        page: 1,
        pageSize: 1,
        formData: { id: TouristsAuth.id },
      });
      const latest = resp.code === 0 ? resp.data?.list?.[0] : null;
      if (!latest) return fallback;

      const next = { focus: cleanIds(latest.focus), collects: cleanIds(latest.collects) };
      focusRef.current = next.focus;
      collectsRef.current = next.collects;
      set_focusString(next.focus);
      set_collectsString(next.collects);
      // 顺手把最新资料写回 store，详情页等地方的首屏占位也不会是旧值
      useAuthStore.setState({
        TouristsAuth: { ...useAuthStore.getState().TouristsAuth, ...latest },
      });
      return next;
    } catch (error) {
      console.warn('获取关注 / 收藏失败：', error);
      // 网络失败就退回上一次已知的值，总比把列表清空强
      return fallback;
    }
  };

  /**
   * 组装列表查询条件：
   * - 「关注」→ 带上关注博主的 User id 串（后端 userIdStrings）
   * - 「收藏」→ 带上收藏文章的 id 串（后端 idStrings）
   * - 选了具体分类 → 再叠加分类
   * 「发现」不额外筛，保持原来的全量列表
   */
  const buildQuery = (
    tabKey: number,
    typeId: string,
    relations: { focus: string; collects: string } = {
      focus: focusRef.current,
      collects: collectsRef.current,
    },
  ) => {
    const formData: { [key: string]: unknown } = {};
    if (tabKey === 1) formData.userIdStrings = relations.focus;
    if (tabKey === 3) formData.idStrings = relations.collects;
    if (typeId !== '-1') formData.articleType = typeId;

    return Object.keys(formData).length
      ? { ..._page_template, formData }
      : { ..._page_template };
  };

  const selectTopTab = async (item: tabs1Type): Promise<void> => {
    if (item.key === tabs1key) return;

    // 「关注」「收藏」必须先登录：没登录硬查也只会得到空列表，不如直接引导
    if ((item.key === 1 || item.key === 3) && !TouristsToken) {
      toast('提示', {
        description: item.key === 1 ? '登录后才能查看关注的博主' : '登录后才能查看收藏的文章',
        duration: 1500,
        position: 'top-center',
      });
      return;
    }

    set_tabs1key(item.key);
    tabKeyRef.current = item.key;

    // 换 tab 等于换一份列表：分页、滚动标记、底部「到底了」全部归零
    set_DATA([]);
    dataLenRef.current = 0;
    // 上一个 tab 的错误态不能带过来，否则新 tab 会先闪一下「网络异常」
    set_loadError(null);
    set_total(0);
    set_ListFooterComponent(null);
    set_pageData(_page_template);
    userHasScrolled.current = false;

    // 「关注」「收藏」先问数据库要最新的 id 串，再拿它查文章
    let relations = { focus: focusRef.current, collects: collectsRef.current };
    if (item.key === 1 || item.key === 3) relations = await fetchRelations();
    // 等接口的工夫用户可能又切走了，这份结果就别再往列表里塞
    if (tabKeyRef.current !== item.key) return;

    searchData(buildQuery(item.key, FocuseType.typeId, relations));
  };

  const searchData = async (queryData: { [key: string]: any }) => {
    // 每次发起就占一个号；回来时号已经不是自己的，说明中途又切了分类
    const requestId = ++requestIdRef.current;
    const params: artcleOpt = { ...pageData, ...queryData };

    set_loding(true);
    try {
      const resp = await postRequest<artcleOpt>("/api/artcle/getList", params);
      // 过期响应直接丢，别拿旧分类的数据覆盖新分类
      if (requestId !== requestIdRef.current) return;
      if (resp.code === 0) {
        const list = resp.data?.list ?? [];
        dataLenRef.current = list.length;
        set_DATA(list);
        set_total(resp.data?.total ?? 0);
        // 这次成功，之前攒下的错误态作废
        set_loadError(null);
      } else {
        // 后端有响应但业务失败：这不是「没有文章」，空态得说实话
        set_loadError('server');
      }
    } catch (error) {
      console.warn('获取失败：', error);
      if (requestId !== requestIdRef.current) return;
      const kind = classifyLoadError(error);
      set_loadError(kind);
      // 已经有内容时不会被空态接管，用 toast 告诉用户「刷新没成功」
      if (dataLenRef.current > 0) {
        toast.error(kind === 'timeout' ? '请求超时' : '网络异常', {
          description: '当前显示的是上次加载的内容，下拉可重试',
          duration: 2000,
          position: 'top-center',
        });
      }
    } finally {
      // 只有最后一次请求才有资格收掉 loading，否则新请求会被提前熄灯
      if (requestId === requestIdRef.current) set_loding(false);
    }


  }

  const loadNext = async () => {
    if (!userHasScrolled.current) return;
    // 首屏还没回来 / 正在刷新时别翻页，否则会拿着旧页码再查一遍
    if (loding || !DATA.length) return;

    // 记下这次翻页属于哪个分类 / 哪个顶部 tab，响应回来要核对
    const typeId = FocuseType.typeId;
    const tabKey = tabKeyRef.current;
    const params: artcleOpt = { ...pageData, pageNum: pageData.pageNum + 1 };
    const formData: { [key: string]: unknown } = {};
    // 翻页沿用进入 tab 时校准过的那份，别再读可能过期的 state
    if (tabKey === 1) formData.userIdStrings = focusRef.current;
    if (tabKey === 3) formData.idStrings = collectsRef.current;
    if (typeId !== '-1') formData.articleType = typeId;
    if (Object.keys(formData).length) params.formData = formData;

    try {
      const resp = await postRequest<artcleOpt>("/api/artcle/getList", params);
      // 翻页期间切了分类 / 顶部 tab：这一页属于旧条件，拼上去就串了
      if (focuseTypeRef.current.typeId !== typeId || tabKeyRef.current !== tabKey) return;

      if (resp.code === 0) {
        const list = resp.data?.list ?? [];
        if (!list.length) {
          set_ListFooterComponent(<ThemedText onPress={scrollToTop} style={styles.footerText}>到底了，回到顶部？</ThemedText>);
        } else {
          set_DATA(prev => {
            const next = [...prev, ...list];
            dataLenRef.current = next.length;
            return next;
          });
          set_total(resp.data?.total ?? 0);
          set_pageData(prev => ({ ...prev, pageNum: prev.pageNum + 1 }));
        }
      }
    } catch (error) {
      // 翻页失败不能清空已有列表，提示一下让用户知道这页没加载上
      console.warn('翻页失败：', error);
      toast.error(classifyLoadError(error) === 'timeout' ? '请求超时' : '加载失败', {
        description: '检查网络后继续下拉试试',
        duration: 2000,
        position: 'top-center',
      });
    }
  }




  const handleRefresh = async () => {
    userHasScrolled.current = false;
    set_pageData(_page_template);
    set_ListFooterComponent(null);

    // 关注 / 收藏 tab 刷新时同样先校准 id 串，别拿旧值去查
    let relations = { focus: focusRef.current, collects: collectsRef.current };
    if (tabs1key === 1 || tabs1key === 3) relations = await fetchRelations();
    if (tabKeyRef.current !== tabs1key) return;

    // 刷新当前 tab + 当前分类，不把用户选好的条件重置掉
    await searchData(buildQuery(tabs1key, FocuseType.typeId, relations));
  }

  const getarticleType = async () => {
    const resp = await getRequest("/api/articleType/getList");
    if (resp.code === 0) {
      set_articleTypeList(prev => [...[{ typeId: '-1', typeName: '推荐' }], ...resp.data]);
    }
  }

  const scrollToTop = () => {
    listRef.current?.scrollToOffset({
      offset: 0,
      animated: true,
    });
  };

  const switcharticleType = (item: articleType): void => {
    if (item.typeId === FocuseType.typeId) return;

    // 换分类等于换一份列表：分页、滚动标记、底部「到底了」全部归零。
    // pageNum 不重置是最要命的——会拿上一个分类的页码去查新分类，
    // offset 直接跳过该分类的全部文章，看起来就是「这个分类没文章」。
    focuseTypeRef.current = item;
    set_FocuseType(item);
    set_DATA([]);
    dataLenRef.current = 0;
    // 换分类重新来过，旧分类的错误态不该留给新分类
    set_loadError(null);
    set_ListFooterComponent(null);
    set_pageData(_page_template);
    userHasScrolled.current = false;

    searchData(buildQuery(tabs1key, item.typeId));

  }

  const EmptyComponent = () => {
    // 加载失败优先于业务空态：没网时还说「这里还没有文章」就是骗人了。
    // 错误态在重试期间也保留，让按钮能显示「正在加载」，点了才有反馈。
    if (loadError) {
      const meta = {
        offline: {
          icon: 'cloud-offline-outline',
          title: '网络连接失败',
          hint: '请检查手机网络或 Wi-Fi 后重试',
        },
        timeout: {
          icon: 'time-outline',
          title: '网络有点慢',
          hint: '请求超时了，换个网络环境再试试',
        },
        server: {
          icon: 'alert-circle-outline',
          title: '服务器开小差了',
          hint: '稍等片刻再刷新，或者去别的分类逛逛',
        },
      }[loadError] as { icon: 'cloud-offline-outline' | 'time-outline' | 'alert-circle-outline'; title: string; hint: string };

      return (
        <ThemedView style={[styles.emptyWrap, { backgroundColor: theme.home_bg_color }]}>
          {/* 错误态换成暖红圆底，和「确实没内容」的蓝色一眼区分开 */}
          <ThemedView style={[styles.emptyIconWrap, styles.emptyIconWrapError]}>
            <Ionicons name={meta.icon} size={38} color="#e5484d" />
          </ThemedView>

          <ThemedText style={styles.emptyTitle}>{meta.title}</ThemedText>
          <ThemedText style={[styles.emptyHint, { color: theme.tabIconDefault }]}>
            {meta.hint}
          </ThemedText>

          <Pressable
            onPress={() => {
              if (!loding) handleRefresh();
            }}
            disabled={loding}
            style={({ pressed }) => [
              styles.emptyBtn,
              pressed && styles.emptyBtnPressed,
              loding && styles.emptyBtnDisabled,
            ]}
          >
            <ThemedText style={styles.emptyBtnText}>{loding ? '正在加载…' : '重新加载'}</ThemedText>
          </Pressable>
        </ThemedView>
      );
    }

    // 首次加载 / 重试中：这里只处理「还没有结果」的情况，不给空态免得闪
    if (loding) return null;

    // 关注 tab：没关注人 / 关注的人还没文章，两种空态分开说
    if (tabs1key === 1) {
      const noFollow = focusString.split(',').filter(Boolean).length === 0;

      return (
        <ThemedView style={[styles.emptyWrap, { backgroundColor: theme.home_bg_color }]}>
          <ThemedView style={styles.emptyIconWrap}>
            <Ionicons name={noFollow ? 'heart-outline' : 'file-tray-outline'} size={38} color="#3d8af5" />
          </ThemedView>

          <ThemedText style={styles.emptyTitle}>
            {noFollow ? '还没有关注任何博主' : '关注的博主还没有文章'}
          </ThemedText>
          <ThemedText style={[styles.emptyHint, { color: theme.tabIconDefault }]}>
            {noFollow
              ? '在文章详情页点一下「关注」，他们的新文章就会出现在这里'
              : '下拉刷新试试，或者去发现看看别的文章'}
          </ThemedText>

          <Pressable
            onPress={() => selectTopTab({ name: '发现', key: 2 })}
            style={({ pressed }) => [styles.emptyBtn, pressed && styles.emptyBtnPressed]}
          >
            <ThemedText style={styles.emptyBtnText}>去发现</ThemedText>
          </Pressable>
        </ThemedView>
      );
    }

    // 收藏 tab：一件没收藏 / 收藏的文章被删了，两种空态分开说
    if (tabs1key === 3) {
      const noCollect = collectsString.split(',').filter(Boolean).length === 0;

      return (
        <ThemedView style={[styles.emptyWrap, { backgroundColor: theme.home_bg_color }]}>
          <ThemedView style={styles.emptyIconWrap}>
            <Ionicons name={noCollect ? 'bookmark-outline' : 'file-tray-outline'} size={38} color="#3d8af5" />
          </ThemedView>

          <ThemedText style={styles.emptyTitle}>
            {noCollect ? '还没有收藏任何文章' : '收藏的文章暂时看不到了'}
          </ThemedText>
          <ThemedText style={[styles.emptyHint, { color: theme.tabIconDefault }]}>
            {noCollect
              ? '在文章详情页点一下「收藏」，喜欢的文章就会出现在这里'
              : '文章可能已被删除，下拉刷新试试'}
          </ThemedText>

          <Pressable
            onPress={() => selectTopTab({ name: '发现', key: 2 })}
            style={({ pressed }) => [styles.emptyBtn, pressed && styles.emptyBtnPressed]}
          >
            <ThemedText style={styles.emptyBtnText}>去发现</ThemedText>
          </Pressable>
        </ThemedView>
      );
    }

    // 空态给个能点的出口：不是推荐分类就引导回推荐，已经在推荐就刷新
    const isRecommend = FocuseType.typeId === '-1';
    const actionText = isRecommend ? '刷新一下' : '看看推荐';
    const onAction = () => {
      if (isRecommend) handleRefresh();
      else switcharticleType({ typeId: '-1', typeName: '推荐' });
    };

    return (
      <ThemedView style={[styles.emptyWrap, { backgroundColor: theme.home_bg_color }]}>
        {/* 浅蓝圆底托住图标，比孤零零一个线框图标柔和 */}
        <ThemedView style={styles.emptyIconWrap}>
          <Ionicons name="file-tray-outline" size={38} color="#3d8af5" />
        </ThemedView>

        <ThemedText style={styles.emptyTitle}>这里还没有文章</ThemedText>
        <ThemedText style={[styles.emptyHint, { color: theme.tabIconDefault }]}>
          下拉刷新试试，或去别的分类逛逛
        </ThemedText>

        <Pressable
          onPress={onAction}
          style={({ pressed }) => [styles.emptyBtn, pressed && styles.emptyBtnPressed]}
        >
          <ThemedText style={styles.emptyBtnText}>{actionText}</ThemedText>
        </Pressable>
      </ThemedView>
    )
  };

  //打开文章详情
  const openArticle = (item: ArticleItem) => {
    useCurrentArticle.setState({ "Article": item });
    router.push('/articlePreview');
  }

  useEffect(() => {
    // 放进定时器避开「effect 内同步 setState」的规则，也让首页先渲染出来
    const timer = setTimeout(() => {
      searchData({});
      getarticleType();
    }, 0);
    return () => clearTimeout(timer);
  }, []);




  return (
    <ThemedView style={[publicStyles.flex_1, { paddingTop: insets.top }]}>
      <ThemedView style={[publicStyles.flex_space_between, publicStyles.padding_0_10, styles.topBar, { borderColor: colorScheme === 'light' ? '#e6e6e6' : '#2a2a30' }]}>
        {/* 左上角消息入口：直接切到底部的「消息」tab（navigate 不会往栈里再压一层） */}
        <SimpleLineIcons
          name="bubble"
          size={20}
          color={theme.icon}
          hitSlop={10}
          onPress={() => router.navigate('/explore')}
        />
        <ThemedView style={[publicStyles.flex_space_around]}>
          {tabs1.map(m => {
            return (<Pressable key={m.key} style={{ paddingHorizontal: 13 }}>
              <ThemedText
                onPress={() => selectTopTab(m)}
                style={[{ borderBottomWidth: 2, borderColor: tabs1key === m.key ? '#3d8af5' : 'transparent' }, { color: m.key === tabs1key ? theme.tabIconSelected : theme.tabIconDefault, }]}
              >
                {m.name}
              </ThemedText>
            </Pressable>)
          })}
        </ThemedView>
        <SimpleLineIcons name="magnifier" size={20} color={theme.icon} onPress={() => router.push('/search')} />
      </ThemedView>
      <ThemedView style={[publicStyles.flex_1, { backgroundColor: theme.home_bg_color }]}>

        <ThemedScrollView
          showsHorizontalScrollIndicator={false}
          horizontal
          style={{ flexGrow: 0 }}
          contentContainerStyle={styles.ContainerStyle}>
          {articleTypeList.map(m => (<Pressable style={{ paddingHorizontal: 13 }} key={m.typeId} onPress={() => switcharticleType(m)}>
            <ThemedText style={[{ fontSize: 14 }, { color: FocuseType?.typeId === m.typeId ? theme.tabIconSelected : theme.tabIconDefault }]}>{m.typeName}</ThemedText>
          </Pressable>))}
        </ThemedScrollView>

        <ObservableMasonryFlashList
          ref={listRef}
          data={DATA}
          // key 跟着列数走：列数变化时让 FlashList 干净重建，避免旧布局残留
          key={`article-grid-${numColumns}`}
          numColumns={numColumns}
          keyExtractor={(item) => item.id + ''}
          renderItem={({ item }) => <ArticleCard cb={openArticle} item={item} />}
          ListEmptyComponent={EmptyComponent}
          onMomentumScrollBegin={() => userHasScrolled.current = true}
          refreshControl={
            <RefreshControl
              refreshing={loding}
              onRefresh={handleRefresh}
              // Android：传入颜色数组
              colors={Platform.OS === 'android' ? ['#3d8af5'] : undefined}
              // iOS：传入单个颜色
              tintColor={Platform.OS === 'ios' ? '#3d8af5' : undefined}
            />
          }
          onEndReached={loadNext}
          onEndReachedThreshold={0.2}
          masonry
          ListFooterComponent={loding || !DATA.length ? null : ListFooterComponent}
          contentContainerStyle={{ paddingHorizontal: 4, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
        />

      </ThemedView>

    </ThemedView>
  );
}

const styles = StyleSheet.create({

  topBar: {
    borderColor: '#e6e6e6',//#2a2a30
    borderBottomWidth: .5,
    paddingBottom: 10
  },
  footerText: {
    textAlign: 'center',
    paddingVertical: 10,
    fontSize: 12,
    letterSpacing: 1,
    opacity: 0.55,
  },
  ContainerStyle: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center'
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 88,
    paddingBottom: 48,
  },
  // 浅蓝圆底托住图标，比孤零零一个线框图标柔和
  emptyIconWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(61, 138, 245, 0.1)',   // #3d8af5 的 10%
    marginBottom: 18,
  },
  // 错误态：底色换成 #e5484d 的 10%，和正常空态一眼区分
  emptyIconWrapError: {
    backgroundColor: 'rgba(229, 72, 77, 0.1)',
  },
  emptyTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  emptyHint: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    opacity: 0.7,
  },
  // 空态行动按钮：主题蓝描边 + 淡蓝底
  emptyBtn: {
    marginTop: 22,
    paddingHorizontal: 22,
    paddingVertical: 9,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#3d8af5',
    backgroundColor: 'rgba(61, 138, 245, 0.08)',
  },
  // 重试进行中：按钮变淡，和「已禁用」对得上
  emptyBtnDisabled: {
    opacity: 0.5,
  },
  emptyBtnPressed: {
    opacity: 0.6,
  },
  emptyBtnText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: '#3d8af5',
  }

});

