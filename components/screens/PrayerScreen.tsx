import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Animated, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';

const JOINED_KEY = 'joined_prayers';
const PAGE_SIZE = 5;

const getTimeLabel = (fechaStr: string | null): string => {
    if (!fechaStr) return 'Reciente';
    const ahora = new Date();
    const fecha = new Date(fechaStr);
    const diffMs = ahora.getTime() - fecha.getTime();
    const diffH = diffMs / (1000 * 60 * 60);
    if (diffH < 24) return 'Hoy';
    if (diffH < 48) return 'Ayer';
    if (diffH < 168) return 'Esta semana';
    return 'Este mes';
};

const GROUP_ORDER = ['Hoy', 'Ayer', 'Esta semana', 'Este mes'];

const PrayerScreen = ({ navigateTo, cargarPedidos, listaPedidosOracion }: any) => {
    const insets = useSafeAreaInsets();
    const { memberId, nombre, refreshData } = useApp();
    const [mensajeOracion, setMensajeOracion] = useState('');
    const [joinedPrayers, setJoinedPrayers] = useState<Set<string>>(new Set());
    const [localCounts, setLocalCounts] = useState<Record<string, number>>({});
    const [pagina, setPagina] = useState(1);
    const [totalPedidos, setTotalPedidos] = useState<any[]>([]);
    const [filtroMios, setFiltroMios] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const fadeAnim = useState(new Animated.Value(0))[0];

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([cargarPedidos(), refreshData()]);
        setRefreshing(false);
    }, [cargarPedidos, refreshData]);

    useEffect(() => {
        const loadJoined = async () => {
            const raw = await AsyncStorage.getItem(JOINED_KEY);
            if (raw) setJoinedPrayers(new Set(JSON.parse(raw)));
        };
        loadJoined();
        cargarPedidos();
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    }, [cargarPedidos, fadeAnim]);
    useEffect(() => {
        setTotalPedidos(listaPedidosOracion || []);
    }, [listaPedidosOracion]);

    const saveJoined = async (newSet: Set<string>) => {
        setJoinedPrayers(newSet);
        await AsyncStorage.setItem(JOINED_KEY, JSON.stringify([...newSet]));
    };

    const handlePublicarPedido = async () => {
        if (!mensajeOracion.trim()) return;
        try {
            const { error } = await supabase.from('pedidos_oracion').insert([{ miembro_id: memberId, pedido: mensajeOracion, contador_oraciones: 0, fecha: new Date().toISOString() }]);
            if (error) throw error;
            setMensajeOracion('');
            cargarPedidos();
            Alert.alert("¡Publicado! 🙏", "Tu pedido ha sido compartido con la comunidad.");
        } catch (e) { console.error(e); Alert.alert("Error", "No se pudo publicar el pedido."); }
    };

    const handleMeUni = async (pedido: any) => {
        if (joinedPrayers.has(pedido.id)) return;
        setLocalCounts(prev => ({ ...prev, [pedido.id]: (prev[pedido.id] ?? pedido.contador_oraciones ?? 0) + 1 }));
        await saveJoined(new Set(joinedPrayers).add(pedido.id));
        try {
            const { error } = await supabase.rpc('incrementar_oracion', { row_id: pedido.id });
            if (error) throw error;
            if (pedido.miembro_id !== memberId && pedido.miembros?.token_notificacion) {
                try {
                    await fetch('https://exp.host/--/api/v2/push/send', {
                        method: 'POST',
                        headers: {
                            Accept: 'application/json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            to: pedido.miembros.token_notificacion,
                            title: '¡Alguien ora por vos! 🙏',
                            body: `${nombre} se acaba de unir a tu pedido de oración.`,
                            sound: 'default',
                        }),
                    });
                } catch (pe) { console.log("Push error:", pe); }
            }
            cargarPedidos();
        } catch (e) {
            setLocalCounts(prev => ({ ...prev, [pedido.id]: (prev[pedido.id] ?? 1) - 1 }));
            console.error(e);
        }
    };

    const handleEliminarPedido = async (pedidoId: string) => {
        Alert.alert("Eliminar pedido", "¿Querés eliminar tu pedido de oración?", [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Eliminar", style: "destructive",
                onPress: async () => {
                    const { error } = await supabase.from('pedidos_oracion').delete().eq('id', pedidoId).eq('miembro_id', memberId);
                    if (!error) cargarPedidos();
                    else Alert.alert("Error", "No se pudo eliminar el pedido.");
                }
            }
        ]);
    };

    const handleReportar = (pedido: any) => {
        Alert.alert("Reportar pedido", "¿Este pedido tiene contenido inapropiado?", [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Reportar", style: "destructive",
                onPress: async () => {
                    await supabase.from('reportes').insert([{ tipo: 'pedido_oracion', referencia_id: pedido.id, reportado_por: memberId }]);
                    Alert.alert("Gracias", "Revisaremos este pedido pronto.");
                }
            }
        ]);
    };

    const listaFiltrada = filtroMios ? totalPedidos.filter(p => p.miembro_id === memberId) : totalPedidos;
    const pedidosMostrados = listaFiltrada.slice(0, pagina * PAGE_SIZE);
    const grupos: Record<string, any[]> = {};
    pedidosMostrados.forEach(p => {
        const label = getTimeLabel(p.fecha);
        if (!grupos[label]) grupos[label] = [];
        grupos[label].push(p);
    });

    const hayMas = listaFiltrada.length > pagina * PAGE_SIZE;

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <ScrollView
                style={styles.pageScroll}
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#c5ff00" />}
            >
                <View style={styles.topNav}>
                    <TouchableOpacity onPress={() => navigateTo('Inicio')} style={styles.backButton}>
                        <MaterialCommunityIcons name="chevron-left" size={28} color="#c5ff00" />
                        <Text style={styles.backText}>VOLVER</Text>
                    </TouchableOpacity>
                    <View style={styles.topTitles}>
                        <Text style={styles.topLabel}>COMUNIDAD</Text>
                        <Text style={styles.topTitle}>MURO DE ORACIÓN</Text>
                    </View>
                </View>

                <View style={styles.inputSection}>
                    <BlurView intensity={10} tint="light" style={styles.inputBlur}>
                        <TextInput
                            style={styles.prayerInput}
                            multiline
                            placeholder="¿Por qué necesitamos orar hoy?..."
                            placeholderTextColor="#444"
                            value={mensajeOracion}
                            onChangeText={setMensajeOracion}
                            selectionColor="#c5ff00"
                        />
                        <TouchableOpacity
                            style={[styles.publishBtn, !mensajeOracion.trim() && { opacity: 0.3 }]}
                            onPress={handlePublicarPedido}
                            disabled={!mensajeOracion.trim()}
                        >
                            <LinearGradient
                                colors={['#c5ff00', '#a2d100']}
                                style={styles.publishBtnGradient}
                            >
                                <MaterialCommunityIcons name="hands-pray" size={20} color="#000" />
                                <Text style={styles.publishBtnText}>COMPARTIR PEDIDO</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </BlurView>
                </View>

                <View style={styles.filterRow}>
                    <Text style={styles.sectionTitle}>{filtroMios ? 'MIS PEDIDOS' : 'PEDIDOS RECIENTES'}</Text>
                    <TouchableOpacity
                        onPress={() => { setFiltroMios(!filtroMios); setPagina(1); }}
                        style={[styles.filterBtn, filtroMios && styles.filterBtnActive]}
                    >
                        <Text style={[styles.filterBtnText, filtroMios && { color: '#000' }]}>
                            {filtroMios ? 'VER TODOS' : 'MIS PEDIDOS'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <Animated.View style={{ opacity: fadeAnim }}>
                    {listaFiltrada.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconCircle}>
                                <MaterialCommunityIcons name="hands-pray" size={60} color="#111" />
                            </View>
                            <Text style={styles.emptyTitle}>Muro en silencio</Text>
                            <Text style={styles.emptySubtitle}>Sé el primero en levantar un motivo de oración hoy.</Text>
                        </View>
                    ) : (
                        GROUP_ORDER.filter(g => grupos[g]?.length > 0).map(grupoLabel => (
                            <View key={grupoLabel} style={styles.groupSection}>
                                <View style={styles.groupHeader}>
                                    <Text style={styles.groupHeaderText}>{grupoLabel.toUpperCase()}</Text>
                                    <View style={styles.groupHeaderLine} />
                                </View>
                                {grupos[grupoLabel].map((p, i) => {
                                    const yaUni = joinedPrayers.has(p.id);
                                    const esMio = p.miembro_id === memberId;
                                    const count = localCounts[p.id] ?? p.contador_oraciones ?? 0;
                                    return (
                                        <View key={i} style={[styles.prayerCard, esMio && styles.prayerCardOwned]}>
                                            <View style={styles.cardHeader}>
                                                <View style={styles.userInfo}>
                                                    <View>
                                                        <Text style={styles.userName}>{esMio ? 'Vos' : (p.miembros?.nombre || 'Miembro')}</Text>
                                                        {esMio && <Text style={styles.userStatus}>TU PEDIDO</Text>}
                                                    </View>
                                                </View>
                                                <TouchableOpacity
                                                    onPress={() => esMio ? handleEliminarPedido(p.id) : handleReportar(p)}
                                                    style={styles.cardActionBtn}
                                                >
                                                    <MaterialCommunityIcons
                                                        name={esMio ? "trash-can-outline" : "flag-outline"}
                                                        size={18}
                                                        color={esMio ? "#ff4444" : "#333"}
                                                    />
                                                </TouchableOpacity>
                                            </View>

                                            <Text style={styles.prayerContent}>&quot;{p.pedido}&quot;</Text>

                                            <View style={styles.cardFooter}>
                                                <View style={styles.counterBox}>
                                                    <MaterialCommunityIcons name="heart" size={12} color="#ff4444" />
                                                    <Text style={styles.counterText}>{count} ORANDO</Text>
                                                </View>

                                                <TouchableOpacity
                                                    style={[styles.prayBtn, yaUni && styles.prayBtnDone]}
                                                    onPress={() => handleMeUni(p)}
                                                    disabled={yaUni || esMio}
                                                >
                                                    <LinearGradient
                                                        colors={yaUni ? ['#111', '#0a0a0a'] : ['#c5ff00', '#a2d100']}
                                                        style={styles.prayBtnGradient}
                                                    >
                                                        {yaUni ? (
                                                            <>
                                                                <MaterialCommunityIcons name="check" size={14} color="#c5ff00" />
                                                                <Text style={styles.prayBtnTextDone}>YA ORÉ</Text>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <MaterialCommunityIcons name="hands-pray" size={14} color="#000" />
                                                                <Text style={styles.prayBtnText}>{esMio ? 'MI PEDIDO' : 'UNIRME'}</Text>
                                                            </>
                                                        )}
                                                    </LinearGradient>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        ))
                    )}

                    {hayMas && (
                        <TouchableOpacity style={styles.loadMoreFab} onPress={() => setPagina(p => p + 1)}>
                            <Text style={styles.loadMoreFabText}>VER MÁS PEDIDOS</Text>
                            <MaterialCommunityIcons name="chevron-down" size={20} color="#c5ff00" />
                        </TouchableOpacity>
                    )}
                </Animated.View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    pageScroll: { flex: 1 },
    topNav: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, marginBottom: 25 },
    backButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 22, borderWidth: 1, borderColor: '#333' },
    backText: { color: '#c5ff00', fontSize: 11, fontWeight: '900', letterSpacing: 1, marginLeft: 5 },
    topTitles: { marginLeft: 15 },
    topLabel: { color: '#c5ff00', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
    topTitle: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },

    inputSection: { paddingHorizontal: 20, marginBottom: 30 },
    inputBlur: { borderRadius: 30, overflow: 'hidden', padding: 20, backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    prayerInput: { height: 100, color: '#fff', fontSize: 16, textAlignVertical: 'top', marginBottom: 20 },
    publishBtn: { height: 50, borderRadius: 18, overflow: 'hidden' },
    publishBtnGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    publishBtnText: { color: '#000', fontWeight: '900', fontSize: 13, letterSpacing: 1 },

    filterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
    sectionTitle: { color: '#444', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
    filterBtn: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12, backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: '#111' },
    filterBtnActive: { backgroundColor: '#c5ff00', borderColor: '#c5ff00' },
    filterBtnText: { color: '#666', fontSize: 10, fontWeight: '900' },

    emptyContainer: { alignItems: 'center', marginTop: 50, paddingHorizontal: 40 },
    emptyIconCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#111' },
    emptyTitle: { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 25 },
    emptySubtitle: { color: '#444', fontSize: 13, textAlign: 'center', marginTop: 10, lineHeight: 20 },

    groupSection: { marginBottom: 25 },
    groupHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
    groupHeaderText: { color: '#222', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
    groupHeaderLine: { flex: 1, height: 1, backgroundColor: '#0a0a0a', marginLeft: 15 },

    prayerCard: { marginHorizontal: 20, backgroundColor: '#050505', borderRadius: 28, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: '#111' },
    prayerCardOwned: { borderColor: '#c5ff0020', backgroundColor: '#070700' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatarBox: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    avatarInitial: { fontSize: 18, fontWeight: '900' },
    userName: { color: '#fff', fontSize: 15, fontWeight: '800' },
    userStatus: { color: '#c5ff00', fontSize: 9, fontWeight: '900' },
    cardActionBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.02)', justifyContent: 'center', alignItems: 'center' },
    prayerContent: { color: '#aaa', fontSize: 15, lineHeight: 24, fontStyle: 'italic', marginVertical: 20, fontWeight: '400' },
    cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    counterBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    counterText: { color: '#333', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    prayBtn: { height: 40, borderRadius: 14, overflow: 'hidden', minWidth: 100 },
    prayBtnDone: { borderWidth: 1, borderColor: '#111' },
    prayBtnGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 15 },
    prayBtnText: { color: '#000', fontSize: 11, fontWeight: '900' },
    prayBtnTextDone: { color: '#c5ff00', fontSize: 11, fontWeight: '900' },

    loadMoreFab: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 20, paddingVertical: 20, borderRadius: 24, backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: '#111', marginTop: 10, gap: 10 },
    loadMoreFabText: { color: '#c5ff00', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
});

export default PrayerScreen;
