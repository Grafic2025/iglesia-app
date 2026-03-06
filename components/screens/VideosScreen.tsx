import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CATEGORIES = [
    { id: '1', title: 'PREDICAS', icon: 'microphone', color: '#A8D500', image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400' },
    { id: '2', title: 'ESENCIALES', icon: 'star', color: '#00D9FF', image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400' },
    { id: '3', title: 'ALABANZA', icon: 'music', color: '#FFB400', image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400' },
    { id: '4', title: 'CONGRESO', icon: 'fireplace', color: '#9333EA', image: 'https://images.unsplash.com/photo-1475721027187-4024733923f9?w=400' },
];

const VideosScreen = ({ navigateTo }: { navigateTo: (s: string) => void }) => {
    const insets = useSafeAreaInsets();
    return (
        <View style={styles.mainWrapper}>
            <LinearGradient colors={['#010A2A', '#020205']} style={StyleSheet.absoluteFill} />
            <View style={styles.header}>
                <Image
                    source={{ uri: 'https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?w=800' }}
                    style={StyleSheet.absoluteFill}
                />
                <LinearGradient
                    colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.9)']}
                    style={StyleSheet.absoluteFill}
                />
                <View style={[styles.headerSafe, { paddingTop: insets.top }]}>
                    <TouchableOpacity onPress={() => navigateTo('Inicio')} style={styles.backButton}>
                        <MaterialCommunityIcons name="chevron-left" size={24} color="#c5ff00" />
                        <Text style={styles.backText}>VOLVER</Text>
                    </TouchableOpacity>
                    <View style={styles.headerBody}>
                        <Text style={styles.headerLabel}>MULTIMEDIA</Text>
                        <Text style={styles.headerTitle}>VIDEOTECA</Text>
                        <Text style={styles.headerDesc}>Explora todo el contenido audiovisual de nuestra comunidad.</Text>
                    </View>
                </View>
            </View>

            <FlatList
                data={CATEGORIES}
                numColumns={2}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.categoryCard}
                        activeOpacity={0.8}
                        onPress={() => item.title === 'ESENCIALES' ? navigateTo('Mensajes') : alert('Próximamente')}
                    >
                        <Image source={{ uri: item.image }} style={StyleSheet.absoluteFill} />
                        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.8)']}
                            style={StyleSheet.absoluteFill}
                        />
                        <View style={styles.cardContent}>
                            <View style={[styles.iconCircle, { backgroundColor: item.color + '20' }]}>
                                <MaterialCommunityIcons name={item.icon as any} size={24} color={item.color} />
                            </View>
                            <Text style={styles.categoryTitle}>{item.title}</Text>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    mainWrapper: { flex: 1, backgroundColor: '#020205' },
    container: { flex: 1 },
    header: { height: 280 },
    headerSafe: { flex: 1, paddingHorizontal: 20 },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        alignSelf: 'flex-start',
        marginTop: 10
    },
    backText: { color: '#c5ff00', fontSize: 10, fontFamily: 'Montserrat_900Black', letterSpacing: 1.5, marginLeft: 8 },
    headerBody: { marginTop: 'auto', marginBottom: 30 },
    headerLabel: { color: '#c5ff00', fontSize: 11, fontWeight: '900', letterSpacing: 4 },
    headerTitle: { color: '#fff', fontSize: 36, fontWeight: '900', letterSpacing: -1, marginTop: 5 },
    headerDesc: { color: '#888', fontSize: 13, marginTop: 8, fontWeight: '500' },
    listContent: { padding: 15, paddingBottom: 100 },
    categoryCard: {
        flex: 1,
        height: 180,
        margin: 5,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: '#111',
        borderWidth: 1,
        borderColor: '#222'
    },
    cardContent: { flex: 1, justifyContent: 'flex-end', padding: 15 },
    iconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    categoryTitle: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
});

export default VideosScreen;
