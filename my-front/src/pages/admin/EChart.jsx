// 图表按需注册：只用 echarts-for-react 的 core 版本，
// 它不会在顶层 import 完整 echarts（主入口 lib/index.js 是 import * as echarts from 'echarts'）。
// 本组件由 WelCome 通过 React.lazy 动态导入，echarts 因此只在进入后台统计页时才加载。
import ReactEChartsCore from 'echarts-for-react/esm/core';
import * as echarts from 'echarts/core';
import { LineChart, BarChart, PieChart } from 'echarts/charts';
import {
    GridComponent,
    TooltipComponent,
    LegendComponent,
    TitleComponent,
    AxisPointerComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

// 与 WelCome 用到的图表一一对应：
// 折线(line) / 环形(pie) / 柱状+条形(bar) + grid/tooltip/legend/title/axisPointer
echarts.use([
    LineChart, BarChart, PieChart,
    GridComponent, TooltipComponent, LegendComponent, TitleComponent, AxisPointerComponent,
    CanvasRenderer,
]);

export default function EChart(props) {
    return <ReactEChartsCore echarts={echarts} {...props} />;
}
