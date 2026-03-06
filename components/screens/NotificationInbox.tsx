import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Animated, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';

const getRelativeTime = (dateStr: string): string => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
};

const NotificationInbox = ({ navigateTo }: any) => {
    const insets = useSafeAreaInsets();
    const { notificationInbox, markNotificationRead, markAllRead, unreadCount, refreshData, setDeepLinkTarget } = useApp();
    const [refreshing, setRefreshing] = useState(false);
    const [fadeAnim] = useState(new Animated.Value(0));

    React.useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();
    }, [fadeAnim]);

    const onRefresh = async () => {
        setRefreshing(true);
        await refreshData();
        setRefreshing(false);
    };

    const handleNotifPress = (item: any) => {
        // Marcar como leída
        if (item.id) markNotificationRead(item.id.toString());

        // Navegar según el tipo de notificación
        const data = item.data;
        if (!data?.type) return; // Sin tipo = solo marcar leída

        if (data.type === 'chat') {
            if (data.planId) {
                setDeepLinkTarget({ action: 'openChat', planId: data.planId });
            }
            navigateTo('Servidores');
        } else if (data.type === 'service_reminder') {
            navigateTo('Servidores');
        } else if (data.type === 'news') {
            navigateTo('Inicio');
        } else if (data.type === 'video') {
            navigateTo('Videos');
        } else if (data.type === 'prayer') {
            navigateTo('Necesito Oración');
        }
    };

    return (
        <View style={styles.mainWrapper}>
            <LinearGradient colors={['#050B25', '#020205']} style={StyleSheet.absoluteFill} />

            {/* Glowing Nebula effects */}
            <View style={{ position: 'absolute', top: -50, left: -50, width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(37, 99, 235, 0.08)' }} />
            <View style={{ position: 'absolute', bottom: 100, right: -50, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(147, 51, 234, 0.06)' }} />

            <View style={[styles.headerLayout, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => navigateTo('Inicio')} style={styles.backButton}>
                    <MaterialCommunityIcons name="chevron-left" size={28} color="#c5ff00" />
                    <Text style={styles.backText}>VOLVER</Text>
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 15 }}>
                    <Text style={styles.headerSub}>NOTIFICACIONES</Text>
                    <Text style={styles.headerTitle}>BANDEJA DE ENTRADA</Text>
                </View>
                {unreadCount > 0 && (
                    <TouchableOpacity onPress={markAllRead} style={styles.allReadBtn}>
                        <MaterialCommunityIcons name="check-all" size={20} color="#c5ff00" />
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView
                style={styles.container}
                contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#c5ff00" />}
            >
                {unreadCount > 0 && (
                    <BlurView intensity={20} tint="dark" style={styles.unreadBanner}>
                        <View style={styles.unreadTag}>
                            <Text style={styles.unreadTagText}>{unreadCount}</Text>
                        </View>
                        <Text style={styles.unreadBannerText}>Mensajes sin leer</Text>
                    </BlurView>
                )}

                {notificationInbox.length === 0 ? (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconCircle}>
                            <MaterialCommunityIcons name="bell-off-outline" size={50} color="#111" />
                        </View>
                        <Text style={styles.emptyTitle}>Bandeja Vacía</Text>
                        <Text style={styles.emptySub}>No recibiste notificaciones recientemente. Te avisaremos cuando haya novedades.</Text>
                    </View>
                ) : (
                    <Animated.View style={{ opacity: fadeAnim }}>
                        {notificationInbox.map((item, index) => (
                            <TouchableOpacity
                                key={item.id || index}
                                style={[styles.notifItem, !item.read && styles.notifItemUnread]}
                                onPress={() => handleNotifPress(item)}
                                activeOpacity={0.8}
                            >
                                <View style={styles.notifIconBox}>
                                    <View style={[styles.statusDot, item.read && { backgroundColor: '#222' }]} />
                                    <MaterialCommunityIcons
                                        name={item.read ? "email-open-outline" : "email-newsletter"}
                                        size={24}
                                        color={item.read ? "#333" : "#c5ff00"}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <View style={styles.notifMeta}>
                                        <Text style={[styles.notifTitle, !item.read && styles.notifTitleUnread]} numberOfLines={1}>{item.title}</Text>
                                        <Text style={styles.notifTime}>{item.date ? getRelativeTime(item.date) : ''}</Text>
                                    </View>
                                    <Text style={[styles.notifBody, !item.read && styles.notifBodyUnread]} numberOfLines={2}>{item.body}</Text>
                                    {item.image && (
                                        <Image source={{ uri: item.image }} style={styles.notifImage} resizeMode="cover" />
                                    )}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </Animated.View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    mainWrapper: { flex: 1, backgroundColor: '#020205' },
    container: { flex: 1 },
    headerLayout: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, marginBottom: 10 },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)'
    },
    backText: { color: '#c5ff00', fontSize: 10, fontFamily: 'Montserrat_900Black', letterSpacing: 1.5, marginLeft: 8 },
    headerSub: { color: '#c5ff00', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
    allReadBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#050505', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#111' },

    unreadBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(197, 255, 0, 0.06)',
        paddingHorizontal: 20,
        paddingVertical: 18,
        borderRadius: 24,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(197, 255, 0, 0.12)'
    },
    unreadTag: { backgroundColor: '#c5ff00', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    unreadTagText: { color: '#000', fontSize: 11, fontWeight: '900' },
    unreadBannerText: { color: '#c5ff00', fontSize: 13, fontWeight: '900' },

    emptyState: { alignItems: 'center', marginTop: 100, padding: 40 },
    emptyIconCircle: { width: 100, height: 100, borderRadius: 50, borderStyle: 'dashed', borderWidth: 1, borderColor: '#111', justifyContent: 'center', alignItems: 'center' },
    emptyTitle: { color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 30 },
    emptySub: { color: '#888', fontSize: 14, textAlign: 'center', marginTop: 12, lineHeight: 22 },

    notifItem: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        padding: 20,
        borderRadius: 28,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        alignItems: 'center'
    },
    notifItemUnread: {
        backgroundColor: 'rgba(197, 255, 0, 0.02)',
        borderColor: 'rgba(197, 255, 0, 0.12)'
    },
    notifIconBox: { width: 50, height: 50, borderRadius: 16, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    statusDot: { position: 'absolute', top: -4, right: -4, width: 10, height: 10, borderRadius: 5, backgroundColor: '#c5ff00', borderWidth: 2, borderColor: '#000', zIndex: 1 },
    notifMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    notifTitle: { color: '#888', fontSize: 15, fontWeight: '800', flex: 1, marginRight: 10 },
    notifTitleUnread: { color: '#fff' },
    notifTime: { color: '#666', fontSize: 10, fontWeight: '900' },
    notifBody: { color: '#777', fontSize: 13, lineHeight: 18 },
    notifBodyUnread: { color: '#999' },
    notifImage: {
        width: '100%',
        height: 120,
        borderRadius: 16,
        marginTop: 10,
        backgroundColor: '#111'
    }
});

export default NotificationInbox;
