import React from 'react';
import { ActivityIndicator, Animated, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';

import { LoginView } from '../components/auth/LoginView';
import { GlobalModals } from '../components/modals/GlobalModals';
import { CustomDrawer } from '../components/navigation/CustomDrawer';
import ScannerModal from '../components/ScannerModal';
import VideoModal from '../components/VideoModal';
import { useApp } from '../context/AppContext';
import { useAppContentLogic } from '../hooks/useAppContentLogic';
import { useBiometricAuth } from '../hooks/useBiometricAuth';

export default function RootScreen() {
  const { isLoggedIn, loading, loginWithBiometrics } = useApp();

  // Mantenemos el hook de biometría en la raíz para evitar que se reinicie al navegar
  const biometric = useBiometricAuth();

  const handleBiometricLogin = async () => {
    const success = await biometric.authenticate();
    if (success) {
      await loginWithBiometrics();
    }
  };

  const {
    localNombre,
    setLocalNombre,
    localApellido,
    setLocalApellido,
    toggleMenu,
    slideAnim,
    screenFadeAnim,
    handleLogin,
    renderScreen,
    nombre,
    apellido,
    fotoUrl,
    currentScreen,
    unreadCount,
    esServidor,
    logout,
    deleteAccount,
    showRanking,
    setShowRanking,
    showHistorial,
    setShowHistorial,
    asistenciasDetalle,
    rankingTop10,
    showSuccessScan,
    pickImage,
    navigateTo,
    isMenuOpen,
    modalVideoVisible,
    setModalVideoVisible,
    videoSeleccionado,
    scanning,
    setScanning,
    handleBarCodeScanned,
    refreshData,
  } = useAppContentLogic();

  // 1. Estado de carga inicial
  if (loading) {
    return (
      <View style={styles.centerOuter}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <ActivityIndicator size="large" color="#c5ff00" />
      </View>
    );
  }

  // 2. Renderizado condicional Principal
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" translucent />

      {!isLoggedIn ? (
        /* ============ PANTALLA DE LOGIN ============ */
        <LoginView
          localNombre={localNombre}
          setLocalNombre={setLocalNombre}
          localApellido={localApellido}
          setLocalApellido={setLocalApellido}
          handleLogin={handleLogin}
          handleBiometricLogin={handleBiometricLogin}
          biometricAvailable={biometric.isAvailable}
          biometricType={biometric.biometricType}
          hasSavedSession={biometric.hasSavedSession}
        />
      ) : (
        /* ============ IU PRINCIPAL DE LA APP ============ */
        <>
          <Animated.View
            style={[
              styles.screenContainer,
              { opacity: screenFadeAnim },
            ]}
          >
            {renderScreen()}
          </Animated.View>

          {/* ============ OVERLAY DEL MENÚ ============ */}
          {isMenuOpen && (
            <Animated.View style={styles.overlayContainer}>
              <TouchableOpacity
                style={styles.overlay}
                onPress={toggleMenu}
                activeOpacity={1}
              />
            </Animated.View>
          )}

          {/* ============ MENÚ LATERAL (DRAWER) ============ */}
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
              currentScreen={currentScreen}
              unreadCount={unreadCount}
              esServidor={esServidor}
              toggleMenu={toggleMenu}
              navigateTo={navigateTo}
              pickImage={pickImage}
              logout={logout}
              deleteAccount={deleteAccount}
              refreshData={refreshData}
            />
          </Animated.View>

          {/* ============ MODALES GLOBALES ============ */}
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
            onClose={() => setModalVideoVisible(false)}
          />

          {scanning && (
            <ScannerModal
              onClose={() => setScanning(false)}
              onBarCodeScanned={handleBarCodeScanned}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerOuter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
