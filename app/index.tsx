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
    // Obtenemos el token de forma silenciosa
    const token = await registerForPushNotifications();

    // Insertamos al miembro CON su token en la columna token_notificacion
    const { data, error } = await supabase
      .from('miembros')
      .insert([{ 
        nombre, 
        apellido, 
        token_notificacion: token 
      }])
      .select()
      .single();

    if (error) throw error;

    if (data) {
      await AsyncStorage.setItem('usuario_id', data.id.toString());
      setIsRegistered(true);
      // Solo mostramos el cartel de bienvenida, NO el del token
      Alert.alert("¡Bienvenido!", `Hola ${nombre}, ya puedes registrar tu asistencia.`);
    }
  } catch (err: any) {
    Alert.alert("Error", "No se pudo completar el registro.");
  }
};

 const handleScan = async (data: string) => {
  if (data === 'ASISTENCIA_IGLESIA') {
    // 1. OBTENER HORA REAL ARGENTINA
    const ahoraLocal = new Date();
    // Forzamos la hora de Argentina usando el string de locación
    const horaArgentina = JSON.parse(
      JSON.stringify(ahoraLocal.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }))
    );
    const dateArg = new Date(horaArgentina);
    
    const hora = dateArg.getHours();
    const minutos = dateArg.getMinutes();
    const fechaHoy = dateArg.toISOString().split('T')[0];
    
    // 2. DETERMINAR EL BLOQUE (Rangos amplios para evitar el "Extraoficial")
    let bloque = "Extraoficial";
    
    // Mañana: de 08:00 a 10:00 -> Bloque 09:00
    if (hora >= 8 && hora < 10) {
      bloque = "09:00";
    } 
    // Mediodía: de 10:00 a 12:00 -> Bloque 11:00
    else if (hora >= 11 && hora <= 12) {
      bloque = "11:00";
    } 
    // Noche: de 19:00 a 21:00 -> Bloque 20:00
    else if (hora >= 19 && hora < 21) {
      bloque = "20:00";
    }

    // 3. GUARDAR EN SUPABASE
    try {
      const userId = await AsyncStorage.getItem('usuario_id');
      const { error } = await supabase.from('asistencias').insert([{
        miembro_id: userId,
        horario_reunion: bloque, // Ahora coincidirá con el Admin
        fecha: fechaHoy,
        hora_entrada: `${hora.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`
      }]);

      if (error) throw error;
      Alert.alert("¡Éxito!", `Asistencia registrada para las ${bloque}`);
      setScanned(true);
    } catch (err) {
      Alert.alert("Error", "No se pudo registrar la asistencia.");
    }
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