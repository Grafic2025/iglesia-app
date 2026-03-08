import * as Haptics from 'expo-haptics';
import { Stack, usePathname, useRouter } from 'expo-router';
import React from 'react';
import { Animated, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';

import { GlobalModals } from '../../components/modals/GlobalModals';
import { CustomDrawer } from '../../components/navigation/CustomDrawer';
import ScannerModal from '../../components/ScannerModal';
import VideoModal from '../../components/VideoModal';
import { AppContentProvider, useAppContent } from '../../context/AppContentContext';
import { useApp } from '../../context/AppContext';

export default function AppLayoutWrapper() {
    return (
        <AppContentProvider>
            <AppLayout />
        </AppContentProvider>
    );
}

function AppLayout() {
    const { nombre, apellido, fotoUrl, unreadCount, esServidor, logout } = useApp();
    const router = useRouter();
    const pathname = usePathname();



    const {
        toggleMenu,
        slideAnim,
        showRanking,
        setShowRanking,
        showHistorial,
        setShowHistorial,
        asistenciasDetalle,
        rankingTop10,
        showSuccessScan,
        pickImage,
        isMenuOpen,
        modalVideoVisible,
        setModalVideoVisible,
        videoSeleccionado,
        scanning,
        setScanning,
        handleBarCodeScanned,
        refreshData,
    } = useAppContent();

    const navigateTo = (screenName: string) => {
        toggleMenu();
        switch (screenName) {
            case 'Inicio': router.replace('/(app)'); break;
            case 'Mi Perfil': router.replace('/(app)/perfil'); break;
            case 'Agenda': router.replace('/(app)/agenda'); break;
            case 'Necesito Oración': router.replace('/(app)/oracion'); break;
            case 'Notificaciones': router.replace('/(app)/notificaciones'); break;
            case 'Mis Notas': router.replace('/(app)/notas'); break;
            case 'Mensajes': router.replace('/(app)/mensajes'); break;
            case 'NewsDetail': router.replace('/(app)/news-detail'); break;
            case 'SerieEsenciales': router.replace('/(app)/serie'); break;
            case 'Videos': router.replace('/(app)/videos'); break;
            case 'Servidores': router.replace('/(app)/servidores'); break;
            case 'Contacto': router.replace('/(app)/contacto'); break;
            default: router.replace('/(app)');
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            <Animated.View style={styles.screenContainer}>
                <Stack screenOptions={{ headerShown: false, animation: 'none' }} />
            </Animated.View>

            {isMenuOpen && (
                <Animated.View style={styles.overlayContainer}>
                    <TouchableOpacity
                        style={styles.overlay}
                        onPress={toggleMenu}
                        activeOpacity={1}
                    />
                </Animated.View>
            )}

            <Animated.View
                style={[
                    styles.drawer,
                    { transform: [{ translateX: slideAnim }] },
                ]}
            >
                <CustomDrawer
                    slideAnim={slideAnim}
                    nombre={nombre}
                    apellido={apellido}
                    fotoUrl={fotoUrl}
                    unreadCount={unreadCount}
                    esServidor={esServidor}
                    toggleMenu={toggleMenu}
                    navigateTo={navigateTo}
                    pickImage={pickImage}
                    logout={logout}
                    refreshData={refreshData}
                />
            </Animated.View>

            <GlobalModals
                showHistorial={showHistorial}
                setShowHistorial={setShowHistorial}
                asistenciasDetalle={asistenciasDetalle}
                showRanking={showRanking}
                setShowRanking={setShowRanking}
                rankingTop10={rankingTop10}
                showSuccessScan={showSuccessScan}
            />

            <VideoModal
                visible={modalVideoVisible}
                video={videoSeleccionado}
                onClose={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { }); setModalVideoVisible(false); }}
            />

            {scanning && (
                <ScannerModal
                    onClose={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { }); setScanning(false); }}
                    onBarCodeScanned={handleBarCodeScanned}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    screenContainer: {
        flex: 1,
    },
    overlayContainer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 99,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    drawer: {
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        zIndex: 100,
    },
});
