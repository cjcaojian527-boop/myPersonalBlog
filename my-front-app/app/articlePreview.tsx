import { StyleSheet, Pressable, Image, Platform, View, TextInput, KeyboardAvoidingView, BackHandler, Keyboard, RefreshControl } from 'react-native';
import { useEffect, useState, useRef } from 'react'

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';
import { Ionicons } from '@expo/vector-icons';
import { toast } from 'sonner-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuthStore, useCurrentArticle } from '@/store';
import { publicStyles, FILE_BASEURI } from '@/utils/const';
import { postRequest } from '@/utils/api';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { FlashList, FlashListRef } from "@shopify/flash-list";
import { observe } from 'react-native-observable-list';
import ItemView from '@/components/ui/ItemView'
import CommentList from '@/components/ui/CommentList'
import { getCommentTrees, formatCommentTime, type CommentItem } from '@/utils/utils'

interface contextOpt {
    articleId: number;
    pageSize: number;
}

interface contextItem {
    content: string;
    elementType: string;
    order: number;
    articleId: number;
    id: number;
}



// 小红书那个红，只用在「关注」按钮上
const XHS_RED = '#3d8af5';

// 点亮色：点赞走红（跟 ItemView 里 PDF 卡片同一支），收藏走金黄
const ACTIVE_RED = '#e5484d';
const ACTIVE_GOLD = '#f5a623';

const ObservFlashList = observe(FlashList);

export default function ArticlePreview() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const [List, set_List] = useState<contextItem[]>([]);
    const listRef = useRef<FlashListRef<contextItem>>(null);
    const theme = Colors[colorScheme];
    const TouristsToken = useAuthStore(state => state.TouristsToken);
    const TouristsAuth = useAuthStore(state => state.TouristsAuth);
    const currentArticle = useCurrentArticle(state => state.Article);

    // 评论输入面板：点底部「说点什么」拉起来
    const [commentVisible, set_commentVisible] = useState<boolean>(false);
    const [commentText, set_commentText] = useState<string>('');
    // 面板一打开就要把键盘拉起来，得手动抓一下输入框
    const commentInputRef = useRef<TextInput>(null);

    // 回复目标：点评论区的「回复」时记下是谁，发送后清空
    const [replyTarget, set_replyTarget] = useState<CommentItem | null>(null);

    // 评论区：已登录就直接展示在 IP 属地下面，没有「收起」这个操作。
    // 底部气泡只负责把视图滚过去，不是开关
    const commentExpanded = !!TouristsToken;

    // 下拉刷新状态：给 FlashList 的内置 RefreshControl 用
    const [refreshing, set_refreshing] = useState<boolean>(false);

    const [commentLoading, set_commentLoading] = useState<boolean>(false);
    const [commentLoaded, set_commentLoaded] = useState<boolean>(false);
    const [commentList, set_commentList] = useState<CommentItem[]>([]);
    const [commentNodeMap, set_commentNodeMap] = useState<Map<number, CommentItem>>(new Map());
    const [commentCount, set_commentCount] = useState<number>(0);

    // 输入框的浅灰底 / 上下两条分割线颜色，都得跟着明暗模式走
    const boxBg = colorScheme === 'light' ? '#f5f5f5' : '#26262e';
    const lineColor = colorScheme === 'light' ? '#ececec' : '#2a2a30';

    // 这个游客赞没赞过当前文章：likeStrings 是逗号分隔的 id 串。
    // 先把空值兜成空串再 split，别写 likeStrings?.split(',').includes(...)——
    // ?. 只护住 split，字段是 undefined 时后面的 .includes 照样会抛
    const liked = (TouristsAuth.likeStrings ?? '').split(',').includes(String(currentArticle.id));
    const collected = (TouristsAuth.collects ?? '').split(',').includes(String(currentArticle.id));

    // 关注：focus 存的是博主（后台 User）的 id 串，和游客 id 是两套编号，
    // 千万别拿当前登录游客的 id 去比对。
    // 真正作数的是下面 effect 从数据库拉回来的那份；store 里的值只当首屏占位，
    // 免得进页面先闪一下「关注」再跳成「已关注」。
    const [focusIds, set_focusIds] = useState<string[]>(() =>
        String(useAuthStore.getState().TouristsAuth?.focus ?? '').split(',').filter(Boolean),
    );
    const authorId = currentArticle.User?.id ?? currentArticle.userId;
    const following = !!authorId && focusIds.includes(String(authorId));
    // 没登录就整块走弱化色：「灰」本身就是没有操作权限的视觉暗示。
    // 登录了以后：点亮 = 各自的点亮色，没点亮 = 正文色
    const relationColor = (active: boolean, activeColor: string) =>
        !TouristsToken
            ? theme.tabIconDefault
            : active
                ? activeColor
                : theme.text;

    const likeColor = relationColor(liked, ACTIVE_RED);       // 点赞：红
    const collectColor = relationColor(collected, ACTIVE_GOLD);   // 收藏：黄

    const Init = async (articleId: number) => {
        try {
            const context = await postRequest<contextOpt>("/api/context/getList", { articleId, pageSize: 1000 });
            if (context.code === 0) {
                if (context.data.list.length === 0) {
                    context.data.list = [{
                        id: Date.now(),
                        content: currentArticle.coverImage,
                        elementType: "image/png",
                        order: 1,
                        articleId: currentArticle.id,
                    }];
                }
                set_List(context.data.list.sort((a: contextItem, b: contextItem) => a.order - b.order));

            }
        } catch (error) {
            console.warn('获取失败：', error);
        } finally {

        }
    }


    /**
     * 点赞 / 收藏共用的一套「切换」逻辑：
     *   1. 把当前文章 id 加进 / 移出游客身上的 id 串
     *   2. 成功了再回写文章上的计数
     * 两边只差字段名，合成一个函数，免得以后改一处漏一处。
     */
    const toggleRelation = async (
        idField: 'likeStrings' | 'collects',      // 游客身上的 id 串
        countField: 'likes' | 'collects',         // 文章上的计数
    ) => {
        try {
            const ids: string[] = (TouristsAuth[idField] ?? '').split(',').filter(Boolean); // 去掉空串

            const currentId = String(currentArticle.id);
            const isActive = ids.includes(currentId);

            const nextIds = isActive
                ? ids.filter(id => id !== currentId)
                : [...ids, currentId];

            const resp = await postRequest("/api/touristsAuth/updateUser", {
                id: TouristsAuth.id,
                [idField]: nextIds.join(','),
            });

            if (resp.code !== 0) return;

            // 关键兜底：计数可能是 undefined 或 0，取消时直接 -1 就会掉成负数。
            // 先统一成数字，再 Math.max(0) 压住下界
            const base = Number(currentArticle[countField]) || 0;
            const nextCount = isActive ? Math.max(0, base - 1) : base + 1;

            useAuthStore.setState({ TouristsAuth: resp.data });

            const { code } = await postRequest("/api/artcle/update", {
                id: currentArticle.id,
                [countField]: nextCount,
            });

            if (code === 0) {
                const { Article } = useCurrentArticle.getState();
                useCurrentArticle.setState({ Article: { ...Article, [countField]: nextCount } });
            }
        } catch (error) {
            // 网络挂了别让 Promise 悬着，至少留条日志
            console.warn('点赞/收藏操作失败：', error);
        }
    };

    const likeClick = () => toggleRelation('likeStrings', 'likes');
    const collectClick = () => toggleRelation('collects', 'collects');

    /**
     * 关注 / 取消关注：
     * 把当前文章作者的 User.id 加进 / 移出游客身上的 focus 串。
     * 以页面里这份（来自数据库的）focusIds 为基准，成功后用后端返回的最新
     * 用户对象同时校准页面和 store。
     */
    const followClick = async () => {
        if (!TouristsToken) {
            toast('提示', { description: '登录后才能关注哦', duration: 1500, position: 'top-center' });
            return;
        }
        if (!authorId) return;

        try {
            const key = String(authorId);
            const isFollowing = focusIds.includes(key);
            const nextIds = isFollowing
                ? focusIds.filter(id => id !== key)
                : [...focusIds, key];

            const resp = await postRequest('/api/touristsAuth/updateUser', {
                id: TouristsAuth.id,
                focus: nextIds.join(','),
            });

            if (resp.code !== 0) {
                toast('提示', {
                    description: resp.message || '关注失败，请稍后再试',
                    duration: 1500,
                    position: 'top-center',
                });
                return;
            }

            // 以后端返回的 focus 为准，避免本地拼出来的值和库里不一致
            set_focusIds(String(resp.data?.focus ?? nextIds.join(',')).split(',').filter(Boolean));
            // store 顺手同步一份，别的页面拿到的也不再是旧值
            useAuthStore.setState({
                TouristsAuth: { ...useAuthStore.getState().TouristsAuth, ...resp.data },
            });
        } catch (error) {
            console.warn('关注操作失败：', error);
        }
    };


    // 拉评论：自动展开、点气泡、发评论、下拉刷新共用一份。
    // 已经拉过 / 正在拉就不重复请求；force 用于强制取最新列表
    const fetchComments = async (force = false) => {
        if (commentLoading) return;
        if (!force && commentLoaded) return;

        // 首次加载才亮转圈。下拉刷新时列表已经有内容，
        // 再切进 loading 会让评论区整块闪成转圈，反而显得卡
        if (!commentLoaded) set_commentLoading(true);
        try {
            const resp = await postRequest("/api/comment/getComment", {
                formData: { articleId: currentArticle.id },
                pageSize: 1000,
            });

            if (resp.code === 0 && resp.data?.list?.length) {
                // Commentobject === -1 是楼层，其余是回复，交给 getCommentTrees 归位
                const [Pnodes, nodeMap, count] = getCommentTrees(
                    resp.data.list.filter((f: CommentItem) => f.Commentobject === -1),
                    resp.data.list.filter((f: CommentItem) => f.Commentobject !== -1),
                    TouristsAuth,
                );
                set_commentList(Pnodes);
                set_commentNodeMap(nodeMap);
                set_commentCount(count);
            } else {
                set_commentList([]);
                set_commentNodeMap(new Map());
                set_commentCount(0);
            }
            set_commentLoaded(true);
        } catch (error) {
            console.warn('获取评论失败：', error);
        } finally {
            set_commentLoading(false);
        }
    };

    /**
     * 下拉刷新：只刷评论，正文不动。
     * 正文是写好的内容，重新拉一遍既慢又没必要；
     * 评论才是会变的那部分（新评论、审核状态）。
     * 未登录时评论区没铺出来，刷了也没处显示，直接不请求。
     */
    const handleRefresh = async () => {
        if (refreshing) return;
        set_refreshing(true);
        try {
            if (commentExpanded) await fetchComments(true);
        } finally {
            set_refreshing(false);
        }
    };

    /**
     * 把视图滚到评论区开头。
     * 不用 footer 的 onLayout：它拿到的 y 是相对 footer 包裹层的，恒为 0。
     * 列表自己知道 items 的高度（不含 header/footer），
     *   items 结束的位置 = header 高度 + items 高度
     * 正好就是 footer（IP 属地 + 评论区）的起点。
     *
     * 评论区是倒序的（最新几条在最上面），所以只认这个位置，
     * 绝不能退化成 scrollToEnd —— 滚到最底就是最老的评论了。
     */
    const scrollToComments = () => {
        const list = listRef.current;
        if (!list) return;

        const run = () => {
            try {
                const itemsBottom = list.getFirstItemOffset() + list.getChildContainerDimensions().height;
                list.scrollToOffset({
                    offset: Math.max(0, itemsBottom - 8),
                    animated: true,
                    skipFirstItemOffset: true,
                });
                return true;
            } catch {
                return false;
            }
        };

        // 等一帧让评论挂载完；布局还没建好就再试一次
        setTimeout(() => {
            if (!run()) setTimeout(run, 300);
        }, 120);
    };

    // 点底部气泡：评论区一直铺在 IP 属地下面，这里只负责把视图带过去。
    // 不是开关——反复点只有「滚到评论区」这一个作用
    const openCommentList = () => {
        // 跟 web 端一致：没登录不给看，也不发请求
        if (!TouristsToken) {
            toast('提示', { description: '登录后才能查看评论哦', duration: 1500, position: 'top-center' });
            return;
        }

        fetchComments();
        scrollToComments();
    };





    useEffect(() => {
        // 跟下面拉评论同一个套路：放进定时器避开「effect 内同步 setState」的规则，
        // 也让正文先上屏，别让正文请求抢在首帧前面
        const timer = setTimeout(() => { Init(currentArticle.id); }, 0);
        return () => clearTimeout(timer);
    }, [currentArticle.id]);

    /**
     * 关注状态以数据库为准：
     * 每次进详情页（以及登录态变化时）都查一次当前游客的最新资料，
     * 拿库里的 focus 覆盖本地。这样在数据库里手动改过 focus，前台也能立刻对上，
     * 不会出现「库里清空了、App 还显示已关注」的情况。
     * store 里那份只在首屏当占位，拉回来后就作废。
     */
    useEffect(() => {
        if (!TouristsToken || !TouristsAuth.id) {
            // 退出登录后立刻清掉，别让上一位游客的关注状态留在页面上
            const timer = setTimeout(() => set_focusIds([]), 0);
            return () => clearTimeout(timer);
        }

        let cancelled = false;
        const timer = setTimeout(async () => {
            try {
                const resp = await postRequest('/api/touristsAuth/queryUsers', {
                    page: 1,
                    pageSize: 1,
                    formData: { id: TouristsAuth.id },
                });
                const latest = resp.code === 0 ? resp.data?.list?.[0] : null;
                if (cancelled || !latest) return;

                set_focusIds(String(latest.focus ?? '').split(',').filter(Boolean));
                // 顺手把最新资料写回 store，点赞 / 收藏这些字段也跟着校准
                useAuthStore.setState({
                    TouristsAuth: { ...useAuthStore.getState().TouristsAuth, ...latest },
                });
            } catch (error) {
                console.warn('获取关注状态失败：', error);
            }
        }, 0);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [TouristsToken, TouristsAuth.id]);

    // 已登录时 commentExpanded 一上来就是 true，直接开拉评论；
    // 未登录不会走到这儿（评论区和请求一起收起来）。
    // 放进定时器有两个好处：避开「effect 内同步 setState」的规则，
    // 也让正文先渲染出来，别让评论请求抢在正文前面
    useEffect(() => {
        if (!commentExpanded) return;
        const timer = setTimeout(() => { fetchComments(); }, 0);
        return () => clearTimeout(timer);
        // fetchComments 每次渲染都是新函数，但它内部用 commentLoaded / commentLoading 挡住了重复请求
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [commentExpanded]);

    // 发评论：游客统一走审核（后端不传 isPass 就是 pending）
    const handleSend = async () => {
        // 兜底：面板虽然已经挡在前面，但别让任何路径绕过登录校验
        if (!TouristsToken) return;
        const text = commentText.trim();
        if (!text) return;

        try {
            const resp = await postRequest("/api/comment/addComment", {
                articleId: currentArticle.id,
                tId: TouristsAuth.id,
                // 新楼层不传这个字段，模型默认 -1；点「回复」才带目标评论 id
                Commentobject: replyTarget?.id,
                context: text,
            });

            if (resp.code !== 0) {
                toast('评论失败', {
                    description: resp.message || '请稍后再试',
                    duration: 1500,
                    position: 'top-center',
                });
                return;
            }

            // 游客评论进审核队列：先收面板清输入，再强制拉一次最新列表。
            // 自己的待审评论会带「审核中」标签显示出来
            set_commentText('');
            set_replyTarget(null);
            set_commentVisible(false);
            toast('评论成功', {
                description: '已提交，审核通过后大家都能看到',
                duration: 1500,
                position: 'top-center',
            });

            await fetchComments(true);
            scrollToComments();
        } catch (error: any) {
            console.warn('发送评论失败：', error);
            // 401 已经由 axios 拦截器统一提示并清掉登录态，这里别再弹「网络异常」误导人
            if (error?.isAuthExpired) return;
            toast('评论失败', {
                description: '网络异常，请稍后再试',
                duration: 1500,
                position: 'top-center',
            });
        }
    };

    // 面板一出现就把键盘拉起来。
    // 等一帧再 focus：输入框刚挂上时立刻调 focus() 会被吞掉
    useEffect(() => {
        if (!commentVisible) return;
        const timer = setTimeout(() => commentInputRef.current?.focus(), 50);
        return () => clearTimeout(timer);
    }, [commentVisible]);

    // Android：面板开着时按返回键先收面板，别直接退出页面。
    // 注意：键盘弹着的时候这层根本收不到事件（第一次返回被系统拿去收键盘），
    // 真正兜住那种情况的是下面的键盘监听
    useEffect(() => {
        if (!commentVisible) return;
        const sub = BackHandler.addEventListener('hardwareBackPress', () => {
            set_commentVisible(false);
            return true;
        });
        return () => sub.remove();
    }, [commentVisible]);

    // 键盘一收，面板跟着收。
    // 这样「点遮罩空白 / 按侧边返回 / 手动收键盘」三种操作都只要一次：
    //   - iOS 键盘弹着时第一次点空白，触摸会被系统吞去收键盘，遮罩的 onPress 不触发
    //   - Android 键盘弹着时第一次按返回，同样被系统拿去收键盘，hardwareBackPress 不触发
    // 所以不靠点击回调，改听「键盘正在/已经收起」这个系统事件。
    // iOS 用 willHide（键盘一边收面板一边退，不拖泥带水），Android 只有 didHide
    useEffect(() => {
        if (!commentVisible) return;
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
        const sub = Keyboard.addListener(hideEvent, () => set_commentVisible(false));
        return () => sub.remove();
    }, [commentVisible]);

    return (
        <ThemedView style={[publicStyles.flex_1, { paddingTop: insets.top }]}>

            {/* ── 顶部：返回 + 头像 + 昵称 + 关注 + 分享 ──────── */}
            <ThemedView style={[styles.header, { borderBottomColor: lineColor }]}>
                <Pressable onPress={() => router.back()} hitSlop={10}>
                    <SimpleLineIcons name="arrow-left" size={22} color={theme.text} />
                </Pressable>

                <Image
                    source={{ uri: FILE_BASEURI + currentArticle.User.avatar }}
                    style={styles.avatar}
                />

                {/* flex:1 把右边两个挤到最边上 */}
                <ThemedText numberOfLines={1} style={styles.authorName}>
                    {currentArticle.User.name_display}
                </ThemedText>

                <Pressable
                    onPress={followClick}
                    style={({ pressed }) => [
                        styles.followBtn,
                        following && [styles.followBtnActive, { backgroundColor: boxBg }],
                        pressed && styles.followBtnPressed,
                    ]}
                >
                    <ThemedText
                        style={[
                            styles.followText,
                            { color: following ? theme.tabIconDefault : XHS_RED },
                        ]}
                    >
                        {following ? '已关注' : '关注'}
                    </ThemedText>
                </Pressable>

                <Pressable hitSlop={10}>
                    <SimpleLineIcons name="share" size={20} color={theme.text} />
                </Pressable>
            </ThemedView>

            {/* ── 中间：内容区占位（图片轮播 / 标题 / 正文以后放这）── */}
            <ThemedView style={[styles.contentBox]}>
                <ObservFlashList
                    ref={listRef}
                    data={List}
                    ListHeaderComponent={
                        <ThemedView style={styles.titleBlock}>
                            <ThemedText style={styles.articleTitle}>{currentArticle.title}</ThemedText>
                            <View style={[styles.titleBar, { backgroundColor: XHS_RED }]} />
                        </ThemedView>
                    }
                    keyExtractor={(item) => item.id + ''}
                    renderItem={({ item }) => <ItemView item={item} />}

                    contentContainerStyle={{ paddingHorizontal: 4, paddingTop: 8 }}
                    ListFooterComponent={
                        <ThemedView>
                            <ThemedView style={styles.metaRow}>
                                {/* 发布日期：接详情接口后换成 currentArticle.createdAt */}
                                <ThemedText style={[styles.metaText, { color: theme.tabIconDefault }]}>
                                    {formatCommentTime(currentArticle.createdAt)}
                                </ThemedText>
                                {/* IP 属地：同上，先写死 */}
                                <ThemedText style={[styles.metaText, { color: theme.tabIconDefault }]}>
                                    {currentArticle.ClientIp}
                                </ThemedText>
                            </ThemedView>

                            {/* 评论区就铺在 IP 属地下面，跟着正文一起滚 */}
                            {commentExpanded && (
                                <CommentList
                                    comments={commentList}
                                    nodeMap={commentNodeMap}
                                    commentCount={commentCount}
                                    currentArticle={currentArticle}
                                    loading={commentLoading}
                                    onReply={(target) => {
                                        // 借底部那个输入面板回复，先记住回的是谁
                                        set_replyTarget(target);
                                        set_commentVisible(true);
                                    }}
                                />
                            )}
                        </ThemedView>
                    }
                    showsVerticalScrollIndicator={false}
                    // 下拉刷新：跟首页同一个原生 RefreshControl、同一支蓝
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            // Android：传入颜色数组
                            colors={Platform.OS === 'android' ? ['#3d8af5'] : undefined}
                            // iOS：传入单个颜色
                            tintColor={Platform.OS === 'ios' ? '#3d8af5' : undefined}
                        />
                    }
                />
            </ThemedView>

            {/* ── 底部：评论输入 + 点赞 / 收藏 / 评论 ───────────── */}
            <ThemedView style={[styles.bottomBar, {
                borderTopColor: lineColor,
                // 有手势条就贴着它，没有（比如老安卓）至少留 10
                paddingBottom: Math.max(insets.bottom, 10),
            }]}>
                {/* 已登录就在「说点什么」左边露出自己的头像；未登录整块不渲染 */}
                {TouristsToken && (
                    TouristsAuth.avatar ? (
                        <Image
                            source={{ uri: FILE_BASEURI + TouristsAuth.avatar }}
                            style={styles.myAvatar}
                        />
                    ) : (
                        // 注册时头像可以不传，没图就落一个灰底小人，别让 Image 去请求空地址
                        <View style={[styles.myAvatar, styles.myAvatarFallback, { backgroundColor: boxBg }]}>
                            <SimpleLineIcons name="user" size={16} color={theme.tabIconDefault} />
                        </View>
                    )
                )}

                {/* 做成壳子不接输入：点它以后是要拉起评论区的 */}
                <Pressable
                    style={[styles.commentBox, { backgroundColor: boxBg }]}
                    onPress={() => {
                        // 没登录就不拉起输入面板，给一句明确的说明
                        if (!TouristsToken) {
                            toast('提示', {
                                description: '登录后才能评论哦',
                                duration: 1500,
                                position: 'top-center',
                            });
                            return;
                        }
                        // 主动发新评论时清掉上一次的回复目标
                        set_replyTarget(null);
                        set_commentVisible(true);
                    }}
                >

                    <SimpleLineIcons name="pencil" size={14} color={theme.tabIconDefault} />
                    <ThemedText style={[styles.commentPlaceholder, { color: theme.tabIconDefault }]}>
                        {TouristsToken ? '说点什么...' : '登录后才能评论'}
                    </ThemedText>
                </Pressable>

                <ThemedView style={styles.actionGroup}>
                    {/* 未登录时整块置灰 + disabled，视觉和点击权限一起收掉。
                        点击事件由老大自己接，这里只负责「能不能点」 */}
                    <Pressable
                        onPress={likeClick}
                        style={[styles.actionItem, !TouristsToken && styles.actionItemDisabled]}
                        hitSlop={6}
                        disabled={!TouristsToken}
                    >
                        {liked
                            ? <Ionicons name="heart" size={21} color={likeColor} />
                            : <Ionicons name="heart-outline" size={21} color={likeColor} />}
                        {/* <SimpleLineIcons name="heart" size={21} color={theme.text} /> */}
                        <ThemedText style={[styles.actionCount, { color: likeColor }]}>
                            {currentArticle.likes || 0}
                        </ThemedText>
                    </Pressable>

                    <Pressable
                        onPress={collectClick}
                        style={[styles.actionItem, !TouristsToken && styles.actionItemDisabled]}
                        disabled={!TouristsToken}
                        hitSlop={6}>
                        {collected
                            ? <Ionicons name="star" size={21} color={collectColor} />
                            : <Ionicons name="star-outline" size={21} color={collectColor} />}
                        {/* <SimpleLineIcons name="star" size={21} color={theme.text} /> */}
                        <ThemedText style={[styles.actionCount, { color: collectColor }]}>
                            {currentArticle.collects || 0}
                        </ThemedText>
                    </Pressable>

                    {/* 评论数：登录后才拉评论，所以未登录不占位；未登录同样置灰、不可点 */}
                    <Pressable
                        onPress={openCommentList}
                        style={[styles.actionItem, !TouristsToken && styles.actionItemDisabled]}
                        hitSlop={6}
                        disabled={!TouristsToken}
                    >
                        <SimpleLineIcons
                            name="bubble"
                            size={21}
                            color={TouristsToken ? theme.text : theme.tabIconDefault}
                        />
                        {TouristsToken && (
                            <ThemedText style={[styles.actionCount, { color: theme.text }]}>
                                {commentCount}
                            </ThemedText>
                        )}
                    </Pressable>
                </ThemedView>
            </ThemedView>

            {/* ── 评论输入面板：点底部「说点什么」从下往上拉起 ──────
                这里没有用 Modal。RN 的 Modal 在 iOS 上会开一个独立的原生窗口，
                输入框挂在那儿的时候 focus() 经常落空，表现为「第一次不弹键盘、
                得再点一次输入框」。改成页面内的绝对定位覆盖层后，输入框跟页面
                同一棵树，焦点和键盘都正常。 */}
            {commentVisible && TouristsToken && (
                <KeyboardAvoidingView
                    style={[StyleSheet.absoluteFill, styles.commentOverlay]}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    {/* 遮罩：点空白处收起 */}
                    <Pressable style={styles.commentMask} onPress={() => set_commentVisible(false)} />

                    <ThemedView style={[styles.commentSheet, { paddingBottom: Math.max(insets.bottom, 14) }]}>
                        {/* 从评论区点「回复」进来时，先亮明在回谁 */}
                        {replyTarget && (
                            <View style={[styles.replyHint, { backgroundColor: boxBg }]}>
                                <ThemedText
                                    style={[styles.replyHintText, { color: theme.tabIconDefault }]}
                                    numberOfLines={1}
                                >
                                    {`回复 ${replyTarget.Tourist?.nickName || replyTarget.User?.nickName || replyTarget.User?.name || '游客'}`}
                                </ThemedText>
                                {/* 回复的是作者，也把身份亮出来（跟 web 端一致） */}
                                {!!currentArticle.userId && currentArticle.userId === replyTarget.User?.id && (
                                    <View style={styles.replyAuthorTag}>
                                        <ThemedText style={styles.replyAuthorTagText}>作者</ThemedText>
                                    </View>
                                )}
                                <Pressable hitSlop={8} onPress={() => set_replyTarget(null)}>
                                    <SimpleLineIcons name="close" size={12} color={theme.tabIconDefault} />
                                </Pressable>
                            </View>
                        )}

                        {/* 输入框外面包一层，好把清空叉叉摆在框内右上角 */}
                        <View style={styles.inputWrap}>
                            <TextInput
                                ref={commentInputRef}
                                style={[styles.commentInput, { backgroundColor: boxBg, color: theme.text }]}
                                value={commentText}
                                onChangeText={set_commentText}
                                placeholder="有话要说，快来评论"
                                placeholderTextColor={theme.tabIconDefault}
                                multiline
                            />

                            {/* 有内容才给叉叉，没内容摆着也是摆设 */}
                            {commentText.length > 0 && (
                                <Pressable
                                    style={styles.clearBtn}
                                    onPress={() => {
                                        set_commentText('');
                                        commentInputRef.current?.focus();   // 清完别让键盘掉下去
                                    }}
                                    hitSlop={8}
                                >
                                    <SimpleLineIcons name="close" size={11} color="#ffffff" />
                                </Pressable>
                            )}
                        </View>

                        <View style={styles.commentToolRow}>
                            <Pressable
                                style={[styles.sendBtn, { opacity: commentText.trim() ? 1 : 0.45 }]}
                                disabled={!commentText.trim()}
                                onPress={handleSend}
                            >
                                <ThemedText style={styles.sendText}>发送</ThemedText>
                            </Pressable>
                        </View>
                    </ThemedView>
                </KeyboardAvoidingView>
            )}

        </ThemedView>
    );
}


const styles = StyleSheet.create({

    // ── 顶部 ─────────────────────────────────────
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        gap: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#e9e9e9',   // 头像没加载出来时的灰底
    },
    authorName: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
    },
    followBtn: {
        minWidth: 64,                 // 关注 / 已关注 字数不同，固定宽度防止头像和昵称抖动
        alignItems: 'center',
        borderWidth: 1,
        borderColor: XHS_RED,
        borderRadius: 9999,           // 胶囊
        paddingHorizontal: 16,
        paddingVertical: 5,
    },
    // 已关注：撤掉描边，换成浅灰底 + 灰字，弱化成「可再次点击取消」
    followBtnActive: {
        borderColor: 'transparent',
    },
    followBtnPressed: {
        opacity: 0.6,
    },
    followText: {
        fontSize: 14,
        lineHeight: 20,
        color: XHS_RED,
    },

    // ── 文章标题 ──────────────────────────────────
    // contentBox 已经给了 5、列表又给了 4，这里再补 5，正好跟顶部栏的 14 对齐
    titleBlock: {
        paddingHorizontal: 5,
        marginTop: 6,
        marginBottom: 18,
    },
    articleTitle: {
        fontSize: 22,
        lineHeight: 32,        // 中文行高必须跟字号成对写，否则多行会挤在一起
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    titleBar: {
        width: 28,
        height: 3,
        borderRadius: 2,
        marginTop: 12,
    },

    // ── 正文末尾的「日期 + IP」 ─────────────────────
    // 横向排一行，跟标题同一条左边线
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 5,
        marginTop: 24,        // 跟上面的正文拉开，别贴在一起
        marginBottom: 20,
    },
    metaText: {
        fontSize: 13,
        lineHeight: 18,
    },

    // ── 评论输入面板 ──────────────────────────────
    // 盖在整页（含底部栏）之上
    commentOverlay: {
        zIndex: 10,
        elevation: 10,      // Android 上 zIndex 不一定够，补一个 elevation
    },
    // 遮罩：吃掉剩余高度，点它 = 收起面板
    commentMask: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
    },
    // 从底部升起的那块白色板子，只有上面两个角是圆的
    commentSheet: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 14,
        paddingTop: 18,
    },
    // 回复目标提示条：横在输入框上方，浅灰底
    replyHint: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: 10,
    },
    replyHintText: {
        flex: 1,
        fontSize: 12,
        lineHeight: 16,
    },
    // 「回复 XXX」里的作者小标签
    replyAuthorTag: {
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 4,
        backgroundColor: XHS_RED + '1a',
    },
    replyAuthorTagText: {
        fontSize: 10,
        lineHeight: 14,
        fontWeight: '600',
        color: XHS_RED,
    },
    // 输入框的定位壳子，给右上角那个叉叉当坐标系
    inputWrap: {
        position: 'relative',
    },
    // 输入框：浅灰底（跟随 boxBg）、多行、够高
    commentInput: {
        minHeight: 96,
        maxHeight: 160,
        borderRadius: 12,
        paddingHorizontal: 14,
        // 右边多留一点，文字别钻到叉叉底下
        paddingRight: 40,
        paddingTop: 12,
        paddingBottom: 12,
        fontSize: 16,
        lineHeight: 22,
        textAlignVertical: 'top',   // Android：多行从顶部开始写，别垂直居中
    },
    // 清空按钮：灰圆底白叉，跟 iOS 输入框的清空按钮一个路子
    clearBtn: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#b0b0b0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    // 工具栏：只留一个「发送」，靠右
    commentToolRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 14,
    },
    sendBtn: {
        backgroundColor: XHS_RED,
        borderRadius: 9999,         // 胶囊
        paddingHorizontal: 24,
        paddingVertical: 8,
    },
    sendText: {
        fontSize: 15,
        lineHeight: 20,
        color: '#fff',              // 红底白字，压过 ThemedText 的主题色
    },

    // ── 中间占位 ──────────────────────────────────
    // flex:1 把底部栏顶到屏幕最下面
    contentBox: {
        flex: 1,
        paddingHorizontal: 5

    },

    // ── 底部 ─────────────────────────────────────
    bottomBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingTop: 8,
        gap: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    // 底部评论框左边那个「我」的头像，尺寸跟输入框高度对齐
    myAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#e9e9e9',   // 图片没加载出来时的灰底
    },
    myAvatarFallback: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    commentBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        height: 36,
        borderRadius: 18,             // 高度的一半 = 胶囊
        paddingHorizontal: 14,
        gap: 6,
    },
    commentPlaceholder: {
        fontSize: 14,
    },
    actionGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    // 未登录：再压一层透明度。disabled 已经挡住点击，这里只负责「看起来不能点」
    actionItemDisabled: {
        opacity: 0.45,
    },
    actionCount: {
        fontSize: 14,
    },
    emptyWrap: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 300,
    },
    // 图标用的是 tabIconDefault 这个弱化色，下面两行靠字号 + 透明度拉层次，
    // 明暗两种配色下都自动适配，不用再写死颜色
    emptyTitle: {
        marginTop: 16,
        fontSize: 15,
        letterSpacing: 2,
        opacity: 0.8,
    },
    emptyHint: {
        marginTop: 8,
        fontSize: 12,
        letterSpacing: 0.5,
        opacity: 0.5,
    }

});
