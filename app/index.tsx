import { Text, View, Button, StyleSheet, Image, Animated, SafeAreaView, Alert, TextInput, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { registerForPushNotifications } from '../lib/registerPushToken';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router'; // 1. Importamos Stack para controlar el encabezado

export default function Index() {
  const [showScanner, setShowScanner] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    verificarRegistro();
  }, []);

  const verificarRegistro = async () => {
    try {
      const userId = await AsyncStorage.getItem('usuario_id');
      if (userId) {
        setIsRegistered(true);
      }
      await registerForPushNotifications();
    } catch (e) {
      console.error("Error al verificar registro", e);
    }
  };

  const manejarRegistro = async () => {
    if (!nombre.trim() || !apellido.trim()) {
      return Alert.alert("Error", "Por favor, completa tu nombre y apellido");
    }

    try {
      const token = await registerForPushNotifications();
      const { data, error } = await supabase
        .from('miembros')
        .insert([{ nombre, apellido, token_notificacion: token }])
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        await AsyncStorage.setItem('usuario_id', data.id.toString());
        setIsRegistered(true);
        Alert.alert("¡Bienvenido!", `Hola ${nombre}, registro completado.`);
      }
    } catch (err: any) {
      Alert.alert("Error al registrar", err.message);
    }
  };

  const handleScan = async (data: string) => {
    if (data === 'ASISTENCIA_IGLESIA') {
      const ahora = new Date();
      const fechaHoy = ahora.toISOString().split('T')[0];
      const hora = ahora.getHours();
      const minutos = ahora.getMinutes();
      
      let bloque = "Extraoficial";
      if (hora >= 7 && hora <= 10) bloque = "09:00";
      else if (hora >= 11 && hora <= 14) bloque = "11:00";
      else if (hora >= 18 && hora <= 22) bloque = "20:00";

      try {
        const userId = await AsyncStorage.getItem('usuario_id');

        const { data: existe, error: errorCheck } = await supabase
          .from('asistencias')
          .select('id')
          .eq('miembro_id', userId)
          .eq('fecha', fechaHoy)
          .maybeSingle();

        if (existe) {
          Alert.alert("Aviso", "Ya registraste tu asistencia hoy.");
          setScanned(false);
          return;
        }

        const { error } = await supabase
          .from('asistencias')
          .insert([{ 
            miembro_id: userId, 
            horario_reunion: bloque, 
            hora_entrada: `${hora}:${minutos < 10 ? '0'+minutos : minutos}`, 
            fecha: fechaHoy 
          }]);

        if (error) throw error;
        Alert.alert("✅ Éxito", `Asistencia marcada: ${bloque}`);
      } catch (err: any) {
        Alert.alert("❌ Error", err.message);
      }
    } else {
      Alert.alert("QR Incorrecto", "Este código no es válido para la asistencia.");
      setScanned(false);
    }
  };

  // --- RENDERIZADO ---

  // Pantalla de Permisos
  if (!permission) return <View style={styles.center} />;
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={{ color: 'white', textAlign: 'center', marginBottom: 20 }}>Necesitamos permiso de cámara</Text>
        <Button title="Dar Permiso" onPress={requestPermission} />
      </View>
    );
  }

  // Pantalla de Registro
  if (!isRegistered) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} /> 
        <Text style={styles.church}>Iglesia del Salvador</Text>
        <TextInput 
          placeholder="Nombre" 
          placeholderTextColor="#999" 
          style={styles.input} 
          value={nombre}
          onChangeText={setNombre} 
        />
        <TextInput 
          placeholder="Apellido" 
          placeholderTextColor="#999" 
          style={styles.input} 
          value={apellido}
          onChangeText={setApellido} 
        />
        <TouchableOpacity style={styles.mainButton} onPress={manejarRegistro}>
          <Text style={styles.buttonText}>Registrarme</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Pantalla de Inicio
  if (!showScanner) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.welcome}>¡Hola, {nombre}!</Text>
        <Text style={styles.church}>Iglesia del Salvador</Text>
        <TouchableOpacity style={styles.mainButton} onPress={() => setShowScanner(true)}>
          <Text style={styles.buttonText}>Escanear QR</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Pantalla de Cámara
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <Stack.Screen options={{ headerShown: false }} />
      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : ({ data }) => {
          setScanned(true);
          handleScan(data);
        }}
      />
      {scanned && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.mainButton, { backgroundColor: '#A8D500' }]} 
            onPress={() => setScanned(false)}
          >
            <Text style={styles.buttonText}>Escanear de nuevo</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.mainButton, { backgroundColor: 'white', marginTop: 10 }]} 
            onPress={() => setShowScanner(false)}
          >
            <Text style={styles.buttonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center', padding: 30 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A1A1A' },
  church: { fontSize: 24, fontWeight: 'bold', color: '#A8D500', marginBottom: 20 },
  welcome: { fontSize: 18, color: 'white', marginBottom: 5 },
  input: { width: '100%', backgroundColor: '#333', color: 'white', padding: 15, borderRadius: 10, marginBottom: 15 },
  mainButton: { backgroundColor: '#A8D500', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30, width: '100%', alignItems: 'center' },
  buttonText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  buttonContainer: { position: 'absolute', bottom: 40, alignSelf: 'center', width: '80%' },
});