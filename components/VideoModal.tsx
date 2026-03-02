import { FontAwesome } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import YoutubePlayer from 'react-native-youtube-iframe';

interface VideoModalProps {
  visible: boolean;
  video: any;
  onClose: () => void;
}

const VideoModal: React.FC<VideoModalProps> = ({ visible, video, onClose }) => {
  const insets = useSafeAreaInsets();
  const extractVideoId = (video: any) => {
    const url = video?.video_url || video?.url || '';
    if (video?.id && video.id.length === 11) return video.id;
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[7].length === 11 ? match[7] : '';
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View style={[{ flex: 1, backgroundColor: '#000', paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <TouchableOpacity onPress={onClose} style={styles.closeVideoBtn}>
          <FontAwesome name="arrow-left" size={20} color="#c5ff00" />
          <Text style={{ color: '#fff', marginLeft: 15, fontWeight: '900', letterSpacing: 1 }}>
            CERRAR REPRODUCTOR
          </Text>
        </TouchableOpacity>
        {video && (
          <YoutubePlayer height={260} play={true} videoId={extractVideoId(video)} />
        )}
        <View style={styles.videoDetailContainer}>
          <Text style={styles.videoTitleText}>{video?.titulo || video?.title}</Text>
        </View>
      </View>
    </Modal>
  );
};

export default VideoModal;

const styles = StyleSheet.create({
  closeVideoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 25,
    marginTop: 10,
  },
  videoDetailContainer: {
    padding: 25,
  },
  videoTitleText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 28,
  },
});