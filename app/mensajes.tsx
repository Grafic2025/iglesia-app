import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

export default function MensajesScreen() {
    const [recursos, setRecursos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [playingId, setPlayingId] = useState<string | null>(null);
    const [sound, setSound] = useState<Audio.Sound | null>(null);

    useEffect(() => {
        fetchRecursos();
        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [sound]);

    const fetchRecursos = async () => {
        try {
            const { data, error } = await supabase
                .from('recursos')
                .select('*')
                .order('fecha', { ascending: false });

            if (data) setRecursos(data);
            if (error) console.error("Error fetching recursos:", error);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    async function playSound(uri: string, id: string) {
        try {
            if (playingId === id) {
                await sound?.pauseAsync();
                setPlayingId(null);
                return;
            }

            if (sound) {
                await sound.unloadAsync();
            }

            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri },
                { shouldPlay: true }
            );
            setSound(newSound);
            setPlayingId(id);

            newSound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                    setPlayingId(null);
                }
            });
        } catch (e) {
            console.error("Error playing sound:", e);
            Alert.alert("Error", "No se pudo reproducir el audio.");
        }
    }

    if (loading) {
        return <View style={styles.center}><ActivityIndicator color="#A8D500" /></View>;
    }

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#1E1E1E', '#121212']} style={styles.header}>
                <Text style={styles.title}>Mensajes y Podcasts</Text>
                <Text style={styles.subtitle}>Escucha la palabra en cualquier momento</Text>
            </LinearGradient>

            <FlatList
                data={recursos}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => playSound(item.audio_url, item.id)}
                    >
                        <Image
                            source={{ uri: item.portada_url || 'https://via.placeholder.com/150' }}
                            style={styles.cover}
                        />
                        <View style={styles.info}>
                            <Text style={styles.itemName}>{item.titulo}</Text>
                            <Text style={styles.itemDate}>{new Date(item.fecha).toLocaleDateString('es-AR')}</Text>
                            <View style={styles.playRow}>
                                <Ionicons
                                    name={playingId === item.id ? "pause-circle" : "play-circle"}
                                    size={24}
                                    color="#c5ff00"
                                />
                                <Text style={styles.playText}>{playingId === item.id ? "Pausar" : "Escuchar ahora"}</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#121212' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
    header: { padding: 20, paddingTop: 50, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    subtitle: { color: '#aaa', fontSize: 12, marginTop: 5 },
    list: { padding: 15 },
    card: { backgroundColor: '#1E1E1E', borderRadius: 15, marginBottom: 12, flexDirection: 'row', overflow: 'hidden', borderWidth: 1, borderColor: '#333' },
    cover: { width: 80, height: 80 },
    info: { flex: 1, padding: 10, justifyContent: 'center' },
    itemName: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
    itemDate: { color: '#888', fontSize: 11, marginTop: 2 },
    playRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 5 },
    playText: { color: '#c5ff00', fontSize: 11, fontWeight: 'bold' }
});
