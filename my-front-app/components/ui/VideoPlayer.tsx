import { useVideoPlayer, VideoView } from 'expo-video';

const VideoPlayer = ({ videoUri }: { videoUri: string }) => {
    // 创建播放器实例，可以在这里设置初始状态（比如循环播放）
    const player = useVideoPlayer(videoUri, (player) => {
        player.muted = true;      // 静音
        player.loop = true;
        player.play(); // 如果需要自动播放可以取消注释
    });

    return (
        <VideoView
            player={player}
            style={{ width: '100%', aspectRatio: 16 / 9 }}
            nativeControls // 显示系统自带的播放控制条
            contentFit='contain'

        />
    );
}

export default VideoPlayer;