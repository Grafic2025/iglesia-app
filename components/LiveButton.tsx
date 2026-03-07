import { usePathname } from 'expo-router';
import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface LiveButtonProps {
  isCurrentlyLive: boolean;
  liveVideoUrl?: string;
}

const LiveButton: React.FC<LiveButtonProps> = ({
  isCurrentlyLive,
  liveVideoUrl,
}) => {
  const pathname = usePathname();
  if (!isCurrentlyLive || pathname.includes('news-detail')) return null;

  return (
    <TouchableOpacity
      style={styles.liveBubble}
      onPress={() =>
        Linking.openURL(liveVideoUrl || 'https://youtube.com/@iglesiadelsalvador')
      }
    >
      <View style={styles.liveDot} />
      <Text style={styles.liveBubbleText}>VIVO</Text>
    </TouchableOpacity>
  );
};

export default LiveButton;

const styles = StyleSheet.create({
  liveBubble: {
    position: 'absolute',
    bottom: 35,
    right: 25,
    backgroundColor: '#ff0000',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 9999,
    shadowColor: '#ff0000',
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#ff0000',
  },
  liveBubbleText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 1,
  },
});