import { StyleSheet, RefreshControl, Platform, Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useState, useRef, type ReactElement } from 'react';
import { useRouter } from 'expo-router';
import { FlashList, FlashListRef } from "@shopify/flash-list";
import { observe } from 'react-native-observable-list';
import { toast } from 'sonner-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ArticleCard, type ArticleItem } from '@/components/ArticleCard';
import { publicStyles } from '@/utils/const';
import { postRequest } from '@/utils/api';
import { useHistoryList } from '@/store';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';


// 1. 用 observe 包装原组件，生成一个可观测版本
const ObservableMasonryFlashList = observe(FlashList);

interface artcleOpt {
    pageSize: number;
    pageNum: number;
    formData?: { [key: string]: unknown }
}

const _page_template = { pageSize: 10, pageNum: 1 };

// 收起状态下最多露几个，超出的靠右下角那个箭头按钮展开
const COLLAPSED_COUNT = 4;

export default function SearchComp() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const colorScheme = useColorScheme();

    const theme = Colors[colorScheme];

    const history = useHistoryList(state => state.historyList);
    const keyword = useHistoryList(state => state.keyword);
    const set_history = <V,>(key: string, val: V) => useHistoryList.setState({ [key]: val });
    const set_keyword = <V,>(key: string, val: V) => useHistoryList.setState({ [key]: val });
    const [expanded, set_expanded] = useState(false);

    // ── 搜索结果的状态（跟首页那套保持一致）───────────────
    const [loding, set_loding] = useState<boolean>(false);
    const [DATA, set_DATA] = useState<ArticleItem[]>([]);
    const [ListFooterComponent, set_ListFooterComponent] = useState<ReactElement | null>(null);
    const [pageData, set_pageData] = useState<{ pageSize: number, pageNum: number }>(_page_template);
    const userHasScrolled = useRef<boolean>(false);
    const listRef = useRef<FlashListRef<ArticleItem>>(null);

    // 搜索框和标签共用同一个浅灰底，暗色模式下换成深灰
    const boxBg = colorScheme === 'light' ? '#f5f5f5' : '#26262e';
    // 搜索框里那排小图标的颜色
    const boxIconColor = colorScheme === 'light' ? '#555555' : '#c8c8c8';

    const visibleHistory = expanded ? history : history.slice(0, COLLAPSED_COUNT);

    // 搜出东西了才展示结果列表，否则展示历史记录
    const hasResult = DATA.length > 0;


    // ── 接口部分 ──────────────────────────────────────────
    const searchData = async (queryData: { [key: string]: any }) => {
        const params: artcleOpt = { ...pageData, ...queryData };
        set_loding(true);
        try {
            const resp = await postRequest<artcleOpt>("/api/artcle/getList", params);
            if (resp.code === 0) {
                set_DATA(resp.data.list);
                if (!resp.data.list.length) {
                    toast.error('提示', {
                        description: '未找到相关文章！',
                        duration: 1000,
                        position: 'top-center'
                    });

                } 
            }
        } catch (error) {
            console.warn('搜索失败：', error);
        } finally {
            set_loding(false);
        }
    }

    // 触底加载下一页
    const loadNext = async () => {
        if (!userHasScrolled.current) return;
        const params: artcleOpt = {
            ...pageData,
            pageNum: pageData.pageNum + 1,
            formData: keyword ? { title: keyword } : {},
        };

        const resp = await postRequest<artcleOpt>("/api/artcle/getList", params);
        if (resp.code === 0) {
            if (!resp.data.list.length) {
                set_ListFooterComponent(
                    <ThemedText onPress={scrollToTop} style={styles.footerText}>到底了，回到顶部？</ThemedText>
                );
            } else {
                set_DATA(prev => [...prev, ...resp.data.list]);
                set_pageData({ ...pageData, pageNum: pageData.pageNum + 1 });
            }
        }
    }

    // 下拉刷新：回到第一页重新搜
    const handleRefresh = async () => {
        userHasScrolled.current = false;
        set_pageData(_page_template);
        set_ListFooterComponent(null);
        set_DATA([]);
        await searchData({ pageNum: 1, formData: keyword ? { title: keyword } : {} });
    }

    const scrollToTop = () => {
        listRef.current?.scrollToOffset({
            offset: 0,
            animated: true,
        });
    };




    const doSearch = () => {

        const kw = useHistoryList.getState().keyword.trim();
        if (!kw) return;
        // 搜过的词提到最前面，之前有过的先剔掉，避免重复
        set_history<string[]>('historyList', [kw, ...history.filter(h => h !== kw)]);
        set_ListFooterComponent(null);
        set_pageData(_page_template);
        searchData({ pageNum: 1, formData: { title: kw } });
    };

    // 点卡片 → 去详情页（跟首页那边保持一致，传参等详情接口接好再补）
    const openArticle = (item: ArticleItem) => {
        router.push('/articlePreview');
    };

    // 清空 / 重置：叉叉和扫帚都走这里。
    // 页面是按「有结果 → 文章列表，无结果 → 历史记录」切换的，
    // 所以字清掉的同时结果也得清，否则会卡在「输入框空了、下面还挂着上一次的文章」
    const resetSearch = () => {
        set_keyword<string>('keyword', '');
        set_DATA([]);
        set_ListFooterComponent(null);
        set_pageData(_page_template);
        set_expanded(false);
    };

    return (
        <ThemedView style={[publicStyles.flex_1, { paddingTop: insets.top, backgroundColor: theme.home_bg_color }]}>

            {/* ── 顶部：返回 + 搜索框 + 搜索 ──────────────────── */}
            <View style={styles.searchBar}>
                <Pressable onPress={() => router.back()} hitSlop={10}>
                    <SimpleLineIcons name="arrow-left" size={22} color={theme.text} />
                </Pressable>

                <View style={[styles.inputBox, { backgroundColor: boxBg }]}>
                    <TextInput
                        style={[styles.input, { color: theme.text }]}
                        value={keyword}
                        onChangeText={t => set_keyword<string>('keyword', t)}
                        onSubmitEditing={doSearch}
                        placeholder="输入文章标题搜索文章"
                        placeholderTextColor={theme.tabIconDefault}
                        returnKeyType="search"
                        autoFocus
                    />
                    {/* 有字 → 叉叉（清空输入）；没字 → 扫帚（整个重置归零）。
                        SimpleLineIcons 里没有扫帚，只能从 MaterialCommunityIcons 借一个 */}
                    {keyword ? (
                        <Pressable onPress={resetSearch} hitSlop={8}>
                            <SimpleLineIcons name="close" size={18} color={boxIconColor} />
                        </Pressable>
                    ) : (
                        <Pressable onPress={resetSearch} hitSlop={8}>
                            <MaterialCommunityIcons name="broom" size={18} color={boxIconColor} />
                        </Pressable>
                    )}
                </View>

                <Pressable onPress={doSearch} hitSlop={10}>
                    <ThemedText style={styles.searchBtn}>搜索</ThemedText>
                </Pressable>
            </View>

            {hasResult ? (

                /* ── 搜索结果：有数据才渲染，历史区自动让位 ──────── */
                <ObservableMasonryFlashList
                    ref={listRef}
                    data={DATA}
                    numColumns={2}
                    keyExtractor={(item) => item.id + ''}
                    renderItem={({ item }) => <ArticleCard cb={openArticle} item={item} />}
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

            ) : (

                /* ── 历史记录：没搜出东西时显示 ────────────────── */
                <View style={styles.section}>
                    <View style={styles.sectionHead}>
                        <ThemedText style={styles.sectionTitle}>历史记录</ThemedText>
                        <Pressable onPress={() => set_history('historyList', [])} hitSlop={10}>
                            <SimpleLineIcons name="trash" size={16} color={theme.tabIconDefault} />
                        </Pressable>
                    </View>

                    <View style={styles.chipWrap}>
                        {visibleHistory.map(m => (
                            <Pressable
                                key={m}
                                style={[styles.chip, { backgroundColor: boxBg }]}
                                onPress={() => {
                                    set_keyword<string>('keyword', m);
                                    doSearch();
                                }}
                            >
                                <ThemedText style={styles.chipText} numberOfLines={1} ellipsizeMode="tail">
                                    {m}
                                </ThemedText>
                            </Pressable>
                        ))}

                        {/* 只有超过收起上限时才给展开按钮，展开后箭头翻转朝上 */}
                        {history.length > COLLAPSED_COUNT && (
                            <Pressable
                                style={[styles.moreChip, { backgroundColor: boxBg }]}
                                onPress={() => set_expanded(!expanded)}
                            >
                                <SimpleLineIcons
                                    name="arrow-down"
                                    size={14}
                                    color={theme.tabIconDefault}
                                    style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}
                                />
                            </Pressable>
                        )}
                    </View>
                </View>

            )}

        </ThemedView>
    );
}


const styles = StyleSheet.create({

    // ── 顶部搜索栏 ────────────────────────────────────
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        gap: 10,
    },
    inputBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        height: 38,
        borderRadius: 19,       // 高度的一半 = 胶囊形
        paddingHorizontal: 14,
        gap: 8,
    },
    input: {
        flex: 1,
        fontSize: 15,
        // Android 的 TextInput 自带内边距，不清掉文字会往下偏
        padding: 0,
    },
    searchBtn: {
        fontSize: 15,
    },

    // ── 历史记录 ─────────────────────────────────────
    section: {
        paddingHorizontal: 14,
        marginTop: 10,
    },
    sectionHead: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '500',
    },
    chipWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    chip: {
        borderRadius: 17,
        paddingHorizontal: 16,
        paddingVertical: 8,
        // 太长的词别让它独占一整行，超了打省略号
        maxWidth: 170,
    },
    chipText: {
        fontSize: 14,
    },
    moreChip: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // ── 搜索结果（从首页搬过来的）──────────────────────
    footerText: {
        textAlign: 'center',
        paddingVertical: 10,
        fontSize: 12,
        letterSpacing: 1,
        opacity: 0.55,
    },

});
