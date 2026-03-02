import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import YoutubePlayer from 'react-native-youtube-iframe';

const extractVideoId = (url: string | undefined | null) => {
    if (!url) return "";
    const match = url.match(/(?:\?v=|&v=|v\/|embed\/|youtu\.be\/|\/v\/|watch\?v=)([^#&?]*).*/);
    return (match && match[1].length === 11) ? match[1] : (url.length === 11 ? url : "");
};

export default function MensajesScreen() {
    const insets = useSafeAreaInsets();
    const [recursos, setRecursos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState<any>(null);

    useEffect(() => {
        fetchRecursos();
    }, []);

    const fetchRecursos = async () => {
        try {
            // Cargar playlist "Discipulado Summer Edition" desde YouTube
            const playlistId = 'PL9eGAPSt61HBxiNwoXIG0xpaWzf0aNTuC';
            const rssUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`;
            const response = await fetch(rssUrl);
            const xml = await response.text();

            const entries = xml.split('<entry>').slice(1);
            const podcasts = entries.map(entry => {
                const videoId = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
                let title = entry.match(/<title>([^<]+)<\/title>/)?.[1];
                const published = entry.match(/<published>([^<]+)<\/published>/)?.[1];
                if (title) title = title.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

                if (!videoId) return null;
                return {
                    id: videoId,
                    titulo: title || 'Podcast',
                    portada_url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                    video_url: `https://www.youtube.com/watch?v=${videoId}`,
                    fecha: published || new Date().toISOString()
                };
            }).filter(v => v !== null)
                .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

            setRecursos(podcasts);
        } catch (e) {
            console.error("Error cargando podcasts:", e);
        } finally {
            setLoading(false);
        }
    };

    const openVideo = (video: any) => {
        setSelectedVideo(video);
        setModalVisible(true);
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#c5ff00" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.headerWrapper}>
                <Image
                    source={{ uri: recursos[0]?.portada_url || 'https://via.placeholder.com/400x200' }}
                    style={styles.headerBackground}
                    resizeMode="cover"
                />
                <LinearGradient
                    colors={['rgba(0, 0, 0, 0.95)', 'rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0.98)']}
                    style={styles.headerOverlay}
                >
                    <View style={styles.headerContent}>
                        <Text style={styles.title}>Discipulado Summer Edition</Text>
                        <Text style={styles.subtitle}>Serie Esenciales • {recursos.length} episodios</Text>
                    </View>
                </LinearGradient>
            </View>

            <LinearGradient
                colors={['#0f0f1e', '#1a1a2e', '#0f0f1e']}
                style={styles.listContainer}
            >
                <FlatList
                    data={recursos}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    renderItem={({ item, index }) => (
                        <TouchableOpacity
                            style={styles.card}
                            onPress={() => openVideo(item)}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#2a2a3e', '#1e1e2e']}
                                style={styles.cardGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <View style={styles.imageContainer}>
                                    <Image
                                        source={{ uri: item.portada_url }}
                                        style={styles.cover}
                                    />
                                    <View style={styles.playOverlay}>
                                        <FontAwesome name="play-circle" size={40} color="#c5ff00" />
                                    </View>
                                </View>
                                <View style={styles.info}>
                                    <Text style={styles.episodeNumber}>Episodio {index + 1}</Text>
                                    <Text style={styles.itemName} numberOfLines={2}>{item.titulo}</Text>
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                    )}
                />
            </LinearGradient>

            <Modal visible={modalVisible} animationType="slide">
                <View style={[styles.modalContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                    <LinearGradient
                        colors={['#1a1a2e', '#0f0f1e']}
                        style={styles.modalContent}
                    >
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                                <FontAwesome name="arrow-left" size={20} color="#c5ff00" />
                                <Text style={styles.closeText}>Volver</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                            <View style={styles.videoContainer}>
                                {selectedVideo && (
                                    <YoutubePlayer
                                        key={extractVideoId(selectedVideo.video_url)}
                                        height={220}
                                        play={true}
                                        videoId={extractVideoId(selectedVideo.video_url)}
                                    />
                                )}
                            </View>

                            <View style={styles.videoInfo}>
                                <Text style={styles.videoTitle}>{selectedVideo?.titulo}</Text>
                                <Text style={styles.videoSubtitle}>Iglesia del Salvador • Serie Esenciales</Text>

                                <View style={styles.divider} />

                                <Text style={styles.descriptionTitle}>Acerca de este episodio</Text>
                                <Text style={styles.descriptionText}>
                                    Parte de la serie &quot;Discipulado Summer Edition&quot;, donde exploramos los fundamentos
                                    esenciales de la fe cristiana. Cada episodio profundiza en aspectos clave que
                                    fortalecen nuestra relación con Dios y nuestra comprensión del evangelio.
                                </Text>
                            </View>
                        </ScrollView>
                    </LinearGradient>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f0f1e'
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0f0f1e'
    },
    header: {
        paddingTop: 60,
        paddingBottom: 30,
        paddingHorizontal: 20,
    },
    headerWrapper: {
        position: 'relative',
        overflow: 'hidden',
        height: 280,
    },
    headerBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
    },
    headerOverlay: {
        paddingTop: 60,
        paddingBottom: 15,
        paddingHorizontal: 20,
        justifyContent: 'flex-end',
        minHeight: 280,
    },
    headerContent: {
        alignItems: 'center',
    },
    iconContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'rgba(197, 255, 0, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        borderWidth: 2,
        borderColor: '#c5ff00',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 6,
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
    },
    subtitle: {
        color: '#c5ff00',
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
        backgroundColor: 'rgba(0,0,0,0.4)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 10,
        overflow: 'hidden',
        marginTop: 10
    },
    listContainer: {
        flex: 1,
    },
    list: {
        padding: 15,
        paddingBottom: 30,
    },
    card: {
        borderRadius: 20,
        marginBottom: 10,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: '#333',
        backgroundColor: '#0d0d0d',
    },
    cardGradient: {
        flexDirection: 'row',
        padding: 8,
        backgroundColor: '#0f0f0f',
    },
    imageContainer: {
        position: 'relative',
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#000',
    },
    cover: {
        width: 110,
        height: 110,
        borderRadius: 12,
    },
    playOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    info: {
        flex: 1,
        padding: 8,
        paddingLeft: 12,
        justifyContent: 'center',
    },
    episodeNumber: {
        color: '#c5ff00',
        fontSize: 9,
        fontWeight: 'bold',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    itemName: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 4,
        lineHeight: 20,
    },
    itemDate: {
        color: '#888',
        fontSize: 12,
        marginBottom: 10,
    },
    playRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    playText: {
        color: '#c5ff00',
        fontSize: 12,
        fontWeight: 'bold',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#0f0f1e',
    },
    modalContent: {
        flex: 1,
    },
    modalHeader: {
        padding: 20,
        paddingTop: 60,
        backgroundColor: '#1a1a2e',
        zIndex: 10,
    },
    closeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    closeText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    scrollContent: {
        flex: 1,
    },
    modalVideoHeader: {
        position: 'relative',
        height: 200,
        marginBottom: 20,
        overflow: 'hidden',
    },
    modalHeaderBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
    },
    modalHeaderOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    modalVideoTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 8,
    },
    modalVideoSubtitle: {
        fontSize: 13,
        color: '#c5ff00',
        fontWeight: '600',
        textAlign: 'center',
    },
    videoContainer: {
        backgroundColor: '#000',
        marginHorizontal: 15,
        borderRadius: 15,
        overflow: 'hidden',
        marginBottom: 20,
    },
    videoInfo: {
        paddingHorizontal: 20,
        paddingBottom: 30,
    },
    videoTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    videoSubtitle: {
        fontSize: 13,
        color: '#c5ff00',
        marginBottom: 20,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(197, 255, 0, 0.2)',
        marginVertical: 20,
    },
    descriptionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 10,
    },
    descriptionText: {
        fontSize: 14,
        color: '#aaa',
        lineHeight: 22,
    },
});
