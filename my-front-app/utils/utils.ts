import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// ── 评论 ───────────────────────────────────────
/** /api/comment/getComment 返回的单条评论 */
export interface CommentItem {
    id: number;
    tId?: number | null;
    uId?: number | null;
    ClientIp?: string;
    articleId: number;
    context: string;
    likes?: number;
    /** -1 表示一级评论，否则是回复；值是它回复的那条评论 id */
    Commentobject: number;
    CommentStatus?: string;
    CommentStatus_display?: string;
    createdAt: string;
    Tourist?: {
        id: number;
        nickName?: string;
        avatar?: string;
        email?: string;
        isSystem?: boolean;
        [key: string]: any;
    } | null;
    User?: {
        id: number;
        nickName?: string;
        name?: string;
        avatar?: string;
        isSystem?: boolean;
        [key: string]: any;
    } | null;
    children?: CommentItem[];
    replyCount?: number;
    /** 别人的待审/驳回评论，不该展示 */
    hide?: boolean;
    [key: string]: any;
}

/**
 * 把扁平评论列表整理成「楼层 + 回复」的树。
 * 逻辑跟 web 端 src/utils/utils.js 的同名函数保持一致：
 *   - Commentobject === -1 是一级评论（楼层）
 *   - 其余评论顺着 Commentobject 往上追，统一平铺挂到所属楼层的 children
 *   - 自己的待审评论保留（标记状态），别人的待审评论隐藏
 */
export const getCommentTrees = (
    Pnodes: CommentItem[] = [],
    Cnodes: CommentItem[] = [],
    TouristsAuth: { [key: string]: any } = {},
): [CommentItem[], Map<number, CommentItem>, number] => {
    if (Pnodes.length === 0) return [[], new Map(), 0];

    // 1. 每个楼层先挂一个空 children，并建 id 索引（回复也要能查到）
    const nodeMap = new Map<number, CommentItem>();
    Pnodes.forEach(f => {
        f.children = [];
        nodeMap.set(f.id, f);
    });
    Cnodes.forEach(c => nodeMap.set(c.id, c));

    // 2. 顺着 Commentobject 往上爬，直到找到 Commentobject === -1 的楼层
    const getFloorId = (comment: CommentItem): number | null => {
        let current: CommentItem | undefined = comment;
        while (current && current.Commentobject !== -1) {
            current = nodeMap.get(current.Commentobject);
        }
        return current ? current.id : null;
    };

    // 3. 所有回复平铺挂到对应楼层
    Cnodes.forEach(c => {
        const floorId = getFloorId(c);
        if (floorId === null) return;
        nodeMap.get(floorId)?.children?.push(c);
    });

    // 4. 统计每条评论被回复的次数
    Cnodes.forEach(c => {
        const target = nodeMap.get(c.Commentobject);
        if (target) target.replyCount = (target.replyCount || 0) + 1;
    });

    // 5. 楼层按时间倒序（新 → 旧）
    Pnodes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // 6. 审核状态：已登录游客视角下，自己的待审评论自己能看到，别人的藏起来
    let commentCount = 0;
    const processCommentStatus = (comment: CommentItem) => {
        if (comment.tId !== undefined && TouristsAuth.navigator) {
            if (comment.tId === TouristsAuth.id) {
                if (comment.CommentStatus === 'pending') {
                    comment.CommentStatus_display = '审核中';
                } else if (comment.CommentStatus === 'rejected') {
                    comment.CommentStatus_display = '驳回';
                }
                commentCount++;
            } else if (comment.CommentStatus === 'pending' || comment.CommentStatus === 'rejected') {
                comment.hide = true;
            } else {
                commentCount++;
            }
        }
        comment.children?.forEach(processCommentStatus);
    };

    Pnodes.forEach(f => {
        processCommentStatus(f);
        f.children?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    });

    // 没登录的人不区分审核状态，全都算上（跟 web 端一致）
    if (!TouristsAuth.navigator) commentCount = nodeMap.size;

    return [Pnodes, nodeMap, commentCount];
};

/** 评论时间：刚刚 / x分钟前 / x小时前 / 今天 HH:mm / 昨天 / x月x日 / xxxx年x月x日 */
export function formatCommentTime(dateStr: string): string {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return '';

    const now = new Date();
    const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000);
    const diffHour = Math.floor(diffMin / 60);

    const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayZero = new Date(todayZero.getTime() - 86400000);
    const pad = (n: number) => (n < 10 ? '0' + n : String(n));

    if (diffMin < 1) return '刚刚';
    if (diffMin < 60) return `${diffMin}分钟前`;
    if (diffHour < 5) return `${diffHour}小时前`;
    if (date >= todayZero) return `今天 ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    if (date >= yesterdayZero) return '昨天';
    if (date.getFullYear() === now.getFullYear()) return `${date.getMonth() + 1}月${date.getDate()}日`;
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

export const handleDownload = async (uri: string) => {
    try {
        const file = await File.downloadFileAsync(
            uri,
            new File(Paths.document, uri.substring(uri.lastIndexOf('/') + 1)), // 指定保存的文件名
            { idempotent: true }
        );

        // 2. 检查设备是否支持分享
        const isAvailable = await Sharing.isAvailableAsync();
        if (!isAvailable) {
            console.log('当前设备不支持分享功能');
            return;
        }

        // 3. 打开系统分享面板
        // 注意：参数必须是本地文件的 file:// 路径
        await Sharing.shareAsync(file.uri, {
            mimeType: 'application/pdf', // 帮助系统正确识别文件类型
            dialogTitle: '保存或分享文件', // 仅 Android 生效
        });
        console.log('下载完成:', file);
    } catch (error) {
        console.error('下载失败:', error);
    }
};