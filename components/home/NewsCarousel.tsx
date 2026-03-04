import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image as ExpoImage } from 'expo-image';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');
const BLUR_HASH = 'LEHV6nWB2yk8pyo0adRj00WBnq%M';

interface NewsCarouselProps {
    data: any[];
    onPress: (item: any) => void;
}

const NewsCarousel: React.FC<NewsCarouselProps> = React.memo(({ data, onPress }) => {
    const [activeSlide, setActiveSlide] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (data.length <= 1) return;
        autoPlayRef.current = setInterval(() => {
            setActiveSlide(prev => {
                const next = (prev + 1) % data.length;
                flatListRef.current?.scrollToIndex({ index: next, animated: true });
                return next;
            });
        }, 4000);
        return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); };
    }, [data.length]);

    const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
        if (viewableItems.length > 0) setActiveSlide(viewableItems[0].index || 0);
    }, []);

    const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 });

    const renderItem = useCallback(({ item }: any) => (
        <TouchableOpacity activeOpacity={0.9} style={styles.slide} onPress={() => onPress(item)}>
            <View style={styles.slideInner}>
                <ExpoImage
                    source={{ uri: item.imagen_url || item.image }}
                    style={styles.slideImage}
                    contentFit="cover"
                    placeholder={BLUR_HASH}
                    transition={300}
                />
                <BlurView intensity={35} tint="dark" style={styles.slideInfoContainer}>
                    <View style={styles.infoTopRow}>
                        {item.isLive ? (
                            <View style={styles.newsLiveTag}>
                                <View style={styles.livePulse} />
                                <Text style={styles.newsLiveText}>ESTAMOS EN VIVO</Text>
                            </View>
                        ) : (item.video_url || (item.url && item.url.includes('youtube.com'))) && (
                            <View style={styles.videoIndicator}>
                                <View style={styles.indicatorPlayCircle}>
                                    <MaterialCommunityIcons name="play" size={10} color="#000" />
                                </View>
                                <Text style={styles.videoIndicatorText}>VER VIDEO</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.slideTitleText} numberOfLines={2}>{item.titulo || item.title}</Text>
                </BlurView>
            </View>
        </TouchableOpacity>
    ), [onPress]);

    if (data.length === 0) return null;

    return (
        <View style={styles.carouselContainer}>
            <FlatList
                ref={flatListRef}
                data={data}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig.current}
                renderItem={renderItem}
                maxToRenderPerBatch={3}
                windowSize={3}
                initialNumToRender={1}
                removeClippedSubviews
            />
            {data.length > 1 && (
                <View style={styles.dotRow}>
                    {data.map((_, i) => (
                        <View key={i} style={[styles.dot, i === activeSlide ? styles.dotActive : styles.dotInactive]} />
                    ))}
                </View>
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    carouselContainer: { marginBottom: -10, position: 'relative' },
    slide: { width: width, paddingHorizontal: 20 },
    slideInner: { height: 260, borderRadius: 30, overflow: 'hidden', backgroundColor: '#111' },
    slideImage: { width: '100%', height: '100%' },
    slideInfoContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 50 },
    infoTopRow: { marginBottom: 10 },
    videoIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: '#c5ff00', shadowColor: '#c5ff00', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 4 },
    indicatorPlayCircle: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#c5ff00', justifyContent: 'center', alignItems: 'center', marginRight: 10, shadowColor: '#c5ff00', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 3, elevation: 6 },
    videoIndicatorText: { fontFamily: 'Montserrat_900Black', color: '#c5ff00', fontSize: 11, letterSpacing: 1 },
    slideTitleText: { fontFamily: 'Montserrat_900Black', color: '#fff', fontSize: 21, letterSpacing: -0.5, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 6, marginBottom: 10 },
    newsLiveTag: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
    livePulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#c5ff00', marginRight: 8, shadowColor: '#c5ff00', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 4, elevation: 8 },
    newsLiveText: { fontFamily: 'Montserrat_900Black', color: '#c5ff00', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' },
    dotRow: { flexDirection: 'row', justifyContent: 'center', position: 'absolute', bottom: 12, left: 0, right: 0 },
    dot: { height: 5, borderRadius: 3, marginHorizontal: 2.5 },
    dotActive: { width: 18, backgroundColor: '#c5ff00', shadowColor: '#c5ff00', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 4, elevation: 5 },
    dotInactive: { width: 5, backgroundColor: 'rgba(255,255,255,0.3)' }
});

export default NewsCarousel;
