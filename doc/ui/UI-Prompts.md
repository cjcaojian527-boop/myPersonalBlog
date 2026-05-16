# UI 原型图提示词 (UI Prompts)

本文档包含根据 Product-Spec.md v1.0.0 生成的原型图提示词，可用于 Midjourney、DALL-E、Stable Diffusion 等工具生成设计稿。

---

## 设计风格与配色

### 版本 A：暗色开发者风格（Dark Dev）

**视觉风格**：Dark Mode

**风格说明**：深色背景+霓虹色强调，类似 GitHub Dark / VS Code 暗色主题。技术博客的目标用户是开发者，暗色模式在码农圈接受度极高，护眼且显得专业。面试官打开后立即感受到"这人是开发者社区的人"。

**配色方案**：
- **主色**：#0d1117 - 页面背景
- **辅助色**：#161b22 - 卡片/区块背景
- **强调色**：#58a6ff - 链接、按钮、高亮
- **文字主色**：#e6edf3 - 正文
- **文字辅助色**：#8b949e - 次要信息
- **代码块背景**：#161b22，代码文字 #c9d1d9
- **边框色**：#30363d - 分割线/边框

---

### 版本 B：现代极简白（Paper White）

**视觉风格**：Modern Minimalist

**风格说明**：大量留白、清晰排版、突出内容本身。类似 Medium / Notion 风格，适合长时间阅读。面试官打开后感觉"干净、有品味"，内容导向而非花哨设计导向。

**配色方案**：
- **主色**：#ffffff - 页面背景
- **辅助色**：#f8f9fa - 卡片/区块背景
- **强调色**：#2563eb - 链接、按钮
- **文字主色**：#1a1a2e - 正文
- **文字辅助色**：#6b7280 - 次要信息
- **代码块背景**：#1e1e2e，代码文字 #cdd6f4 (Catppuccin Mocha)
- **边框色**：#e5e7eb - 分割线/边框

---

### 版本 C：清新科技蓝（Tech Blue）

**视觉风格**：Material Design / Flat Design 混合

**风格说明**：浅色背景+蓝色科技风，带轻微渐变和卡片阴影，亲切不压迫。类似掘金/InfoQ 风格。适合国内技术社区审美，给人"专业但不高冷"的感觉。

**配色方案**：
- **主色**：#f5f7fa - 页面背景（暖灰底色）
- **辅助色**：#ffffff - 卡片背景
- **强调色**：#1e80ff - 链接、按钮、标签
- **文字主色**：#252933 - 正文
- **文字辅助色**：#8a919f - 次要信息
- **代码块背景**：#282c34 (One Dark)，代码文字 #abb2bf
- **边框色**：#e4e6eb - 分割线/边框

---

## 核心 UI 提示词

### 界面 1：首页（文章列表）- 版本 A（暗色开发者）

**功能描述**：博客首页，展示文章列表、顶部导航、侧边栏（分类/标签云/最新文章）、分页。

**提示词**：
```
A professional technical blog homepage, web application UI design, dark mode developer theme. Layout: top sticky navigation bar with blog name "PersonalBlog" on the left, navigation links (Home, Frontend, Backend, Design, Life, About) in the center, and a search icon on the right. Below nav: a hero banner area with subtle gradient dark background (#0d1117 to #161b22) showing a brief tagline. Main content area (left 70%): article cards in a vertical list, each card has dark card background (#161b22), article title in large white text (#e6edf3), summary text in grey (#8b949e), meta info row showing date, view count, and category badge with neon blue accent (#58a6ff), a thin border-bottom separator (#30363d). Floating "views" and "likes" sort tabs at top of list. Pagination at bottom: numbered buttons with hover glow effect (#58a6ff). Right sidebar (30%): sections stacked vertically - "Latest Articles" with compact link list, "Categories" with icon + count, "Tag Cloud" with small rounded pills. Clean monospace font. Code syntax highlight colored text. Subtle card hover effect: slight brightness increase. 1920x1080 resolution, professional, polished, high-quality UI design.
```

**使用建议**：适合生成博客首页整体布局，强调暗色开发者社区氛围。

---

### 界面 1：首页（文章列表）- 版本 B（极简白）

**功能描述**：博客首页，极简白色风格，突出内容。

**提示词**：
```
A minimalist technical blog homepage, web application UI design, clean white theme with ample whitespace. Layout: slim top navigation bar with pure white background (#ffffff), blog name "PersonalBlog" in bold black serif font on the left, navigation links in light grey (#6b7280), subtle bottom border (#e5e7eb). No hero banner - articles start directly. Main content area centered (max-width 720px), article cards in a clean vertical list with generous spacing (24px padding). Each card: bold article title in dark text (#1a1a2e), summary in grey (#6b7280) limited to 2 lines, small meta text below (date, category, views) with tiny blue accent dots. Hover: subtle left border highlight (#2563eb). Pagination as simple "Previous / Next" text links at bottom. Sidebar on the right: clean sections with minimal borders, "Categories" showing as simple text list, "Tag Cloud" as small grey pills with blue hover. Typography: system font stack, generous line-height (1.8), comfortable reading experience. 1920x1080 resolution, minimal, elegant, content-focused, award-winning clean design.
```

**使用建议**：极简阅读体验，适合博客内容密度较高的场景，面试官浏览时感觉专业干净。

---

### 界面 1：首页（文章列表）- 版本 C（清新科技蓝）

**功能描述**：博客首页，掘金/InfoQ 风格，暖灰底色+蓝色强调。

**提示词**：
```
A technology blog homepage inspired by juejin.cn, web application UI design, warm grey background (#f5f7fa) with white cards (#ffffff) and soft box shadows. Layout: sticky top navigation with white background, blog logo "PersonalBlog" left-aligned in bold sans-serif, navigation tabs (Home/Frontend/Backend/Design/Life/About) with blue underline indicator (#1e80ff) on active tab, search input box with rounded corners and magnifier icon on the right. Below nav: a subtle sub-nav showing category quick filters as rounded pills (#e4e6eb). Main content (left 70%): article cards as white rounded rectangles with light shadow, card layout: left side shows cover thumbnail image (rounded corners), right side shows title in dark bold text (#252933), 2-line summary in grey (#8a919f), bottom row with category badge (blue pill #e8f3ff text #1e80ff), date, view count with eye icon. Sort tabs: "Latest" / "Most Viewed" as tab buttons above the list. Pagination: rounded numbered buttons. Right sidebar: "About Me" card with avatar circle at top, "Latest Posts" compact list, "Tag Cloud" as blue outline pills, "Friend Links" at bottom. Smooth card lift animation on hover with shadow increase. 1920x1080 resolution, modern, friendly, professional Chinese tech community style.
```

**使用建议**：国内技术社区审美的博客首页，适合展示给中文面试官。

---

### 界面 2：文章详情页 - 版本 A（暗色开发者）

**功能描述**：文章详情页，含封面图、Markdown 渲染正文、代码高亮、评论、点赞。

**提示词**：
```
A blog article detail page, dark mode developer theme, web application UI design. Layout: top navigation bar (same as homepage dark theme), below that - article content area centered (max-width 800px). From top to bottom: article cover image (full-width, dark overlay gradient), article title in large bold white text (#e6edf3), author and publish date row with small avatar icon, category badge (#58a6ff pill), view count. Main article body: Markdown rendered HTML, dark background (#0d1117), comfortable reading width, headings in bold white, paragraph text in light grey (#e6edf3), inline code in red-tinted background (#ff7b7220), code blocks with VS Code dark theme styling (#161b22 background, syntax highlighted with green strings #7ee787, blue keywords #79c0ff, orange functions #d2a8ff), line numbers in grey. Article bottom: like button (outlined heart icon that fills red on click, with count number), previous/next article navigation as two columns with article titles. Below: comments section header "Comments (N)", each comment showing user avatar (small circle), username, timestamp, comment text, reply button. Threaded replies indented with left border line (#30363d). Comment input box at bottom with text area, captcha image, and submit button (#238636 green). 1920x1080 resolution, professional, polished, dark code-focused design.
```

**使用建议**：展示文章详情页完整交互，突出代码块的视觉质量。

---

### 界面 2：文章详情页 - 版本 B（极简白）

**功能描述**：文章详情页，极简白色阅读体验，代码块使用 Catppuccin 主题。

**提示词**：
```
A minimalist blog article detail page, clean white theme, web application UI design focused on readability. Layout: slim top nav, centered article (max-width 680px). Top: article title in large bold serif font (#1a1a2e), author + date row in small grey text, no cover image (optional, if present it's a full-width banner with blurred white overlay). Article body: generous whitespace, headings in bold serif, paragraph text in dark grey (#1a1a2e) with 1.8 line-height for comfortable reading, blockquotes with left blue border (#2563eb) and light grey background, inline code with light grey background and monospace font. Code blocks: dark Catppuccin Mocha theme (#1e1e2e background) with soft rounded corners and a subtle "copy" button top-right, syntax highlighting with pastel colors (mauve keywords, green strings, blue functions). Article bottom divider line, then navigation: "← Previous Article" and "Next Article →" as clean text links. Like button: outlined heart with count, fills red on hover. Comments section: clean list with user avatar circles, threaded replies with subtle indentation, comment form at bottom with rounded input fields, captcha, and a minimal blue submit button. 1920x1080 resolution, elegant, reader-friendly, clean typography design.
```

**使用建议**：极简阅读体验的首选，面试官打开后感到舒适专业。

---

### 界面 2：文章详情页 - 版本 C（清新科技蓝）

**功能描述**：文章详情页，掘金风格，侧边栏含目录导航。

**提示词**：
```
A technology blog article detail page, Chinese tech community style (juejin.cn inspired), web application UI design. Layout: sticky top nav, article area (left 70%) with white card background, right sidebar with table of contents (TOC). Top of article: large cover image (16:9 aspect ratio) with rounded corners, then article title in bold dark text (#252933), author info bar with large avatar circle, name, publish date, reading time estimate. Article body: rendered Markdown, paragraph text in #252933, headings in bold with hash symbols colored blue (#1e80ff), blockquotes with blue left border and grey background (#f5f7fa), images with rounded corners and shadow. Code blocks: One Dark theme (#282c34), rounded corners 8px, language label top-left, copy button top-right, syntax highlighted code. Bottom: like bar with heart icon animation (bounces on click), share buttons, previous/next article as two cards with cover thumbnails. Right sidebar TOC: sticky, follows scroll, shows H2/H3 headings with active highlight dot, smooth scroll. Below TOC: related articles list. Comments: threaded with user avatars, reply expands inline, comment editor with Markdown toolbar, captcha, submit button. 1920x1080 resolution, modern, engaging, developer-friendly Chinese tech blog design.
```

**使用建议**：带目录导航的文章页，适合长文阅读体验，国内开发者的审美偏好。

---

### 界面 3：搜索结果页 - 版本 A（暗色开发者）

**功能描述**：搜索结果页，与文章列表格式一致，顶部显示搜索关键词和结果数量。

**提示词**：
```
A search results page for a technical blog, dark mode developer theme, web application UI design. Layout: top navigation bar with search input already filled with the query keyword, showing an "X" clear button inside the input. Below nav: search meta bar showing "Search results for 'vue deployment': 12 articles found" in light grey text (#8b949e), with sort options as small tabs (Relevance / Latest). Main content area: article result cards identical to homepage list format (dark card background #161b22), but with search keyword highlighted in yellow (#f2cc60) in both title and summary text. If no results: centered empty state illustration (simple magnifier icon with "X"), message "No results found" in grey, and suggestion "Try different keywords" below. Pagination at bottom. 1920x1080 resolution, professional, intuitive search UX design.
```

**使用建议**：展示搜索结果页的完整状态（有结果和无结果）。

---

### 界面 4：后台管理（文章编辑器）- 版本 A（暗色开发者）

**功能描述**：后台文章编辑页，左侧 Markdown 编辑器，右侧实时预览，顶部工具栏。

**提示词**：
```
A blog admin dashboard, article editor page, dark mode developer theme, web application UI design. Layout: left sidebar (collapsed navigation with icons: Dashboard icon, Articles icon, Categories icon, Tags icon, Comments icon, Settings gear icon), dark background (#161b22) with neon blue active indicator. Main area: top bar showing breadcrumb "Dashboard / Articles / New Article" with "Save Draft" (grey outline button) and "Publish" (blue filled button #238636) on the right. Below: article title input (large text, dark background, no border, placeholder "Article Title"). Then a toolbar row with Markdown formatting buttons (Bold, Italic, Heading, Link, Image, Code, Quote) as small icon buttons. Below toolbar: split pane layout - left half: Markdown editor textarea with monospace font, dark background (#0d1117), line numbers, syntax subtle highlighting for Markdown syntax (#8b949e). Right half: real-time Markdown preview rendered in HTML, matching the frontend article detail page style. Below editor: metadata panel with fields "Category" (dropdown), "Tags" (multi-select tag input with pills), "Cover Image" (upload area with dashed border), "Slug" (auto-generated text field). Footer: "Save Draft" + "Publish" buttons. 1920x1080 resolution, professional developer tool design, clean dark admin panel.
```

**使用建议**：后台核心页面，Markdown 编辑器分屏是技术博客后台的标志性设计。

---

### 界面 4：后台管理（文章编辑器）- 版本 B（极简白）

**功能描述**：后台文章编辑页，类似 Notion 的极简编辑体验。

**提示词**：
```
A minimalist blog admin article editor page, Notion-inspired clean design, web application UI design. Layout: very minimal - no sidebar, just a top bar with light grey background (#f8f9fa), left: blog logo, center: breadcrumb "Articles / New", right: "Save Draft" (grey) and "Publish" (blue #2563eb) buttons. Main editor area: centered (max-width 800px), starts with title field (large placeholder text "Untitled", no visible border, serif font), then a unified editing area where you type Markdown directly and see WYSIWYG-like rendering instantly (no split pane), similar to Notion's block-based editing. Below title: a subtle toolbar that appears on text selection with formatting options. Article metadata at the top as small configurable fields (category dropdown, tag input) that collapse when focused on writing. Clean, distraction-free writing experience. 1920x1080 resolution, minimal, elegant, writer-focused design.
```

**使用建议**：极简写作体验的后台编辑器，适合不喜欢复杂界面的博主。

---

## 交互流程提示词

### 流程 1：访客浏览 → 搜索 → 阅读 → 评论

**流程描述**：访客打开博客首页 → 浏览文章列表 → 使用搜索找文章 → 点击进入详情页阅读 → 登录后发表评论

**关键界面**：
- 界面 1：博客首页（文章列表 + 搜索入口）
- 界面 2：搜索结果页（关键词高亮）
- 界面 3：文章详情页（正文 + 评论区）
- 界面 4：评论输入（评论区展开 + 验证码）

**提示词**：
```
A 4-step user journey flow for a technical blog, dark mode developer theme, web application UI, showing the complete path from landing to commenting. Step 1: blog homepage with article list, user clicks search icon in nav, search modal/dropdown appears. Step 2: search results page with matching articles, keywords highlighted in yellow, user clicks an article card. Step 3: article detail page with full content, user scrolls to bottom, sees comments section with existing threaded comments. Step 4: user clicks "Write a comment", login prompt appears (username + password form in a modal), after login, comment form expands with textarea and captcha image, user types comment and clicks submit, new comment appears at top of list with fade-in animation. Show smooth transitions between each step, consistent dark color scheme, professional interaction design. 1920x1080 resolution, polished user flow, intuitive navigation.
```

---

### 流程 2：博主登录 → 写文章 → 发布

**流程描述**：博主打开后台 → 登录 → 进入文章编辑器 → 编写 Markdown 文章 → 设置分类标签 → 发布

**关键界面**：
- 界面 1：后台登录页
- 界面 2：后台仪表盘（文章列表）
- 界面 3：文章编辑页（Markdown 分屏编辑器）
- 界面 4：文章发布确认 + 发布后效果

**提示词**：
```
A 4-step blogger admin workflow, dark mode developer theme, web application UI. Step 1: simple login page with centered card, username and password fields, rounded inputs, blue login button, minimalist design. Step 2: admin dashboard with left sidebar navigation, main area shows article table with columns (Title, Category, Status, Date, Actions), blue "New Article" button top-right. Step 3: article editor with split pane - left Markdown editor with line numbers and syntax hints, right real-time preview showing rendered HTML with code highlighting, metadata panel below for category/tags/cover image. Step 4: publish confirmation modal "Publish this article?" with preview snippet, clicking "Confirm" shows success toast notification, article now visible with "Published" badge in the list. Clean transitions, professional admin panel design. 1920x1080 resolution, polished developer tool workflows.
```

---

### 流程 3：管理员管理评论

**流程描述**：博主在后台查看评论列表 → 筛选某个文章的评论 → 删除违规评论

**关键界面**：
- 界面 1：后台评论管理列表
- 界面 2：删除确认弹窗

**提示词**：
```
A blog admin comment management page, dark mode developer theme, web application UI. Main area: comments table showing all comments across articles, columns: User Avatar + Name, Comment Text (truncated), Article Title (link), Date, Status, Action button (trash icon). Filter row at top: dropdown to filter by article, search by comment content. Clicking trash icon shows red confirmation dialog "Are you sure you want to delete this comment?" with Cancel and Confirm buttons. After deletion, the comment row fades out with a smooth animation and a brief toast "Comment deleted" appears. 1920x1080 resolution, clean admin management design.
```

---

## 响应式设计说明

由于未引入 AI 增强功能，以下直接提供移动端适配要点：

---

### 移动端适配（响应式设计）

**桌面端（≥1024px）**：双栏布局，左侧文章列表（70%）+ 右侧边栏（30%），完整导航栏

**平板端（768-1023px）**：单栏布局，侧边栏移至页面底部，导航栏折叠为汉堡菜单

**移动端（<768px）**：
- 导航栏：顶部固定，汉堡菜单展开全屏导航
- 文章列表：单栏全宽，卡片圆角缩小，减少间距
- 文章详情：全宽排版，代码块可横向滚动，封面图全宽
- 评论区：输入框贴底固定，盖楼回复缩进减少
- 后台编辑器：Markdown 编辑区和预览区上下切换（Tab 切换），而非左右分屏
- 搜索：搜索输入框全宽展开

---

## 设计建议

### 布局建议
- 首页文章列表采用卡片式布局，每个卡片视觉上独立，方便扫描阅读
- 文章详情页内容区保持 680-800px 最大宽度，符合最佳阅读行宽（60-80 字符/行）
- 侧边栏放置辅助信息，不要让侧边栏的内容比主内容区更吸引眼球
- 后台编辑器分屏比例建议 1:1，代码块较长时间可拖动调整

### 交互建议
- 导航栏切换分类时做平滑过渡，避免页面闪烁
- 点赞按钮点击有微动画（心形缩放），提升交互反馈感
- 评论提交后即时显示（乐观更新），先显示再请求后端
- 搜索输入框聚焦时自动展开，失焦时收缩
- 分页切换使用 AJAX 无刷新加载，保持滚动位置

### 动效建议
- 页面切换：fade-in + 轻微上移（translateY 4px → 0），200ms
- 卡片 hover：轻微上浮（translateY -2px）+ 阴影加深，150ms ease
- 按钮 hover：背景色过渡，150ms
- 评论展开：max-height 动画展开回复区域
- Toast 提示：从顶部滑入，停留 3 秒后淡出

---

## 使用指南

### 生成设计稿的步骤

1. **选择视觉版本**：从版本 A（暗色）、B（极简白）、C（清新蓝）中选一个你喜欢的
2. **复制提示词**：将对应界面的提示词完整复制到图像生成工具
3. **调整参数**：根据工具要求调整尺寸、风格强度等参数
4. **生成多个版本**：每个界面建议生成 2-3 个变体对比
5. **选择最佳方案**：选择最符合需求的设计稿
6. **反馈调整**：如果不满意，可以调整配色描述或布局描述重新生成

### 推荐的图像生成工具

- **Midjourney**：添加参数 `--ar 16:9 --style raw --v 6`，适合生成高质量 UI 概念图
- **DALL-E 3**：直接粘贴提示词，对文字渲染更好
- **Stable Diffusion**：使用 SDXL 模型 + 合适的 LoRA（如 UI design LoRA），参数 `--ar 16:9`
- **v0.dev (Vercel)**：直接粘贴提示词生成可交互的 React 组件代码，最接近实际开发

### 常见问题

**Q: 生成的图片不符合预期怎么办？**
A: 调整提示词中的关键元素描述，或尝试不同的版本。可以先去掉一些细节描述，让 AI 有更多发挥空间。

**Q: 如何保持多个界面风格一致？**
A: 所有提示词开头都加上相同的配色和风格描述前缀，在生成时强调"consistent with previous design"。

**Q: 生成的图片可以作为开发参考吗？**
A: 可以，AI 生成的 UI 概念图主要作用是定调视觉方向和布局结构，实际开发时 CSS 细节需要手动调整。

---

## 版本历史

- 1.0.0 - 2026-05-11：根据 Product-Spec.md v1.0.0 生成
  - 新增：3 套视觉方案（暗色/极简白/清新蓝）
  - 新增：4 个核心界面提示词（首页、详情页、搜索、后台编辑器）
  - 新增：3 个交互流程提示词
  - 新增：响应式设计要点、设计建议、动效建议

---

**文档版本**：1.0.0

**最后更新**：2026-05-11

**对应的产品文档**：Product-Spec.md v1.0.0

**下次更新计划**：产品文档更新或设计风格调整后
