import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, View } from 'react-native';
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';
import { Ionicons } from '@expo/vector-icons';
import { toast } from 'sonner-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { FILE_BASEURI } from '@/utils/const';
import { postRequest } from '@/utils/api';
import { useAuthStore } from '@/store';
import { formatCommentTime, type CommentItem } from '@/utils/utils';

// 跟详情页底部点赞同一支红
const LIKE_RED = '#e5484d';
// 审核中 / 驳回的小标签色，抄的 web 端
const TAG_ORANGE = '#f28a22';
// 「作者」标签：跟主题蓝一个色系，跟审核橙区分开
const TAG_BLUE = '#3d8af5';

/**
 * 「作者」小标签。
 * 定义在组件外面，避免每次渲染新建组件类型导致整棵子树重挂。
 */
const AuthorTag = () => (
    <View style={[styles.tag, { backgroundColor: TAG_BLUE + '1a' }]}>
        <ThemedText style={[styles.tagText, { color: TAG_BLUE }]}>作者</ThemedText>
    </View>
);

/**
 * 头像：没传地址就落一个灰底小人，别让 Image 去请求一个空 URL。
 * 定义在组件外面 —— 写在组件体内等于每次渲染都新建一个组件类型，
 * React 会把整棵子树卸掉重挂，列表一长就卡。
 */
const CommentAvatar = ({
    uri,
    size,
    fallbackBg,
    iconColor,
}: {
    uri?: string;
    size: number;
    fallbackBg: string;
    iconColor: string;
}) => {
    const shape = { width: size, height: size, borderRadius: size / 2 };
    return uri ? (
        <Image source={{ uri: FILE_BASEURI + uri }} style={[styles.avatar, shape]} />
    ) : (
        <View style={[styles.avatar, styles.avatarFallback, shape, { backgroundColor: fallbackBg }]}>
            <SimpleLineIcons name="user" size={Math.round(size * 0.45)} color={iconColor} />
        </View>
    );
};

interface CommentListProps {
    comments: CommentItem[];
    nodeMap: Map<number, CommentItem>;
    commentCount: number;
    currentArticle: { id: number;[key: string]: any };
    loading?: boolean;
    /** 点「回复」时通知外面把输入面板拉起来 */
    onReply?: (target: CommentItem) => void;
}

/**
 * 评论区：挂在正文 IP 属地下面。
 * 自己不滚动，跟着外层的文章列表一起滚（移动端比 web 的独立抽屉更顺手）。
 */
export default function CommentList({
    comments,
    nodeMap,
    commentCount,
    currentArticle,
    loading = false,
    onReply,
}: CommentListProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const TouristsToken = useAuthStore(state => state.TouristsToken);
    const TouristsAuth = useAuthStore(state => state.TouristsAuth);

    // 跟底部栏用同一套浅灰底 / 分割线
    const boxBg = colorScheme === 'light' ? '#f5f5f5' : '#26262e';
    const lineColor = colorScheme === 'light' ? '#ececec' : '#2a2a30';

    // 点赞后只覆盖「这条评论的点赞数」，不复制整棵树：
    // 父级重新拉数据时 props 依然是干净的，本地改动也不会被冲掉
    const [likesOverride, set_likesOverride] = useState<Record<number, number>>({});
    const getLikes = (item: CommentItem) => likesOverride[item.id] ?? (Number(item.likes) || 0);

    // commentLikeStrings 存的是「游客id_文章id_评论id」这种三元组
    const likeKey = (id: number) => `${TouristsAuth.id}_${currentArticle.id}_${id}`;
    const likedKeys: string[] = (TouristsAuth.commentLikeStrings ?? '').split(',').filter(Boolean);

    // 作者身份：跟 web 端一致的判断 —— 评论的 User.id 对上文章的 userId。
    // 只认后台用户（User）身份，游客（Tourist）身份不标作者。
    // 前面加 !! 是防「两边都是 undefined」时误判为作者
    const articleAuthorId = currentArticle.userId ?? currentArticle.User?.id;
    const isAuthor = (item: CommentItem) =>
        !!articleAuthorId && articleAuthorId === item.User?.id;

    const onLikeClick = async (item: CommentItem) => {
        if (!TouristsToken) {
            toast('提示', { description: '登录后才能点赞哦', duration: 1500, position: 'top-center' });
            return;
        }
        // 注销账号留下的评论不给点，跟 web 端一致
        if (item.Tourist?.isSystem && item.Tourist?.email?.includes('CloseAccount')) {
            toast('提示', { description: '该账号已注销，点赞失败', duration: 1500, position: 'top-center' });
            return;
        }

        const key = likeKey(item.id);
        const liked = likedKeys.includes(key);
        const nextKeys = liked ? likedKeys.filter(k => k !== key) : [...likedKeys, key];

        // 取消时兜底 0：likes 可能是 undefined 或 0，直接减会掉成负数
        const base = getLikes(item);
        const nextLikes = liked ? Math.max(0, base - 1) : base + 1;

        try {
            // 先回写评论的点赞数，成功了再改游客身上的三元组（顺序跟 web 端一致）
            const commentResp = await postRequest('/api/comment/updateComment', {
                id: item.id,
                likes: nextLikes,
            });
            if (commentResp.code !== 0) {
                toast('提示', {
                    description: commentResp.message || '点赞失败',
                    duration: 1500,
                    position: 'top-center',
                });
                return;
            }

            const userResp = await postRequest('/api/touristsAuth/updateUser', {
                id: TouristsAuth.id,
                commentLikeStrings: nextKeys.join(','),
            });
            if (userResp.code !== 0) {
                toast('提示', {
                    description: userResp.message || '点赞失败',
                    duration: 1500,
                    position: 'top-center',
                });
                return;
            }

            useAuthStore.setState({ TouristsAuth: userResp.data });
            set_likesOverride(prev => ({ ...prev, [item.id]: nextLikes }));
        } catch (error) {
            console.warn('评论点赞失败：', error);
        }
    };

    if (loading) {
        return (
            <View style={styles.stateBox}>
                <ActivityIndicator size="small" color={theme.tabIconDefault} />
            </View>
        );
    }

    return (
        <ThemedView style={styles.wrap}>
            {/* 标题：跟上面 IP 属地之间拉一根分割线，明确「正文到此为止」 */}
            <View style={[styles.header, { borderTopColor: lineColor }]}>
                <ThemedText style={styles.headerTitle}>
                    评论{commentCount ? ` ${commentCount}` : ''}
                </ThemedText>
            </View>

            {commentCount === 0 ? (
                <View style={styles.empty}>
                    <SimpleLineIcons name="bubble" size={30} color={theme.tabIconDefault} />
                    <ThemedText style={[styles.emptyText, { color: theme.tabIconDefault }]}>
                        暂无评论，快来抢沙发吧~
                    </ThemedText>
                </View>
            ) : comments.map(floor => {
                if (floor.hide) return null;

                const floorUser = floor.Tourist || floor.User;
                const floorLiked = likedKeys.includes(likeKey(floor.id));

                return (
                    <View key={floor.id} style={styles.floor}>
                        {/* 整条评论都是回复热区：点内容、头像、空白处都算回复，
                            不用非戳「回复」两个字。
                            里面的点赞按钮是独立的 Pressable，会自己拦下点击，
                            不会冒泡到这里误触发回复 */}
                        <Pressable style={styles.row} onPress={() => onReply?.(floor)}>
                            <CommentAvatar
                                uri={floorUser?.avatar}
                                size={36}
                                fallbackBg={boxBg}
                                iconColor={theme.tabIconDefault}
                            />

                            <View style={styles.body}>
                                <View style={styles.nickRow}>
                                    <ThemedText
                                        style={[styles.nickName, { color: theme.tabIconDefault }]}
                                        numberOfLines={1}
                                    >
                                        {floorUser?.nickName || floorUser?.name || '游客'}
                                    </ThemedText>
                                    {isAuthor(floor) ? <AuthorTag /> : null}
                                    {floor.CommentStatus_display ? (
                                        <View style={[styles.tag, { backgroundColor: TAG_ORANGE + '1a' }]}>
                                            <ThemedText style={[styles.tagText, { color: TAG_ORANGE }]}>
                                                {floor.CommentStatus_display}
                                            </ThemedText>
                                        </View>
                                    ) : null}
                                </View>

                                <ThemedText style={styles.content}>{floor.context}</ThemedText>

                                <View style={styles.metaRow}>
                                    <ThemedText style={[styles.metaText, { color: theme.tabIconDefault }]}>
                                        {formatCommentTime(floor.createdAt)}
                                    </ThemedText>
                                    {floor.ClientIp ? (
                                        <ThemedText style={[styles.metaText, { color: theme.tabIconDefault }]}>
                                            {floor.ClientIp}
                                        </ThemedText>
                                    ) : null}
                                </View>

                                <View style={styles.actionRow}>
                                    <Pressable style={styles.actionItem} hitSlop={8} onPress={() => onLikeClick(floor)}>
                                        {floorLiked
                                            ? <Ionicons name="heart" size={15} color={LIKE_RED} />
                                            : <Ionicons name="heart-outline" size={15} color={theme.tabIconDefault} />}
                                        <ThemedText style={[styles.actionText, { color: floorLiked ? LIKE_RED : theme.tabIconDefault }]}>
                                            {getLikes(floor)}
                                        </ThemedText>
                                    </Pressable>

                                    <Pressable style={styles.actionItem} hitSlop={8} onPress={() => onReply?.(floor)}>
                                        <SimpleLineIcons name="bubble" size={15} color={theme.tabIconDefault} />
                                        <ThemedText style={[styles.actionText, { color: theme.tabIconDefault }]}>
                                            {floor.children?.length || '回复'}
                                        </ThemedText>
                                    </Pressable>
                                </View>
                            </View>
                        </Pressable>

                        {/* 回复区：浅灰底、缩进到正文左边线 */}
                        {floor.children?.length ? (
                            <View style={[styles.replies, { backgroundColor: boxBg }]}>
                                {floor.children.map((child, index) => {
                                    if (child.hide) return null;

                                    const childUser = child.Tourist || child.User;
                                    const childLiked = likedKeys.includes(likeKey(child.id));
                                    // 回复的是楼层本身就不写「回复 XXX」，否则把对方昵称带上
                                    const target = nodeMap.get(child.Commentobject);
                                    const targetName = target?.Tourist?.nickName
                                        || target?.User?.nickName
                                        || target?.User?.name;

                                    return (
                                        // 同理：整条回复也能点，回的就是这条回复的主人
                                        <Pressable
                                            key={child.id}
                                            style={[
                                                styles.replyItem,
                                                index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: lineColor },
                                            ]}
                                            onPress={() => onReply?.(child)}
                                        >
                                            <CommentAvatar
                                                uri={childUser?.avatar}
                                                size={26}
                                                fallbackBg={boxBg}
                                                iconColor={theme.tabIconDefault}
                                            />

                                            <View style={styles.body}>
                                                <View style={styles.nickRow}>
                                                    <ThemedText
                                                        style={[styles.nickName, { color: theme.tabIconDefault }]}
                                                        numberOfLines={1}
                                                    >
                                                        {childUser?.nickName || childUser?.name || '游客'}
                                                        {target && target.id !== floor.id && targetName ? (
                                                            <ThemedText style={[styles.replyTo, { color: theme.tabIconDefault }]}>
                                                                {` 回复 ${targetName}`}
                                                            </ThemedText>
                                                        ) : null}
                                                    </ThemedText>
                                                    {isAuthor(child) ? <AuthorTag /> : null}
                                                    {child.CommentStatus_display ? (
                                                        <View style={[styles.tag, { backgroundColor: TAG_ORANGE + '1a' }]}>
                                                            <ThemedText style={[styles.tagText, { color: TAG_ORANGE }]}>
                                                                {child.CommentStatus_display}
                                                            </ThemedText>
                                                        </View>
                                                    ) : null}
                                                </View>

                                                <ThemedText style={[styles.content, styles.replyContent]}>
                                                    {child.context}
                                                </ThemedText>

                                                <View style={styles.metaRow}>
                                                    <ThemedText style={[styles.metaText, { color: theme.tabIconDefault }]}>
                                                        {formatCommentTime(child.createdAt)}
                                                    </ThemedText>
                                                    {child.ClientIp ? (
                                                        <ThemedText style={[styles.metaText, { color: theme.tabIconDefault }]}>
                                                            {child.ClientIp}
                                                        </ThemedText>
                                                    ) : null}
                                                </View>

                                                <View style={styles.actionRow}>
                                                    <Pressable style={styles.actionItem} hitSlop={8} onPress={() => onLikeClick(child)}>
                                                        {childLiked
                                                            ? <Ionicons name="heart" size={14} color={LIKE_RED} />
                                                            : <Ionicons name="heart-outline" size={14} color={theme.tabIconDefault} />}
                                                        <ThemedText style={[styles.actionText, { color: childLiked ? LIKE_RED : theme.tabIconDefault }]}>
                                                            {getLikes(child)}
                                                        </ThemedText>
                                                    </Pressable>

                                                    <Pressable style={styles.actionItem} hitSlop={8} onPress={() => onReply?.(child)}>
                                                        <SimpleLineIcons name="bubble" size={14} color={theme.tabIconDefault} />
                                                        <ThemedText style={[styles.actionText, { color: theme.tabIconDefault }]}>
                                                            {child.replyCount || '回复'}
                                                        </ThemedText>
                                                    </Pressable>
                                                </View>
                                            </View>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        ) : null}
                    </View>
                );
            })}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    wrap: {
        marginTop: 4,
    },

    // ── 标题 ─────────────────────────────────────
    header: {
        paddingTop: 16,
        paddingBottom: 6,
        paddingHorizontal: 5,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    headerTitle: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '600',
    },

    // ── 空态 / 加载中 ─────────────────────────────
    stateBox: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    empty: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        gap: 10,
    },
    emptyText: {
        fontSize: 13,
        lineHeight: 18,
    },

    // ── 一级评论 ──────────────────────────────────
    floor: {
        paddingVertical: 12,
        paddingHorizontal: 5,   // 跟标题、正文同一条左边线
    },
    row: {
        flexDirection: 'row',
        gap: 10,
    },
    avatar: {
        backgroundColor: '#e9e9e9',
    },
    avatarFallback: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    body: {
        flex: 1,
    },
    nickRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    nickName: {
        flexShrink: 1,
        fontSize: 13,
        lineHeight: 18,
    },
    replyTo: {
        fontSize: 12,
        lineHeight: 18,
    },
    content: {
        fontSize: 14,
        lineHeight: 22,     // 中文行高跟字号成对写
        marginBottom: 4,
    },
    replyContent: {
        fontSize: 13,
        lineHeight: 20,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 4,
    },
    metaText: {
        fontSize: 12,
        lineHeight: 16,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    actionText: {
        fontSize: 12,
        lineHeight: 16,
    },

    // ── 回复区 ────────────────────────────────────
    replies: {
        marginTop: 10,
        marginLeft: 46,          // 对齐正文左边线：头像 36 + gap 10
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 2,
    },
    replyItem: {
        flexDirection: 'row',
        gap: 8,
        paddingVertical: 8,
    },

    // ── 审核状态小标签 ─────────────────────────────
    tag: {
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 4,
    },
    tagText: {
        fontSize: 10,
        lineHeight: 14,
        fontWeight: '600',
    },
});
