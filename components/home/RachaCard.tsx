import { FontAwesome } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface RachaCardProps {
    rachaUsuario: number;
    onRankingPress: () => void;
    onHistorialPress: () => void;
}

const RachaCard: React.FC<RachaCardProps> = ({ rachaUsuario, onRankingPress, onHistorialPress }) => {
    return (
        <View style={styles.rachaCard}>
            <Text style={styles.rachaTitle}>🔥 TU RACHA DE ASISTENCIA</Text>
            <View style={styles.starsContainer}>
                {[...Array(10)].map((_, i) => (
                    <View key={i} style={[styles.dot, i < rachaUsuario && styles.dotActive]}>
                        <View style={styles.dotShine} />
                    </View>
                ))}
            </View>
            <Text style={styles.rachaTextWhite}>Tu racha: {rachaUsuario} asistencias</Text>
            <View style={{ flexDirection: 'row', marginTop: 15 }}>
                <TouchableOpacity style={styles.rachaSubBtn} onPress={onRankingPress}>
                    <FontAwesome name="trophy" size={14} color="#c5ff00" />
                    <Text style={styles.rachaSubBtnTxt}> VER TOP 10</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.rachaSubBtn} onPress={onHistorialPress}>
                    <FontAwesome name="list-ul" size={12} color="#c5ff00" />
                    <Text style={styles.rachaSubBtnTxt}> MI HISTORIAL</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    rachaCard: { backgroundColor: '#0d0d0d', marginHorizontal: 20, paddingVertical: 10, paddingHorizontal: 15, borderRadius: 28, alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: '#1a1a1a' },
    rachaTitle: { color: '#c5ff00', fontFamily: 'Montserrat_700Bold', fontSize: 13, letterSpacing: 1, marginBottom: 15 },
    starsContainer: { flexDirection: 'row', marginBottom: 15, gap: 4 },
    dot: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#d1d1d1', position: 'relative' },
    dotActive: { backgroundColor: '#c5ff00', shadowColor: '#c5ff00', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 3, elevation: 3 },
    dotShine: { position: 'absolute', top: 3, left: 3, width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.7)' },
    rachaTextWhite: { color: '#fff', fontSize: 14, fontFamily: 'Montserrat_500Medium', marginBottom: 10 },
    rachaSubBtn: { backgroundColor: '#1a1a1a', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 25, marginHorizontal: 6, flexDirection: 'row', alignItems: 'center' },
    rachaSubBtnTxt: { color: '#fff', fontSize: 11, fontFamily: 'Montserrat_700Bold', marginLeft: 8 }
});

export default RachaCard;
