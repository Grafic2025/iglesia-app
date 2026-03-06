import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Animated, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const NewsDetail = ({ news, navigateTo }: { news: any, navigateTo: any }) => {
    const insets = useSafeAreaInsets();
    const fadeIn = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, [fadeIn]);

    if (!news) return null;

    return (
        <View style={styles.mainWrapper}>
            <LinearGradient colors={['#050B25', '#020205']} style={StyleSheet.absoluteFill} />
            <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
                <View style={styles.imageContainer}>
                    <Image source={{ uri: news.imagen_url }} style={styles.image} />
                    <View style={[styles.headerActions, { paddingTop: Math.max(insets.top, 16) }]}>
                        <TouchableOpacity onPress={() => navigateTo('Inicio')} style={styles.backButton}>
                            <MaterialCommunityIcons name="chevron-left" size={24} color="#c5ff00" />
                            <Text style={styles.backText}>VOLVER</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <Animated.View style={[styles.content, { opacity: fadeIn }]}>
                    <View style={styles.metaRow}>
                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>{news.categoria?.toUpperCase() || 'NOVEDAD'}</Text>
                        </View>
                        <View style={styles.dateBox}>
                            <MaterialCommunityIcons name="calendar-outline" size={14} color="#444" />
                            <Text style={styles.dateText}>{new Date(news.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                        </View>
                    </View>

                    <Text style={styles.title}>{news.titulo}</Text>

                    <View style={styles.gradientDivider}>
                        <View style={styles.dot} />
                        <View style={styles.line} />
                    </View>

                    <Text style={styles.description}>{news.descripcion || 'No hay descripción disponible para esta noticia.'}</Text>
                </Animated.View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    mainWrapper: { flex: 1, backgroundColor: '#020205' },
    container: { flex: 1 },
    imageContainer: { width: '100%', height: 350, backgroundColor: '#111' },
    image: { width: '100%', height: '100%', resizeMode: 'cover' },
    headerActions: { position: 'absolute', left: 20, right: 20, zIndex: 10 },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)'
    },
    backText: { color: '#c5ff00', fontSize: 10, fontFamily: 'Montserrat_900Black', letterSpacing: 1.5, marginLeft: 8 },
    content: { flex: 1, backgroundColor: 'transparent', marginTop: -40, borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 30 },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    categoryBadge: { backgroundColor: '#c5ff00', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    categoryText: { color: '#000', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    dateBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dateText: { color: '#919191', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },

    title: { color: '#fff', fontSize: 28, fontWeight: '900', lineHeight: 36, letterSpacing: -0.5 },

    gradientDivider: { flexDirection: 'row', alignItems: 'center', marginVertical: 25 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#c5ff00' },
    line: { flex: 1, height: 1, backgroundColor: '#111', marginLeft: 10 },

    description: { color: '#ccc', fontSize: 16, lineHeight: 28, fontWeight: '400' },
});

export default NewsDetail;
