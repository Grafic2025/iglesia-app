import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface AssignListProps {
    plans: any[];
    memberId: string | null;
    onSelectPlan: (idx: number) => void;
    onConfirm?: (idx: number) => void;
    fadeAnim: Animated.Value;
    onRefresh: () => void;
}

const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const AssignList: React.FC<AssignListProps> = ({ plans, memberId, onSelectPlan, onConfirm, fadeAnim, onRefresh }) => {
    if (plans.length === 0) {
        return (
            <View style={styles.emptyState}>
                <View style={styles.emptyIconCircle}>
                    <MaterialCommunityIcons name="calendar-blank-outline" size={48} color="#444" />
                </View>
                <Text style={styles.emptyTitle}>Agenda Despejada</Text>
                <Text style={styles.emptySub}>No tenés servicios asignados próximamente.{"\n"}¡Aprovechá para descansar!</Text>
                <TouchableOpacity onPress={onRefresh} style={styles.refreshListBtn} activeOpacity={0.7}>
                    <Text style={styles.refreshListText}>SINCRONIZAR AGENDA</Text>
                    <MaterialCommunityIcons name="sync" size={14} color="#c5ff00" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <Animated.View style={{ opacity: fadeAnim }}>
            {plans.map((p, idx) => {
                const mAsig = p.equipo_ids?.find((s: any) => s.miembro_id === memberId);
                const isP = !mAsig?.estado || mAsig.estado === 'pendiente';
                const isC = mAsig?.estado === 'confirmado';
                const isR = mAsig?.estado === 'rechazado';
                const date = new Date(p.fecha + 'T12:00:00');

                return (
                    <TouchableOpacity
                        key={p.id}
                        onPress={() => onSelectPlan(idx)}
                        activeOpacity={0.8}
                        style={[
                            styles.assignCard,
                            isP && styles.assignCardPending,
                            isR && { opacity: 0.5 }
                        ]}
                    >
                        <View style={styles.assignHeader}>
                            <View style={styles.assignDateBox}>
                                <Text style={styles.assignDay}>{date.getDate()}</Text>
                                <Text style={styles.assignMonth}>{MONTHS_ES[date.getMonth()].substring(0, 3).toUpperCase()}</Text>
                            </View>
                            <View style={{ flex: 1, marginLeft: 16 }}>
                                <Text style={styles.assignTitle}>
                                    {date.toLocaleDateString('es-AR', { weekday: 'long' }).toUpperCase()}
                                    <Text style={{ color: '#c5ff00' }}> • {p.horario ? p.horario.split(',').map((h: any) => h.trim().replace(/HS/gi, '').trim()).sort((a: any, b: any) => { const [ha, ma] = a.split(':').map(Number); const [hb, mb] = b.split(':').map(Number); return (ha * 60 + (ma || 0)) - (hb * 60 + (mb || 0)); }).join(' y ') : '...'} HS</Text>
                                </Text>
                                <Text style={styles.assignRole}>{mAsig?.rol || 'Servidor'}</Text>
                            </View>
                            <View style={[styles.statusTag, isC && styles.statusTagC, isR && styles.statusTagR, isP && styles.statusTagP]}>
                                {isC && <MaterialCommunityIcons name="check-circle" size={12} color="#000" style={{ marginRight: 4 }} />}
                                {isP && <MaterialCommunityIcons name="alert-circle-outline" size={12} color="#000" style={{ marginRight: 4 }} />}
                                <Text style={[styles.statusTagText, (isC || isP) && { color: '#000' }]}>
                                    {isC ? 'CONFIRMADO' : isR ? 'RECHAZADO' : 'NUEVO'}
                                </Text>
                            </View>
                        </View>
                        {isP && onConfirm && (
                            <TouchableOpacity
                                style={styles.inlineConfirmBtn}
                                onPress={(e) => { e.stopPropagation(); onConfirm(idx); }}
                            >
                                <Text style={styles.inlineConfirmText}>CONFIRMAR AHORA</Text>
                                <MaterialCommunityIcons name="check-bold" size={14} color="#000" />
                            </TouchableOpacity>
                        )}
                    </TouchableOpacity>
                );
            })}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    emptyState: { padding: 40, alignItems: 'center', marginTop: 20 },
    emptyIconCircle: {
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.03)', justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderStyle: 'dashed'
    },
    emptyTitle: { color: '#fff', fontSize: 22, fontFamily: 'Montserrat_900Black', marginTop: 25 },
    emptySub: { color: '#888', fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: 12, lineHeight: 22 },
    refreshListBtn: {
        marginTop: 35, backgroundColor: 'rgba(255, 255, 255, 0.05)', paddingHorizontal: 24, paddingVertical: 14,
        borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', flexDirection: 'row',
        alignItems: 'center', shadowColor: '#c5ff00', shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1, shadowRadius: 10
    },
    refreshListText: { color: '#c5ff00', fontSize: 11, fontFamily: 'Montserrat_700Bold', letterSpacing: 1 },

    assignCard: {
        marginHorizontal: 20, backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 24,
        padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)'
    },
    assignCardPending: {
        borderColor: 'rgba(197, 255, 0, 0.3)',
        backgroundColor: 'rgba(197, 255, 0, 0.02)'
    },
    assignHeader: { flexDirection: 'row', alignItems: 'center' },
    assignDateBox: {
        width: 52, height: 52, borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.05)', justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)'
    },
    assignDay: { color: '#fff', fontSize: 18, fontFamily: 'Montserrat_900Black' },
    assignMonth: { color: '#c5ff00', fontSize: 9, fontFamily: 'Montserrat_700Bold', marginTop: -2 },
    assignTitle: { color: '#999', fontSize: 10, fontFamily: 'Montserrat_700Bold', letterSpacing: 1 },
    assignRole: { color: '#fff', fontSize: 16, fontFamily: 'Montserrat_700Bold', marginTop: 1 },
    statusTag: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, flexDirection: 'row', alignItems: 'center' },
    statusTagC: { backgroundColor: '#c5ff00' },
    statusTagR: { backgroundColor: 'rgba(255, 68, 68, 0.1)' },
    statusTagP: { backgroundColor: '#c5ff00' },
    statusTagText: { fontSize: 9, fontFamily: 'Montserrat_900Black', color: '#ff4444' },
    inlineConfirmBtn: {
        marginTop: 15,
        backgroundColor: '#c5ff00',
        paddingVertical: 12,
        borderRadius: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        shadowColor: '#c5ff00',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4
    },
    inlineConfirmText: { color: '#000', fontSize: 11, fontFamily: 'Montserrat_900Black' }
});

export default AssignList;
