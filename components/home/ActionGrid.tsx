import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
    // useCallback para que los handlers no se recreen en cada render del padre
    const goDonaciones = useCallback(() => navigateTo('Quiero Ayudar'), [navigateTo]);
    const goPedidos = useCallback(() => navigateTo('Necesito Oración'), [navigateTo]);
    const goGrupos = useCallback(() => navigateTo('Sumarme a un Grupo'), [navigateTo]);
    const goStream = useCallback(() => navigateTo(liveVideoUrl || 'https://youtube.com/@iglesiadelsalvador'), [navigateTo, liveVideoUrl]);
    const goAgenda = useCallback(() => navigateTo('Agenda'), [navigateTo]);
    const goNuevo = useCallback(() => navigateTo('Soy Nuevo'), [navigateTo]);
    const goBautismos = useCallback(() => navigateTo('Quiero Bautizarme'), [navigateTo]);
    const goCapacitarme = useCallback(() => navigateTo('Quiero Capacitarme'), [navigateTo]);
    const goAyuda = useCallback(() => navigateTo('Necesito Ayuda'), [navigateTo]);

    return (
        <View style={styles.grid}>
            <View style={styles.row}>
                <ActionCard title="Agenda" icon="calendar" image="https://images.unsplash.com/photo-1506784365847-bbad939e9335?w=400" onPress={goAgenda} />
                <ActionCard title="Biblia" icon="book" image="https://acvxjhecpgmauqqzmjik.supabase.co/storage/v1/object/public/imagenes-iglesia/Biblia.jpg" onPress={onBiblePress} />
            </View>
            <View style={styles.row}>
                <ActionCard title="Quiero Ayudar" icon="heart" image="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400" onPress={goDonaciones} />
                <ActionCard title="Necesito Ayuda" icon="hand-heart" isMCI image="https://acvxjhecpgmauqqzmjik.supabase.co/storage/v1/object/public/imagenes-iglesia/Ayuda.jpg" onPress={goAyuda} />
            </View>
            <View style={styles.row}>
                <ActionCard title="Quiero Bautizarme" icon="tint" image="https://acvxjhecpgmauqqzmjik.supabase.co/storage/v1/object/public/imagenes-iglesia/Bautismos.jpg" onPress={goBautismos} />
                <ActionCard title="Quiero Capacitarme" icon="graduation-cap" image="https://acvxjhecpgmauqqzmjik.supabase.co/storage/v1/object/public/imagenes-iglesia/Capacitarme.jpg" onPress={goCapacitarme} />
            </View>
            <View style={styles.row}>
                <ActionCard title="Soy Nuevo" icon="account-plus" isMCI image="https://acvxjhecpgmauqqzmjik.supabase.co/storage/v1/object/public/imagenes-iglesia/Nuevo.jpg" onPress={goNuevo} />
                <ActionCard title="Necesito Oración" icon="hands-pray" isMCI image="https://acvxjhecpgmauqqzmjik.supabase.co/storage/v1/object/public/imagenes-iglesia/Oracion.jpg" onPress={goPedidos} />
            </View>
            <View style={styles.row}>
                <ActionCard title="Sumarme a un Grupo" icon="users" image="https://acvxjhecpgmauqqzmjik.supabase.co/storage/v1/object/public/imagenes-iglesia/Grupos.jpg" onPress={goGrupos} />
                <ActionCard title="Reunión en Vivo" icon="youtube-play" image="https://acvxjhecpgmauqqzmjik.supabase.co/storage/v1/object/public/imagenes-iglesia/Vivo.jpg" onPress={goStream} />
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    grid: { padding: 10 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    card: { width: '48%', height: 100 },
    cardImage: { width: '100%', height: '100%', borderRadius: 24, overflow: 'hidden', backgroundColor: '#000' },
    cardImageFill: { ...StyleSheet.absoluteFillObject },
    solidCard: { justifyContent: 'center', alignItems: 'center' },
    cardOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 10 },
    cardTitle: {
        fontFamily: 'Montserrat_700Bold',
        color: '#fff',
        fontSize: 13,
        marginTop: 10,
        textAlign: 'center',
        letterSpacing: 0.2,
        textShadowColor: 'rgba(0,0,0,1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3
    },
    iconContainer: {
        height: 40,
        justifyContent: 'center',
        alignItems: 'center'
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
