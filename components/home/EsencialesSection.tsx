import { FontAwesome } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import React, { useCallback } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const BLUR_HASH = 'LEHV6nWB2yk8pyo0adRj00WBnq%M';

interface EsencialesSectionProps {
    data: any[];
    watchedVideos: Set<string>;
    onVideoPress: (item: any) => void;
    onViewMorePress: () => void;
}

const EsencialesSection: React.FC<EsencialesSectionProps> = React.memo(({ data, watchedVideos, onVideoPress, onViewMorePress }) => {
    const renderItem = useCallback(({ item }: any) => (
        <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.videoCard, watchedVideos.has(item.id) && { opacity: 0.7 }]}
            onPress={() => onVideoPress(item)}
        >
            <View style={styles.videoThumbnailContainer}>
                <ExpoImage
                    source={{ uri: item.imagen_url }}
                    style={styles.videoThumbnail}
                    contentFit="cover"
                    placeholder={BLUR_HASH}
                />
                {watchedVideos.has(item.id) && (
                    <View style={styles.videoWatchedBadge}>
                        <FontAwesome name="check" size={10} color="#000" />
                    </View>
                )}
                <View style={styles.videoPlayOverlay}>
                    <FontAwesome name="play" size={12} color="#000" style={{ marginLeft: 2 }} />
                </View>
            </View>
            <Text style={styles.videoTitle} numberOfLines={2}>{item.titulo}</Text>
        </TouchableOpacity>
    ), [watchedVideos, onVideoPress]);

    if (data.length === 0) return null;

    return (
        <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>SERIE: ESENCIALES</Text>
                <TouchableOpacity style={styles.viewMoreBtn} onPress={onViewMorePress}>
                    <Text style={styles.viewMoreText}>VER TODOS</Text>
                </TouchableOpacity>
            </View>
            <FlatList
                data={data}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingLeft: 20, paddingRight: 20 }}
                renderItem={renderItem}
                keyExtractor={(item) => item.id?.toString()}
                maxToRenderPerBatch={4}
                windowSize={5}
                initialNumToRender={3}
                removeClippedSubviews
            />
        </View>
    );
});

const styles = StyleSheet.create({
    sectionContainer: { marginBottom: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 25, alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 15, fontWeight: '900', color: '#fff', letterSpacing: 1 },
    viewMoreBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#0d0d0d', borderWidth: 1, borderColor: '#1a1a1a' },
    viewMoreText: { color: '#888', fontSize: 10, fontWeight: '800' },
    videoCard: { width: 180, marginRight: 15 },
    videoThumbnailContainer: { height: 110, borderRadius: 24, overflow: 'hidden', marginBottom: 12, backgroundColor: '#000' },
    videoThumbnail: { width: '100%', height: '100%' },
    videoPlayOverlay: { position: 'absolute', bottom: 10, right: 10, width: 34, height: 34, borderRadius: 17, backgroundColor: '#c5ff00', justifyContent: 'center', alignItems: 'center', shadowColor: '#c5ff00', shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
    videoWatchedBadge: { position: 'absolute', top: 10, left: 10, width: 22, height: 22, borderRadius: 11, backgroundColor: '#c5ff00', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#000' },
    videoTitle: { color: '#fff', fontSize: 13, fontWeight: '700', paddingHorizontal: 5, lineHeight: 18 }
});

EsencialesSection.displayName = 'EsencialesSection';
export default EsencialesSection;
