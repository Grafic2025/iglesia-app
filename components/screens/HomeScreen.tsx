import { FontAwesome, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Linking, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useApp } from '../../context/AppContext';

// Modular Components
import ActionGrid from '../home/ActionGrid';
import EsencialesSection from '../home/EsencialesSection';
import NewsCarousel from '../home/NewsCarousel';
import RachaCard from '../home/RachaCard';
import WelcomeHeader from '../home/WelcomeHeader';

const HomeScreen = ({ navigateTo, setVideoSeleccionado, setModalVideoVisible, setScanning, requestPermission, cargarRanking, setShowRanking, setShowHistorial, setNoticiaSeleccionada, toggleMenu }: any) => {
    const {
        noticiasSupabase,
        serieEsenciales,
        rachaUsuario,
        nombre,
        apellido,
        fotoUrl,
        refreshData,
        isCurrentlyLive,
        liveVideoUrl,
        notificationInbox,
    } = useApp();

    const [refreshing, setRefreshing] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [watchedVideos, setWatchedVideos] = useState<Set<string>>(new Set());
    const toastAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        AsyncStorage.getItem('watchedVideos').then((val: string | null) => {
            if (val) setWatchedVideos(new Set(JSON.parse(val)));
        });
    }, []);

    const showRefreshToast = () => {
        setShowToast(true);
        Animated.sequence([
            Animated.timing(toastAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.delay(2000),
            Animated.timing(toastAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]).start(() => setShowToast(false));
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await refreshData();
        setRefreshing(false);
        showRefreshToast();
    };

    const handleVideoPress = useCallback((item: any) => {
        const updated = new Set(watchedVideos).add(item.id);
        setWatchedVideos(updated);
        AsyncStorage.setItem('watchedVideos', JSON.stringify([...updated]));
        setVideoSeleccionado(item);
        setModalVideoVisible(true);
    }, [watchedVideos, setVideoSeleccionado, setModalVideoVisible]);

    const handleNewsPress = useCallback((item: any) => {
        if (item.isLive && liveVideoUrl) {
            Linking.openURL(liveVideoUrl);
            return;
        }
        if (item.video_url || (item.url && item.url.includes('youtube.com'))) {
            handleVideoPress(item);
        } else if (item.url) {
            Linking.openURL(item.url);
        } else if (item.screen) {
            navigateTo(item.screen);
        } else {
            setNoticiaSeleccionada(item);
            navigateTo('NewsDetail');
        }
    }, [handleVideoPress, navigateTo, setNoticiaSeleccionada, liveVideoUrl]);

    const carouselData = React.useMemo(() => {
        let list = [...noticiasSupabase];
        if (isCurrentlyLive && liveVideoUrl) {
            const liveItem = {
                id: 'live-now',
                titulo: 'TRANSMISIÓN EN VIVO',
                descripcion: '¡Únete a nuestra reunión ahora mismo!',
                imagen_url: 'https://img.youtube.com/vi/live/maxresdefault.jpg',
                isLive: true,
                liveUrl: liveVideoUrl,
                es_youtube: true
            };
            list = [liveItem, ...list];
        } else {
            // Si no estamos en vivo, marcamos la primera noticia como Live si es de Youtube (para pruebas o si el feed es lento)
            list = list.map((n, i) => ({ ...n, isLive: isCurrentlyLive && n.es_youtube && i === 0 }));
        }
        return list;
    }, [noticiasSupabase, isCurrentlyLive, liveVideoUrl]);

    const unreadCount = notificationInbox?.filter((n: any) => !n.read).length || 0;

    if (!nombre) return null;

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#c5ff00" />}
        >
            {showToast && (
                <Animated.View style={[styles.toast, { opacity: toastAnim, transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
                    <FontAwesome name="check-circle" size={16} color="#000" />
                    <Text style={styles.toastTxt}>¡Todo al día!</Text>
                </Animated.View>
            )}

            <WelcomeHeader
                nombre={nombre}
                apellido={apellido}
                fotoUrl={fotoUrl}
                unreadCount={unreadCount}
                onNotificationsPress={() => navigateTo('Notificaciones')}
                onMenuPress={toggleMenu}
                onProfilePress={() => navigateTo('Mi Perfil')}
            />

            <NewsCarousel
                data={carouselData}
                onPress={handleNewsPress}
            />

            <RachaCard
                rachaUsuario={rachaUsuario}
                onRankingPress={() => { cargarRanking(); setShowRanking(true); }}
                onHistorialPress={() => setShowHistorial(true)}
            />

            <EsencialesSection
                data={serieEsenciales}
                watchedVideos={watchedVideos}
                onVideoPress={handleVideoPress}
                onViewMorePress={() => navigateTo('Mensajes')}
            />

            <ActionGrid
                isCurrentlyLive={isCurrentlyLive}
                liveVideoUrl={liveVideoUrl}
                navigateTo={(screen) => screen.startsWith('http') ? Linking.openURL(screen) : navigateTo(screen)}
                onBiblePress={() => Linking.openURL('https://www.bible.com/es')}
            />

            <TouchableOpacity style={styles.assistButton} onPress={async () => {
                const { status } = await requestPermission();
                if (status === 'granted') setScanning(true);
                else Alert.alert("Error", "Permiso de cámara denegado");
            }}>
                <Text style={styles.assistButtonText}>REGISTRAR ASISTENCIA</Text>
                <MaterialCommunityIcons name="arrow-right" size={16} color="#000" style={{ marginLeft: 8 }} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.whatsappChannelBtn} onPress={() => Linking.openURL('https://whatsapp.com/channel/0029VaT0L9rEgGfRVvKIZ534')}>
                <MaterialCommunityIcons name="whatsapp" size={18} color="white" />
                <Text style={styles.whatsappChannelTxt}>UNIRME AL CANAL</Text>
                <MaterialCommunityIcons name="arrow-right" size={16} color="white" style={{ marginLeft: 8 }} />
            </TouchableOpacity>

            {/* ── FOOTER estilo web ── */}
            <View style={styles.footer}>
                {/* Info columns */}
                <View style={styles.footerTop}>
                    {/* Columna izquierda */}
                    <View style={styles.footerCol}>
                        <Text style={styles.footerColTitle}>NAVEGACIÓN</Text>
                        {['Inicio', 'Grupos', 'Videos', 'Agenda'].map(s => (
                            <TouchableOpacity key={s} onPress={() => navigateTo(s)}>
                                <Text style={styles.footerLink}>{s}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Columna derecha */}
                    <View style={styles.footerCol}>
                        <Text style={styles.footerColTitle}>UBICACIÓN & HORARIOS</Text>
                        <Text style={styles.footerInfoLabel}>DIRECCIÓN:</Text>
                        <Text style={styles.footerInfoText}>Constituyentes 950, Morón,{`\n`}Buenos Aires, Argentina.</Text>
                        <Text style={[styles.footerInfoLabel, { marginTop: 12 }]}>PRESENCIAL:</Text>
                        <Text style={styles.footerInfoText}>Dom. 9, 11 y 20hs</Text>
                        <Text style={[styles.footerInfoLabel, { marginTop: 4, color: '#c5ff00' }]}>YOUTUBE:</Text>
                        <Text style={styles.footerInfoText}>Dom. 11hs</Text>
                        <Text style={[styles.footerInfoText, { marginTop: 8, color: '#888' }]}>hola@iglesiadelsalvador.com</Text>
                    </View>
                </View>

                {/* Social */}
                <View style={styles.footerDivider} />
                <View style={styles.socialRow}>
                    <SocialBtn icon="instagram" color="#E1306C" url="https://instagram.com/iglesiadelsalvador" />
                    <SocialBtn icon="facebook" color="#4267B2" url="https://facebook.com/iglesiadelsalvador" />
                    <SocialBtn icon="youtube-play" color="#FF0000" url="https://youtube.com/@iglesiadelsalvador" />
                    <SocialBtn icon="twitter" color="#1DA1F2" url="https://twitter.com/iglesiadelsalvador" />
                </View>

                {/* Copyright */}
                <Text style={styles.copyright}>© 2026 IGLESIA DEL SALVADOR. TODOS LOS DERECHOS RESERVADOS.</Text>
            </View>
        </ScrollView>
    );
};

const SocialBtn = ({ icon, color, url, is5 = false }: any) => (
    <TouchableOpacity style={styles.socialCircle} onPress={() => Linking.openURL(url)}>
        {is5 ? <FontAwesome5 name={icon} size={18} color={color} /> : <FontAwesome name={icon} size={18} color={color} />}
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    footer: { paddingHorizontal: 24, paddingTop: 36, paddingBottom: 40, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
    footerTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
    footerCol: { flex: 1, paddingRight: 8 },
    footerColTitle: { fontFamily: 'Montserrat_900Black', color: '#2563EB', fontSize: 10, letterSpacing: 2, marginBottom: 14 },
    footerLink: { fontFamily: 'Inter_400Regular', color: '#bbb', fontSize: 14, marginBottom: 10 },
    footerInfoLabel: { fontFamily: 'Montserrat_700Bold', color: '#fff', fontSize: 10, letterSpacing: 1, marginBottom: 2 },
    footerInfoText: { fontFamily: 'Inter_400Regular', color: '#888', fontSize: 12, lineHeight: 18, marginBottom: 4 },
    footerDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: 24 },
    socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 28 },
    socialCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#0d0d0d', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#1a1a1a' },
    copyright: { fontFamily: 'Montserrat_500Medium', color: '#fff', fontSize: 11, letterSpacing: 1, textAlign: 'center', opacity: 0.8 },
    toast: { position: 'absolute', top: 20, alignSelf: 'center', backgroundColor: '#c5ff00', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20, flexDirection: 'row', alignItems: 'center', zIndex: 9999 },
    toastTxt: { fontFamily: 'Montserrat_700Bold', color: '#000', fontSize: 13, marginLeft: 10 },
    assistButton: { backgroundColor: '#fff', paddingVertical: 16, borderRadius: 12, marginHorizontal: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 15, marginTop: 15, flexDirection: 'row' },
    assistButtonText: { fontFamily: 'Montserrat_900Black', color: '#000', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
    whatsappChannelBtn: { backgroundColor: '#2563EB', paddingVertical: 16, borderRadius: 12, marginHorizontal: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 30, flexDirection: 'row' },
    whatsappChannelTxt: { fontFamily: 'Montserrat_900Black', color: '#fff', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginLeft: 10 },
});

export default HomeScreen;
