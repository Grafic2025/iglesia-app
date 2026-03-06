import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import React, { useCallback } from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useApp } from '../../context/AppContext';

const BLUR_HASH = 'LEHV6nWB2yk8pyo0adRj00WBnq%M';

interface ActionCardProps {
    title: string;
    icon: any;
    image?: string | null;
    onPress: () => void;
    isMCI?: boolean;
}

// Memoizado: solo re-renderiza si cambian sus props
const ActionCard: React.FC<ActionCardProps> = React.memo(({ title, icon, image, onPress, isMCI = false }) => (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
        {image ? (
            <View style={styles.cardImage}>
                <ExpoImage
                    source={{ uri: image }}
                    style={styles.cardImageFill}
                    contentFit="cover"
                    placeholder={BLUR_HASH}
                    cachePolicy="memory-disk"
                />
                <View style={styles.cardOverlay}>
                    <View style={styles.iconContainer}>
                        {isMCI
                            ? <MaterialCommunityIcons name={icon} size={32} color="#c5ff00" style={styles.iconGlow} />
                            : <FontAwesome name={icon} size={28} color="#c5ff00" style={styles.iconGlow} />}
                    </View>
                    <Text style={styles.cardTitle}>{title}</Text>
                </View>
            </View>
        ) : (
            <View style={[styles.cardImage, styles.solidCard]}>
                <View style={styles.iconContainer}>
                    {isMCI
                        ? <MaterialCommunityIcons name={icon} size={32} color="#c5ff00" style={styles.iconGlow} />
                        : <FontAwesome name={icon} size={28} color="#c5ff00" style={styles.iconGlow} />}
                </View>
                <Text style={styles.cardTitle}>{title}</Text>
            </View>
        )}
    </TouchableOpacity>
));

interface ActionGridProps {
    navigateTo: (screen: string) => void;
    onBiblePress: () => void;
    isCurrentlyLive?: boolean;
    liveVideoUrl?: string | null;
}

const ActionGrid: React.FC<ActionGridProps> = React.memo(({ navigateTo, onBiblePress, isCurrentlyLive, liveVideoUrl }) => {
    const { homeActions } = useApp();

    // Acciones por defecto (las que tenías antes)
    const defaultActions = [
        { id: '1', titulo: 'Agenda', icono: 'calendar', imagen_url: 'https://images.unsplash.com/photo-1506784365847-bbad939e9335?w=400', pantalla: 'Agenda', es_mci: false },
        { id: '2', titulo: 'Biblia', icono: 'book', imagen_url: 'https://acvxjhecpgmauqqzmjik.supabase.co/storage/v1/object/public/imagenes-iglesia/Biblia.jpg', pantalla: 'https://www.bible.com/es', es_mci: false },
        { id: '3', titulo: 'Quiero Ayudar', icono: 'heart', imagen_url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400', pantalla: 'Quiero Ayudar', es_mci: false },
        { id: '4', titulo: 'Necesito Ayuda', icono: 'hand-heart', imagen_url: 'https://acvxjhecpgmauqqzmjik.supabase.co/storage/v1/object/public/imagenes-iglesia/Ayuda.jpg', pantalla: 'Necesito Ayuda', es_mci: true },
        { id: '5', titulo: 'Quiero Bautizarme', icono: 'tint', imagen_url: 'https://acvxjhecpgmauqqzmjik.supabase.co/storage/v1/object/public/imagenes-iglesia/Bautismos.jpg', pantalla: 'Quiero Bautizarme', es_mci: false },
        { id: '6', titulo: 'Quiero Capacitarme', icono: 'graduation-cap', imagen_url: 'https://acvxjhecpgmauqqzmjik.supabase.co/storage/v1/object/public/imagenes-iglesia/Capacitarme.jpg', pantalla: 'Quiero Capacitarme', es_mci: false },
        { id: '7', titulo: 'Soy Nuevo', icono: 'account-plus', imagen_url: 'https://acvxjhecpgmauqqzmjik.supabase.co/storage/v1/object/public/imagenes-iglesia/Nuevo.jpg', pantalla: 'Soy Nuevo', es_mci: true },
        { id: '8', titulo: 'Necesito Oración', icono: 'hands-pray', imagen_url: 'https://acvxjhecpgmauqqzmjik.supabase.co/storage/v1/object/public/imagenes-iglesia/Oracion.jpg', pantalla: 'Necesito Oración', es_mci: true },
        { id: '9', titulo: 'Sumarme a un Grupo', icono: 'users', imagen_url: 'https://acvxjhecpgmauqqzmjik.supabase.co/storage/v1/object/public/imagenes-iglesia/Grupos.jpg', pantalla: 'Sumarme a un Grupo', es_mci: false },
        { id: '10', titulo: 'Reunión en Vivo', icono: 'youtube-play', imagen_url: 'https://acvxjhecpgmauqqzmjik.supabase.co/storage/v1/object/public/imagenes-iglesia/Vivo.jpg', pantalla: liveVideoUrl || 'https://youtube.com/@iglesiadelsalvador', es_mci: false },
    ];

    const actionsToRender = homeActions && homeActions.length > 0 ? homeActions : defaultActions;

    // Agrupamos de a 2 para las filas
    const rows = [];
    for (let i = 0; i < actionsToRender.length; i += 2) {
        rows.push(actionsToRender.slice(i, i + 2));
    }

    const handlePress = useCallback((screen: string) => {
        if (screen === 'Biblia') {
            onBiblePress();
        } else if (screen === 'Reunión en Vivo') {
            navigateTo(liveVideoUrl || 'https://youtube.com/@iglesiadelsalvador');
        } else if (screen.startsWith('http')) {
            Linking.openURL(screen);
        } else {
            navigateTo(screen);
        }
    }, [navigateTo, onBiblePress, liveVideoUrl]);

    return (
        <View style={styles.grid}>
            {rows.map((row, rowIndex) => (
                <View key={`row-${rowIndex}`} style={styles.row}>
                    {row.map((action: any) => (
                        <ActionCard
                            key={action.id}
                            title={action.titulo}
                            icon={action.icono}
                            image={action.imagen_url}
                            isMCI={action.es_mci}
                            onPress={() => handlePress(action.pantalla)}
                        />
                    ))}
                    {/* Placeholder si la fila tiene uno solo */}
                    {row.length === 1 && <View style={{ width: '48%' }} />}
                </View>
            ))}
        </View>
    );
});

const styles = StyleSheet.create({
    grid: { padding: 10 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    card: { width: '48%', height: 100 },
    cardImage: {
        width: '100%',
        height: '100%',
        borderRadius: 28,
        overflow: 'hidden',
        backgroundColor: '#000',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)'
    },
    cardImageFill: { ...StyleSheet.absoluteFillObject },
    solidCard: { justifyContent: 'center', alignItems: 'center' },
    cardOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center', padding: 10 },
    cardTitle: {
        fontFamily: 'Montserrat_900Black',
        color: '#fff',
        fontSize: 10,
        textAlign: 'center',
        letterSpacing: 1,
        textTransform: 'uppercase',
        textShadowColor: 'rgba(0,0,0,0.85)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 6
    },
    videoTitle: { color: '#fff', fontSize: 13, fontWeight: '700', paddingHorizontal: 5, lineHeight: 18, marginBottom: 5 },
    iconContainer: {
        height: 38,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4
    },
    iconGlow: {
        shadowColor: '#c5ff00',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
        elevation: 6
    }
});

ActionCard.displayName = 'ActionCard';
ActionGrid.displayName = 'ActionGrid';

export default ActionGrid;
