import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface GlobalModalsProps {
    showHistorial: boolean;
    setShowHistorial: (b: boolean) => void;
    asistenciasDetalle: any[];
    showRanking: boolean;
    setShowRanking: (b: boolean) => void;
    rankingTop10: any[];
    showSuccessScan: boolean;
}

export const GlobalModals: React.FC<GlobalModalsProps> = ({
    showHistorial,
    setShowHistorial,
    asistenciasDetalle,
    showRanking,
    setShowRanking,
    rankingTop10,
    showSuccessScan
}) => {
    return (
        <>
            {/* Modal de Historial */}
            <Modal visible={showHistorial} animationType="fade" transparent>
                <BlurView intensity={20} tint="dark" style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View style={styles.titleGroup}>
                                <Text style={styles.modalLabel}>REGISTROS</Text>
                                <Text style={styles.modalTitle}>MI HISTORIAL</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowHistorial(false)} style={styles.closeBtn}>
                                <MaterialCommunityIcons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                            {asistenciasDetalle.length === 0 ? (
                                <View style={styles.emptyBox}>
                                    <MaterialCommunityIcons name="calendar-blank-outline" size={40} color="#222" />
                                    <Text style={styles.emptyText}>Sin asistencias en los últimos 30 días</Text>
                                </View>
                            ) : (
                                asistenciasDetalle.map((a: any, i: number) => (
                                    <View key={i} style={styles.historyCard}>
                                        <View style={styles.dateBadge}>
                                            <Text style={styles.dateDay}>{new Date(a.fecha + 'T12:00:00').getDate()}</Text>
                                            <Text style={styles.dateMonth}>{new Date(a.fecha + 'T12:00:00').toLocaleDateString('es-AR', { month: 'short' }).toUpperCase()}</Text>
                                        </View>
                                        <View style={{ flex: 1, marginLeft: 15 }}>
                                            <Text style={styles.historyDayName}>{new Date(a.fecha + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long' }).toUpperCase()}</Text>
                                            <Text style={styles.historyTime}>{a.horario_reunion}</Text>
                                        </View>
                                        <MaterialCommunityIcons name="check-decagram" size={24} color="#c5ff00" />
                                    </View>
                                ))
                            )}
                        </ScrollView>
                    </View>
                </BlurView>
            </Modal>

            {/* Modal de Ranking */}
            <Modal visible={showRanking} animationType="fade" transparent>
                <BlurView intensity={20} tint="dark" style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View style={styles.titleGroup}>
                                <Text style={styles.modalLabel}>COMUNIDAD</Text>
                                <Text style={styles.modalTitle}>TOP 10 RACHAS</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowRanking(false)} style={styles.closeBtn}>
                                <MaterialCommunityIcons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                            {rankingTop10.map((p, i) => (
                                <View key={i} style={[styles.rankItem, i === 0 && styles.firstPlace]}>
                                    <View style={styles.rankBadge}>
                                        <Text style={[styles.rankPosText, i < 3 && { color: '#000' }]}>{i + 1}</Text>
                                    </View>
                                    <Text style={[styles.rankName, i === 0 && { fontWeight: '900' }]}>{p.nombre} {p.apellido}</Text>
                                    <View style={styles.streakBox}>
                                        <Text style={styles.streakVal}>{p.racha}</Text>
                                        <MaterialCommunityIcons name="fire" size={16} color="#c5ff00" />
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                </BlurView>
            </Modal>

            {/* Overlay de Éxito al escanear */}
            {showSuccessScan && (
                <View style={styles.successOverlay}>
                    <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill}>
                        <View style={styles.successContent}>
                            <View style={styles.successCircle}>
                                <MaterialCommunityIcons name="check-bold" size={70} color="black" />
                            </View>
                            <Text style={styles.successText}>¡PRESENTE!</Text>
                            <Text style={styles.successSub}>Tu asistencia fue registrada con éxito.</Text>
                        </View>
                    </BlurView>
                </View>
            )}
        </>
    );
};

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { backgroundColor: '#050505', width: '100%', maxHeight: '80%', borderRadius: 40, padding: 30, borderWidth: 1, borderColor: '#111' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
    titleGroup: { flex: 1 },
    modalLabel: { color: '#333', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
    modalTitle: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
    closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#111' },

    emptyBox: { alignItems: 'center', paddingVertical: 60 },
    emptyText: { color: '#444', textAlign: 'center', marginTop: 15, fontSize: 13, fontStyle: 'italic' },

    historyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0a0a0a', padding: 15, borderRadius: 24, marginBottom: 12, borderWidth: 1, borderColor: '#111' },
    dateBadge: { width: 50, height: 50, borderRadius: 15, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
    dateDay: { color: '#fff', fontSize: 18, fontWeight: '900' },
    dateMonth: { color: '#c5ff00', fontSize: 10, fontWeight: '900' },
    historyDayName: { color: '#fff', fontSize: 14, fontWeight: '800' },
    historyTime: { color: '#444', fontSize: 12, marginTop: 2 },

    rankItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0a0a0a', padding: 15, borderRadius: 24, marginBottom: 10, borderWidth: 1, borderColor: '#111' },
    firstPlace: { backgroundColor: '#c5ff0010', borderColor: '#c5ff0030' },
    rankBadge: { width: 30, height: 30, borderRadius: 10, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    rankPosText: { color: '#c5ff00', fontWeight: '900', fontSize: 14 },
    rankName: { flex: 1, color: '#fff', fontSize: 15, fontWeight: '700', textTransform: 'capitalize' },
    streakBox: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#050505', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    streakVal: { color: '#fff', fontWeight: '900', fontSize: 13 },

    successOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 9999 },
    successContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    successCircle: {
        width: 160, height: 160, borderRadius: 80, backgroundColor: '#c5ff00',
        justifyContent: 'center', alignItems: 'center', marginBottom: 40,
        shadowColor: '#c5ff00', shadowOpacity: 0.5, shadowRadius: 40, elevation: 20
    },
    successText: { color: '#c5ff00', fontSize: 42, fontWeight: '900', letterSpacing: 4 },
    successSub: { color: '#888', fontSize: 16, marginTop: 15, textAlign: 'center', fontWeight: '600' }
});
