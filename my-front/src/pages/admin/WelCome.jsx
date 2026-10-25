import React, { lazy, Suspense, useState, useEffect, useMemo } from 'react';
// echarts 走页面级动态导入：EChart 内部使用 echarts-for-react 的 core 版本 + 按需注册，
// 确保 echarts 不会出现在首屏入口依赖里，只在进入本页时才加载。
const EChart = lazy(() => import('./EChart'));
import { App, Empty, Segmented, Table } from 'antd';
import { postRequest } from '@utils/api';
import { useAuthStore } from '@/store';
import './scss/welcome';

// ============================================================
// 设计令牌（design tokens）
// 分类色按固定槽位顺序取用，绝不循环、绝不按数值深浅生成
// 状态色仅用于表达状态，不复用为系列色
// ============================================================
const TOKEN = {
    // 分类色（identity）—— 固定顺序
    series: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'],
    // 状态色（state）—— 只表达 好/警告/严重
    status: {
        good: '#0ca30c',
        warning: '#fab219',
        critical: '#d03b3b',
    },
    // 文字墨色 —— 文字永远穿文字色，不穿系列色
    ink: {
        primary: '#0b0b0b',
        secondary: '#52514e',
        muted: '#898781',
    },
    surface: '#fcfcfb',
    gridline: '#e1e0d9',
    axisLine: '#c3c2b7',
};

const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

// 统一 tooltip 外观
const TOOLTIP = {
    backgroundColor: TOKEN.surface,
    borderColor: 'rgba(11, 11, 11, 0.10)',
    borderWidth: 1,
    padding: [8, 12],
    textStyle: { color: TOKEN.ink.primary, fontSize: 12, fontFamily: FONT },
    extraCssText: 'box-shadow: 0 4px 16px rgba(11,11,11,0.10); border-radius: 8px;',
};

const axisLabelStyle = { color: TOKEN.ink.muted, fontSize: 12, fontFamily: FONT };
const splitLineStyle = { lineStyle: { color: TOKEN.gridline, width: 1, type: 'solid' } }; // 实线细线，绝不用虚线
const axisLineStyle = { lineStyle: { color: TOKEN.axisLine, width: 1 } };

// 后端返回的评论状态是中文，映射到状态色
const STATUS_COLOR = {
    '通过': TOKEN.status.good,
    '待审核': TOKEN.status.warning,
    '已拒绝': TOKEN.status.critical,
    '已驳回': TOKEN.status.critical,
};

/**
 * 分类数超过 8 个时，尾部合并为「其他」
 * —— 第 9 个分类绝不新造色相，这是硬规则
 */
const foldToOther = (list, max = 8) => {
    if (!list || list.length <= max) return list || [];
    const head = list.slice(0, max - 1);
    const restSum = list.slice(max - 1).reduce((s, i) => s + i.value, 0);
    return [...head, { name: '其他', value: restSum }];
};

// ============================================================
// 图表配置构造器
// ============================================================

/** 趋势折线图 —— 3 个系列，必须有图例 */
const buildTrendOption = (trend) => ({
    tooltip: {
        ...TOOLTIP,
        trigger: 'axis',
        axisPointer: { type: 'line', lineStyle: { color: TOKEN.axisLine, width: 1 } },
    },
    legend: {
        // >= 2 个系列，图例必须存在，身份不能只靠颜色
        data: ['文章', '评论', '游客'],
        top: 0,
        right: 0,
        icon: 'roundRect',
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { color: TOKEN.ink.secondary, fontSize: 12, fontFamily: FONT },
    },
    grid: { top: 32, right: 16, bottom: 32, left: 44 },
    xAxis: {
        type: 'category',
        data: trend.dates,
        boundaryGap: false,
        axisLabel: {
            ...axisLabelStyle,
            formatter: (v) => v.slice(5), // 只显示 MM-DD
        },
        axisLine: axisLineStyle,
        axisTick: { show: false },
    },
    yAxis: {
        type: 'value',
        axisLabel: axisLabelStyle,
        splitLine: splitLineStyle,
    },
    series: [
        { name: '文章', data: trend.article, color: TOKEN.series[0] },
        { name: '评论', data: trend.comment, color: TOKEN.series[1] },
        { name: '游客', data: trend.tourist, color: TOKEN.series[2] },
    ].map(s => ({
        ...s,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,                                  // 标记点 >= 8px
        lineStyle: { width: 2, color: s.color },        // 2px 细线
        itemStyle: { color: s.color, borderWidth: 2, borderColor: TOKEN.surface },
        emphasis: { focus: 'series' },
    })),
});

/** 环形图 —— 扇区 <= 6 才用；直接标注，不再叠图例 */
const buildDonutOption = (list, { centerText, centerSub, useStatusColor }) => ({
    tooltip: { ...TOOLTIP, trigger: 'item', formatter: '{b}：{c}（{d}%）' },
    title: {
        text: String(centerText ?? ''),
        subtext: centerSub,
        left: 'center',
        top: '36%',
        textStyle: { color: TOKEN.ink.primary, fontSize: 26, fontWeight: 600, fontFamily: FONT },
        subtextStyle: { color: TOKEN.ink.muted, fontSize: 12, fontFamily: FONT },
    },
    series: [{
        type: 'pie',
        radius: ['52%', '72%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: true,
        // 扇区之间留 2px 底色缝隙，靠底色分隔而非描边
        itemStyle: { borderColor: TOKEN.surface, borderWidth: 2 },
        label: {
            color: TOKEN.ink.secondary,
            fontSize: 12,
            fontFamily: FONT,
            formatter: '{b}\n{c}',
            lineHeight: 16,
        },
        labelLine: { length: 8, length2: 10, lineStyle: { color: TOKEN.axisLine } },
        data: list.map((item, i) => ({
            ...item,
            itemStyle: {
                borderColor: TOKEN.surface,
                borderWidth: 2,
                color: useStatusColor
                    ? (STATUS_COLOR[item.name] || TOKEN.ink.muted)
                    : TOKEN.series[i % TOKEN.series.length],
            },
        })),
    }],
});

/** 横向条形图 —— 单系列单色；名义型分类绝不按数值上色 */
const buildHBarOption = (list, { valueName = '数量', labelWidth = 130 } = {}) => ({
    tooltip: {
        ...TOOLTIP,
        trigger: 'axis',
        axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(11,11,11,0.04)' } },
        formatter: (p) => `${p[0].name}<br/>${valueName}：${p[0].value}`,
    },
    grid: { top: 8, right: 52, bottom: 8, left: 8, containLabel: true },
    xAxis: {
        type: 'value',
        axisLabel: axisLabelStyle,
        splitLine: splitLineStyle,
        axisLine: { show: false },
    },
    yAxis: {
        type: 'category',
        data: list.map(d => d.name),
        inverse: true,                                   // 第一名在最上面
        axisLabel: {
            ...axisLabelStyle,
            color: TOKEN.ink.secondary,
            width: labelWidth,
            overflow: 'truncate',
            align: 'right',
        },
        axisLine: { show: false },
        axisTick: { show: false },
    },
    series: [{
        type: 'bar',
        data: list.map(d => d.value),
        barWidth: 13,                                    // 细条，不用粗色块
        itemStyle: {
            color: TOKEN.series[0],
            borderRadius: [0, 4, 4, 0],                  // 数据端 4px 圆角，锚在基线
        },
        label: {
            show: true,
            position: 'right',                           // 标在条外侧，绝不被条长截断
            color: TOKEN.ink.secondary,
            fontSize: 12,
            fontFamily: FONT,
        },
        emphasis: { itemStyle: { color: '#1c5cab' } },   // hover 加深，不换色相
    }],
});

/** 纵向柱状图 —— 单系列单色（评论活跃时段） */
const buildColumnOption = (values) => ({
    tooltip: {
        ...TOOLTIP,
        trigger: 'axis',
        axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(11,11,11,0.04)' } },
        formatter: (p) => `${p[0].name}：${p[0].value} 条`,
    },
    grid: { top: 16, right: 16, bottom: 28, left: 40 },
    xAxis: {
        type: 'category',
        data: Array.from({ length: 24 }, (_, i) => `${i}时`),
        axisLabel: { ...axisLabelStyle, interval: 1 },   // 隔一个显示，避免拥挤
        axisLine: axisLineStyle,
        axisTick: { show: false },
    },
    yAxis: { type: 'value', axisLabel: axisLabelStyle, splitLine: splitLineStyle },
    series: [{
        type: 'bar',
        data: values,
        barWidth: 10,
        itemStyle: {
            color: TOKEN.series[0],
            borderRadius: [4, 4, 0, 0],                  // 顶端 4px 圆角
        },
        emphasis: { itemStyle: { color: '#1c5cab' } },
    }],
});

/** 双系列横向条形（热门文章：点赞 / 收藏）—— 2 个系列，必须有图例 */
const buildHotArticleOption = (list) => ({
    tooltip: {
        ...TOOLTIP,
        trigger: 'axis',
        axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(11,11,11,0.04)' } },
    },
    legend: {
        data: ['点赞', '收藏'],
        top: 0,
        right: 0,
        icon: 'roundRect',
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { color: TOKEN.ink.secondary, fontSize: 12, fontFamily: FONT },
    },
    grid: { top: 32, right: 52, bottom: 8, left: 8, containLabel: true },
    xAxis: {
        type: 'value',
        axisLabel: axisLabelStyle,
        splitLine: splitLineStyle,
        axisLine: { show: false },
    },
    yAxis: {
        type: 'category',
        data: list.map(d => d.name),
        inverse: true,
        axisLabel: {
            ...axisLabelStyle,
            color: TOKEN.ink.secondary,
            width: 150,
            overflow: 'truncate',
            align: 'right',
        },
        axisLine: { show: false },
        axisTick: { show: false },
    },
    series: [
        {
            name: '点赞',
            type: 'bar',
            data: list.map(d => d.likes),
            barWidth: 9,
            itemStyle: { color: TOKEN.series[0], borderRadius: [0, 4, 4, 0] },
            emphasis: { itemStyle: { color: '#1c5cab' } },
        },
        {
            name: '收藏',
            type: 'bar',
            data: list.map(d => d.collects),
            barWidth: 9,
            itemStyle: { color: TOKEN.series[1], borderRadius: [0, 4, 4, 0] },
            emphasis: { itemStyle: { color: '#c2521f' } },
        },
    ],
});

// ============================================================
// 子组件
// ============================================================

const StatCard = ({ label, value, suffix, hint }) => (
    <div className='stat-card'>
        <div className='stat-label'>{label}</div>
        <div className='stat-value'>
            {value ?? 0}
            {suffix && <span className='stat-suffix'>{suffix}</span>}
        </div>
        {hint && <div className='stat-hint'>{hint}</div>}
    </div>
);

const ChartCard = ({ title, sub, option, height = 260, span2, loading }) => (
    <div className={`chart-card${span2 ? ' span-2' : ''}`}>
        <h3 className='chart-title'>{title}</h3>
        {sub && <p className='chart-sub'>{sub}</p>}
        <Suspense fallback={<div style={{ height, width: '100%' }} />}>
            <EChart
                option={option}
                style={{ height, width: '100%', opacity: loading ? 0.45 : 1, transition: 'opacity .2s' }}
                notMerge
                lazyUpdate
            />
        </Suspense>
    </div>
);

// 简版列表卡片（最新评论 / 最新文章）—— 用 antd Table
const ListCard = ({ title, sub, columns, rows, span2 }) => (
    <div className={`chart-card${span2 ? ' span-2' : ''}`}>
        <h3 className='chart-title'>{title}</h3>
        {sub && <p className='chart-sub'>{sub}</p>}
        <Table
            size='small'
            rowKey={(r) => `row-${r.id}`}
            columns={columns.map(c => ({ ...c, dataIndex: c.key, ellipsis: true }))}
            dataSource={rows}
            pagination={false}
            scroll={{ y: 320 }}
        />
    </div>
);

// ============================================================
// 页面
// ============================================================

const WelCome = () => {
    const auth = useAuthStore(state => state.auth);
    const { message: messageApi } = App.useApp();

    const [data, set_data] = useState(null);
    const [loading, set_loading] = useState(false);
    const [trendDays, set_trendDays] = useState(30);

    const fetchDashboard = async (days) => {
        set_loading(true);
        try {
            const resp = await postRequest('/api/stats/getDashboard', { trendDays: days });
            if (resp.code === 0 && resp.data) {
                set_data(resp.data);
            } else {
                messageApi.open({ type: 'error', content: resp.message || '数据加载失败' });
            }
        } catch {
            messageApi.open({ type: 'error', content: '数据加载失败' });
        } finally {
            set_loading(false);
        }
    };

    useEffect(() => {
        const load = async () => {
            await fetchDashboard(trendDays);
        };
        load();
    }, [trendDays]);

    // 图表配置：全部按 data 计算一次，避免每次渲染重建
    const options = useMemo(() => {
        if (!data) return null;
        const { trend, categoryDist, commentStatus, locationDist, hourlyActivity, hotArticles, activeAuthors, labelUsage } = data;

        const totalCommentStatus = commentStatus.reduce((s, i) => s + i.value, 0);
        const totalCategory = categoryDist.reduce((s, i) => s + i.value, 0);

        return {
            trend: buildTrendOption(trend),
            categoryDist: buildDonutOption(foldToOther(categoryDist, 8), {
                centerText: totalCategory,
                centerSub: '文章总数',
            }),
            commentStatus: buildDonutOption(commentStatus, {
                centerText: totalCommentStatus,
                centerSub: '评论总数',
                useStatusColor: true,
            }),
            hourly: buildColumnOption(hourlyActivity),
            hotArticles: buildHotArticleOption(hotArticles),
            activeAuthors: buildHBarOption(activeAuthors, { valueName: '发文数' }),
            labelUsage: buildHBarOption(labelUsage, { valueName: '引用次数', labelWidth: 110 }),
            locationDist: buildHBarOption(locationDist, { valueName: '评论数', labelWidth: 110 }),
        };
    }, [data]);

    const o = data?.overview || {};

    const today = new Date().toLocaleDateString('zh-CN', {
        year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
    });

    return (
        <div className='welcome'>
            {/* 页头 */}
            <div className='dash-header'>
                <h2 className='dash-title'>
                    数据概览{auth?.name ? ` · 欢迎回来，${auth.name}` : ''}
                </h2>
                <span className='dash-date'>{today}</span>
            </div>

            {/* KPI 指标行 —— 16 项概览数字全部安置于此 */}
            <div className='stat-row'>
                <StatCard label='文章总数' value={o.articleCount}
                    hint={`今日新增 ${o.todayArticles ?? 0} 篇 · 置顶 ${o.topArticleCount ?? 0} 篇`} />
                <StatCard label='评论总数' value={o.commentCount}
                    hint={`今日新增 ${o.todayComments ?? 0} 条 · 待审核 ${o.pendingComments ?? 0} 条`} />
                <StatCard label='游客总数' value={o.touristCount}
                    hint={`今日新增 ${o.todayTourists ?? 0} 人 · 禁言 ${o.bannedTourists ?? 0} 人`} />
                <StatCard label='后台用户' value={o.userCount}
                    hint={`分类 ${o.typeCount ?? 0} 个 · 标签 ${o.labelCount ?? 0} 个`} />
                <StatCard label='累计点赞' value={o.likesSum} hint='全部文章合计' />
                <StatCard label='累计收藏' value={o.collectsSum} hint='全部文章合计' />
            </div>

            <div className='chart-grid'>
                {/* 过滤器行：所有图表共用同一个时间切片 */}
                <div className='chart-card span-2 filter-bar'>
                    <span className='filter-label'>趋势区间</span>
                    <Segmented
                        value={trendDays}
                        onChange={set_trendDays}
                        options={[
                            { label: '近 7 天', value: 7 },
                            { label: '近 30 天', value: 30 },
                            { label: '近 90 天', value: 90 },
                            { label: '近 365 天', value: 365 },
                        ]}
                    />
                    <span className='filter-tip'>评论审核状态：待审核 {o.pendingComments ?? 0} · 已通过 {o.approvedComments ?? 0} · 已拒绝 {o.rejectedComments ?? 0}</span>
                </div>

                {options && <>
                    <ChartCard
                        title='内容增长趋势'
                        sub={`近 ${trendDays} 天 · 文章 / 评论 / 游客`}
                        option={options.trend}
                        height={300}
                        span2
                        loading={loading}
                    />

                    <ChartCard
                        title='文章分类分布'
                        sub='按分类统计文章数'
                        option={options.categoryDist}
                        height={280}
                        loading={loading}
                    />

                    <ChartCard
                        title='评论审核状态'
                        sub='待审核 / 已通过 / 已拒绝'
                        option={options.commentStatus}
                        height={280}
                        loading={loading}
                    />

                    <ChartCard
                        title='评论活跃时段'
                        sub='按小时统计（0-23 时）'
                        option={options.hourly}
                        height={260}
                        span2
                        loading={loading}
                    />

                    <ChartCard
                        title='热门文章 Top10'
                        sub='按点赞 / 收藏排序'
                        option={options.hotArticles}
                        height={340}
                        loading={loading}
                    />

                    <ChartCard
                        title='活跃作者 Top10'
                        sub='按发文数排序'
                        option={options.activeAuthors}
                        height={340}
                        loading={loading}
                    />

                    <ChartCard
                        title='标签使用频率 Top10'
                        sub='按被引用次数排序'
                        option={options.labelUsage}
                        height={340}
                        loading={loading}
                    />

                    <ChartCard
                        title='评论属地分布 Top15'
                        sub='按评论数排序'
                        option={options.locationDist}
                        height={340}
                        loading={loading}
                    />

                    <ListCard
                        title='最新评论'
                        sub='最近 10 条'
                        span2
                        rows={data.recentComments || []}
                        columns={[
                            { key: 'nickName', title: '评论人', width: 120, render: (_, r) => r.nickName || '游客' },
                            { key: 'context', title: '评论内容' },
                            { key: 'articleTitle', title: '所属文章', width: 200 },
                            { key: 'ClientIp', title: '属地', width: 140 },
                            { key: 'createdAt', title: '时间', width: 170, render: (_, r) => new Date(r.createdAt).toLocaleString('zh-CN') },
                        ]}
                    />

                    <ListCard
                        title='最新文章'
                        sub='最近 10 篇'
                        span2
                        rows={data.recentArticles || []}
                        columns={[
                            { key: 'title', title: '标题' },
                            { key: 'author', title: '作者', width: 140, render: (_, r) => r.author || '--' },
                            { key: 'typeName', title: '分类', width: 140, render: (_, r) => r.typeName || '--' },
                            { key: 'createdAt', title: '发布时间', width: 170, render: (_, r) => new Date(r.createdAt).toLocaleString('zh-CN') },
                        ]}
                    />
                </>}
            </div>

            {!options && !loading && (
                <div className='chart-card' style={{ marginTop: 12 }}>
                    <Empty description='暂无数据' />
                </div>
            )}
        </div>
    );
};

export default WelCome;
