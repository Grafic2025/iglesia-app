import { FontAwesome } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface RachaCardProps {
    rachaUsuario: number;
    onRankingPress: () => void;
    onHistorialPress: () => void;
}

const RachaCard: React.FC<RachaCardProps> = React.memo(({ rachaUsuario, onRankingPress, onHistorialPress }) => {
    return (
        <BlurView intensity={25} tint="dark" style={styles.rachaCard}>
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
                    <Text style={styles.rachaSubBtnTxt}>VER TOP 10</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.rachaSubBtn} onPress={onHistorialPress}>
                    <FontAwesome name="list-ul" size={12} color="#c5ff00" />
                    <Text style={styles.rachaSubBtnTxt}>MI HISTORIAL</Text>
                </TouchableOpacity>
            </View>
        </BlurView>
    );
});

const styles = StyleSheet.create({
    rachaCard: {
        backgroundColor: 'rgba(5, 11, 37, 0.4)',
        marginHorizontal: 20,
        paddingVertical: 20,
        paddingHorizontal: 20,
        borderRadius: 32,
        alignItems: 'center',
        marginBottom: 15,
        marginTop: 5,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        overflow: 'hidden'
    },
    rachaTitle: { color: '#c5ff00', fontFamily: 'Montserrat_700Bold', fontSize: 13, letterSpacing: 1, marginBottom: 5 },
    starsContainer: { flexDirection: 'row', marginBottom: 10, gap: 4 },
    dot: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#d1d1d1', position: 'relative' },
    dotActive: { backgroundColor: '#c5ff00', shadowColor: '#c5ff00', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 3, elevation: 3 },
    dotShine: { position: 'absolute', top: 3, left: 3, width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.7)' },
    rachaTextWhite: { color: '#fff', fontSize: 14, fontFamily: 'Montserrat_500Medium', marginBottom: 10, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
    rachaSubBtn: { backgroundColor: 'rgba(255, 255, 255, 0.05)', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 25, marginHorizontal: 6, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    rachaSubBtnTxt: { color: '#fff', fontSize: 11, fontFamily: 'Montserrat_700Bold', marginLeft: 8 }
});

export default RachaCard;
