import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image as ExpoImage } from 'expo-image';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';

const REWARD_LEVELS = [
    { min: 5, max: 9, icon: '⭐', emoji: '🏷️', title: 'Sticker IDS', color: '#A8D500', textColor: '#000' },
    { min: 10, max: 19, icon: '☕', emoji: '☕', title: 'Café Gratis', color: '#FFB400', textColor: '#000' },
    { min: 20, max: 29, icon: '📚', emoji: '📚', title: 'Libro Cristiano', color: '#3B82F6', textColor: '#fff' },
    { min: 30, max: Infinity, icon: '🎟️', emoji: '🏕️', title: 'Entrada a Retiro', color: '#9333EA', textColor: '#fff' },
];

const ProfileScreen = ({ navigateTo, pickImage }: any) => {
    const insets = useSafeAreaInsets();
    const { memberId, nombre, apellido, fotoUrl, fechaNacimiento, zona, rachaUsuario, asistenciasDetalle, refreshData, esServidor } = useApp();
    const viewShotRef = useRef<any>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    const [editNombre, setEditNombre] = useState(nombre);
    const [editApellido, setEditApellido] = useState(apellido);
    const [historialMes, setHistorialMes] = useState<any[]>([]);
    const [historialTotal, setHistorialTotal] = useState(0);

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([refreshData(), cargarHistorialCompleto()]);
        setRefreshing(false);
    };

    const cargarHistorialCompleto = useCallback(async () => {
        const { data, count } = await supabase
            .from('asistencias')
            .select('*', { count: 'exact' })
            .eq('miembro_id', memberId)
            .order('fecha', { ascending: false })
            .limit(10);
        if (data) setHistorialMes(data);
        if (count) setHistorialTotal(count);
    }, [memberId]);

    useEffect(() => {
        setEditNombre(nombre);
        setEditApellido(apellido);
    }, [nombre, apellido]);

    useEffect(() => {
        if (memberId) cargarHistorialCompleto();
    }, [memberId, cargarHistorialCompleto]);



    const handleGuardarDatos = async () => {
        console.log("[PERFIL] Intentando guardar datos para ID:", memberId);
        const { error } = await supabase.from('miembros').update({
            nombre: editNombre.trim(),
            apellido: editApellido.trim()
        }).eq('id', memberId);

        if (!error) {
            console.log("[PERFIL] Guardado exitoso.");
            await refreshData();
            setShowEditModal(false);
            Alert.alert("¡Guardado!", "Tus datos fueron actualizados.");
        } else {
            console.error("[PERFIL] ERROR de actualización:", error.message, error.details);
            Alert.alert("Error", `No se pudo actualizar: ${error.message}`);
        }
    };

    const shareProgress = async () => {
        try {
            const uri = await viewShotRef.current.capture();
            await Sharing.shareAsync(uri, {
                mimeType: 'image/png',
                dialogTitle: 'Mi progreso en IDS',
                UTI: 'public.png'
            });
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "No se pudo generar la imagen para compartir.");
        }
    };

    const currentReward = REWARD_LEVELS.slice().reverse().find(r => rachaUsuario >= r.min) || null;
    const primerAsistencia = asistenciasDetalle.length > 0 ? asistenciasDetalle[asistenciasDetalle.length - 1]?.fecha : null;
    const mesesDesdeInscripcion = primerAsistencia ? Math.max(1, Math.ceil((Date.now() - new Date(primerAsistencia + 'T12:00:00').getTime()) / (30 * 24 * 60 * 60 * 1000))) : 1;
    const promedioMensual = asistenciasDetalle.length > 0 ? (asistenciasDetalle.length / mesesDesdeInscripcion).toFixed(1) : '0';
    const statusColor = currentReward?.color || '#333';
    const initials = `${nombre?.[0] || ''}${apellido?.[0] || ''}`.toUpperCase();

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#c5ff00" />}
        >
            <View style={[styles.topActions, { paddingTop: Math.max(insets.top, 16) }]}>
                <TouchableOpacity onPress={() => navigateTo('Inicio')} style={styles.backButton}>
                    <MaterialCommunityIcons name="chevron-left" size={24} color="#c5ff00" />
                    <Text style={styles.backText}>VOLVER</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={shareProgress} style={styles.actionCircle}>
                    <MaterialCommunityIcons name="export-variant" size={20} color="#c5ff00" />
                </TouchableOpacity>
            </View>

            {/* Profile Hero */}
            <View style={styles.profileHero}>
                <TouchableOpacity onPress={pickImage} activeOpacity={0.9} style={styles.avatarWrapper}>
                    {fotoUrl ? (
                        <ExpoImage source={{ uri: fotoUrl }} style={styles.largeAvatar} contentFit="cover" />
                    ) : (
                        <View style={[styles.largeAvatarPlaceholder, { borderColor: statusColor }]}>
                            <Text style={styles.avatarInitials}>{initials || '?'}</Text>
                        </View>
                    )}
                    <View style={styles.editBadge}>
                        <MaterialCommunityIcons name="camera" size={16} color="#000" />
                    </View>
                </TouchableOpacity>

                <Text style={styles.label}>MI PERFIL</Text>
                <Text style={styles.profileName}>{nombre} {apellido}</Text>

                {currentReward ? (
                    <View style={[styles.levelBadge, { backgroundColor: `${currentReward.color}20`, borderColor: currentReward.color }]}>
                        <Text style={[styles.levelText, { color: currentReward.color }]}>
                            {currentReward.icon} {currentReward.title}
                        </Text>
                    </View>
                ) : (
                    <Text style={styles.noLevelText}>Subiendo de nivel...</Text>
                )}

                <TouchableOpacity onPress={() => setShowEditModal(true)} style={styles.editButton}>
                    <MaterialCommunityIcons name="account-edit-outline" size={18} color="#000" />
                    <Text style={styles.editButtonText}>EDITAR PERFIL</Text>
                </TouchableOpacity>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsLayout}>
                <View style={styles.statBox}>
                    <Text style={styles.statValue}>🔥 {rachaUsuario}</Text>
                    <Text style={styles.statLabel}>Días Rachas</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statValue}>📅 {historialTotal}</Text>
                    <Text style={styles.statLabel}>Asistencias</Text>
                </View>
                <View style={[styles.statBox, { borderColor: '#c5ff00' }]}>
                    <Text style={[styles.statValue, { color: '#c5ff00' }]}>{promedioMensual}</Text>
                    <Text style={styles.statLabel}>Prom. Mes</Text>
                </View>
            </View>

            {/* Servers Section */}
            {esServidor && (
                <TouchableOpacity
                    onPress={() => navigateTo('Servidores')}
                    activeOpacity={0.8}
                    style={styles.serverCard}
                >
                    <BlurView intensity={20} tint="light" style={styles.serverCardBlur}>
                        <View style={styles.serverCardLeft}>
                            <View style={styles.serverIconBox}>
                                <MaterialCommunityIcons name="shield-check" size={24} color="#c5ff00" />
                            </View>
                            <View>
                                <Text style={styles.serverCardTitle}>EQUIPO DE SERVICIO</Text>
                                <Text style={styles.serverCardSub}>Gestioná tus turnos aquí</Text>
                            </View>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={24} color="#444" />
                    </BlurView>
                </TouchableOpacity>
            )}

            {/* Recent History */}
            <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>ASISTENCIAS RECIENTES</Text>
                </View>
                {historialMes.length > 0 ? historialMes.map((a, i) => (
                    <View key={i} style={styles.historyItem}>
                        <View style={styles.historyDot} />
                        <View style={styles.historyInfo}>
                            <Text style={styles.historyDate}>
                                {new Date(a.fecha + 'T12:00:00').toLocaleDateString('es-AR', {
                                    weekday: 'short', day: 'numeric', month: 'short'
                                }).toUpperCase()}
                            </Text>
                            <Text style={styles.historyTime}>{a.horario_reunion}</Text>
                        </View>
                        <MaterialCommunityIcons name="check-circle" size={20} color="#c5ff00" />
                    </View>
                )) : (
                    <Text style={styles.emptyText}>No hay asistencias registradas aún.</Text>
                )}
            </View>

            {/* Hidden capture area for sharing */}
            <View style={{ position: 'absolute', left: -5000 }}>
                <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.9 }}>
                    <View style={styles.sharePoster}>
                        <View style={styles.sharePosterHeader}>
                            <View style={styles.shareLogo}>
                                <Text style={{ fontSize: 32 }}>⛪</Text>
                            </View>
                            <Text style={styles.shareChurchName}>IGLESIA DEL SALVADOR</Text>
                        </View>
                        <Text style={styles.shareUserName}>{nombre} {apellido}</Text>
                        <View style={styles.shareStreakBox}>
                            <Text style={styles.shareStreakVal}>🔥 {rachaUsuario}</Text>
                            <Text style={styles.shareStreakLbl}>DÍAS DE RACHA</Text>
                        </View>
                        <Text style={styles.shareFooter}>MI PROGRESO EN LA APP</Text>
                    </View>
                </ViewShot>
            </View>

            {/* Refined Edit Modal */}
            <Modal visible={showEditModal} transparent animationType="fade">
                <View style={styles.modalBackdrop}>
                    <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>EDITAR PERFIL</Text>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>NOMBRE</Text>
                            <TextInput style={styles.input} value={editNombre} onChangeText={setEditNombre} placeholder="Tu nombre" placeholderTextColor="#444" />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>APELLIDO</Text>
                            <TextInput style={styles.input} value={editApellido} onChangeText={setEditApellido} placeholder="Tu apellido" placeholderTextColor="#444" />
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowEditModal(false)}>
                                <Text style={styles.closeBtnText}>CANCELAR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveBtn} onPress={handleGuardarDatos}>
                                <Text style={styles.saveBtnText}>GUARDAR</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000', paddingHorizontal: 20 },
    topActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, marginBottom: 20 },
    backButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#222' },
    backText: { color: '#c5ff00', fontSize: 11, fontWeight: '900', letterSpacing: 1, marginLeft: 8 },
    actionCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#222' },

    profileHero: { alignItems: 'center', marginBottom: 30 },
    avatarWrapper: { position: 'relative', marginBottom: 15 },
    largeAvatar: { width: 110, height: 110, borderRadius: 35, borderWidth: 3, borderColor: 'rgba(255,255,255,0.1)' },
    largeAvatarPlaceholder: { width: 110, height: 110, borderRadius: 35, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', borderWidth: 3 },
    avatarInitials: { color: '#c5ff00', fontSize: 36, fontWeight: '900' },
    editBadge: { position: 'absolute', bottom: -5, right: -5, width: 32, height: 32, borderRadius: 12, backgroundColor: '#c5ff00', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#000' },

    headerInfo: { alignItems: 'center', marginBottom: 15 },
    label: { color: '#c5ff00', fontSize: 10, fontWeight: '900', letterSpacing: 2, marginTop: 15 },
    profileName: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5, marginTop: 5 },

    levelBadge: { paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20, marginTop: 8, borderWidth: 1 },
    levelText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
    noLevelText: { color: '#444', fontSize: 12, marginTop: 8, fontWeight: '700' },

    editButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#c5ff00', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginTop: 20 },
    editButtonText: { color: '#000', fontWeight: '900', fontSize: 12, marginLeft: 8 },

    statsLayout: { flexDirection: 'row', gap: 10, marginBottom: 25 },
    statBox: { flex: 1, backgroundColor: '#111', borderRadius: 22, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: '#222' },
    statValue: { color: '#fff', fontSize: 20, fontWeight: '900' },
    statLabel: { color: '#555', fontSize: 10, marginTop: 2, fontWeight: '700' },

    serverCard: { borderRadius: 24, overflow: 'hidden', marginBottom: 25, borderWidth: 1, borderColor: 'rgba(197,255,0,0.2)' },
    serverCardBlur: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18 },
    serverCardLeft: { flexDirection: 'row', alignItems: 'center' },
    serverIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(197,255,0,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    serverCardTitle: { color: '#c5ff00', fontSize: 13, fontWeight: '900' },
    serverCardSub: { color: '#888', fontSize: 11 },

    sectionContainer: { marginBottom: 30 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { color: '#333', fontSize: 11, fontWeight: '900', letterSpacing: 2 },

    historyItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0a0a0a', padding: 15, borderRadius: 20, marginBottom: 10, borderWidth: 1, borderColor: '#111' },
    historyDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#c5ff00', marginRight: 15 },
    historyInfo: { flex: 1 },
    historyDate: { color: '#fff', fontSize: 14, fontWeight: '700' },
    historyTime: { color: '#444', fontSize: 11 },
    emptyText: { color: '#555', textAlign: 'center', marginTop: 10 },

    sharePoster: { width: 400, backgroundColor: '#000', padding: 40, alignItems: 'center', borderWidth: 10, borderColor: '#c5ff00' },
    sharePosterHeader: { alignItems: 'center', marginBottom: 30 },
    shareLogo: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#c5ff00', justifyContent: 'center', alignItems: 'center' },
    shareChurchName: { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 15 },
    shareUserName: { color: '#fff', fontSize: 32, fontWeight: '900', marginBottom: 20, textAlign: 'center' },
    shareStreakBox: { backgroundColor: '#c5ff0022', padding: 30, borderRadius: 40, alignItems: 'center', width: '100%', borderWidth: 2, borderColor: '#c5ff00' },
    shareStreakVal: { color: '#c5ff00', fontSize: 64, fontWeight: '900' },
    shareStreakLbl: { color: '#c5ff00', fontSize: 14, fontWeight: '900', letterSpacing: 2 },
    shareFooter: { color: '#444', fontSize: 12, fontWeight: '900', marginTop: 30, letterSpacing: 5 },

    modalBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { width: '100%', backgroundColor: '#111', borderRadius: 35, padding: 30, borderWidth: 1, borderColor: '#222' },
    modalTitle: { color: '#fff', fontSize: 22, fontWeight: '900', marginBottom: 25, letterSpacing: 1 },
    inputGroup: { marginBottom: 18 },
    inputLabel: { color: '#444', fontSize: 10, fontWeight: '900', marginBottom: 8, marginLeft: 5 },
    input: { backgroundColor: '#1a1a1a', padding: 16, borderRadius: 18, color: '#fff', fontSize: 16, borderWidth: 1, borderColor: '#222' },
    modalActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
    closeBtn: { flex: 1, height: 55, justifyContent: 'center', alignItems: 'center' },
    closeBtnText: { color: '#888', fontWeight: '900', fontSize: 12 },
    saveBtn: { flex: 2, height: 55, backgroundColor: '#c5ff00', borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    saveBtnText: { color: '#000', fontWeight: '900', fontSize: 13 },
});

export default ProfileScreen;
