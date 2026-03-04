// ── IMPORTACIONES ────────────────────────────────────────────────────────────
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import YoutubePlayer from 'react-native-youtube-iframe';
import { useApp } from '../../context/AppContext';
import { sendPushNotification } from '../../lib/registerPushToken';
import { supabase } from '../../lib/supabase';

// Modular Components
import AssignList from '../servidores/AssignList';
import CalendarPicker from '../servidores/CalendarPicker';
import { PlanChatModal } from '../servidores/PlanChatModal';
import PlanDetail from '../servidores/PlanDetail';

// ── COMPONENTE PRINCIPAL ServidoresScreen ─────────────────────────────────────────
const ServidoresScreen = ({ navigateTo }: any) => {
    const insets = useSafeAreaInsets();
    const { memberId, nombre, refreshData, esAdmin } = useApp();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [plans, setPlans] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [plan, setPlan] = useState<any>(null);
    const [canciones, setCanciones] = useState<any[]>([]);
    const [memberPhotos, setMemberPhotos] = useState<any>({});
    const [fadeAnim] = useState(new Animated.Value(0));

    // Modales y formularios
    const [showRejectionModal, setShowRejectionModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showBlockoutModal, setShowBlockoutModal] = useState(false);
    const [blockoutStart, setBlockoutStart] = useState(new Date().toISOString().split('T')[0]);
    const [blockoutEnd, setBlockoutEnd] = useState(new Date().toISOString().split('T')[0]);
    const [blockoutReason, setBlockoutReason] = useState('');
    const [myBlockouts, setMyBlockouts] = useState<any[]>([]);

    // Recursos
    const [modalYoutubeVisible, setModalYoutubeVisible] = useState(false);
    const [modalWebVisible, setModalWebVisible] = useState(false);
    const [modalLyricsVisible, setModalLyricsVisible] = useState(false);
    const [activeResource, setActiveResource] = useState<any>(null);
    const [showChatModal, setShowChatModal] = useState(false);

    const fetchSongs = async (songIds: string[]) => {
        if (!songIds?.length) { setCanciones([]); return; }
        const { data: songs } = await supabase.from('canciones').select('*').in('id', songIds);
        const sortedSongs = songIds.map(id => songs?.find(s => s.id === id)).filter(Boolean);
        setCanciones(sortedSongs);
    };

    const fetchPhotos = async (ids: string[]) => {
        if (!ids?.length) return;
        const { data } = await supabase.from('miembros').select('id, foto_url').in('id', ids);
        if (data) {
            const map = data.reduce((acc, m) => ({ ...acc, [m.id]: m.foto_url }), {});
            setMemberPhotos((prev: any) => ({ ...prev, ...map }));
        }
    };

    const fetchPlans = useCallback(async () => {
        if (!memberId) { setLoading(false); return; }
        const hoy = new Date();
        const fechaFiltro = hoy.toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });
        const { data: allPlans, error } = await supabase.from('cronogramas').select('*').gte('fecha', fechaFiltro).order('fecha', { ascending: true }).limit(40);

        if (error) { setLoading(false); return; }
        const userPlans = esAdmin ? (allPlans || []) : (allPlans?.filter((p: any) => p.equipo_ids?.some((m: any) => m.miembro_id === memberId)) || []);

        setPlans(userPlans);
        if (currentIndex !== -1 && userPlans[currentIndex]) {
            const target = userPlans[currentIndex];
            setPlan(target);
            if (target.orden_canciones) await fetchSongs(target.orden_canciones);
            if (target.equipo_ids) await fetchPhotos(target.equipo_ids.map((m: any) => m.miembro_id).filter(Boolean));
        }
        setLoading(false);
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, [currentIndex, memberId, esAdmin, fadeAnim]);

    const fetchBlockouts = useCallback(async () => {
        const { data } = await supabase.from('bloqueos_servidores').select('*').eq('miembro_id', memberId).order('fecha_inicio', { ascending: true });
        if (data) setMyBlockouts(data);
    }, [memberId]);

    useEffect(() => { fetchPlans(); fetchBlockouts(); }, [fetchPlans, fetchBlockouts]);

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([fetchPlans(), fetchBlockouts(), refreshData()]);
        setRefreshing(false);
    };

    const handleSaveBlockout = async () => {
        if (!blockoutStart || !blockoutEnd) return;
        const { error } = await supabase.from('bloqueos_servidores').insert([{ miembro_id: memberId, fecha_inicio: blockoutStart, fecha_fin: blockoutEnd, motivo: blockoutReason }]);
        if (error) Alert.alert("Error", error.message);
        else { setShowBlockoutModal(false); setBlockoutReason(''); fetchBlockouts(); }
    };

    const deleteBlockout = async (id: string) => {
        const { error } = await supabase.from('bloqueos_servidores').delete().eq('id', id);
        if (!error) fetchBlockouts();
    };

    const handleSwitchPlan = async (idx: number) => {
        const selected = plans[idx];
        setPlan(selected);
        setCurrentIndex(idx);
        if (selected.orden_canciones) await fetchSongs(selected.orden_canciones); else setCanciones([]);
        if (selected.equipo_ids) await fetchPhotos(selected.equipo_ids.map((m: any) => m.miembro_id).filter(Boolean));
    };

    const handleResponderAsignacion = async (nuevoEstado: string, motivo: string = '') => {
        const updatedEquipo = plan.equipo_ids.map((s: any) => s.miembro_id === memberId ? { ...s, estado: nuevoEstado, motivo } : s);
        const { error } = await supabase.from('cronogramas').update({ equipo_ids: updatedEquipo }).eq('id', plan.id);
        if (!error) {
            const updatedPlan = { ...plan, equipo_ids: updatedEquipo };
            setPlan(updatedPlan);
            const newPlans = [...plans]; newPlans[currentIndex] = updatedPlan; setPlans(newPlans);
            if (nuevoEstado === 'confirmado') {
                try {
                    const { data: member } = await supabase.from('miembros').select('token_notificacion').eq('id', memberId).single();
                    if (member?.token_notificacion) await sendPushNotification(member.token_notificacion, '¡Confirmado! ✅', `Gracias por confirmar tu servicio.`);
                    // Notificar a los administradores
                    const { data: admins } = await supabase.from('miembros').select('token_notificacion').eq('es_admin', true);
                    if (admins) {
                        for (const adm of admins) {
                            if (adm.token_notificacion) {
                                await sendPushNotification(adm.token_notificacion, '✅ Servicio Confirmado', `${nombre} ha confirmado su servicio.`);
                            }
                        }
                    }
                } catch (e) { console.error(e); }
            }
        }
    };

    const handleResourcePress = (type: 'youtube' | 'web' | 'lyrics', resource: any) => {
        setActiveResource(resource);
        if (type === 'youtube') setModalYoutubeVisible(true);
        else if (type === 'web') setModalWebVisible(true);
        else if (type === 'lyrics') setModalLyricsVisible(true);
    };

    const myAssignment = plan?.equipo_ids?.find((s: any) => s.miembro_id === memberId);
    const isPending = myAssignment && (!myAssignment.estado || myAssignment.estado === 'pendiente');
    const isRejected = myAssignment?.estado === 'rechazado';

    if (loading) return <View style={styles.center}><ActivityIndicator color="#c5ff00" /></View>;

    return (
        <View style={[styles.mainContainer, { paddingTop: insets.top }]}>
            <View style={{ flex: 1 }}>
                {plan ? (
                    <>
                        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 150 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#c5ff00" />}>
                            <View style={styles.detailHeader}>
                                <TouchableOpacity onPress={() => { setPlan(null); setCurrentIndex(-1); }} style={styles.backButton}>
                                    <MaterialCommunityIcons name="chevron-left" size={28} color="#c5ff00" />
                                    <Text style={styles.backText}>VOLVER</Text>
                                </TouchableOpacity>
                                <View style={styles.headerInfo}>
                                    <View style={styles.dateBadge}>
                                        <Text style={styles.dateBadgeText}>{new Date(plan.fecha + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()}</Text>
                                    </View>
                                    <Text style={styles.planTitle}>Planificación de Culto</Text>
                                    <Text style={styles.planTime}>
                                        {plan.horario ? plan.horario.split(',').map((h: any) => h.trim().replace(/HS/gi, '').trim()).sort((a: any, b: any) => { const [ha, ma] = a.split(':').map(Number); const [hb, mb] = b.split(':').map(Number); return (ha * 60 + (ma || 0)) - (hb * 60 + (mb || 0)); }).join(' y ') : '...'} HS
                                    </Text>
                                </View>
                            </View>

                            {isPending ? (
                                <BlurView intensity={20} tint="dark" style={styles.pendingInviteCard}>
                                    <LinearGradient colors={['rgba(197, 255, 0, 0.15)', 'transparent']} style={styles.gradientOverlay} />
                                    <View style={styles.inviteIconBox}>
                                        <MaterialCommunityIcons name="calendar-star" size={40} color="#c5ff00" />
                                    </View>
                                    <Text style={styles.inviteTitle}>¡Fuiste convocado!</Text>
                                    <Text style={styles.inviteSub}>
                                        Estás invitado como <Text style={{ color: '#c5ff00', fontWeight: '900' }}>{myAssignment?.rol}</Text>.
                                    </Text>

                                    <View style={{ marginTop: 15, gap: 8 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(197, 255, 0, 0.1)' }}>
                                            <MaterialCommunityIcons name="calendar-clock" size={20} color="#c5ff00" style={{ marginRight: 12 }} />
                                            <View>
                                                <Text style={{ color: '#666', fontSize: 10, fontFamily: 'Montserrat_700Bold', letterSpacing: 0.5 }}>FECHA Y HORA</Text>
                                                <Text style={{ color: '#fff', fontSize: 14, fontFamily: 'Montserrat_700Bold', marginTop: 2 }}>
                                                    {new Date(plan.fecha + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' })} • {plan.horario ? plan.horario.split(',').map((h: any) => h.trim().replace(/HS/gi, '').trim()).sort((a: any, b: any) => { const [ha, ma] = a.split(':').map(Number); const [hb, mb] = b.split(':').map(Number); return (ha * 60 + (ma || 0)) - (hb * 60 + (mb || 0)); }).join(' y ') : '...'} HS
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    <Text style={[styles.inviteSub, { marginTop: 15, fontSize: 13 }]}>
                                        Confirmá tu asistencia para ver todos los detalles y archivos.
                                    </Text>
                                </BlurView>
                            ) : isRejected ? (
                                <View style={styles.rejectedBanner}>
                                    <MaterialCommunityIcons name="calendar-remove" size={40} color="#ff4444" />
                                    <Text style={styles.rejectedTitle}>Servicio Rechazado</Text>
                                    <TouchableOpacity onPress={() => handleResponderAsignacion('pendiente')} style={styles.changeResponseBtn}>
                                        <Text style={styles.changeResponseText}>CAMBIAR RESPUESTA</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <PlanDetail
                                    plan={plan}
                                    canciones={canciones}
                                    memberPhotos={memberPhotos}
                                    fadeAnim={fadeAnim}
                                    onResourcePress={handleResourcePress}
                                />
                            )}
                        </ScrollView>

                        {plan && !isPending && !isRejected && (() => {
                            const planDate = new Date(plan.fecha + 'T12:00:00');
                            const today = new Date();

                            // 1. Calcular Lunes de inicio (semana del plan)
                            const dayOfWeek = planDate.getDay();
                            const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                            const mondayOfPlanWeek = new Date(planDate);
                            mondayOfPlanWeek.setDate(planDate.getDate() - diffToMonday);
                            mondayOfPlanWeek.setHours(0, 0, 0, 0);

                            // 2. Calcular Lunes de cierre (el día posterior al evento)
                            const nextMonday = new Date(planDate);
                            nextMonday.setDate(planDate.getDate() + (dayOfWeek === 0 ? 1 : 8 - dayOfWeek));
                            nextMonday.setHours(4, 0, 0, 0); // Cerramos a las 4 AM del lunes posterior

                            // Mostrar si estamos dentro de la ventana de tiempo O si se activó manualmente
                            const isAutoActive = today >= mondayOfPlanWeek && today < nextMonday;
                            const isManualActive = !!plan.chat_activo;

                            if (!isAutoActive && !isManualActive) return null;

                            return (
                                <TouchableOpacity
                                    style={styles.chatFab}
                                    onPress={() => setShowChatModal(true)}
                                    activeOpacity={0.9}
                                >
                                    <BlurView intensity={30} tint="dark" style={styles.chatFabBlur}>
                                        <MaterialCommunityIcons name="chat-processing" size={28} color="#c5ff00" />
                                        <View style={styles.badge} />
                                    </BlurView>
                                </TouchableOpacity>
                            );
                        })()}

                        {isPending && (
                            <View style={styles.floatingActions}>
                                <BlurView intensity={30} tint="dark" style={styles.floatingBlur}>
                                    <View style={styles.floatingTop}>
                                        <MaterialCommunityIcons name="hand-pointing-up" size={16} color="#c5ff00" />
                                        <Text style={styles.floatingActionLabel}>¿PODÉS SERVIR ESTE DÍA?</Text>
                                    </View>
                                    <View style={styles.floatingButtons}>
                                        <TouchableOpacity onPress={() => handleResponderAsignacion('confirmado')} style={styles.confirmBtn}>
                                            <Text style={styles.confirmBtnText}>SÍ, CONFIRMO</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => setShowRejectionModal(true)} style={styles.declineBtn}>
                                            <Text style={styles.declineBtnText}>NO PUEDO</Text>
                                        </TouchableOpacity>
                                    </View>
                                </BlurView>
                            </View>
                        )}
                    </>
                ) : (
                    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#c5ff00" />}>
                        <View style={styles.mainHeader}>
                            <TouchableOpacity onPress={() => navigateTo('Inicio')} style={styles.backButton}>
                                <MaterialCommunityIcons name="chevron-left" size={28} color="#c5ff00" />
                                <Text style={styles.backText}>VOLVER</Text>
                            </TouchableOpacity>
                            <View style={{ marginLeft: 15 }}>
                                <Text style={styles.mainHeaderLabel}>CENTRO DE</Text>
                                <Text style={styles.mainHeaderTitle}>SERVIDORES</Text>
                            </View>
                        </View>

                        <Text style={styles.listLabel}>TUS PRÓXIMAS ASIGNACIONES</Text>

                        <AssignList
                            plans={plans}
                            memberId={memberId}
                            onSelectPlan={handleSwitchPlan}
                            fadeAnim={fadeAnim}
                            onRefresh={onRefresh}
                        />

                        <View style={styles.mainBlockoutSection}>
                            <View style={styles.blockoutTitleRow}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <MaterialCommunityIcons name="shield-lock" size={16} color="#ff4444" />
                                    <Text style={styles.listLabelInline}>MIS BLOQUEOS</Text>
                                </View>
                                <TouchableOpacity onPress={() => setShowBlockoutModal(true)} style={styles.addBtnCircle}>
                                    <MaterialCommunityIcons name="plus" size={24} color="#000" />
                                </TouchableOpacity>
                            </View>
                            {myBlockouts.length === 0 ? (
                                <View style={styles.emptyBlockoutsMain}>
                                    <MaterialCommunityIcons name="calendar-lock-outline" size={24} color="#151515" style={{ alignSelf: 'center', marginBottom: 10 }} />
                                    <Text style={styles.emptyBlockoutsMainText}>No tenés días bloqueados. Si vas a viajar, avisanos acá.</Text>
                                </View>
                            ) : (
                                <View style={styles.mainBlockoutList}>
                                    {myBlockouts.map(b => (
                                        <View key={b.id} style={styles.mainBlockoutItem}>
                                            <View style={styles.mbIcon}><MaterialCommunityIcons name="calendar-lock" size={18} color="#ff4444" /></View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.mbDate}>Del {new Date(b.fecha_inicio + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })} al {new Date(b.fecha_fin + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</Text>
                                                <Text style={styles.mbReason}>{b.motivo || 'Indisponible'}</Text>
                                            </View>
                                            <TouchableOpacity onPress={() => deleteBlockout(b.id)} style={styles.mbDelete}>
                                                <MaterialCommunityIcons name="trash-can-outline" size={20} color="#ff4444" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    </ScrollView>
                )}
            </View>

            {/* MODALES */}
            <Modal visible={showBlockoutModal} transparent animationType="slide">
                <BlurView intensity={20} tint="dark" style={styles.modalOverlay}>
                    <ScrollView style={{ width: '100%' }} contentContainerStyle={{ padding: 20 }}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Mis Bloqueos</Text>
                                <TouchableOpacity onPress={() => setShowBlockoutModal(false)}><MaterialCommunityIcons name="close" size={24} color="#fff" /></TouchableOpacity>
                            </View>
                            <CalendarPicker startDate={blockoutStart} endDate={blockoutEnd} onChangeStart={setBlockoutStart} onChangeEnd={setBlockoutEnd} />
                            <View style={styles.modalInputGroup}>
                                <Text style={styles.modalInputLabel}>¿POR QUÉ NO PODRÁS ESTAR?</Text>
                                <TextInput style={styles.modalInput} value={blockoutReason} onChangeText={setBlockoutReason} placeholder="Opcional: Viaje, salud, examen..." placeholderTextColor="#444" selectionColor="#c5ff00" />
                            </View>
                            <TouchableOpacity style={styles.modalPrimaryBtn} onPress={handleSaveBlockout}>
                                <Text style={styles.modalPrimaryBtnText}>GUARDAR BLOQUEO</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </BlurView>
            </Modal>

            <Modal visible={showRejectionModal} transparent animationType="fade">
                <BlurView intensity={20} tint="dark" style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={[styles.modalTitle, { color: '#ff4444' }]}>Confirmar Rechazo</Text>
                        <Text style={styles.modalDesc}>Contanos brevemente por qué no podés servir este día para ayudarnos con la organización.</Text>
                        <TextInput style={styles.modalTextArea} placeholder="Motivo del rechazo..." placeholderTextColor="#444" value={rejectionReason} onChangeText={setRejectionReason} multiline selectionColor="#ff4444" />
                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowRejectionModal(false)}><Text style={styles.modalCancelText}>VOLVER</Text></TouchableOpacity>
                            <TouchableOpacity style={styles.modalDangerBtn} onPress={() => { handleResponderAsignacion('rechazado', rejectionReason); setShowRejectionModal(false); }}><Text style={styles.modalDangerText}>RECHAZAR</Text></TouchableOpacity>
                        </View>
                    </View>
                </BlurView>
            </Modal>

            {/* Recurso Youtube */}
            <Modal visible={modalYoutubeVisible} animationType="slide">
                <View style={[{ flex: 1, backgroundColor: '#000', paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                    <View style={styles.resHeader}>
                        <TouchableOpacity onPress={() => setModalYoutubeVisible(false)} style={styles.resBack}><MaterialCommunityIcons name="arrow-left" size={24} color="#c5ff00" /></TouchableOpacity>
                        <Text style={styles.resTitle} numberOfLines={1}>{activeResource?.titulo}</Text>
                    </View>
                    <View style={styles.youtubeWrapper}>
                        {activeResource?.youtube_url ? <YoutubePlayer height={250} play={true} videoId={activeResource.youtube_url.includes('v=') ? activeResource.youtube_url.split('v=')[1].split('&')[0] : activeResource.youtube_url.split('/').pop()?.split('?')[0]} /> : <ActivityIndicator color="#c5ff00" />}
                    </View>
                </View>
            </Modal>

            {/* Recurso Web (PDF) */}
            <Modal visible={modalWebVisible} animationType="slide">
                <View style={[{ flex: 1, backgroundColor: '#000', paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                    <View style={styles.resHeader}>
                        <TouchableOpacity onPress={() => setModalWebVisible(false)} style={styles.resBack}><MaterialCommunityIcons name="arrow-left" size={24} color="#c5ff00" /></TouchableOpacity>
                        <Text style={styles.resTitle} numberOfLines={1}>{activeResource?.titulo}</Text>
                    </View>
                    <WebView source={{ uri: activeResource?.url?.includes('drive.google.com') ? (() => { const m = activeResource.url.match(/\/d\/([\w-]+)/) || activeResource.url.match(/id=([\w-]+)/); return m ? `https://drive.google.com/file/d/${m[1]}/preview` : activeResource.url; })() : activeResource?.url }} style={{ flex: 1, backgroundColor: '#000' }} startInLoadingState renderLoading={() => <View style={StyleSheet.absoluteFill}><ActivityIndicator size="large" color="#c5ff00" /></View>} />
                </View>
            </Modal>

            {/* Letra de Canción */}
            <Modal visible={modalLyricsVisible} animationType="slide">
                <View style={[{ flex: 1, backgroundColor: '#000', paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                    <View style={styles.resHeader}>
                        <TouchableOpacity onPress={() => setModalLyricsVisible(false)} style={styles.resBack}><MaterialCommunityIcons name="arrow-left" size={24} color="#c5ff00" /></TouchableOpacity>
                        <Text style={styles.resTitle} numberOfLines={1}>{activeResource?.titulo} - LETRA</Text>
                    </View>
                    <ScrollView style={{ flex: 1, padding: 25 }}><Text style={styles.lyricsBody}>{activeResource?.acordes}</Text></ScrollView>
                </View>
            </Modal>

            {/* Chat del Plan */}
            {plan && (
                <Modal visible={showChatModal} transparent animationType="slide">
                    <PlanChatModal
                        visible={showChatModal}
                        onClose={() => setShowChatModal(false)}
                        planId={plan.id}
                        memberId={memberId || ''}
                        planTitle={plan.notas_generales || 'Plan de Culto'}
                        planDate={new Date(plan.fecha + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                        planTime={plan.horario ? plan.horario.split(',').map((h: any) => h.trim().replace(/HS/gi, '').trim()).sort((a: any, b: any) => { const [ha, ma] = a.split(':').map(Number); const [hb, mb] = b.split(':').map(Number); return (ha * 60 + (ma || 0)) - (hb * 60 + (mb || 0)); }).join(' y ') : '...'}
                        equipoIds={plan.equipo_ids || []}
                    />
                </Modal>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: '#000' },
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
    mainHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, marginBottom: 30 },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0a0a0a',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#1a1a1a',
        shadowColor: '#c5ff00',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 10
    },
    backText: { color: '#c5ff00', fontSize: 10, fontFamily: 'Montserrat_900Black', letterSpacing: 1.5, marginLeft: 8 },
    mainHeaderLabel: { color: '#444', fontSize: 11, fontFamily: 'Montserrat_900Black', letterSpacing: 2 },
    mainHeaderTitle: { color: '#fff', fontSize: 26, fontFamily: 'Montserrat_900Black', letterSpacing: -1, marginTop: -2 },
    listLabel: {
        color: '#ddd',
        fontSize: 10.5,
        fontFamily: 'Montserrat_900Black',
        letterSpacing: 2,
        marginLeft: 22,
        marginBottom: 15,
        textShadowColor: 'rgba(197, 255, 0, 0.3)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 6
    },
    detailHeader: { paddingHorizontal: 20, paddingTop: 20, flexDirection: 'row', alignItems: 'flex-start', marginBottom: 30 },
    headerInfo: { marginLeft: 20, flex: 1 },
    dateBadge: {
        backgroundColor: '#c5ff00',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 10,
        alignSelf: 'flex-start',
        marginBottom: 10,
        shadowColor: '#c5ff00',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6
    },
    dateBadgeText: { color: '#000', fontSize: 10, fontFamily: 'Montserrat_900Black' },
    planTitle: { color: '#fff', fontSize: 28, fontFamily: 'Montserrat_900Black', letterSpacing: -1 },
    planTime: { color: '#c5ff00', fontSize: 16, fontFamily: 'Montserrat_700Bold', marginTop: 2, opacity: 0.8 },
    pendingInviteCard: {
        marginHorizontal: 20,
        borderRadius: 32,
        padding: 30,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(197, 255, 0, 0.2)',
        marginBottom: 20,
        backgroundColor: 'rgba(197, 255, 0, 0.03)'
    },
    gradientOverlay: { ...StyleSheet.absoluteFillObject },
    inviteIconBox: {
        width: 72, height: 72, borderRadius: 24,
        backgroundColor: 'rgba(197, 255, 0, 0.1)',
        justifyContent: 'center', alignItems: 'center', marginBottom: 20,
        borderWidth: 1, borderColor: 'rgba(197, 255, 0, 0.2)'
    },
    inviteTitle: { color: '#fff', fontSize: 26, fontFamily: 'Montserrat_900Black', marginBottom: 10 },
    inviteSub: { color: '#888', fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 24 },
    rejectedBanner: {
        margin: 20, alignItems: 'center', padding: 40,
        backgroundColor: '#0a0a0a', borderRadius: 32,
        borderWidth: 1, borderColor: 'rgba(255, 68, 68, 0.1)'
    },
    rejectedTitle: { color: '#ff4444', fontSize: 20, fontFamily: 'Montserrat_900Black', marginTop: 20 },
    changeResponseBtn: { marginTop: 20, padding: 15 },
    changeResponseText: { color: '#444', fontSize: 11, fontFamily: 'Montserrat_700Bold', letterSpacing: 1 },
    mainBlockoutSection: { paddingHorizontal: 20, marginTop: 40 },
    blockoutTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    addBtnCircle: {
        width: 54, height: 54, borderRadius: 27,
        backgroundColor: '#c5ff00', justifyContent: 'center', alignItems: 'center',
        shadowColor: '#c5ff00', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4, shadowRadius: 10, elevation: 8
    },
    emptyBlockoutsMain: {
        padding: 35, backgroundColor: '#050505', borderRadius: 32,
        borderStyle: 'dashed', borderWidth: 1, borderColor: '#151515'
    },
    emptyBlockoutsMainText: {
        color: '#888', fontSize: 13, fontFamily: 'Inter_400Regular',
        textAlign: 'center', lineHeight: 22
    },
    mainBlockoutList: { gap: 12 },
    mainBlockoutItem: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#0a0a0a',
        padding: 16, borderRadius: 24, borderWidth: 1, borderColor: '#151515', gap: 16
    },
    mbIcon: {
        width: 44, height: 44, borderRadius: 14,
        backgroundColor: 'rgba(255, 68, 68, 0.08)', justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: 'rgba(255, 68, 68, 0.2)'
    },
    mbDate: { color: '#fff', fontSize: 14, fontFamily: 'Montserrat_700Bold' },
    mbReason: { color: '#555', fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
    mbDelete: { padding: 10 },
    floatingActions: { position: 'absolute', bottom: 30, left: 20, right: 20, zIndex: 10 },
    floatingBlur: { borderRadius: 32, padding: 25, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(0,0,0,0.8)' },
    floatingTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18, justifyContent: 'center' },
    floatingActionLabel: { color: '#c5ff00', fontSize: 11, fontFamily: 'Montserrat_900Black', letterSpacing: 1.5 },
    floatingButtons: { flexDirection: 'row', gap: 12 },
    confirmBtn: {
        flex: 1.2, backgroundColor: '#c5ff00', height: 64, borderRadius: 22,
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#c5ff00', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 10, elevation: 8
    },
    confirmBtnText: { color: '#000', fontSize: 13, fontFamily: 'Montserrat_900Black' },
    declineBtn: {
        flex: 1, backgroundColor: '#111', height: 64, borderRadius: 22,
        justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#222'
    },
    declineBtnText: { color: '#fff', fontSize: 13, fontFamily: 'Montserrat_700Bold' },
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
    modalContent: { backgroundColor: '#050505', borderRadius: 40, padding: 30, width: '100%', borderWidth: 1, borderColor: '#151515' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    modalTitle: { color: '#fff', fontSize: 26, fontFamily: 'Montserrat_900Black', letterSpacing: -1 },
    modalDesc: { color: '#666', fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 22, marginBottom: 20 },
    modalInputGroup: { marginTop: 20, marginBottom: 25 },
    modalInputLabel: {
        color: '#ddd',
        fontSize: 11,
        fontFamily: 'Montserrat_900Black',
        letterSpacing: 2,
        marginBottom: 12,
        marginLeft: 5,
        textShadowColor: 'rgba(197, 255, 0, 0.3)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 6
    },
    modalInput: { backgroundColor: '#0a0a0a', borderRadius: 18, height: 60, paddingHorizontal: 22, color: '#fff', fontSize: 16, fontFamily: 'Inter_400Regular', borderWidth: 1, borderColor: '#151515' },
    modalTextArea: { backgroundColor: '#0a0a0a', borderRadius: 20, height: 130, padding: 22, color: '#fff', fontSize: 16, fontFamily: 'Inter_400Regular', textAlignVertical: 'top', borderWidth: 1, borderColor: '#151515' },
    modalPrimaryBtn: {
        backgroundColor: '#c5ff00', height: 64, borderRadius: 22,
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#c5ff00', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 12, elevation: 10
    },
    modalPrimaryBtnText: { color: '#000', fontSize: 13, fontFamily: 'Montserrat_900Black' },
    modalFooter: { flexDirection: 'row', gap: 15, marginTop: 15 },
    modalCancelBtn: { flex: 1, height: 64, justifyContent: 'center', alignItems: 'center' },
    modalCancelText: { color: '#444', fontFamily: 'Montserrat_700Bold', fontSize: 12, letterSpacing: 1 },
    modalDangerBtn: { flex: 2, backgroundColor: '#ff4444', height: 64, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    modalDangerText: { color: '#fff', fontSize: 13, fontFamily: 'Montserrat_900Black' },
    resHeader: {
        paddingTop: 60, paddingBottom: 22, paddingHorizontal: 20,
        backgroundColor: '#000', flexDirection: 'row', alignItems: 'center',
        borderBottomWidth: 1, borderBottomColor: '#151515'
    },
    resBack: {
        width: 48, height: 48, borderRadius: 18,
        backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: '#1a1a1a'
    },
    resTitle: { color: '#fff', fontSize: 17, fontFamily: 'Montserrat_700Bold', flex: 1, marginLeft: 16 },
    youtubeWrapper: { flex: 1, justifyContent: 'center', backgroundColor: '#000' },
    lyricsBody: { color: '#fff', fontSize: 17, fontFamily: 'monospace', lineHeight: 28, paddingBottom: 100 },
    listLabelInline: {
        color: '#ddd',
        fontSize: 10.5,
        fontFamily: 'Montserrat_900Black',
        letterSpacing: 2,
        textShadowColor: 'rgba(197, 255, 0, 0.3)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 6
    },
    chatFab: {
        position: 'absolute',
        bottom: 40,
        right: 25,
        zIndex: 100,
        shadowColor: '#c5ff00',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
        elevation: 12
    },
    chatFabBlur: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: 'rgba(197, 255, 0, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(197, 255, 0, 0.3)',
        overflow: 'hidden'
    },
    badge: {
        position: 'absolute',
        top: 18,
        right: 18,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#ff4444',
        borderWidth: 2,
        borderColor: '#000'
    }
});

export default ServidoresScreen;
