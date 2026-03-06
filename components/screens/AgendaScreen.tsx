import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Linking, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';

/**
 * Pantalla de Agenda de la aplicación mejorada.
 */
const AgendaScreen = ({ navigateTo }: any) => {
    const insets = useSafeAreaInsets();
    const { refreshData } = useApp();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [proximos, setProximos] = useState<any[]>([]);
    const [horariosBase, setHorariosBase] = useState<string[]>([]);
    const fadeAnim = useState(new Animated.Value(0))[0];

    const fetchAgenda = useCallback(async () => {
        const hoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });

        const [{ data: cronos }, { data: config }] = await Promise.all([
            supabase
                .from('cronogramas')
                .select('id, fecha, horario, equipo_ids, notas_generales')
                .gte('fecha', hoy)
                .order('fecha', { ascending: true })
                .limit(10),
            supabase
                .from('configuracion')
                .select('valor')
                .eq('clave', 'horarios_reunion')
                .single()
        ]);

        if (cronos) setProximos(cronos);
        if (config?.valor) setHorariosBase(config.valor);
        setLoading(false);
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }, [fadeAnim]);

    useEffect(() => {
        fetchAgenda();
    }, [fetchAgenda]);

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([fetchAgenda(), refreshData()]);
        setRefreshing(false);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator color="#c5ff00" size="large" />
            </View>
        );
    }

    return (
        <View style={styles.mainWrapper}>
            <LinearGradient colors={['#050B25', '#020205']} style={StyleSheet.absoluteFill} />

            {/* Mesh gradient effects */}
            <View style={{ position: 'absolute', top: -100, right: -50, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(37, 99, 235, 0.1)' }} />
            <View style={{ position: 'absolute', bottom: 100, left: -100, width: 400, height: 400, borderRadius: 200, backgroundColor: 'rgba(147, 51, 234, 0.08)' }} />

            <ScrollView
                style={styles.container}
                contentContainerStyle={{ paddingBottom: 100, paddingTop: Math.max(insets.top, 16) }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#c5ff00" />}
            >
                <TouchableOpacity onPress={() => navigateTo('Inicio')} style={styles.backButton}>
                    <MaterialCommunityIcons name="chevron-left" size={28} color="#c5ff00" />
                    <Text style={styles.backText}>VOLVER</Text>
                </TouchableOpacity>

                <View style={styles.header}>
                    <Text style={styles.headerLabel}>PLANIFICACIÓN</Text>
                    <Text style={styles.headerTitle}>AGENDA</Text>
                    <View style={styles.headerLine} />
                </View>

                <Animated.View style={{ opacity: fadeAnim }}>
                    {/* PRÓXIMOS SERVICIOS */}
                    {proximos.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>PRÓXIMOS CULTOS</Text>
                            {proximos.map((c) => {
                                const fecha = new Date(c.fecha + 'T12:00:00');
                                const diaNum = fecha.getDate();
                                const mesStr = fecha.toLocaleDateString('es-AR', { month: 'short' }).toUpperCase();
                                const diaSem = fecha.toLocaleDateString('es-AR', { weekday: 'long' }).toUpperCase();

                                const total = (c.equipo_ids || []).length;

                                return (
                                    <View key={c.id} style={styles.agendaCard}>
                                        <View style={styles.dateBadge}>
                                            <Text style={styles.dateDay}>{diaNum}</Text>
                                            <Text style={styles.dateMonth}>{mesStr}</Text>
                                        </View>

                                        <View style={styles.agendaContent}>
                                            <Text style={styles.agendaDayName}>{diaSem}</Text>
                                            <Text style={styles.agendaInfoText}>
                                                {c.notas_generales || (total > 0 ? `Servicio con ${total} Voluntarios` : 'Reunión General')}
                                            </Text>
                                            <View style={styles.timeTag}>
                                                <MaterialCommunityIcons name="clock-outline" size={14} color="#c5ff00" />
                                                <Text style={styles.timeText}>{c.horario} HS</Text>
                                            </View>
                                        </View>

                                        <TouchableOpacity
                                            onPress={() => {
                                                const title = `Reunión - Iglesia del Salvador`;
                                                const start = c.fecha.replace(/-/g, '') + 'T' + c.horario.replace(/[^0-9]/g, '').padEnd(4, '0') + '00';
                                                const end = c.fecha.replace(/-/g, '') + 'T' + (parseInt(c.horario) + 2).toString().padStart(2, '0') + c.horario.substring(2).replace(/[^0-9]/g, '').padEnd(2, '0') + '00';
                                                const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${start}/${end}&details=${encodeURIComponent(c.notas_generales || 'Servicio de adoración')}&location=Iglesia+del+Salvador`;
                                                Linking.openURL(url);
                                            }}
                                            style={styles.calendarFab}
                                        >
                                            <MaterialCommunityIcons name="calendar-plus" size={20} color="#000" />
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}
                        </View>
                    )}

                    {/* HORARIO REGULAR */}
                    {horariosBase.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>HORARIO SEMANAL</Text>
                            {horariosBase.map((h: string, i: number) => (
                                <View key={i} style={styles.regularCard}>
                                    <BlurView intensity={10} tint="light" style={styles.regularCardBlur}>
                                        <View style={styles.regularInfo}>
                                            <Text style={styles.regularDay}>DOMINGO</Text>
                                            <Text style={styles.regularTitle}>Reunión General</Text>
                                        </View>
                                        <View style={styles.regularTimeBox}>
                                            <Text style={styles.regularTimeText}>{h}</Text>
                                            <Text style={styles.regularTimeLabel}>HS</Text>
                                        </View>
                                    </BlurView>
                                </View>
                            ))}

                            {/* Eventos adicionales fijos */}
                            <View style={styles.regularCard}>
                                <BlurView intensity={10} tint="light" style={styles.regularCardBlur}>
                                    <View style={styles.regularInfo}>
                                        <Text style={styles.regularDay}>SÁBADO</Text>
                                        <Text style={styles.regularTitle}>Jóvenes</Text>
                                    </View>
                                    <View style={styles.regularTimeBox}>
                                        <Text style={styles.regularTimeText}>20:00</Text>
                                        <Text style={styles.regularTimeLabel}>HS</Text>
                                    </View>
                                </BlurView>
                            </View>
                        </View>
                    )}
                </Animated.View>

                <View style={styles.infoFooter}>
                    <BlurView intensity={20} tint="dark" style={styles.infoFooterBlur}>
                        <MaterialCommunityIcons name="information-outline" size={20} color="#c5ff00" />
                        <Text style={styles.infoFooterText}>
                            Los horarios pueden variar en feriados o eventos especiales. Te recomendamos seguirnos en redes sociales para avisos de último momento.
                        </Text>
                    </BlurView>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    mainWrapper: { flex: 1, backgroundColor: '#020205' },
    container: { flex: 1, paddingHorizontal: 20 },
    loadingContainer: { flex: 1, backgroundColor: '#020205', justifyContent: 'center', alignItems: 'center' },
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
        marginBottom: 20
    },
    backText: { color: '#c5ff00', fontSize: 10, fontFamily: 'Montserrat_900Black', letterSpacing: 1.5, marginLeft: 8 },
    header: { paddingHorizontal: 25, marginBottom: 30 },
    headerLabel: { color: '#c5ff00', fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 5 },
    headerTitle: { color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: -1 },
    headerLine: { width: 40, height: 4, backgroundColor: '#c5ff00', marginTop: 8, borderRadius: 2 },

    section: { marginBottom: 35 },
    sectionLabel: { color: '#999', fontSize: 12, fontWeight: '900', letterSpacing: 2, marginBottom: 20 },

    agendaCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 28,
        padding: 18,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)'
    },
    dateBadge: { width: 55, height: 65, backgroundColor: '#c5ff00', borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    dateDay: { color: '#000', fontSize: 24, fontWeight: '900' },
    dateMonth: { color: '#000', fontSize: 10, fontWeight: '900', marginTop: -2 },

    agendaContent: { flex: 1, marginLeft: 15 },
    agendaDayName: { color: '#fff', fontSize: 16, fontWeight: '900', marginBottom: 2 },
    agendaInfoText: { color: '#888', fontSize: 12, marginBottom: 8 },
    timeTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.05)', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    timeText: { color: '#c5ff00', fontSize: 11, fontWeight: '900', marginLeft: 5 },

    calendarFab: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#c5ff00', justifyContent: 'center', alignItems: 'center', shadowColor: '#c5ff00', shadowOpacity: 0.3, shadowRadius: 8 },

    regularCard: { borderRadius: 22, overflow: 'hidden', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    regularCardBlur: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
    regularInfo: { flex: 1 },
    regularDay: { color: '#c5ff00', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
    regularTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
    regularTimeBox: { alignItems: 'center' },
    regularTimeText: { color: '#fff', fontSize: 22, fontWeight: '900' },
    regularTimeLabel: { color: '#888', fontSize: 8, fontWeight: '900', marginTop: -4 },

    infoFooter: { borderRadius: 24, overflow: 'hidden', marginTop: 10 },
    infoFooterBlur: { padding: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)' },
    infoFooterText: { color: '#888', fontSize: 11, marginLeft: 15, flex: 1, lineHeight: 18, fontWeight: '500' },
});

export default AgendaScreen;
