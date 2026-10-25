import { Image, Pressable, StyleSheet } from 'react-native';
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';
import { FILE_BASEURI } from '@/utils/const';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useEffect, useSyncExternalStore } from 'react';
const PLACEHOLDER = require('@/assets/images/placeholder.jpg'); // 动态 require

/** 一条笔记的数据形状 */
export type ArticleItem = {
    ClientIp: string;
    id: number;
    coverImage: string;          // 封面图地址
    coverWidth?: number;     // 封面「原始宽度」——算宽高比用
    coverHeight?: number;    // 封面「原始高度」——算宽高比用
    title: string;
    User: { avatar: string, name_display: string, name: string, [key: string]: any };
    avatar: string;
    likes: number;
    [key: string]: any;
};

/** 12345 → "1.2万" */
function formatLikes(n: number): string {
    return n >= 10000 ? `${(n / 10000).toFixed(1)}万` : String(n);
}

type imageSize = {
    w: number;
    h: number;
}

// 还没测出尺寸之前先用这个比例撑着（竖图，接近大部分封面）
const FALLBACK_RATIO = 784 / 1168;


// ── 图片尺寸缓存（注意：全都写在组件外面）─────────────────────────
// FlashList 会把滚出视口的卡片实例回收，再复用给后面进来的 item。
// 所以尺寸绝不能存在组件的 useState 里 —— 那样它会跟着「实例」走，
// 实例被复用后还留着上一位住户的尺寸，卡片一进一出视口就抖。
//
// 存在模块作用域、按「图片 URL」索引，就跟组件实例的生死彻底解绑了：
// 谁来查都是按 URL 查，复用一百次也不会串味。
const sizeCache = new Map<string, imageSize>();
const pending = new Set<string>();          // 正在测的，防止同一张图被并发测多次
const listeners = new Set<() => void>();    // 谁在等着这张表变

function subscribe(cb: () => void) {
    listeners.add(cb);
    return () => { listeners.delete(cb); };
}

function notify() {
    listeners.forEach(l => l());
}

/** 测一张图 —— 同一个 URL 全局只测这一次 */
function measure(url: string) {
    if (sizeCache.has(url) || pending.has(url)) return;
    pending.add(url);
    Image.getSize(
        url,
        (w, h) => {
            sizeCache.set(url, { w, h });
            pending.delete(url);
            notify();                        // 叫醒所有在等这张图的卡片
        },
        (error) => {
            pending.delete(url);             // 失败就放开，允许以后再试
            console.warn('图片尺寸获取失败:', error);
        }
    );
}


export function ArticleCard({ item, cb }: { item: ArticleItem, cb: (item: ArticleItem) => void }) {
    const theme = Colors[useColorScheme() ?? 'light'];

    const url = item.coverImage ? FILE_BASEURI + item.coverImage : '';

    // 每次渲染都同步按 url 查一次表。
    // item 一换 url 就跟着换，查到的必然是这张图的尺寸（没测过就是 null），不会有残留
    const size = useSyncExternalStore<imageSize | null>(
        subscribe,
        () => sizeCache.get(url) ?? null,
        () => null      // SSR（web 端）用，不写会报 getServerSnapshot 缺失
    );



    // 没测过的图发起一次测量，测完 notify() 会把这批卡片自动刷出来
    useEffect(() => {
        if (url) measure(url);
    }, [url]);

    const ratio = size ? size.w / size.h : FALLBACK_RATIO;

    return (
        <Pressable
            style={({ pressed }) => [styles.card, { backgroundColor: theme.background }, pressed && styles.cardPressed]}
            onPress={() => cb(item)}
        >


            {/* 图片地址只跟 url 走，不再等尺寸 —— 这样图一开始就下载，
                不会卡在「先占位图、再换真图」那一下 */}
            <Image
                source={url ? { uri: url } : PLACEHOLDER}
                style={[styles.cover, { aspectRatio: ratio }]}
            />

            <ThemedView style={styles.body}>
                {/* 标题：最多 2 行，超了自动打省略号 */}
                <ThemedText numberOfLines={2} style={styles.title}>
                    {item.title}
                </ThemedText>

                {/* 底部一行：左边「头像 + 昵称」，右边「♡ + 点赞数」 */}
                <ThemedView style={styles.footer}>
                    <ThemedView style={styles.author}>
                        <Image source={{ uri: FILE_BASEURI + item.User.avatar }} style={styles.avatar} />
                        <ThemedText
                            numberOfLines={1}
                            style={[styles.authorName, { color: theme.tabIconDefault }]}
                        >
                            {item.User.name_display}
                        </ThemedText>
                    </ThemedView>

                    <ThemedView style={styles.likes}>
                        <SimpleLineIcons name="heart" size={13} color={theme.tabIconDefault} />
                        <ThemedText style={[styles.likeCount, { color: theme.tabIconDefault }]}>
                            {formatLikes(item.likes)}
                        </ThemedText>
                    </ThemedView>
                </ThemedView>
            </ThemedView>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        marginHorizontal: 4,
        marginBottom: 12,
        borderRadius: 8,
    },
    cardPressed: {
        opacity: 0.85,
    },
    cover: {
        width: '100%',
        borderRadius: 8,
        backgroundColor: '#e9e9e9',   // 图片没加载出来时的占位灰
        borderBottomRightRadius: 0,
        borderBottomLeftRadius: 0,
    },
    body: {
        padding: 5,

        backgroundColor: 'transparent',   // 跟着外层列表背景走
    },
    title: {
        fontSize: 15,
        lineHeight: 21,
        fontWeight: '500',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
        backgroundColor: 'transparent',
    },
    author: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,          // 吃掉中间空间，把点赞挤到右边
        gap: 6,
        backgroundColor: 'transparent',
    },
    avatar: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#e9e9e9',
    },
    authorName: {
        fontSize: 12,
        lineHeight: 16,
        flexShrink: 1,    // 名字太长时先压缩自己，不把点赞挤出去
    },
    likes: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginLeft: 8,
        backgroundColor: 'transparent',
    },
    likeCount: {
        fontSize: 12,
        lineHeight: 16,
    },
});
