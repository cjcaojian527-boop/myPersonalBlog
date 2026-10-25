/**
 * 隐私政策 / 用户协议 正文（中英双语）
 *
 * 业务边界（老大钦定）：
 *   - 大藍本是个人博客的移动端阅读应用，不是开放内容平台
 *   - 发布作品的权限只属于运营者（后台管理员），游客没有
 *   - 游客只能：浏览作品、点赞 / 收藏 / 关注、发表评论、点赞评论
 *   - App 内不提供博客账号（管理员）注册功能
 *
 * 其余技术细节均按项目真实实现撰写：
 *   - 游客账号 = 昵称 + 邮箱（无密码、无手机号）
 *   - IP 属地来自 ip2region 离线库，评论与文章各存一份 ClientIp
 *   - 文章配图 / 视频存于运营者自有的 MinIO 对象存储
 *   - 登录态 SM4 加密 + SecureStore 存密钥；后台密码 bcrypt + SM2 传输
 *
 * 以后改条款只动这张表，页面不用碰。
 */

export type LegalSection = {
    /** 章节标题 */
    heading: string;
    /** 普通段落 */
    paragraphs?: string[];
    /** 列表项（每项前面自动加圆点） */
    items?: string[];
};

/** 一种语言的完整文档 */
export type LegalText = {
    title: string;
    updatedAt: string;
    effectiveAt: string;
    sections: LegalSection[];
};

/** 一份文档的中英两个版本 */
export type LegalDoc = {
    zh: LegalText;
    en: LegalText;
};

export type LegalLanguage = 'zh' | 'en';

export const LEGAL_DOCS: Record<'privacy' | 'terms', LegalDoc> = {
    privacy: {
        zh: {
            title: '隐私政策',
            updatedAt: '2026-10-21',
            effectiveAt: '2026-10-21',
            sections: [
                {
                    heading: '一、引言',
                    paragraphs: [
                        '欢迎使用大藍本（以下简称「本应用」）。本应用是由曹健（个人开发者，以下简称「我们」）开发和运营的个人博客移动端阅读应用。',
                        '本应用中的文章、图片、视频等内容，均由我们通过后台管理系统自行发布和管理。本应用不向普通用户开放内容发布权限，也不提供博客账号（管理员）的注册功能。',
                        '我们深知个人信息对您的重要性，并会尽全力保护您的个人信息安全可靠。本政策说明我们如何收集、使用、存储、共享和保护您的个人信息，以及您所享有的权利。请您在使用本应用前仔细阅读并充分理解本政策。您开始使用本应用，即表示您同意本政策。',
                    ],
                },
                {
                    heading: '二、本应用的业务范围与用户权限',
                    items: [
                        '内容发布：仅限运营者本人通过后台管理系统发布和管理文章，本应用内不提供任何内容编辑、上传作品或管理员注册的入口；',
                        '游客权限：您可以浏览我们发布的作品，对文章进行点赞、收藏、关注博主，以及发表评论、点赞评论。',
                    ],
                },
                {
                    heading: '三、我们收集的个人信息',
                    paragraphs: ['我们仅收集实现上述功能所必需的信息，具体如下：'],
                    items: [
                        '账号信息：您注册游客账号时提供的昵称和邮箱。昵称用于标识您的身份并在评论区等处展示；邮箱用于登录校验和区分账号，不向其他用户完整展示。如您的账号设置了头像，头像仅用于评论区等处的展示。',
                        '互动信息：您的点赞、收藏、关注记录，用于生成「关注」「收藏」列表以及计算点赞数、收藏数；您的浏览记录，用于记录您看过的文章；您发表的评论及评论点赞记录，用于展示评论和回复关系。',
                        '网络与设备信息：当您发表评论时，我们会记录您的 IP 地址，并通过离线数据库解析为省市级属地，公开展示为「IP 属地」，不展示完整 IP 地址；注册时会记录浏览器/设备标识（User-Agent），用于安全风控；访问统计以汇总方式记录访问次数和访客数量，统计结果不用于识别个人身份。',
                        '存储在本机设备上的信息：登录令牌和账号信息（经 SM4 加密后存储，加密密钥存放于设备安全存储区）；消息已读记录；图片等缓存文件（可在「设置 - 清理缓存」中清除）。',
                    ],
                },
                {
                    heading: '四、我们不收集的信息',
                    paragraphs: [
                        '本应用展示的文章、图片、视频等内容由我们自行上传并存储于自有对象存储服务，不属于您的个人信息；本应用不向您收集上传的作品或文件。',
                        '我们不会收集您的精确地理位置、通讯录、短信、通话记录，也不申请相机、麦克风、相册权限。本应用不包含广告、第三方统计分析或推送类 SDK。',
                    ],
                },
                {
                    heading: '五、我们如何使用您的个人信息',
                    items: [
                        '提供游客账号登录与身份识别服务；',
                        '展示文章、评论内容及您的互动状态；',
                        '维护「关注」「收藏」「浏览历史」等功能；',
                        '安全风控：防止恶意注册、刷屏、攻击等行为，例如注册频率限制和图形验证码；',
                        '生成不含个人身份的汇总统计，用于改进服务。',
                    ],
                },
                {
                    heading: '六、我们如何存储您的个人信息',
                    paragraphs: [
                        '本应用目前处于开发测试阶段。正式上线后，您的个人信息将存储于中华人民共和国境内的服务器。',
                        '我们仅在为您提供服务所必需的期限内保存您的个人信息。您注销账号后，我们将删除或匿名化处理您的个人信息，法律法规另有规定的除外。我们可能对数据进行备份，备份数据同样适用本政策。',
                    ],
                },
                {
                    heading: '七、我们如何共享、转让、公开披露您的个人信息',
                    paragraphs: [
                        '我们不会出售您的个人信息。除以下情形外，我们不会与任何第三方共享、转让或公开披露您的个人信息：',
                    ],
                    items: [
                        '事先获得您的明确同意；',
                        '根据法律法规、司法或行政机关的强制性要求；',
                        '为维护您或公众的生命、财产等重大合法权益所必需。',
                    ],
                },
                {
                    heading: '八、我们如何保护您的个人信息',
                    items: [
                        '传输安全：后台管理账号的登录密码采用 SM2 国密算法加密传输，并配合时间戳和一次性随机数防止重放攻击；',
                        '存储安全：后台账号密码使用 bcrypt 加盐哈希存储，不保存明文密码；',
                        '本机安全：登录态采用 SM4 加密后存储，密钥保存在设备安全存储区，与密文分离存放；',
                        '访问控制：接口采用令牌（JWT）鉴权，并设置访问频率限制。',
                    ],
                    paragraphs: [
                        '尽管我们采取了上述合理可行的安全措施，但互联网环境并非绝对安全。如发生个人信息安全事件，我们将按照法律法规的要求及时告知您，并向主管部门报告。',
                    ],
                },
                {
                    heading: '九、您的权利',
                    items: [
                        '查询与更正：您可以在「我的」页面查看您的昵称、邮箱等信息；',
                        '删除：您可以删除自己发表的评论等内容；',
                        '注销账号：您可以通过本政策载明的联系方式申请注销游客账号，我们将在核验身份后处理，注销后您的个人信息将被删除或匿名化；',
                        '撤回同意：您可以通过卸载本应用停止使用，并通过联系方式要求删除相关数据；',
                        '联系我们：如对本政策或个人信息处理有疑问，可发送邮件至 cjcaojian527@gmail.com，我们将在 15 个工作日内答复。',
                    ],
                },
                {
                    heading: '十、未成年人保护',
                    paragraphs: [
                        '若您是未满 14 周岁的未成年人，请在监护人的陪同和同意下阅读本政策并使用本应用。若我们发现在未事先获得监护人同意的情况下收集了未成年人的个人信息，会尽快删除相关数据。',
                    ],
                },
                {
                    heading: '十一、本政策的更新',
                    paragraphs: [
                        '我们可能适时更新本政策。更新后，我们会在本应用内以显著方式提示您。若您在更新后继续使用本应用，即视为您接受更新后的政策。',
                    ],
                },
                {
                    heading: '十二、联系我们',
                    paragraphs: ['运营者：曹健（个人开发者）', '电子邮箱：cjcaojian527@gmail.com'],
                },
            ],
        },

        en: {
            title: 'Privacy Policy',
            updatedAt: '2026-10-21',
            effectiveAt: '2026-10-21',
            sections: [
                {
                    heading: '1. Introduction',
                    paragraphs: [
                        'Welcome to Dalanben (the "App"). The App is a mobile reading application for a personal blog, developed and operated by Cao Jian (an individual developer, "we", "us" or "our").',
                        'All articles, images and videos in the App are published and managed by us through our backend management system. The App does not grant content publishing permission to ordinary users and does not provide registration for blog (administrator) accounts.',
                        'We understand the importance of your personal information and will make every effort to protect it. This Policy explains how we collect, use, store, share and protect your personal information, and the rights you have. Please read this Policy carefully before using the App. By starting to use the App, you agree to this Policy.',
                    ],
                },
                {
                    heading: '2. Scope of the App and User Permissions',
                    items: [
                        'Content publishing: only the operator may publish and manage articles through the backend management system. The App provides no entry point for content editing, uploading works or registering administrator accounts.',
                        'Visitor permissions: you may browse the articles we publish, like and save articles, follow authors, post comments on articles, and like comments.',
                    ],
                },
                {
                    heading: '3. Information We Collect',
                    paragraphs: ['We only collect information necessary for the functions described above:'],
                    items: [
                        'Account information: the nickname and email address you provide when registering a visitor account. Your nickname identifies you and is displayed in comment sections; your email is used for login verification and to distinguish accounts, and is not fully displayed to other users. If your account has a profile picture, it is only used for display in comment sections.',
                        'Interaction information: your likes, saves and follows, used to build your "Following" and "Saved" lists and to calculate like and save counts; your browsing records, used to remember the articles you have read; your comments and comment likes, used to display comments and reply relationships.',
                        'Network and device information: when you post a comment, we record your IP address and resolve it to a province/city-level location using an offline database, displayed publicly as "IP location". We do not display your full IP address. At registration we record the browser/device identifier (User-Agent) for security risk control. Access statistics are recorded in aggregate (visit counts and unique visitors) and are not used to identify individuals.',
                        'Information stored on your device: your login token and account information (stored encrypted with SM4, with the encryption key kept in the device\'s secure storage); message read records; cached images and other temporary files (which you can clear in Settings > Clear Cache).',
                    ],
                },
                {
                    heading: '4. Information We Do Not Collect',
                    paragraphs: [
                        'Articles, images, videos and other content displayed in the App are uploaded by us and stored in our own object storage service; they are not your personal information. The App does not collect works or files uploaded by you.',
                        'We do not collect your precise location, contacts, text messages or call records, and we do not request camera, microphone or photo library permissions. The App contains no advertising, third-party analytics or push notification SDKs.',
                    ],
                },
                {
                    heading: '5. How We Use Your Information',
                    items: [
                        'To provide visitor account login and identity verification;',
                        'To display articles, comments and your interaction status;',
                        'To support the "Following", "Saved" and "Browsing History" features;',
                        'For security risk control, such as limiting registration frequency and using CAPTCHAs to prevent malicious registration, spam and attacks;',
                        'To generate aggregate statistics that do not identify individuals, in order to improve our services.',
                    ],
                },
                {
                    heading: '6. How We Store Your Information',
                    paragraphs: [
                        'The App is currently in a development and testing phase. Upon official launch, your personal information will be stored on servers located in the People\'s Republic of China.',
                        'We retain your personal information only for as long as necessary to provide our services. After you cancel your account, we will delete or anonymize your personal information, except as otherwise required by laws and regulations. We may back up data, and such backups are subject to this Policy.',
                    ],
                },
                {
                    heading: '7. Sharing, Transfer and Public Disclosure',
                    paragraphs: [
                        'We do not sell your personal information. We will not share, transfer or publicly disclose your personal information with any third party except in the following circumstances:',
                    ],
                    items: [
                        'with your explicit consent;',
                        'as required by laws, regulations, or mandatory judicial or administrative orders;',
                        'where necessary to protect your or the public\'s vital interests, such as life or property.',
                    ],
                },
                {
                    heading: '8. How We Protect Your Information',
                    items: [
                        'Transmission security: administrator login passwords are transmitted encrypted with the SM2 national cryptographic algorithm, together with timestamps and one-time nonces to prevent replay attacks;',
                        'Storage security: administrator passwords are stored using bcrypt salted hashing; plaintext passwords are never stored;',
                        'On-device security: login state is stored encrypted with SM4, and the key is kept in the device\'s secure storage, separate from the ciphertext;',
                        'Access control: APIs are protected with JWT authentication and rate limiting.',
                    ],
                    paragraphs: [
                        'Although we take the reasonable and practicable security measures described above, the Internet is not absolutely secure. If a personal information security incident occurs, we will notify you promptly and report to the competent authorities as required by laws and regulations.',
                    ],
                },
                {
                    heading: '9. Your Rights',
                    items: [
                        'Access and correction: you can view your nickname, email and other information on the "Me" page;',
                        'Deletion: you can delete comments you have posted;',
                        'Account cancellation: you may request cancellation of your visitor account through the contact details in this Policy. We will process your request after verifying your identity; after cancellation, your personal information will be deleted or anonymized;',
                        'Withdrawal of consent: you may stop using the App by uninstalling it and request deletion of your data through the contact details below;',
                        'Contact us: if you have any questions about this Policy or our processing of personal information, email us at cjcaojian527@gmail.com. We will respond within 15 business days.',
                    ],
                },
                {
                    heading: '10. Protection of Minors',
                    paragraphs: [
                        'If you are under 14 years old, please read this Policy and use the App with the accompaniment and consent of your guardian. If we discover that we have collected personal information of a minor without prior guardian consent, we will delete such data as soon as possible.',
                    ],
                },
                {
                    heading: '11. Updates to This Policy',
                    paragraphs: [
                        'We may update this Policy from time to time. After an update, we will notify you prominently within the App. If you continue to use the App after an update, you are deemed to accept the updated Policy.',
                    ],
                },
                {
                    heading: '12. Contact Us',
                    paragraphs: ['Operator: Cao Jian (individual developer)', 'Email: cjcaojian527@gmail.com'],
                },
            ],
        },
    },

    terms: {
        zh: {
            title: '用户协议',
            updatedAt: '2026-10-21',
            effectiveAt: '2026-10-21',
            sections: [
                {
                    heading: '一、协议的接受与范围',
                    paragraphs: [
                        '本协议是您与曹健（个人开发者，以下简称「我们」）之间就使用大藍本（以下简称「本应用」）所订立的协议。',
                        '本应用是个人博客的移动端阅读应用。本应用中的文章、图片、视频等内容均由我们自行发布和管理；普通用户（游客）只能浏览内容和进行互动，不能发布任何作品。本应用不提供博客账号（管理员）的注册功能。',
                        '您在使用本应用前应认真阅读本协议。您注册游客账号或使用本应用，即视为您已阅读并同意本协议及《隐私政策》。若您未满 18 周岁，应在监护人陪同下阅读并决定是否同意本协议。',
                    ],
                },
                {
                    heading: '二、游客账号的注册与使用',
                    items: [
                        '本应用采用「昵称 + 邮箱」的方式注册和登录游客账号，无需设置密码。请您妥善保管邮箱，因邮箱泄露导致的账号风险由您自行承担；',
                        '游客账号仅用于浏览作品及评论、点赞、收藏、关注等互动功能，不具备任何内容发布权限；',
                        '昵称和邮箱均需唯一，不得冒用他人身份，不得使用违法或侵犯他人权益的名称；',
                        '账号仅限您本人使用，未经我们同意不得转让、出借或出售；',
                        '您应保证注册信息真实、准确，信息变更时应及时更新。',
                    ],
                },
                {
                    heading: '三、内容发布权限',
                    items: [
                        '本应用的内容发布权限仅属于运营者本人，通过独立的后台管理系统发布和管理文章；',
                        '游客不得以任何方式发布作品，包括但不限于尝试调用发布接口、伪造内容、冒充运营者或以其他方式在本应用中展示您自行制作的内容；',
                        '本应用不提供博客账号（管理员）注册入口。任何人不得通过非正常途径获取管理权限。',
                    ],
                },
                {
                    heading: '四、用户行为规范',
                    paragraphs: ['您在使用本应用时，不得实施下列行为：'],
                    items: [
                        '发布违反法律法规、危害国家安全、破坏社会稳定、淫秽色情、暴力恐怖等内容的评论；',
                        '侵犯他人知识产权、名誉权、隐私权等合法权益；',
                        '发布广告、垃圾信息、恶意刷屏、诱导分享；',
                        '通过程序或工具批量注册账号、恶意请求接口、爬取数据；',
                        '干扰、破坏本应用的正常运行，或尝试获取未经授权的访问权限；',
                        '其他违反法律法规或公序良俗的行为。',
                    ],
                },
                {
                    heading: '五、内容与知识产权',
                    items: [
                        '本应用内的文章、图片、视频、界面设计等内容的知识产权归我们或相应权利人所有，未经书面许可不得转载、复制或用于商业用途；',
                        '您在本应用发表的评论，其知识产权归您所有。您授予我们在本应用内展示、存储、复制该评论的非独占许可；',
                        '您保证发表的评论不侵犯任何第三方的合法权益。因您发表的内容引发的纠纷，由您自行承担责任；给我们造成损失的，您应予以赔偿。',
                    ],
                },
                {
                    heading: '六、评论审核与违规处理',
                    items: [
                        '为维护社区秩序，您发表的评论可能需经审核后展示（审核状态包括：待审核、已通过、已驳回）；',
                        '对于违规内容，我们有权采取删除内容、限制展示、禁言、封禁账号等措施，并可视情节保留追究法律责任的权利；',
                        '您对处理结果有异议的，可通过本协议载明的联系方式申诉。',
                    ],
                },
                {
                    heading: '七、服务的变更、中断与终止',
                    items: [
                        '我们可能根据业务需要调整、升级或暂停部分服务，并尽可能提前通知；',
                        '因系统维护、网络故障、不可抗力等原因导致服务中断的，我们将尽力恢复，但不承担由此产生的间接损失；',
                        '若您严重违反本协议，我们有权终止向您提供服务。',
                    ],
                },
                {
                    heading: '八、免责声明',
                    items: [
                        '用户在本应用发表的评论仅代表其个人观点，不代表我们的立场；',
                        '本应用可能包含指向第三方网站的链接，我们不对第三方内容承担责任；',
                        '对于因不可抗力、黑客攻击、计算机病毒等非我们所能控制的原因造成的损失，我们不承担责任，但法律另有规定的除外。',
                    ],
                },
                {
                    heading: '九、账号注销',
                    items: [
                        '您可以联系我们申请注销游客账号。注销后，您的账号信息及互动记录将被删除或匿名化处理，且不可恢复；',
                        '注销后，您发表过的评论可能以匿名化形式保留，以维持评论区的完整性。',
                    ],
                },
                {
                    heading: '十、违约责任',
                    paragraphs: [
                        '若您违反本协议，我们有权视情节采取警告、删除内容、限制功能、禁言、封禁账号等措施；给您或第三方造成损失的，您应依法承担赔偿责任。',
                    ],
                },
                {
                    heading: '十一、协议的修改',
                    paragraphs: [
                        '我们可能适时修订本协议，修订后将在本应用内公布。修订后的协议自公布之日起生效。您继续使用本应用，即视为接受修订后的协议。',
                    ],
                },
                {
                    heading: '十二、法律适用与争议解决',
                    paragraphs: [
                        '本协议的订立、执行和解释均适用中华人民共和国法律。因本协议引起的争议，双方应友好协商；协商不成的，可向运营者所在地有管辖权的人民法院提起诉讼。',
                    ],
                },
                {
                    heading: '十三、联系我们',
                    paragraphs: ['电子邮箱：cjcaojian527@gmail.com'],
                },
            ],
        },

        en: {
            title: 'Terms of Service',
            updatedAt: '2026-10-21',
            effectiveAt: '2026-10-21',
            sections: [
                {
                    heading: '1. Acceptance and Scope',
                    paragraphs: [
                        'This Agreement is entered into between you and Cao Jian (an individual developer, "we", "us" or "our") regarding your use of Dalanben (the "App").',
                        'The App is a mobile reading application for a personal blog. All articles, images and videos in the App are published and managed by us. Ordinary users (visitors) may only browse content and interact with it; they may not publish any works. The App does not provide registration for blog (administrator) accounts.',
                        'Please read this Agreement carefully before using the App. By registering a visitor account or using the App, you are deemed to have read and agreed to this Agreement and the Privacy Policy. If you are under 18, please read this Agreement with your guardian and decide whether to agree.',
                    ],
                },
                {
                    heading: '2. Registration and Use of Visitor Accounts',
                    items: [
                        'The App uses "nickname + email" to register and log in a visitor account; no password is required. Please keep your email secure; you are responsible for risks arising from email leakage.',
                        'Visitor accounts are only for browsing and interactions such as commenting, liking, saving and following. They do not carry any content publishing permission.',
                        'Nicknames and emails must be unique. You may not impersonate others or use names that are illegal or infringe others\' rights.',
                        'Accounts are for your personal use only and may not be transferred, lent or sold without our consent.',
                        'You must provide true and accurate registration information and update it in a timely manner.',
                    ],
                },
                {
                    heading: '3. Content Publishing Permission',
                    items: [
                        'Content publishing permission belongs solely to the operator, who publishes and manages articles through a separate backend management system.',
                        'Visitors may not publish works in any manner, including but not limited to attempting to call publishing APIs, fabricating content, impersonating the operator, or otherwise displaying content you created within the App.',
                        'The App provides no entry point for blog (administrator) account registration. No one may obtain administrative access through improper means.',
                    ],
                },
                {
                    heading: '4. User Conduct',
                    paragraphs: ['When using the App, you must not:'],
                    items: [
                        'post comments that violate laws and regulations, endanger national security, disrupt social stability, or contain obscene, pornographic, violent or terrorist content;',
                        'infringe others\' intellectual property, reputation, privacy or other lawful rights;',
                        'post advertisements, spam, or repeatedly flood content, or induce sharing;',
                        'use programs or tools to register accounts in bulk, abuse APIs, or scrape data;',
                        'interfere with or disrupt the normal operation of the App, or attempt to gain unauthorized access;',
                        'engage in other conduct that violates laws, regulations or public order and good morals.',
                    ],
                },
                {
                    heading: '5. Content and Intellectual Property',
                    items: [
                        'Intellectual property in the articles, images, videos, interface designs and other content of the App belongs to us or the respective rights holders. They may not be reproduced, copied or used for commercial purposes without our written permission.',
                        'Intellectual property in comments you post belongs to you. You grant us a non-exclusive license to display, store and reproduce such comments within the App.',
                        'You warrant that your comments do not infringe any third party\'s lawful rights. You are responsible for disputes arising from your content and shall compensate us for any losses caused to us.',
                    ],
                },
                {
                    heading: '6. Comment Moderation and Violations',
                    items: [
                        'To maintain community order, comments you post may be displayed only after moderation (statuses include: pending, approved, rejected).',
                        'For violating content, we may delete the content, restrict its display, mute you or ban your account, and may reserve the right to pursue legal liability depending on the circumstances.',
                        'If you disagree with a decision, you may appeal through the contact details in this Agreement.',
                    ],
                },
                {
                    heading: '7. Changes, Interruption and Termination of Services',
                    items: [
                        'We may adjust, upgrade or suspend some services as needed and will give notice in advance where possible.',
                        'If services are interrupted due to system maintenance, network failures or force majeure, we will make every effort to restore them but will not be liable for indirect losses arising therefrom.',
                        'If you seriously violate this Agreement, we may terminate your access to the services.',
                    ],
                },
                {
                    heading: '8. Disclaimer',
                    items: [
                        'Comments posted by users represent their personal views only and do not represent our position.',
                        'The App may contain links to third-party websites; we are not responsible for third-party content.',
                        'We are not liable for losses caused by force majeure, hacker attacks, computer viruses or other causes beyond our reasonable control, except as otherwise provided by law.',
                    ],
                },
                {
                    heading: '9. Account Cancellation',
                    items: [
                        'You may contact us to cancel your visitor account. After cancellation, your account information and interaction records will be deleted or anonymized and cannot be recovered.',
                        'After cancellation, comments you posted may be retained in anonymized form to maintain the integrity of the comment section.',
                    ],
                },
                {
                    heading: '10. Liability for Breach',
                    paragraphs: [
                        'If you breach this Agreement, we may take measures such as warnings, content removal, feature restrictions, muting or account bans as appropriate. If you cause losses to us or any third party, you shall bear liability for compensation in accordance with law.',
                    ],
                },
                {
                    heading: '11. Amendments',
                    paragraphs: [
                        'We may amend this Agreement from time to time and will publish the amended version in the App. The amended Agreement takes effect upon publication. Your continued use of the App constitutes acceptance of the amended Agreement.',
                    ],
                },
                {
                    heading: '12. Governing Law and Dispute Resolution',
                    paragraphs: [
                        'The conclusion, performance and interpretation of this Agreement are governed by the laws of the People\'s Republic of China. Disputes arising from this Agreement shall be resolved through friendly negotiation; if negotiation fails, either party may bring a lawsuit before the competent people\'s court at the operator\'s place of residence.',
                    ],
                },
                {
                    heading: '13. Contact Us',
                    paragraphs: ['Email: cjcaojian527@gmail.com'],
                },
            ],
        },
    },
};
