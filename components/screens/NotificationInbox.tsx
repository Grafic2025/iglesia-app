import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useState } from 'react';
import { Animated, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
    const { notificationInbox, markNotificationRead, markAllRead, unreadCount, refreshData } = useApp();
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

    return (
        <View style={styles.mainContainer}>
            <View style={[styles.headerLayout, { paddingTop: Math.max(insets.top, 16) }]}>
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
                                onPress={() => item.id && markNotificationRead(item.id.toString())}
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
    mainContainer: { flex: 1, backgroundColor: '#000' },
    container: { flex: 1 },
    headerLayout: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, marginBottom: 10 },
    backButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 22, borderWidth: 1, borderColor: '#333' },
    backText: { color: '#c5ff00', fontSize: 11, fontWeight: '900', letterSpacing: 1, marginLeft: 5 },
    headerSub: { color: '#c5ff00', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
    allReadBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#050505', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#111' },

    unreadBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(197, 255, 0, 0.05)', padding: 15, borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(197, 255, 0, 0.1)' },
    unreadTag: { backgroundColor: '#c5ff00', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    unreadTagText: { color: '#000', fontSize: 11, fontWeight: '900' },
    unreadBannerText: { color: '#c5ff00', fontSize: 13, fontWeight: '900' },

    emptyState: { alignItems: 'center', marginTop: 100, padding: 40 },
    emptyIconCircle: { width: 100, height: 100, borderRadius: 50, borderStyle: 'dashed', borderWidth: 1, borderColor: '#111', justifyContent: 'center', alignItems: 'center' },
    emptyTitle: { color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 30 },
    emptySub: { color: '#444', fontSize: 14, textAlign: 'center', marginTop: 12, lineHeight: 22 },

    notifItem: { flexDirection: 'row', backgroundColor: '#050505', padding: 20, borderRadius: 24, marginBottom: 12, borderWidth: 1, borderColor: '#111', alignItems: 'center' },
    notifItemUnread: { backgroundColor: '#070a00', borderColor: 'rgba(197, 255, 0, 0.15)' },
    notifIconBox: { width: 50, height: 50, borderRadius: 16, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    statusDot: { position: 'absolute', top: -4, right: -4, width: 10, height: 10, borderRadius: 5, backgroundColor: '#c5ff00', borderWidth: 2, borderColor: '#000', zIndex: 1 },
    notifMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    notifTitle: { color: '#666', fontSize: 15, fontWeight: '800', flex: 1, marginRight: 10 },
    notifTitleUnread: { color: '#fff' },
    notifTime: { color: '#333', fontSize: 10, fontWeight: '900' },
    notifBody: { color: '#444', fontSize: 13, lineHeight: 18 },
    notifBodyUnread: { color: '#888' },
});

export default NotificationInbox;
