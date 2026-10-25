import { StyleSheet, Pressable, Image, View, Platform, RefreshControl, ActivityIndicator } from 'react-native';
import { useCallback, useRef, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { toast } from 'sonner-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuthStore, useCurrentArticle } from '@/store';
import { publicStyles, FILE_BASEURI } from '@/utils/const';
import { postRequest } from '@/utils/api';
import type { CommentItem } from '@/utils/utils';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

// 主题蓝，跟首页、评论区的强调色保持一致
const ACCENT = '#3d8af5';
// 后端单页上限就是 100 条，这里按满页拉，少发几轮请求
const PAGE_SIZE = 100;
// 分页兜底：最多拉 10 页（1000 条），防止后端数据异常时无限循环
const MAX_PAGES = 10;

// 顶部两个 tab：互动消息 / 对我点赞
const TABS = [
    { key: 'reply' as const, label: '互动消息' },
    { key: 'like' as const, label: '对我点赞' },
];
type TabKey = (typeof TABS)[number]['key'];

// tab 布局：固定宽度，指示条在两段文字正下方滑动
const TAB_WIDTH = 88;
const TAB_GAP = 16;
const TAB_BAR_WIDTH = 20;
const TAB_BAR_LEFT = (TAB_WIDTH - TAB_BAR_WIDTH) / 2;

const SWIPE_TRIGGER = 60;
const SWIPE_VELOCITY = 350;

/** getComment 的一条回复，额外带上它所属的文章（后端只给了 id + title） */
interface MessageItem extends CommentItem {
    ArticleList?: { id: number; title?: string; coverImage?: string } | null;
}

/** 两个 tab 统一的列表项结构，回复和点赞共用一套渲染 */
interface FeedItem {
    /** 已读持久化的唯一键：r_评论id / l_点赞人id_评论id */
    key: string;
    kind: 'reply' | 'like';
    senderName: string;
    avatar?: string;
    text: string;
    createdAt?: string;
    articleId?: number;
    articleTitle?: string;
}

/** 消息时间用相对时间，超过一周才显示具体日期 */
const formatTime = (iso?: string): string => {
    if (!iso) return '';
    const time = new Date(iso).getTime();
    if (Number.isNaN(time)) return '';

    const diff = Date.now() - time;
    const minute = 60 * 1000;
    if (diff < minute) return '刚刚';
    if (diff < 60 * minute) return `${Math.floor(diff / minute)} 分钟前`;
    if (diff < 24 * 60 * minute) return `${Math.floor(diff / (60 * minute))} 小时前`;
    if (diff < 7 * 24 * 60 * minute) return `${Math.floor(diff / (24 * 60 * minute))} 天前`;

    const d = new Date(time);
    return `${d.getMonth() + 1} 月 ${d.getDate()} 日`;
};

/**
 * 消息页，两个 tab：
 * 1. 互动消息：别人回复我的评论
 * 2. 对我点赞：别人给我的评论点赞
 *
 * 点赞的数据在后端没有独立消息表，只能反查：
 * 游客表里的 commentLikeStrings 存的是「点赞人id_文章id_评论id」三元组，
 * 把所有游客的该字段拆开，第三段评论 id 落在「我的评论」里，就是给我的点赞。
 */
export default function MessagesScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme];

    const TouristsToken = useAuthStore(state => state.TouristsToken);
    const TouristsAuth = useAuthStore(state => state.TouristsAuth);

    const [tab, set_tab] = useState<TabKey>('reply');

    // 两个 tab 各自的数据
    const [replies, set_replies] = useState<FeedItem[]>([]);
    const [likes, set_likes] = useState<FeedItem[]>([]);
    const [loading, set_loading] = useState<boolean>(false);
    const [likeLoading, set_likeLoading] = useState<boolean>(false);
    const [refreshing, set_refreshing] = useState<boolean>(false);

    // 用 ref 而不是 state：避免 loaded 进依赖后把 useFocusEffect 带成死循环
    const replyLoadedRef = useRef<boolean>(false);
    const likeLoadedRef = useRef<boolean>(false);

    // 正在打开哪条消息的文章，防止连点重复请求
    const [openingKey, set_openingKey] = useState<string | null>(null);

    // 文章封面：articleId -> coverImage 相对路径。先渲染列表，再一条条异步补图
    const [coverMap, set_coverMap] = useState<Record<number, string>>({});
    const fetchedCoversRef = useRef<Set<number>>(new Set());

    // 已读消息：按账号分开存，退出登录 / 换账号互不影响。
    // 键是字符串（回复 r_xx、点赞 l_xx_xx），旧版本存的纯数字按回复消息兼容
    const readKey = `message_read_${TouristsAuth.id ?? 'guest'}`;
    const [readIds, set_readIds] = useState<Set<string>>(new Set());
    const [readLoaded, set_readLoaded] = useState<boolean>(false);

    // ── tab 指示条动画 ────────────────────────────
    const barX = useSharedValue(TAB_BAR_LEFT);
    const indicatorStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: barX.get() }],
    }));

    const switchTab = (next: TabKey) => {
        if (next === tab) return;
        set_tab(next);
        const index = TABS.findIndex(t => t.key === next);
        barX.set(withSpring(index * (TAB_WIDTH + TAB_GAP) + TAB_BAR_LEFT, {
            damping: 18, stiffness: 180, mass: 0.8,
        }));
    };

    // 左右滑动切 tab：只认水平位移，纵向留给列表滚动
    const swipeGesture = Gesture.Pan()
        .runOnJS(true)
        .activeOffsetX([-16, 16])
        .failOffsetY([-16, 16])
        .onEnd((e) => {
            if (tab === 'reply' && (e.translationX < -SWIPE_TRIGGER || e.velocityX < -SWIPE_VELOCITY)) {
                switchTab('like');
            } else if (tab === 'like' && (e.translationX > SWIPE_TRIGGER || e.velocityX > SWIPE_VELOCITY)) {
                switchTab('reply');
            }
        });

    const boxBg = colorScheme === 'light' ? '#f5f5f5' : '#26262e';
    const lineColor = colorScheme === 'light' ? '#ececec' : '#2a2a30';
    // 未读行的淡蓝底：浅色下若隐若现，深色下提亮一点但不出戏
    const unreadBg = colorScheme === 'light' ? '#f2f7ff' : '#1c2433';

    // ── 已读状态：每次进页面都重读本地记录 ──────────────
    // 用 useFocusEffect 而不是 useEffect：设置页「清理缓存」会删掉这条记录，
    // 切回消息页时重读一次，红点才能立刻消失，不用重启 App
    useFocusEffect(
        useCallback(() => {
            let cancelled = false;

            (async () => {
                // 换账号时先回到加载态，再读新账号的记录
                set_readLoaded(false);
                try {
                    const raw = await AsyncStorage.getItem(readKey);
                    const ids: (string | number)[] = raw ? JSON.parse(raw) : [];
                    const next = new Set(
                        (Array.isArray(ids) ? ids : []).map(v => (typeof v === 'number' ? `r_${v}` : String(v))),
                    );
                    if (!cancelled) set_readIds(next);
                } catch (error) {
                    console.warn('读取消息已读记录失败：', error);
                    if (!cancelled) set_readIds(new Set());
                } finally {
                    if (!cancelled) set_readLoaded(true);
                }
            })();

            return () => { cancelled = true; };
        }, [readKey]),
    );

    const markRead = (key: string) => {
        if (readIds.has(key)) return;

        const next = new Set(readIds);
        next.add(key);
        set_readIds(next);
        // 落盘失败不影响本次会话内的已读状态
        AsyncStorage.setItem(readKey, JSON.stringify([...next])).catch(error => {
            console.warn('保存消息已读记录失败：', error);
        });
    };

    // ── 文章封面：串行补图，一条请求回来再发下一条 ────────
    const fetchCovers = useCallback(async (articleIds: number[]) => {
        for (const articleId of articleIds) {
            if (!articleId || fetchedCoversRef.current.has(articleId)) continue;
            fetchedCoversRef.current.add(articleId);

            try {
                const resp = await postRequest('/api/artcle/getList', {
                    pageNum: 1,
                    pageSize: 1,
                    formData: { idStrings: String(articleId) },
                });
                const cover = resp.code === 0 ? resp.data?.list?.[0]?.coverImage : '';
                if (cover) {
                    set_coverMap(prev => ({ ...prev, [articleId]: cover }));
                }
            } catch (error) {
                console.warn('获取文章封面失败：', error);
            }
        }
    }, []);

    // ── 互动消息：别人回复我的评论 ──────────────────────
    const fetchReplies = useCallback(async (isRefresh = false) => {
        if (!TouristsToken) {
            // 退出登录：立刻清空，并把缓存开关复位，重新登录后才会重新拉
            set_replies([]);
            replyLoadedRef.current = false;
            return;
        }

        if (isRefresh) {
            set_refreshing(true);
        } else if (!replyLoadedRef.current) {
            // 只有第一次进来才亮转圈；切回 tab 时静默刷新
            set_loading(true);
        }

        try {
            const resp = await postRequest('/api/comment/getComment', {
                page: 1,
                pageSize: PAGE_SIZE,
                // 只拿审核通过的：待审核 / 被驳回的回复不该出现在消息里
                formData: { CommentStatus: 'approved' },
            });

            if (resp.code === 0) {
                const all: MessageItem[] = resp.data?.list ?? [];
                const byId = new Map<number, MessageItem>();
                all.forEach(c => byId.set(c.id, c));

                const mine: MessageItem[] = [];
                all.forEach(reply => {
                    // 后端已按状态筛过，这里再兜一层，防止参数被忽略时漏网
                    if (reply.CommentStatus !== 'approved') return;
                    if (reply.Commentobject === -1) return;        // 一级评论不是回复
                    if (reply.tId === TouristsAuth.id) return;     // 自己回自己不算消息

                    const parent = byId.get(reply.Commentobject);
                    // 父评论是我发的 → 这条就是别人回复我的
                    if (parent && parent.tId === TouristsAuth.id) mine.push(reply);
                });

                mine.sort(
                    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
                );

                const items: FeedItem[] = mine.map(item => {
                    // 回复者可能是游客，也可能是后台 User，两边字段名略有不同
                    const sender = item.Tourist ?? item.User;
                    return {
                        key: `r_${item.id}`,
                        kind: 'reply',
                        senderName: sender?.nickName || sender?.name || '匿名用户',
                        avatar: sender?.avatar,
                        text: item.context ?? '',
                        createdAt: item.createdAt,
                        articleId: item.ArticleList?.id ?? item.articleId,
                        articleTitle: item.ArticleList?.title,
                    };
                });

                set_replies(items);
                // 不 await：列表先上屏，封面在后面一条条补
                fetchCovers(items.map(i => i.articleId).filter(Boolean) as number[]);
            }
        } catch (error) {
            console.warn('获取互动消息失败：', error);
        } finally {
            set_loading(false);
            set_refreshing(false);
            replyLoadedRef.current = true;
        }
    }, [TouristsToken, TouristsAuth.id, fetchCovers]);

    // ── 对我点赞：反查所有游客的 commentLikeStrings ──────
    const fetchLikes = useCallback(async (isRefresh = false) => {
        if (!TouristsToken) {
            // 退出登录：立刻清空，并把缓存开关复位，重新登录后才会重新拉
            set_likes([]);
            likeLoadedRef.current = false;
            return;
        }

        if (isRefresh) {
            set_refreshing(true);
        } else if (!likeLoadedRef.current) {
            set_likeLoading(true);
        }

        try {
            // 1. 先把「我的评论」全部拉回来（含所属文章的 id / title）
            const myComments: CommentItem[] = [];
            for (let page = 1; page <= MAX_PAGES; page++) {
                const resp = await postRequest('/api/comment/getComment', {
                    page,
                    pageSize: PAGE_SIZE,
                    // 只有审核通过的评论被点赞才算数，待审核 / 驳回的一律不展示
                    formData: { tId: TouristsAuth.id, CommentStatus: 'approved' },
                });
                if (resp.code !== 0) break;
                const list: CommentItem[] = resp.data?.list ?? [];
                myComments.push(...list);
                if (list.length < PAGE_SIZE) break;
            }

            const commentMap = new Map<number, CommentItem>();
            myComments.forEach(c => commentMap.set(c.id, c));

            // 2. 再把所有游客拉回来（分页），准备反查三元组
            const tourists: any[] = [];
            for (let page = 1; page <= MAX_PAGES; page++) {
                const resp = await postRequest('/api/touristsAuth/queryUsers', {
                    page,
                    pageSize: PAGE_SIZE,
                    formData: {},
                });
                if (resp.code !== 0) break;
                const list = resp.data?.list ?? [];
                tourists.push(...list);
                if (list.length < PAGE_SIZE) break;
            }

            // 3. 拆三元组：评论 id 落在我的评论里 → 他赞了我的评论
            const seen = new Set<string>();
            const items: FeedItem[] = [];
            tourists.forEach(user => {
                if (user.id === TouristsAuth.id) return;      // 自己赞自己不算

                const triples = String(user.commentLikeStrings ?? '')
                    .split(',')
                    .filter(Boolean);

                triples.forEach((triple: string) => {
                    const parts = triple.split('_');
                    if (parts.length !== 3) return;

                    const commentId = Number(parts[2]);
                    const comment = commentMap.get(commentId);
                    if (!comment) return;                      // 不是我发的评论，跳过
                    if (comment.CommentStatus !== 'approved') return;  // 状态兜底

                    const key = `l_${user.id}_${commentId}`;
                    if (seen.has(key)) return;
                    seen.add(key);

                    items.push({
                        key,
                        kind: 'like',
                        senderName: user.nickName || '匿名用户',
                        avatar: user.avatar,
                        text: comment.context ?? '',
                        // 后端没记录点赞时间，用被赞评论的时间兜底排序
                        createdAt: comment.createdAt,
                        articleId: comment.ArticleList?.id ?? comment.articleId,
                        articleTitle: comment.ArticleList?.title,
                    });
                });
            });

            items.sort(
                (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
            );

            set_likes(items);
            fetchCovers(items.map(i => i.articleId).filter(Boolean) as number[]);
        } catch (error) {
            console.warn('获取点赞消息失败：', error);
        } finally {
            set_likeLoading(false);
            set_refreshing(false);
            likeLoadedRef.current = true;
        }
    }, [TouristsToken, TouristsAuth.id, fetchCovers]);

    // 切到消息 tab 时按当前 tab 刷新；点赞数据较重，首次进入才拉
    useFocusEffect(
        useCallback(() => {
            if (!TouristsToken) {
                // 已退出：两个 tab 都走一遍清理分支，别留下上一个账号的数字
                fetchReplies();
                fetchLikes();
                return;
            }
            if (tab === 'reply') {
                fetchReplies();
            } else if (!likeLoadedRef.current) {
                fetchLikes();
            }
        }, [tab, TouristsToken, fetchReplies, fetchLikes]),
    );

    const handleRefresh = () => {
        if (refreshing) return;
        if (tab === 'reply') {
            fetchReplies(true);
        } else {
            likeLoadedRef.current = false;
            fetchLikes(true);
        }
    };

    // 点消息 → 先按 id 把完整文章拿回来（详情页需要 User、coverImage 等字段），再跳转
    const openArticle = async (item: FeedItem) => {
        if (openingKey !== null) return;
        if (!item.articleId) return;

        set_openingKey(item.key);
        try {
            const resp = await postRequest('/api/artcle/getList', {
                pageNum: 1,
                pageSize: 1,
                formData: { idStrings: String(item.articleId) },
            });
            const article = resp.code === 0 ? resp.data?.list?.[0] : null;

            if (!article) {
                toast.error('提示', {
                    description: '文章不存在或已删除',
                    duration: 1500,
                    position: 'top-center',
                });
                return;
            }

            useCurrentArticle.setState({ Article: article });
            router.push('/articlePreview');
        } catch (error) {
            console.warn('打开文章失败：', error);
        } finally {
            set_openingKey(null);
        }
    };

    // 未登录时直接按空数据处理，哪怕清空动作晚一拍，顶部数字也不会露出来
    const data = TouristsToken ? (tab === 'reply' ? replies : likes) : [];
    const unreadCount = data.filter(m => !readIds.has(m.key)).length;
    const listLoading = tab === 'reply' ? loading : likeLoading;

    const renderItem = ({ item }: { item: FeedItem }) => {
        const coverPath = item.articleId ? coverMap[item.articleId] : '';
        const cover = coverPath ? FILE_BASEURI + coverPath : '';
        const avatar = item.avatar ? FILE_BASEURI + item.avatar : '';
        const isOpening = openingKey === item.key;
        const isRead = readIds.has(item.key);

        return (
            <Pressable
                onPress={() => {
                    // 点开即已读：先消高亮，再跳文章
                    markRead(item.key);
                    openArticle(item);
                }}
                style={({ pressed }) => [
                    styles.row,
                    !isRead && { backgroundColor: unreadBg },
                    pressed && styles.rowPressed,
                ]}
            >
                {/* 未读标识：左侧一根主题蓝竖条 */}
                {!isRead && <View style={[styles.unreadBar, { backgroundColor: ACCENT }]} />}

                {/* 左：动作发起人的头像 */}
                {avatar ? (
                    <Image source={{ uri: avatar }} style={styles.avatar} />
                ) : (
                    <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: boxBg }]}>
                        <SimpleLineIcons name="user" size={20} color={theme.tabIconDefault} />
                    </View>
                )}

                {/* 中：昵称 + 动作 + 内容 + 时间 */}
                <View style={styles.middle}>
                    <View style={styles.nameRow}>
                        <ThemedText style={styles.nickName} numberOfLines={1}>
                            {item.senderName}
                        </ThemedText>
                        <View style={[styles.badge, { backgroundColor: ACCENT + '1a' }]}>
                            <ThemedText style={[styles.badgeText, { color: ACCENT }]}>
                                {item.kind === 'reply' ? '回复了你' : '赞了你的评论'}
                            </ThemedText>
                        </View>
                        <ThemedText style={[styles.time, { color: theme.tabIconDefault }]}>
                            {formatTime(item.createdAt)}
                        </ThemedText>
                    </View>

                    <ThemedText style={styles.content} numberOfLines={2}>
                        {item.text}
                    </ThemedText>
                </View>

                {/* 右：文章小卡片。封面异步补，没回来之前先显示占位 */}
                <View style={[styles.articleBox, { backgroundColor: boxBg }]}>
                    {cover ? (
                        <Image source={{ uri: cover }} style={styles.cover} />
                    ) : (
                        <View style={[styles.cover, styles.coverFallback, { backgroundColor: boxBg }]}>
                            {isOpening
                                ? <ActivityIndicator size="small" color={ACCENT} />
                                : <SimpleLineIcons name="picture" size={20} color={theme.tabIconDefault} />
                            }
                        </View>
                    )}
                    <ThemedText style={styles.articleTitle} numberOfLines={2}>
                        {item.articleTitle || '文章已删除'}
                    </ThemedText>
                </View>
            </Pressable>
        );
    };

    const renderEmpty = () => {
        if (listLoading || !readLoaded) {
            return <ActivityIndicator style={styles.loading} color={ACCENT} />;
        }
        return (
            <View style={styles.emptyWrap}>
                <View style={styles.emptyIconWrap}>
                    <Ionicons name="chatbubble-ellipses-outline" size={36} color={ACCENT} />
                </View>
                <ThemedText style={styles.emptyTitle}>
                    {tab === 'reply' ? '还没有新消息' : '还没有人点赞'}
                </ThemedText>
                <ThemedText style={[styles.emptyHint, { color: theme.tabIconDefault }]}>
                    {tab === 'reply' ? '有人回复你的评论时，会出现在这里' : '有人给你的评论点赞时，会出现在这里'}
                </ThemedText>
            </View>
        );
    };

    return (
        <ThemedView style={[publicStyles.flex_1, { paddingTop: insets.top, backgroundColor: theme.home_bg_color }]}>
            {/* 顶部：大标题 + 总条数徽章 + 未读提示 + 右侧气泡图标 */}
            <View style={styles.header}>
                <View style={styles.headerTextWrap}>
                    <View style={styles.titleRow}>
                        <ThemedText style={styles.headerTitle}>消息</ThemedText>
                        <View style={[styles.countBadge, { backgroundColor: ACCENT + '1a' }]}>
                            <ThemedText style={[styles.countText, { color: ACCENT }]}>
                                {data.length}
                            </ThemedText>
                        </View>
                    </View>
                    <ThemedText style={[styles.headerHint, { color: theme.tabIconDefault }]}>
                        {!TouristsToken
                            ? '登录后查看别人给你的回复'
                            : unreadCount > 0
                                ? `${unreadCount} 条未读，点开消息即可标记已读`
                                : '全部已读'}
                    </ThemedText>
                </View>

                <View style={[styles.headerIcon, { backgroundColor: ACCENT + '14' }]}>
                    <Ionicons name="chatbubbles-outline" size={24} color={ACCENT} />
                </View>
            </View>

            {/* 两个可滑动 tab：点按切换，指示条 spring 平移 */}
            <View style={styles.tabRow}>
                {TABS.map(t => {
                    const active = tab === t.key;
                    return (
                        <Pressable
                            key={t.key}
                            onPress={() => switchTab(t.key)}
                            style={styles.tabItem}
                        >
                            <ThemedText
                                style={[
                                    styles.tabText,
                                    { color: active ? ACCENT : theme.tabIconDefault },
                                    active && styles.tabTextActive,
                                ]}
                            >
                                {t.label}
                            </ThemedText>
                        </Pressable>
                    );
                })}
                <Animated.View
                    style={[styles.tabBar, { backgroundColor: ACCENT }, indicatorStyle]}
                />
            </View>

            {!TouristsToken ? (
                // 未登录：不给空列表，直接引导去登录
                <View style={styles.emptyWrap}>
                    <View style={styles.emptyIconWrap}>
                        <Ionicons name="chatbubble-ellipses-outline" size={36} color={ACCENT} />
                    </View>
                    <ThemedText style={styles.emptyTitle}>登录后才能查看消息</ThemedText>
                    <ThemedText style={[styles.emptyHint, { color: theme.tabIconDefault }]}>
                        登录后，别人回复或点赞你的评论都会出现在这里
                    </ThemedText>
                    <Pressable
                        onPress={() => router.navigate('/myspace')}
                        style={({ pressed }) => [styles.loginBtn, pressed && styles.loginBtnPressed]}
                    >
                        <ThemedText style={styles.loginBtnText}>去登录</ThemedText>
                    </Pressable>
                </View>
            ) : (
                <ThemedView style={[publicStyles.flex_1, { backgroundColor: theme.background }]}>
                    <GestureDetector gesture={swipeGesture}>
                        <View style={publicStyles.flex_1}>
                            <FlashList
                                // 切 tab 换一份数据，强制重建以回到列表顶部
                                key={tab}
                                data={data}
                                renderItem={renderItem}
                                keyExtractor={(item) => item.key}
                                contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 16 }]}
                                ItemSeparatorComponent={() => (
                                    <View style={[styles.separator, { backgroundColor: lineColor }]} />
                                )}
                                ListEmptyComponent={renderEmpty}
                                refreshControl={
                                    <RefreshControl
                                        refreshing={refreshing}
                                        onRefresh={handleRefresh}
                                        colors={Platform.OS === 'android' ? [ACCENT] : undefined}
                                        tintColor={Platform.OS === 'ios' ? ACCENT : undefined}
                                    />
                                }
                                showsVerticalScrollIndicator={false}
                            />
                        </View>
                    </GestureDetector>
                </ThemedView>
            )}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    // ── 顶部 ─────────────────────────────────────
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 14,
    },
    headerTextWrap: {
        gap: 4,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        fontSize: 26,
        lineHeight: 34,
        fontWeight: '700',
    },
    // 总条数徽章：淡蓝底 + 主题蓝字
    countBadge: {
        minWidth: 26,
        height: 22,
        paddingHorizontal: 7,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
    },
    countText: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '700',
    },
    headerHint: {
        fontSize: 12,
        lineHeight: 17,
    },
    headerIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // ── tab ─────────────────────────────────────
    tabRow: {
        flexDirection: 'row',
        gap: TAB_GAP,
        paddingHorizontal: 20,
        marginBottom: 4,
        position: 'relative',
    },
    tabItem: {
        width: TAB_WIDTH,
        alignItems: 'center',
        paddingTop: 6,
        paddingBottom: 12,
    },
    tabText: {
        fontSize: 15,
        lineHeight: 21,
    },
    tabTextActive: {
        fontWeight: '700',
    },
    // 指示条：宽度固定，靠 translateX 在两段文字下平移
    tabBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: TAB_BAR_WIDTH,
        height: 3,
        borderRadius: 2,
    },

    // ── 列表 ─────────────────────────────────────
    listContent: {
        flexGrow: 1,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    rowPressed: {
        backgroundColor: 'rgba(128,128,128,0.08)',   // 按下给一层很淡的底
    },
    // 未读竖条：贴着行左边，上下各留一点
    unreadBar: {
        position: 'absolute',
        left: 0,
        top: 16,
        bottom: 16,
        width: 3,
        borderRadius: 2,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#e9e9e9',      // 图片没加载出来时的灰底
    },
    avatarFallback: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    middle: {
        flex: 1,
        gap: 5,
        paddingTop: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    nickName: {
        flexShrink: 1,
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '600',
    },
    // 动作徽章：淡蓝底配主题蓝字
    badge: {
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 4,
    },
    badgeText: {
        fontSize: 10,
        lineHeight: 14,
        fontWeight: '600',
    },
    time: {
        marginLeft: 'auto',
        fontSize: 11,
        lineHeight: 15,
    },
    content: {
        fontSize: 14,
        lineHeight: 20,
    },

    // 右侧文章小卡片：图片 + 标题共用一块浅灰底
    articleBox: {
        width: 76,
        borderRadius: 12,
        padding: 4,
        gap: 4,
    },
    cover: {
        width: 68,
        height: 68,
        borderRadius: 8,
        backgroundColor: '#e9e9e9',
    },
    coverFallback: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    articleTitle: {
        fontSize: 11,
        lineHeight: 15,
        paddingHorizontal: 2,
        paddingBottom: 2,
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        marginLeft: 72,      // 跟头像右侧对齐
    },

    // ── 空态 ─────────────────────────────────────
    emptyWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
        paddingBottom: 60,
    },
    emptyIconWrap: {
        width: 76,
        height: 76,
        borderRadius: 38,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(61,138,245,0.1)',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 16,
        lineHeight: 22,
        fontWeight: '600',
    },
    emptyHint: {
        fontSize: 13,
        lineHeight: 19,
        textAlign: 'center',
        marginTop: 6,
    },
    loginBtn: {
        marginTop: 20,
        paddingHorizontal: 30,
        paddingVertical: 10,
        borderRadius: 9999,
        backgroundColor: ACCENT,
    },
    loginBtnPressed: {
        opacity: 0.75,
    },
    loginBtnText: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '600',
        color: '#ffffff',
    },
    loading: {
        marginTop: 80,
    },
});
