import { StyleSheet, Pressable, Image, Platform, Modal, View } from 'react-native';
import { useState } from 'react';
import { useRecyclingState } from '@shopify/flash-list';


import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Heading } from '@/components/ui/Heading';
import { FILE_BASEURI } from '@/utils/const';
import { handleDownload } from '@/utils/utils';
import VideoPlayer from '@/components/ui/VideoPlayer';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { GestureViewer, GestureTrigger } from 'react-native-gesture-image-viewer';
import { useInViewPort } from 'react-native-observable-list';

interface contextItem {
    content: string;
    elementType: string;
    order: number;
    articleId: number;
    id: number;
}

const marginBottom = 10;
// PDF 卡片的图标红，明暗两种主题下都够显眼
const PDF_RED = '#e5484d';
const fileviewMap: { [key: string]: (item: contextItem) => any } = {
    // 视频
    'video/mp4': item => <VideoPlayer videoUri={FILE_BASEURI + item.content} />,
    'video/webm': item => <VideoPlayer videoUri={FILE_BASEURI + item.content} />,
    'video/ogg': item => <VideoPlayer videoUri={FILE_BASEURI + item.content} />,
    // PDF：整张卡片都是下载入口（原来只有那行字能点，手指得戳准才行）
    'application/pdf': item => (
        <Pressable
            onPress={() => handleDownload(FILE_BASEURI + item.content)}
            style={({ pressed }) => [pressed && styles.pdfCardPressed]}
        >
            <ThemedView lightColor="#f5f5f5" darkColor="#26262e" style={styles.pdfCard}>
                <MaterialCommunityIcons name="file-pdf-box" size={42} color={PDF_RED} />

                <View style={styles.pdfInfo}>
                    <ThemedText style={styles.pdfTitle} numberOfLines={1}>PDF 文档</ThemedText>
                    <ThemedText lightColor="#8c8c8c" darkColor="#686869" style={styles.pdfHint}>
                        暂不支持预览，点击下载
                    </ThemedText>
                </View>

                {/* 右边这个下载箭头是给「能点」一个视觉暗示 */}
                <MaterialCommunityIcons name="download" size={22} color="#8c8c8c" />
            </ThemedView>
        </Pressable>
    ),
}
const ItemView = ({ item }: { item: contextItem }) => {
    const colorScheme = useColorScheme();

    const theme = Colors[colorScheme];
    const { elementType = '/', content } = item;
    const [viewerVisible, setViewerVisible] = useState<boolean>(false);


    // 第二个参数是依赖，item.id 一变，state 自动回到初始值 false
    const [visible, set_visible] = useRecyclingState<boolean>(false, [item.id]);

    useInViewPort(() => {
        // 进入视口时执行
        set_visible(true);
        return () => {
            // set_visible(false);
        };
    }, [item.id]); // 依赖数组可选，变化时会重新注册回调


    const renderImage = (imageUrl: string) => (
        <Image
            source={{ uri: imageUrl }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
        />
    );

    if (elementType.includes('/')) {
        //多媒体
        if (fileviewMap[elementType]) {
            return fileviewMap[elementType](item);
        }
        return (<>
            <GestureTrigger onPress={() => setViewerVisible(true)}>
                <Pressable>
                    <Image
                        resizeMode="contain"
                        source={visible ? { uri: FILE_BASEURI + content } : undefined}
                        style={{ height: 200, marginBottom: 10, borderRadius: 12, backgroundColor: theme.icon }}
                    />
                </Pressable>
            </GestureTrigger>
            <Modal visible={viewerVisible} onRequestClose={() => setViewerVisible(false)} transparent animationType="fade">
                <GestureViewer
                    data={[FILE_BASEURI + content]}          // 图片地址数组
                    initialIndex={0}           // 初始显示索引
                    renderItem={renderImage}   // 内容渲染函数
                    onDismiss={() => setViewerVisible(false)}  // 下滑关闭时回调
                />
            </Modal>
        </>)


    } else if (elementType === 'text') {
        return <ThemedText style={{ fontSize: 14, marginBottom, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>{content}</ThemedText>

    } else if (elementType === 'code') {
        return <ThemedText style={{ fontSize: 14, marginBottom, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>{content}</ThemedText>

    } else {
        return <Heading style={{ marginBottom }} level={item.elementType}>{content}</Heading>
    }

}

const styles = StyleSheet.create({
    // PDF 卡片：横向一条，左边图标、中间两行字、右边下载箭头
    pdfCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        gap: 14,
    },
    pdfCardPressed: {
        opacity: 0.7,     // 按下去有个反馈，告诉手指「这块能点」
    },
    pdfInfo: {
        flex: 1,          // 吃掉中间空间，把右边的箭头顶到最边上
        gap: 4,
    },
    pdfTitle: {
        fontSize: 15,
        lineHeight: 21,   // 中文必须和字号成对写，否则上下会被裁
        fontWeight: '500',
    },
    pdfHint: {
        fontSize: 12,
        lineHeight: 17,
    },
});

export default ItemView;