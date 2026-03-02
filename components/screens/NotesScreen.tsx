import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import React, { useEffect, useState } from 'react';
import { Alert, Animated, Modal, RefreshControl, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useApp } from '../../context/AppContext';

interface Nota {
    id: string;
    titulo: string;
    contenido: string;
    fecha: string;
}

const NotesScreen = ({ navigateTo }: any) => {
    const { memberId, refreshData } = useApp();
    const [notas, setNotas] = useState<Nota[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingNota, setEditingNota] = useState<Nota | null>(null);
    const [tempTitulo, setTempTitulo] = useState('');
    const [tempContenido, setTempContenido] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const fadeAnim = useState(new Animated.Value(0))[0];

    const cargarNotas = React.useCallback(async () => {
        try {
            const saved = await AsyncStorage.getItem(`notas_${memberId || 'invitado'}`);
            if (saved) {
                setNotas(JSON.parse(saved));
            }
            Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
        } catch (e) { console.error(e); }
    }, [memberId, fadeAnim]);

    useEffect(() => {
        cargarNotas();
    }, [cargarNotas]);

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([cargarNotas(), refreshData()]);
        setRefreshing(false);
    };

    const guardarNotas = async (nuevasNotas: Nota[]) => {
        try {
            await AsyncStorage.setItem(`notas_${memberId || 'invitado'}`, JSON.stringify(nuevasNotas));
            setNotas(nuevasNotas);
        } catch (e) { console.error(e); }
    };

    const handleSave = () => {
        if (!tempTitulo.trim()) return Alert.alert("Falta título", "Por favor ponle un título a tu nota.");

        let nuevasNotas;
        if (editingNota) {
            nuevasNotas = notas.map(n => n.id === editingNota.id ? { ...n, titulo: tempTitulo, contenido: tempContenido } : n);
        } else {
            const nueva: Nota = {
                id: Date.now().toString(),
                titulo: tempTitulo,
                contenido: tempContenido,
                fecha: new Date().toLocaleDateString('es-AR')
            };
            nuevasNotas = [nueva, ...notas];
        }

        guardarNotas(nuevasNotas);
        setModalVisible(false);
        setEditingNota(null);
        setTempTitulo('');
        setTempContenido('');
    };

    const deleteNota = (id: string) => {
        Alert.alert("¿Eliminar nota?", "Esta acción no se puede deshacer.", [
            { text: "Cancelar", style: "cancel" },
            { text: "Eliminar", style: "destructive", onPress: () => guardarNotas(notas.filter(n => n.id !== id)) }
        ]);
    };

    const shareNota = async (nota: Nota) => {
        try {
            await Share.share({
                message: `📌 ${nota.titulo}\n\n${nota.contenido}\n\nGuardado en App Iglesia del Salvador`,
                title: nota.titulo
            });
        } catch (e) { console.error(e); }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigateTo('Inicio')} style={styles.backButton}>
                    <MaterialCommunityIcons name="chevron-left" size={28} color="#c5ff00" />
                    <Text style={styles.backText}>VOLVER</Text>
                </TouchableOpacity>
                <View style={styles.headerTitles}>
                    <Text style={styles.headerLabel}>DIARIO ESPIRITUAL</Text>
                    <Text style={styles.headerTitle}>MIS NOTAS</Text>
                </View>
                <TouchableOpacity
                    onPress={() => { setEditingNota(null); setTempTitulo(''); setTempContenido(''); setModalVisible(true); }}
                    style={styles.addBtn}
                >
                    <MaterialCommunityIcons name="plus" size={24} color="#000" />
                </TouchableOpacity>
            </View>

            <Animated.FlatList
                data={notas}
                style={{ opacity: fadeAnim }}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#c5ff00" />}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconBox}>
                            <MaterialCommunityIcons name="notebook-outline" size={60} color="#222" />
                        </View>
                        <Text style={styles.emptyTitle}>Sin apuntes todavía</Text>
                        <Text style={styles.emptyText}>Registrá tus reflexiones y versículos favoritos de cada servicio.</Text>
                        <TouchableOpacity style={styles.createFirstBtn} onPress={() => setModalVisible(true)}>
                            <Text style={styles.createFirstBtnText}>CREAR MI PRIMERA NOTA</Text>
                        </TouchableOpacity>
                    </View>
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.notaCard}
                        onPress={() => {
                            setEditingNota(item);
                            setTempTitulo(item.titulo);
                            setTempContenido(item.contenido);
                            setModalVisible(true);
                        }}
                        activeOpacity={0.9}
                    >
                        <BlurView intensity={5} tint="light" style={styles.notaCardBlur}>
                            <View style={styles.notaHeader}>
                                <Text style={styles.notaDate}>{item.fecha}</Text>
                                <View style={styles.notaActions}>
                                    <TouchableOpacity onPress={() => shareNota(item)} style={styles.actionIcon}>
                                        <MaterialCommunityIcons name="export-variant" size={18} color="#444" />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => deleteNota(item.id)} style={styles.actionIcon}>
                                        <MaterialCommunityIcons name="trash-can-outline" size={18} color="#ff4444" opacity={0.6} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <Text style={styles.notaTitle} numberOfLines={1}>{item.titulo}</Text>
                            <Text style={styles.notaContent} numberOfLines={3}>{item.contenido}</Text>
                        </BlurView>
                    </TouchableOpacity>
                )}
            />

            <Modal visible={modalVisible} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCancel}>
                                <Text style={styles.modalCancelText}>CANCELAR</Text>
                            </TouchableOpacity>
                            <View style={styles.modalHeaderCenter}>
                                <Text style={styles.modalTitleLabel}>{editingNota ? 'EDITANDO' : 'NUEVA'}</Text>
                                <Text style={styles.modalTitleMain}>NOTA</Text>
                            </View>
                            <TouchableOpacity onPress={handleSave} style={styles.modalSave}>
                                <Text style={styles.modalSaveText}>GUARDAR</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.editorArea} showsVerticalScrollIndicator={false}>
                            <TextInput
                                placeholder="Título del mensaje..."
                                placeholderTextColor="#333"
                                style={styles.editorTitleInput}
                                value={tempTitulo}
                                onChangeText={setTempTitulo}
                                selectionColor="#c5ff00"
                            />
                            <View style={styles.editorDivider} />
                            <TextInput
                                placeholder="Empezá a escribir aquí..."
                                placeholderTextColor="#222"
                                style={styles.editorContentInput}
                                multiline
                                textAlignVertical="top"
                                value={tempContenido}
                                onChangeText={setTempContenido}
                                selectionColor="#c5ff00"
                                autoFocus
                            />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
    backButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 22, borderWidth: 1, borderColor: '#333' },
    backText: { color: '#c5ff00', fontSize: 11, fontWeight: '900', letterSpacing: 1, marginLeft: 5 },
    headerTitles: { flex: 1, marginLeft: 15 },
    headerLabel: { color: '#c5ff00', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
    headerTitle: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
    addBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#c5ff00', justifyContent: 'center', alignItems: 'center' },

    listContainer: { padding: 20, paddingBottom: 100 },
    notaCard: { borderRadius: 24, overflow: 'hidden', marginBottom: 15, backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: '#111' },
    notaCardBlur: { padding: 20 },
    notaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    notaDate: { color: '#c5ff00', fontSize: 10, fontWeight: '900' },
    notaActions: { flexDirection: 'row', gap: 10 },
    actionIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.03)', justifyContent: 'center', alignItems: 'center' },
    notaTitle: { color: '#fff', fontSize: 18, fontWeight: '900', marginBottom: 10 },
    notaContent: { color: '#666', fontSize: 14, lineHeight: 22 },

    emptyState: { alignItems: 'center', marginTop: 100, paddingHorizontal: 30 },
    emptyIconBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#222' },
    emptyTitle: { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 25 },
    emptyText: { color: '#444', fontSize: 13, textAlign: 'center', marginTop: 10, lineHeight: 20 },
    createFirstBtn: { backgroundColor: '#c5ff00', paddingHorizontal: 25, paddingVertical: 18, borderRadius: 20, marginTop: 40 },
    createFirstBtnText: { color: '#000', fontWeight: '900', fontSize: 12, letterSpacing: 1 },

    modalOverlay: { flex: 1 },
    modalContent: { flex: 1 },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
    modalHeaderCenter: { alignItems: 'center' },
    modalTitleLabel: { color: '#444', fontSize: 9, fontWeight: '900' },
    modalTitleMain: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
    modalCancel: { flex: 1 },
    modalCancelText: { color: '#ff4444', fontSize: 11, fontWeight: '900' },
    modalSave: { flex: 1, alignItems: 'flex-end' },
    modalSaveText: { color: '#c5ff00', fontSize: 11, fontWeight: '900' },

    editorArea: { flex: 1, paddingHorizontal: 25 },
    editorTitleInput: { color: '#fff', fontSize: 28, fontWeight: '900', marginBottom: 20, letterSpacing: -0.5 },
    editorDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 25 },
    editorContentInput: { color: '#aaa', fontSize: 18, lineHeight: 28, flex: 1 }
});

export default NotesScreen;
