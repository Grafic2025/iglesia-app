import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image as ExpoImage } from 'expo-image';
import React from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface PlanDetailProps {
    plan: any;
    canciones: any[];
    memberPhotos: any;
    fadeAnim: Animated.Value;
    onResourcePress: (type: 'youtube' | 'web' | 'lyrics', song: any) => void;
}

const CATEGORY_CONFIG: any = {
    VOCES: { icon: 'microphone', color: '#c5ff00' },
    BANDA: { icon: 'music', color: '#00ccff' },
    AUDIO: { icon: 'tune', color: '#ff6600' },
    MEDIOS: { icon: 'video', color: '#ff0066' },
    GENERAL: { icon: 'account-group', color: '#ffffff' }
};

const getRoleCategory = (rol: string) => {
    const r = rol.toLowerCase();
    if (["soprano", "tenor", "voz", "vocal", "lider", "worship"].some(x => r.includes(x))) return "VOCES";
    if (["guitarra", "bajo", "bateria", "piano", "teclado", "musica"].some(x => r.includes(x))) return "BANDA";
    if (["sonido", "audio", "streaming", "operador"].some(x => r.includes(x))) return "AUDIO";
    if (["proyeccion", "led", "tv", "filma", "foto", "luces", "video"].some(x => r.includes(x))) return "MEDIOS";
    return "GENERAL";
};

const PlanDetail: React.FC<PlanDetailProps> = ({ plan, canciones, memberPhotos, fadeAnim, onResourcePress }) => {
    const groupedTeam = (plan?.equipo_ids || []).reduce((acc: any, m: any) => {
        const roles = (m.rol || 'GENERAL').split(',').map((r: string) => r.trim());
        roles.forEach((ri: string) => {
            const c = getRoleCategory(ri);
            if (!acc[c]) acc[c] = [];
            acc[c].push({ ...m, rol: ri });
        });
        return acc;
    }, {});

    const categoryOrder = ["VOCES", "BANDA", "AUDIO", "MEDIOS", "GENERAL"];

    return (
        <Animated.View style={{ opacity: fadeAnim }}>
            {plan.notas_generales && (
                <View style={styles.notesSection}>
                    <BlurView intensity={10} tint="dark" style={styles.notesCard}>
                        <MaterialCommunityIcons name="format-quote-open" size={32} color="#c5ff00" style={{ opacity: 0.2, position: 'absolute', top: 15, left: 15 }} />
                        <Text style={styles.notesText}>{plan.notas_generales}</Text>
                    </BlurView>
                </View>
            )}

            <Text style={styles.sectionLabel}>EQUIPO DEL DÍA</Text>
            <View style={styles.teamGrid}>
                {categoryOrder.map(cat => {
                    if (!groupedTeam[cat]) return null;
                    const cfg = CATEGORY_CONFIG[cat];
                    return (
                        <View key={cat} style={styles.categoryBlock}>
                            <View style={styles.categoryHeader}>
                                <View style={[styles.catIconBox, { backgroundColor: cfg.color + '10' }]}>
                                    <MaterialCommunityIcons name={cfg.icon} size={14} color={cfg.color} />
                                </View>
                                <Text style={[styles.categoryTitle, { color: cfg.color }]}>{cat}</Text>
                            </View>
                            {groupedTeam[cat].map((v: any, i: number) => (
                                <View key={i} style={styles.memberRow}>
                                    <View style={[styles.photoContainer, { borderColor: v.estado === 'confirmado' ? '#c5ff0040' : '#1a1a1a' }]}>
                                        {memberPhotos[v.miembro_id] ? (
                                            <ExpoImage source={{ uri: memberPhotos[v.miembro_id] }} style={styles.miniAvatar} />
                                        ) : (
                                            <View style={styles.miniAvatarPlaceholder}><MaterialCommunityIcons name="account" size={14} color="#333" /></View>
                                        )}
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 14 }}>
                                        <Text style={styles.memberRole}>{v.rol}</Text>
                                        <Text style={styles.memberName}>{v.nombre || '...'}</Text>
                                    </View>
                                    <View style={[
                                        styles.statusIndicator,
                                        v.estado === 'confirmado' && styles.statusOk,
                                        v.estado === 'rechazado' && styles.statusError
                                    ]} />
                                </View>
                            ))}
                        </View>
                    );
                })}
            </View>

            <Text style={styles.sectionLabel}>CANCIONERO</Text>
            {canciones.length === 0 ? (
                <View style={styles.noSongsBox}>
                    <MaterialCommunityIcons name="music-off" size={32} color="#151515" />
                    <Text style={styles.noSongsText}>Aún no se asignaron canciones.</Text>
                </View>
            ) : (
                canciones.map((song, idx) => (
                    <TouchableOpacity key={song.id} activeOpacity={0.8} style={styles.songItem}>
                        <View style={styles.songNumberBox}>
                            <Text style={styles.songNumberText}>{idx + 1}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.songTitleText}>{song.titulo}</Text>
                            <Text style={styles.songSubText}>
                                {song.artista} • <Text style={{ color: '#c5ff00', fontFamily: 'Montserrat_700Bold' }}>{song.tono}</Text> • {song.bpm} BPM
                            </Text>

                            <View style={styles.resourceRow}>
                                {song.youtube_url && (
                                    <TouchableOpacity onPress={() => onResourcePress('youtube', song)} style={[styles.resBtn, { borderColor: '#ff000030' }]}>
                                        <MaterialCommunityIcons name="youtube" size={18} color="#ff0000" />
                                    </TouchableOpacity>
                                )}
                                {song.pdf_url && (
                                    <TouchableOpacity onPress={() => onResourcePress('web', { ...song, url: song.pdf_url })} style={[styles.resBtn, { borderColor: '#3B82F630' }]}>
                                        <MaterialCommunityIcons name="file-pdf-box" size={18} color="#3B82F6" />
                                    </TouchableOpacity>
                                )}
                                {song.acordes && (
                                    <TouchableOpacity onPress={() => onResourcePress('lyrics', song)} style={[styles.resBtn, { borderColor: '#c5ff0030' }]}>
                                        <MaterialCommunityIcons name="text-box-outline" size={18} color="#c5ff00" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </TouchableOpacity>
                ))
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    notesSection: { paddingHorizontal: 20, marginBottom: 30 },
    notesCard: {
        backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 28,
        padding: 24, borderWidth: 1, borderColor: '#151515',
        overflow: 'hidden'
    },
    notesText: {
        color: '#888', fontSize: 15, fontFamily: 'Inter_400Regular',
        lineHeight: 24, fontStyle: 'italic', paddingLeft: 10
    },
    sectionLabel: {
        color: '#333', fontSize: 11, fontFamily: 'Montserrat_900Black',
        letterSpacing: 2, marginLeft: 22, marginBottom: 15
    },
    teamGrid: { paddingHorizontal: 20, marginBottom: 30 },
    categoryBlock: {
        marginBottom: 20, backgroundColor: '#0a0a0a', borderRadius: 28,
        padding: 20, borderWidth: 1, borderColor: '#151515'
    },
    categoryHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
    catIconBox: {
        width: 32, height: 32, borderRadius: 10,
        justifyContent: 'center', alignItems: 'center'
    },
    categoryTitle: { fontSize: 10, fontFamily: 'Montserrat_900Black', letterSpacing: 1.5 },
    memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
    photoContainer: {
        width: 42, height: 42, borderRadius: 14,
        overflow: 'hidden', backgroundColor: '#111',
        borderWidth: 1.5
    },
    miniAvatar: { width: '100%', height: '100%' },
    miniAvatarPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    memberRole: { color: '#c5ff00', fontSize: 9, fontFamily: 'Montserrat_900Black', textTransform: 'uppercase' },
    memberName: { color: '#fff', fontSize: 16, fontFamily: 'Montserrat_700Bold', marginTop: 1 },
    statusIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#111', marginLeft: 15 },
    statusOk: {
        backgroundColor: '#c5ff00',
        shadowColor: '#c5ff00', shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5, shadowRadius: 5
    },
    statusError: {
        backgroundColor: '#ff4444',
        shadowColor: '#ff4444', shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5, shadowRadius: 5
    },
    songItem: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#0a0a0a',
        marginHorizontal: 20, padding: 18, borderRadius: 28, marginBottom: 14,
        borderWidth: 1, borderColor: '#151515'
    },
    songNumberBox: {
        width: 44, height: 44, borderRadius: 14,
        backgroundColor: '#111', justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: '#1a1a1a', marginRight: 18
    },
    songNumberText: { color: '#c5ff00', fontSize: 18, fontFamily: 'Montserrat_900Black' },
    songTitleText: { color: '#fff', fontSize: 16, fontFamily: 'Montserrat_700Bold' },
    songSubText: { color: '#555', fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 3 },
    resourceRow: { flexDirection: 'row', gap: 12, marginTop: 15 },
    resBtn: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: '#000', justifyContent: 'center', alignItems: 'center',
        borderWidth: 1
    },
    noSongsBox: { padding: 40, alignItems: 'center', backgroundColor: '#050505', borderRadius: 28, marginHorizontal: 20 },
    noSongsText: { color: '#333', fontFamily: 'Montserrat_700Bold', fontSize: 13, marginTop: 12 },
});

export default PlanDetail;
