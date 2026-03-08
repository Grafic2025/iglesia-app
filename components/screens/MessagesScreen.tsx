import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import YoutubePlayer from 'react-native-youtube-iframe';

const MessagesScreen = ({ navigateTo }: { navigateTo: (s: string) => void }) => {
    const insets = useSafeAreaInsets();
    const [recursos, setRecursos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState<any>(null);
    const fadeAnim = useState(new Animated.Value(0))[0];

    const fetchRecursos = React.useCallback(async () => {
        try {
            const playlistId = 'PL9eGAPSt61HBxiNwoXIG0xpaWzf0aNTuC';
            const rssUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`;
            const response = await fetch(rssUrl);
            const xml = await response.text();

            const entries = xml.split('<entry>').slice(1);
            const podcasts = entries.map(entry => {
                const videoId = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
                let title = entry.match(/<title>([^<]+)<\/title>/)?.[1];
                const published = entry.match(/<published>([^<]+)<\/published>/)?.[1];
                const descriptionMatch = entry.match(/<media:description>([\s\S]*?)<\/media:description>/);
                let description = descriptionMatch ? descriptionMatch[1] : '';

                if (title) title = title.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'");
                description = description.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'");

                if (!videoId) return null;
                return {
                    id: videoId,
                    titulo: title || 'Podcast',
                    descripcion: description,
                    portada_url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                    video_url: `https://www.youtube.com/watch?v=${videoId}`,
                    fecha: published || new Date().toISOString()
                };
            }).filter(v => v !== null)
                .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

            setRecursos(podcasts);
            Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
        } catch (e) {
            console.error("Error cargando podcasts:", e);
        } finally {
            setLoading(false);
        }
    }, [fadeAnim]);

    useEffect(() => {
        fetchRecursos();
    }, [fetchRecursos]);

    const openVideo = (video: any) => {
        setSelectedVideo(video);
        setModalVisible(true);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#c5ff00" />
            </View>
        );
    }

    return (
        <View style={styles.mainWrapper}>
            <View style={styles.header}>
                <Image
                    source={{ uri: recursos[0]?.portada_url }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="disk"
                />
                <LinearGradient
                    colors={['#050B25', 'rgba(5, 11, 37, 0.2)', '#050B25']}
                    style={StyleSheet.absoluteFill}
                />

                <View style={[styles.headerSafe, { paddingTop: insets.top }]}>
                    <TouchableOpacity onPress={() => navigateTo('Inicio')} style={styles.backButton}>
                        <MaterialCommunityIcons name="chevron-left" size={24} color="#c5ff00" />
                        <Text style={styles.backText}>VOLVER</Text>
                    </TouchableOpacity>

                    <View style={styles.headerBody}>
                        <Text style={styles.headerLabel}>DISCIPULADO</Text>
                        <Text style={styles.headerTitle}>SERIE ESENCIALES</Text>
                        <View style={styles.statsRow}>
                            <View style={styles.statTag}>
                                <Text style={styles.statTagText}>{recursos.length} EPISODIOS</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>

            <Animated.FlatList
                data={recursos}
                style={{ opacity: fadeAnim }}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item, index }) => (
                    <TouchableOpacity
                        style={styles.episodeCard}
                        onPress={() => openVideo(item)}
                        activeOpacity={0.9}
                    >
                        <View style={styles.episodeImageContainer}>
                            <Image
                                source={{ uri: item.portada_url }}
                                style={styles.episodeImage}
                                contentFit="cover"
                                transition={150}
                                cachePolicy="disk"
                            />
                            <BlurView intensity={20} tint="dark" style={styles.episodePlayOverlay}>
                                <MaterialCommunityIcons name="play" size={28} color="#c5ff00" />
                            </BlurView>
                        </View>

                        <View style={styles.episodeDetails}>
                            <Text style={styles.episodeIndex}>EPISODIO {index + 1}</Text>
                            <Text style={styles.episodeTitle} numberOfLines={2}>{item.titulo}</Text>
                        </View>
                    </TouchableOpacity>
                )}
            />

            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />

                    <View style={[styles.modalSafe, { paddingTop: insets.top }]}>
                        <View style={styles.modalContent}>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalClose}>
                                <MaterialCommunityIcons name="close" size={24} color="#fff" />
                            </TouchableOpacity>

                            <View style={styles.playerWrapper}>
                                {selectedVideo && (
                                    <YoutubePlayer
                                        key={selectedVideo.id}
                                        height={220}
                                        play={true}
                                        videoId={selectedVideo.id}
                                    />
                                )}
                            </View>

                            <View style={styles.videoMetaContainer}>
                                <Text style={styles.videoMetaTitle}>{selectedVideo?.titulo}</Text>
                                <Text style={styles.videoMetaSubtitle}>Esenciales • Summer Edition</Text>

                                <View style={styles.modalDivider} />

                                <Text style={styles.videoDescLabel}>ACERCA DE ESTE MENSAJE</Text>
                                <Text style={styles.videoDescText}>
                                    {selectedVideo?.descripcion ? selectedVideo.descripcion : (
                                        'Sumérgete en este episodio de nuestra serie de discipulado. ' +
                                        'Exploramos principios bíblicos prácticos para fortalecer tu caminar con Cristo ' +
                                        'en un formato dinámico y profundo.'
                                    )}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    mainWrapper: { flex: 1, backgroundColor: '#050B25' },
    loadingContainer: { flex: 1, backgroundColor: '#050B25', justifyContent: 'center', alignItems: 'center' },
    header: { height: 320, position: 'relative' },
    headerSafe: { flex: 1, padding: 25 },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        alignSelf: 'flex-start'
    },
    backText: { color: '#c5ff00', fontSize: 10, fontFamily: 'Montserrat_900Black', letterSpacing: 1.5, marginLeft: 8 },
    headerBody: { marginTop: 'auto', marginBottom: 30 },
    headerLabel: { color: '#c5ff00', fontSize: 11, fontWeight: '900', letterSpacing: 4, textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 4 },
    headerTitle: { color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: -1, marginTop: 5, textShadowColor: '#000', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 6 },
    statsRow: { flexDirection: 'row', gap: 10, marginTop: 15 },
    statTag: { backgroundColor: 'rgba(0,0,0,0.9)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10, borderWidth: 1, borderColor: '#c5ff0033' },
    statTagText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },

    listContent: { padding: 15, paddingBottom: 100 },
    episodeCard: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        padding: 10,
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)'
    },
    episodeImageContainer: { width: 115, height: 115, borderRadius: 12, overflow: 'hidden', position: 'relative', backgroundColor: '#000' },
    episodeImage: { width: '100%', height: '100%' },
    episodePlayOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
    episodeDetails: { flex: 1, marginLeft: 15, justifyContent: 'center' },
    episodeIndex: { color: '#c5ff00', fontSize: 11, fontWeight: '900', marginBottom: 4, letterSpacing: 1 },
    episodeTitle: { color: '#fff', fontSize: 16, fontWeight: '900', lineHeight: 22, letterSpacing: -0.3 },
    episodeFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 8, opacity: 0.5 },
    episodeMeta: { color: '#fff', fontSize: 10, fontWeight: '500', marginLeft: 6 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(2, 2, 5, 0.95)' },
    modalSafe: { flex: 1 },
    modalContent: { flex: 1, padding: 20 },
    modalClose: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', alignSelf: 'flex-end', marginBottom: 20 },
    playerWrapper: { borderRadius: 24, overflow: 'hidden', backgroundColor: '#111', elevation: 20 },
    videoMetaContainer: { marginTop: 30 },
    videoMetaTitle: { color: '#fff', fontSize: 24, fontWeight: '900' },
    videoMetaSubtitle: { color: '#c5ff00', fontSize: 13, fontWeight: '700', marginTop: 5 },
    modalDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 25 },
    videoDescLabel: { color: '#999', fontSize: 11, fontWeight: '900', letterSpacing: 2, marginBottom: 10 },
    videoDescText: { color: '#888', fontSize: 14, lineHeight: 22, fontWeight: '400' },
});

export default MessagesScreen;
