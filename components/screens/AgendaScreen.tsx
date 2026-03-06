import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { default as React, useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Linking, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';

/**
 * Pantalla de Agenda de la aplicación con diseño tipo Timeline (Google Calendar style).
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
        try {
            const hoy = new Date();
            // Normalizamos hoy a la medianoche para comparaciones de fecha
            const hoyDate = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
            const hoyISO = hoyDate.toISOString().split('T')[0];

            const limitDate = new Date(hoyDate);
            limitDate.setMonth(limitDate.getMonth() + 4);

            // 1. Fetch de Supabase
            const [{ data: cronos }, { data: config }] = await Promise.all([
                supabase
                    .from('cronogramas')
                    .select('id, fecha, horario, notas_generales')
                    .gte('fecha', hoyISO)
                    .order('fecha', { ascending: true })
                    .limit(150),
                supabase
                    .from('configuracion')
                    .select('valor')
                    .eq('clave', 'horarios_reunion')
                    .single()
            ]);

            let allEvents: any[] = [];

            if (cronos) {
                allEvents = cronos.map(c => ({
                    id: `supa_${c.id}`,
                    fecha: c.fecha,
                    horario: c.horario,
                    titulo: c.notas_generales || 'Reunión General',
                    source: 'supabase',
                    isService: true
                }));
            }

            // 2. Fetch y parseo de Google Calendar (ICAL) con motor mejorado
            try {
                const ICAL_URL = 'https://calendar.google.com/calendar/ical/isalv.com.ar_38nn6o6iau2sl52646cti1bgv4%40group.calendar.google.com/public/basic.ics';
                const response = await fetch(ICAL_URL);
                const icsText = await response.text();

                const vevents = icsText.split('BEGIN:VEVENT');
                const icalEvents: any[] = [];

                vevents.shift();

                vevents.forEach(block => {
                    const summaryMatch = block.match(/SUMMARY:(.*)/);
                    if (!summaryMatch) return;

                    const summary = summaryMatch[1].trim();

                    // Evitar eventos de pastelería antiguos o no deseados
                    if (summary.toLowerCase().includes('pasteler')) return;

                    const dtstartMatch = block.match(/DTSTART[:;](?:TZID=.*:)?(\d{8}T\d{6}Z?)/);
                    const dtstartDateOnlyMatch = block.match(/DTSTART;VALUE=DATE:(\d{8})/);
                    const dtendMatch = block.match(/DTEND[:;](?:TZID=.*:)?(\d{8}T\d{6}Z?)/);
                    const dtendDateOnlyMatch = block.match(/DTEND;VALUE=DATE:(\d{8})/);
                    const rruleMatch = block.match(/RRULE:(.*)/);

                    // Soporte para EXDATE (fechas canceladas)
                    const exdates = block.split(/\r?\n/)
                        .filter(l => l.startsWith('EXDATE'))
                        .map(l => {
                            const m = l.match(/(\d{8})/);
                            return m ? m[1] : null;
                        }).filter(Boolean) as string[];

                    if (dtstartMatch || dtstartDateOnlyMatch) {
                        const startRaw = dtstartMatch ? dtstartMatch[1] : dtstartDateOnlyMatch![1];
                        const endRaw = dtendMatch ? dtendMatch[1] : (dtendDateOnlyMatch ? dtendDateOnlyMatch[1] : startRaw);

                        const parseIcalDate = (s: string) => {
                            const y = parseInt(s.substring(0, 4));
                            const m = parseInt(s.substring(4, 6)) - 1;
                            const d = parseInt(s.substring(6, 8));
                            if (s.includes('T')) {
                                const h = parseInt(s.substring(9, 11));
                                const min = parseInt(s.substring(11, 13));
                                if (s.endsWith('Z')) {
                                    const date = new Date(Date.UTC(y, m, d, h, min));
                                    date.setHours(date.getHours() - 3); // Ajuste Argentina
                                    return date;
                                }
                                return new Date(y, m, d, h, min);
                            }
                            return new Date(y, m, d);
                        };

                        const startDate = parseIcalDate(startRaw);
                        const endDate = parseIcalDate(endRaw);
                        const duration = endDate.getTime() - startDate.getTime();

                        const pushEvent = (d: Date) => {
                            const Y = d.getFullYear();
                            const M = (d.getMonth() + 1).toString().padStart(2, '0');
                            const D = d.getDate().toString().padStart(2, '0');
                            const iso = `${Y}-${M}-${D}`;
                            const compact = `${Y}${M}${D}`;

                            // Verificar si esta fecha específica está excluida
                            if (exdates.includes(compact)) return;

                            let hourText = 'Todo el día';
                            if (dtstartMatch && startRaw.includes('T')) {
                                const hStart = d.getHours().toString().padStart(2, '0');
                                const mStart = d.getMinutes().toString().padStart(2, '0');

                                const endInstance = new Date(d.getTime() + duration);
                                const hEnd = endInstance.getHours().toString().padStart(2, '0');
                                const mEnd = endInstance.getMinutes().toString().padStart(2, '0');

                                hourText = `${hStart}:${mStart} a ${hEnd}:${mEnd} HS`;
                            }

                            icalEvents.push({
                                id: `ical_${Math.random()}`,
                                fecha: iso,
                                anio: Y, // Guardamos el año
                                horario: hourText,
                                titulo: summary,
                                source: 'ical'
                            });
                        };

                        // RECURRENCIAS
                        if (rruleMatch) {
                            const rrule = rruleMatch[1];
                            const untilMatch = rrule.match(/UNTIL=(\d{8})/);
                            const untilDate = untilMatch ? parseIcalDate(untilMatch[1]) : limitDate;

                            if (rrule.includes('FREQ=WEEKLY')) {
                                let curr = new Date(startDate);
                                // SALTO OPTIMIZADO: Si el evento empezó hace meses/años, saltamos a la semana actual
                                if (curr < hoyDate) {
                                    const diffMs = hoyDate.getTime() - curr.getTime();
                                    const weeksToSkip = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
                                    if (weeksToSkip > 1) {
                                        curr.setDate(curr.getDate() + (weeksToSkip - 1) * 7);
                                    }
                                }

                                let safety = 0;
                                while (curr <= untilDate && curr <= limitDate && safety < 100) {
                                    if (curr >= hoyDate) pushEvent(new Date(curr));
                                    curr.setDate(curr.getDate() + 7);
                                    safety++;
                                }
                            } else if (rrule.includes('FREQ=MONTHLY')) {
                                let curr = new Date(startDate);
                                if (curr < hoyDate) {
                                    curr.setFullYear(hoyDate.getFullYear());
                                    curr.setMonth(hoyDate.getMonth());
                                    if (curr < hoyDate) curr.setMonth(curr.getMonth() + 1);
                                }
                                let safety = 0;
                                while (curr <= untilDate && curr <= limitDate && safety < 12) {
                                    if (curr >= hoyDate) pushEvent(new Date(curr));
                                    curr.setMonth(curr.getMonth() + 1);
                                    safety++;
                                }
                            }
                        }
                        // EVENTOS MULTIDÍA
                        else if (endDate > startDate && (endDate.getTime() - startDate.getTime() > 86400000)) {
                            let curr = new Date(startDate);
                            let safety = 0;
                            while (curr < endDate && curr <= limitDate && safety < 30) {
                                if (curr >= hoyDate) pushEvent(new Date(curr));
                                curr.setDate(curr.getDate() + 1);
                                safety++;
                            }
                        }
                        // EVENTO ÚNICO
                        else {
                            if (startDate >= hoyDate) pushEvent(startDate);
                        }
                    }
                });

                allEvents = [...allEvents, ...icalEvents];
            } catch (icalError) {
                console.warn('Error ICAL:', icalError);
            }

            allEvents.sort((a, b) => a.fecha.localeCompare(b.fecha));
            // Mostramos suficientes eventos para cubrir bien los próximos meses
            setProximos(allEvents.slice(0, 300));
            if (config?.valor) setHorariosBase(config.valor);
        } catch (error) {
            console.error('Error Agenda:', error);
        } finally {
            setLoading(false);
            Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
        }
    }, [fadeAnim, refreshData]);

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

    const todayISO = new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });

    return (
        <View style={styles.mainWrapper}>
            <LinearGradient colors={['#080C21', '#020205']} style={StyleSheet.absoluteFill} />

            {/* Mesh gradient effects para dar profundidad y que no sea un negro plano */}
            <View style={{ position: 'absolute', top: -50, right: -50, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(59, 130, 246, 0.12)' }} />
            <View style={{ position: 'absolute', bottom: 100, left: -50, width: 400, height: 400, borderRadius: 200, backgroundColor: 'rgba(139, 92, 246, 0.08)' }} />
            <View style={{ position: 'absolute', top: 300, left: -100, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(197, 255, 0, 0.03)' }} />
            <View style={[styles.headerOuter, { paddingTop: insets.top + 10 }]}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => navigateTo('Inicio')} style={styles.backButton}>
                        <MaterialCommunityIcons name="chevron-left" size={28} color="#c5ff00" />
                        <Text style={styles.backText}>VOLVER</Text>
                    </TouchableOpacity>
                    <View style={styles.headerTitles}>
                        <Text style={styles.headerLabel}>PLANIFICACIÓN</Text>
                        <Text style={styles.headerTitle}>AGENDA</Text>
                    </View>
                </View>
            </View>

            <ScrollView
                style={styles.container}
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#c5ff00" />}
            >
                <Animated.View style={{ opacity: fadeAnim, marginTop: 10 }}>
                    {proximos.length === 0 ? (
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="calendar-blank" size={60} color="#222" />
                            <Text style={styles.emptyText}>No hay eventos próximos</Text>
                        </View>
                    ) : (
                        (() => {
                            const groups: { dateISO: string, events: any[] }[] = [];
                            proximos.forEach(item => {
                                const lastGroup = groups[groups.length - 1];
                                if (lastGroup && lastGroup.dateISO === item.fecha) {
                                    lastGroup.events.push(item);
                                } else {
                                    groups.push({ dateISO: item.fecha, events: [item] });
                                }
                            });

                            return groups.map((group) => {
                                const [year, month, day] = group.dateISO.split('-');
                                const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                                const isToday = group.dateISO === todayISO;

                                const diaSem = date.toLocaleDateString('es-AR', { weekday: 'short' }).toUpperCase().replace('.', '');
                                const diaNum = date.getDate();
                                const mesStr = date.toLocaleDateString('es-AR', { month: 'short' }).toUpperCase().replace('.', '');
                                const anioStr = date.getFullYear().toString();

                                return (
                                    <View key={group.dateISO} style={styles.dayCard}>
                                        <View style={styles.dateColumn}>
                                            <View style={[styles.dayCircle, isToday && styles.dayCircleToday]}>
                                                <Text style={[styles.dayNumText, isToday && styles.dayNumTextToday]}>{diaNum}</Text>
                                            </View>
                                            <Text style={styles.daySubText}>{diaSem}</Text>
                                            <Text style={styles.yearText}>{mesStr} {anioStr}</Text>
                                        </View>

                                        <View style={styles.eventsContainer}>
                                            {group.events.map((item, idx) => (
                                                <TouchableOpacity
                                                    key={item.id}
                                                    style={[styles.eventItem, idx < group.events.length - 1 && styles.eventItemDivider]}
                                                    activeOpacity={0.7}
                                                    onPress={() => {
                                                        const title = `${item.titulo} - IDS`;
                                                        const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(item.titulo)}&location=Iglesia+del+Salvador`;
                                                        Linking.openURL(url);
                                                    }}
                                                >
                                                    <View style={styles.eventHeader}>
                                                        <View style={[styles.dot, item.isService ? styles.dotGreen : styles.dotBlue]} />
                                                        <Text style={styles.eventTime}>{item.horario}</Text>
                                                    </View>
                                                    <Text style={styles.eventTitle}>{item.titulo}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                );
                            });
                        })()
                    )}
                </Animated.View>

                {horariosBase.length > 0 && (
                    <View style={styles.footerInfo}>
                        <Text style={styles.footerLabel}>REUNIONES TODOS LOS DOMINGOS:</Text>
                        <Text style={styles.footerText}>{horariosBase.join(' - ')} HS</Text>
                    </View>
                )}
            </ScrollView>
        </View >
    );
};

const styles = StyleSheet.create({
    mainWrapper: { flex: 1, backgroundColor: '#020205' },
    container: { flex: 1 },
    loadingContainer: { flex: 1, backgroundColor: '#020205', justifyContent: 'center', alignItems: 'center' },

    headerOuter: { backgroundColor: 'transparent', paddingHorizontal: 20, paddingBottom: 15 },
    headerRow: { flexDirection: 'row', alignItems: 'center' },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    backText: { color: '#c5ff00', fontSize: 10, fontFamily: 'Montserrat_900Black', letterSpacing: 1.5, marginLeft: 6 },
    headerTitles: { flex: 1, marginLeft: 15 },
    headerLabel: { color: '#c5ff00', fontSize: 13, fontWeight: '900', letterSpacing: 2 },
    headerTitle: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -0.5, marginTop: -2 },

    dayCard: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.10)',
        marginHorizontal: 15,
        marginBottom: 15,
        borderRadius: 24,
        padding: 18,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    dateColumn: {
        width: 65,
        alignItems: 'center',
    },
    eventsContainer: {
        flex: 1,
        marginLeft: 15,
        paddingLeft: 15,
        borderLeftWidth: 1,
        borderLeftColor: 'rgba(255, 255, 255, 0.06)',
    },
    dayCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
        backgroundColor: 'rgba(255,255,255,0.03)'
    },
    dayCircleToday: {
        backgroundColor: '#7bb1d9',
    },
    dayNumText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700'
    },
    dayNumTextToday: {
        color: '#fff',
        fontWeight: '900'
    },
    daySubText: {
        color: '#c5ff00',
        fontSize: 12,
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: 2,
        letterSpacing: 0.5
    },
    yearText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
        textAlign: 'center',
        opacity: 0.7
    },
    eventItem: {
        paddingVertical: 5,
    },
    eventItemDivider: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
        paddingBottom: 12,
        marginBottom: 8,
    },
    eventHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 10
    },
    dotBlue: { backgroundColor: '#7bb1d9' },
    dotGreen: { backgroundColor: '#c5ff00' },
    eventTime: {
        color: '#bbb',
        fontSize: 13,
        fontWeight: '600'
    },
    eventTitle: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '500',
        lineHeight: 22
    },

    emptyState: { padding: 50, alignItems: 'center' },
    emptyText: { color: '#333', marginTop: 15, fontWeight: '700' },

    footerInfo: { marginTop: 40, padding: 40, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', alignItems: 'center' },
    footerLabel: { color: '#ddd', fontSize: 15, fontWeight: '900', letterSpacing: 1.5, marginBottom: 10 },
    footerText: { color: '#c5ff00', fontSize: 18, fontWeight: '700' }
});

export default AgendaScreen;
