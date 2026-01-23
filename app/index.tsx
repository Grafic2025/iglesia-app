import { Text, View, Button, StyleSheet, Image, Animated, SafeAreaView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { registerForPushNotifications } from '../lib/registerPushToken';

export default function Index() {
  const [showScanner, setShowScanner] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // 🔔 Registrar push token al abrir la app
  useEffect(() => {
    registerForPushNotifications();
  }, []);

  if (!permission) return <View style={{ flex: 1 }} />;
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text>Necesitamos acceso a la cámara</Text>
        <Button title="Permitir cámara" onPress={requestPermission} />
      </View>
    );
  }

  const startScanner = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      setShowScanner(true);
    });
  };

  // Pantalla de bienvenida
  if (!showScanner) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1A1A1A' }}>
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
          <Image
            source={require('../assets/images/Logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.welcome}>Bienvenidos a</Text>
          <Text style={styles.church}>Iglesia del Salvador</Text>
          <Image
            source={require('../assets/images/Biblia.png')}
            style={styles.cafe}
            resizeMode="cover"
          />
          <Button title="Ir al escáner" onPress={startScanner} />
        </Animated.View>
      </SafeAreaView>
    );
  }

  // Pantalla de escaneo
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={
            scanned
              ? undefined
              : async ({ data }) => {
                  setScanned(true);
                  const { error } = await supabase.from('scans').insert({ qr_value: data });
                  if (error) alert('❌ Error al guardar el QR');
                  else alert('✅ QR guardado correctamente');
                }
          }
        />
        {scanned && (
          <View style={styles.button}>
            <Button title="Escanear de nuevo" onPress={() => setScanned(false)} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  button: { position: 'absolute', bottom: 40, alignSelf: 'center' },
  logo: { width: 120, height: 120, marginBottom: 16 },
  welcome: { fontSize: 18, color: 'white' },
  church: { fontSize: 22, fontWeight: 'bold', color: '#A8D500', marginBottom: 20 },
  cafe: { width: '100%', height: 200, borderRadius: 12, marginBottom: 20 },
});
