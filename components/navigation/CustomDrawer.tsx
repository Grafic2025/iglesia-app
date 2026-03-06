import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Animated, Dimensions, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

interface CustomDrawerProps {
    slideAnim: Animated.Value;
    nombre: string;
    apellido: string;
    fotoUrl: string | null;
    currentScreen: string;
    unreadCount: number;
    esServidor: boolean;
    toggleMenu: () => void;
    navigateTo: (screen: string) => void;
    pickImage: () => void;
    logout: () => void;
    refreshData: () => Promise<void>;
}

/**
 * CustomDrawer mejorado con estética premium y BlurView.
 */
export const CustomDrawer: React.FC<CustomDrawerProps> = ({
    slideAnim,
    nombre,
    apellido,
    fotoUrl,
    currentScreen,
    unreadCount,
    esServidor,
    toggleMenu,
    navigateTo,
    pickImage,
    logout,
    refreshData
}) => {
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        await refreshData();
        setRefreshing(false);
    };
    return (
        <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
            <LinearGradient colors={['#010A2A', '#020205']} style={StyleSheet.absoluteFill} />

            {/* Mesh gradient effect - Top Left Blue */}
            <View style={{ position: 'absolute', top: -100, left: -50, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(37, 99, 235, 0.12)' }} />

            {/* Mesh gradient effect - Bottom Right Purple */}
            <View style={{ position: 'absolute', bottom: -100, right: -50, width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(147, 51, 234, 0.08)' }} />


            <ScrollView
                style={styles.contentContainer}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#c5ff00" />}
                showsVerticalScrollIndicator={false}
            >
                {/* Header / Usuario */}
                <View style={styles.drawerHeader}>
                    <TouchableOpacity onPress={pickImage} activeOpacity={0.8} style={styles.photoContainer}>
                        {fotoUrl ? (
                            <ExpoImage source={{ uri: fotoUrl }} style={styles.drawerPhoto} />
                        ) : (
                            <View style={styles.drawerPhotoPlaceholder}>
                                <FontAwesome name="user" size={24} color="#666" />
                            </View>
                        )}
                        <View style={styles.editBadge}>
                            <MaterialCommunityIcons name="pencil" size={10} color="#000" />
                        </View>
                    </TouchableOpacity>

                    <View style={styles.headerTextContainer}>
                        <Text style={styles.userNameText} numberOfLines={1}>{nombre}</Text>
                        <Text style={styles.userSurNameText} numberOfLines={1}>{apellido}</Text>
                    </View>

                    <TouchableOpacity onPress={toggleMenu} style={styles.closeButton}>
                        <MaterialCommunityIcons name="chevron-left" size={28} color="#c5ff00" />
                        <Text style={styles.closeText}>VOLVER</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.divider} />

                {/* Lista de Navegación */}
                <View style={styles.menuItemsContainer}>
                    <DrawerItem
                        label="Inicio"
                        icon="home"
                        active={currentScreen === 'Inicio'}
                        onPress={() => navigateTo('Inicio')}
                    />
                    <DrawerItem
                        label="Mi Perfil"
                        icon="account"
                        active={currentScreen === 'Mi Perfil'}
                        onPress={() => navigateTo('Mi Perfil')}
                        isMCI
                    />

                    <View style={styles.notifWrapper}>
                        <DrawerItem
                            label="Notificaciones"
                            icon="bell"
                            active={currentScreen === 'Notificaciones'}
                            onPress={() => navigateTo('Notificaciones')}
                        />
                        {unreadCount > 0 && (
                            <View style={styles.drawerBadge}>
                                <Text style={styles.drawerBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                            </View>
                        )}
                    </View>

                    <DrawerItem
                        label="Agenda"
                        icon="calendar-month"
                        active={currentScreen === 'Agenda'}
                        onPress={() => navigateTo('Agenda')}
                        isMCI
                    />
                    <DrawerItem
                        label="Mensajes"
                        icon="play-circle"
                        active={currentScreen === 'Mensajes'}
                        onPress={() => navigateTo('Mensajes')}
                    />
                    <DrawerItem
                        label="Mis Notas"
                        icon="notebook-edit"
                        active={currentScreen === 'Mis Notas'}
                        onPress={() => navigateTo('Mis Notas')}
                        isMCI
                    />

                    <View style={styles.sectionDivider}>
                        <Text style={styles.sectionLabel}>COMUNIDAD</Text>
                    </View>

                    {esServidor && (
                        <DrawerItem
                            label="Servidores"
                            icon="account-group"
                            active={currentScreen === 'Servidores'}
                            onPress={() => navigateTo('Servidores')}
                            isMCI
                        />
                    )}

                    <DrawerItem
                        label="Contacto"
                        icon="phone"
                        active={currentScreen === 'Contacto'}
                        onPress={() => navigateTo('Contacto')}
                    />
                    <DrawerItem
                        label="Nosotros"
                        icon="information"
                        active={currentScreen === 'Nosotros'}
                        onPress={() => navigateTo('Nosotros')}
                        isMCI
                    />
                </View>

                {/* Pie de Menú / Logout */}
                <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                    <View style={styles.logoutGlass}>
                        <MaterialCommunityIcons name="logout" size={20} color="#ff4444" />
                        <Text style={styles.logoutText}>CERRAR SESIÓN</Text>
                    </View>
                </TouchableOpacity>
            </ScrollView>
        </Animated.View>
    );
};

const DrawerItem = ({ label, icon, active, onPress, isMCI = false }: any) => (
    <TouchableOpacity
        style={[styles.drawerItem, active && styles.drawerItemActive]}
        onPress={onPress}
        activeOpacity={0.7}
    >
        <View style={[styles.iconBox, active && styles.iconBoxActive]}>
            {isMCI ? (
                <MaterialCommunityIcons name={icon} size={20} color={active ? 'black' : '#fff'} />
            ) : (
                <FontAwesome name={icon} size={18} color={active ? 'black' : '#fff'} />
            )}
        </View>
        <Text style={[styles.drawerLabel, { color: active ? '#c5ff00' : '#fff' }]}>{label}</Text>
        {active && <View style={styles.activeDot} />}
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    drawer: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: width * 0.8,
        backgroundColor: '#010A2A',
        zIndex: 1000,
        overflow: 'hidden',
        borderRightWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)'
    },
    contentContainer: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 140,
        flexGrow: 1
    },
    drawerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20
    },
    photoContainer: {
        position: 'relative'
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#c5ff00',
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#000'
    },
    headerTextContainer: {
        flex: 1,
        marginLeft: 15
    },
    userNameText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '900',
        letterSpacing: -0.5
    },
    userSurNameText: {
        color: '#c5ff00',
        opacity: 0.95
    },
    drawerPhoto: {
        width: 60,
        height: 60,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)'
    },
    drawerPhotoPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 20,
        backgroundColor: '#1a1a1a',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333'
    },
    closeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 5
    },
    closeText: {
        color: '#c5ff00',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginVertical: 20
    },
    menuItemsContainer: {
        flex: 1
    },
    drawerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 5,
        marginBottom: 5
    },
    drawerItemActive: {
        // backgroundColor: 'rgba(197,255,0,0.05)',
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15
    },
    iconBoxActive: {
        backgroundColor: '#c5ff00'
    },
    drawerLabel: {
        fontFamily: 'Montserrat_700Bold',
        color: '#fff',
        fontSize: 15
    },
    activeDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#c5ff00',
        marginLeft: 'auto'
    },
    sectionDivider: {
        marginTop: 25,
        marginBottom: 10,
        paddingHorizontal: 10
    },
    sectionLabel: {
        fontFamily: 'Montserrat_900Black',
        color: '#c5ff00',
        fontSize: 10,
        letterSpacing: 2,
        opacity: 0.9
    },
    notifWrapper: {
        position: 'relative'
    },
    drawerBadge: {
        position: 'absolute',
        right: 15,
        top: 15,
        backgroundColor: '#ff0000',
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center'
    },
    drawerBadgeText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: '900',
        paddingHorizontal: 4
    },
    logoutButton: {
        marginTop: 'auto',
        marginBottom: 60,
        borderRadius: 20,
        overflow: 'hidden'
    },
    logoutGlass: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18
    },
    logoutText: {
        fontFamily: 'Montserrat_900Black',
        color: '#ff4444',
        fontSize: 13,
        marginLeft: 12,
        letterSpacing: 2
    },
});
