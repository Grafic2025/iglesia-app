import { Text, View, StyleSheet, SafeAreaView, Alert, TextInput, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { registerForPushNotifications } from '../lib/registerPushToken';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';

// Datos extraídos de iglesiadelsalvador.com.ar
const INFO_IGLESIA = {
  direccion: "Constituyentes 950, Morón",
  lema: "Un lugar para encontrarse con Dios",
  web: "https://www.iglesiadelsalvador.com.ar",
  youtube: "https://www.youtube.com/@IglesiadelSalvador"
};

export default function Index() {
  const [showScanner, setShowScanner] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');

  useEffect(() => {
    verificarRegistro();
  }, []);

  const verificarRegistro = async () => {
    try {
      const userId = await AsyncStorage.getItem('usuario_id');
      const userNombre = await AsyncStorage.getItem('usuario_nombre');
      if (userId) {
        setIsRegistered(true);
        if (userNombre) setNombre(userNombre);
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
        .select().single();

      if (error) throw error;
      if (data) {
        await AsyncStorage.setItem('usuario_id', data.id.toString());
        await AsyncStorage.setItem('usuario_nombre', nombre);
        setIsRegistered(true);
        Alert.alert("¡Bienvenido!", `Hola ${nombre}, ya puedes usar la app.`);
      }
    } catch (err) {
      Alert.alert("Error", "No se pudo completar el registro.");
    }
  };

  const handleScan = async (data: string) => {
    if (data === 'ASISTENCIA_IGLESIA') {
      const ahoraLocal = new Date();
      const horaArgentina = new Date(ahoraLocal.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
      
      const hora = horaArgentina.getHours();
      const minutos = horaArgentina.getMinutes();
      const fechaHoy = horaArgentina.toISOString().split('T')[0];
      
      let bloque = "Extraoficial";
      if (hora >= 8 && hora < 10) bloque = "09:00";
      else if (hora >= 10 && hora <= 12) bloque = "11:00";
      else if (hora >= 19 && hora < 21) bloque = "20:00";

      try {
        const userId = await AsyncStorage.getItem('usuario_id');
        const { error } = await supabase.from('asistencias').insert([{
          miembro_id: userId,
          horario_reunion: bloque,
          fecha: fechaHoy,
          hora_entrada: `${hora.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`
        }]);

        if (error) throw error;
        Alert.alert("¡Éxito!", `Asistencia registrada para las ${bloque}`);
        setShowScanner(false);
        setScanned(false);
      } catch (err) {
        Alert.alert("Error", "No se pudo registrar la asistencia.");
      }
    }
  };

  // --- RENDERS ---

  if (!permission) return <View style={styles.center} />;
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={{ color: 'white', marginBottom: 20 }}>Necesitamos permiso de cámara</Text>
        <TouchableOpacity style={styles.mainButton} onPress={requestPermission}>
          <Text style={styles.buttonText}>Dar Permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!isRegistered) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.churchTitle}>Iglesia del Salvador</Text>
        <TextInput placeholder="Nombre" placeholderTextColor="#999" style={styles.input} value={nombre} onChangeText={setNombre} />
        <TextInput placeholder="Apellido" placeholderTextColor="#999" style={styles.input} value={apellido} onChangeText={setApellido} />
        <TouchableOpacity style={styles.mainButton} onPress={manejarRegistro}>
          <Text style={styles.buttonText}>Registrarme</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!showScanner) {
    return (
      <SafeAreaView style={styles.containerDashboard}>
        <Stack.Screen options={{ headerShown: false }} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.welcome}>¡Hola, {nombre}!</Text>
            <Text style={styles.churchTitle}>Iglesia del Salvador</Text>
          </View>

          <View style={styles.grid}>
            <TouchableOpacity style={styles.mainCard} onPress={() => setShowScanner(true)}>
              <View style={styles.iconCircle}><Text style={{fontSize: 35}}>📸</Text></View>
              <Text style={styles.mainCardText}>Registrar Asistencia</Text>
              <Text style={styles.cardSubText}>Escanea el QR en la entrada</Text>
            </TouchableOpacity>

            <View style={styles.row}>
              <TouchableOpacity style={styles.smallCard} onPress={() => Alert.alert("Nosotros", INFO_IGLESIA.lema + "\n\n" + INFO_IGLESIA.direccion)}>
                <Text style={styles.cardIcon}>👥</Text>
                <Text style={styles.cardTitle}>Nosotros</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.smallCard} onPress={() => Linking.openURL(INFO_IGLESIA.web)}>
                <Text style={styles.cardIcon}>🌐</Text>
                <Text style={styles.cardTitle}>Sitio Web</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.smallCard, { width: '100%', flexDirection: 'row', height: 90 }]} onPress={() => Linking.openURL(INFO_IGLESIA.youtube)}>
              <Text style={[styles.cardIcon, { marginRight: 20 }]}>📺</Text>
              <View>
                <Text style={styles.cardTitle}>Prédicas en Vivo</Text>
                <Text style={{color: '#AAA', fontSize: 12}}>Canal oficial de YouTube</Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

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
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.mainButton, { backgroundColor: '#fff' }]} onPress={() => setShowScanner(false)}>
          <Text style={styles.buttonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center', padding: 30 },
  containerDashboard: { flex: 1, backgroundColor: '#1A1A1A', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A1A1A' },
  header: { marginTop: 40, marginBottom: 30 },
  welcome: { fontSize: 18, color: '#AAA' },
  churchTitle: { fontSize: 28, fontWeight: 'bold', color: '#A8D500', marginBottom: 20 },
  input: { width: '100%', backgroundColor: '#333', color: 'white', padding: 15, borderRadius: 12, marginBottom: 15 },
  mainButton: { backgroundColor: '#A8D500', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30, width: '100%', alignItems: 'center' },
  buttonText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  grid: { width: '100%' },
  mainCard: { 
    width: '100%', backgroundColor: '#A8D500', borderRadius: 30, padding: 25, alignItems: 'center', marginBottom: 20,
    elevation: 8, shadowColor: "#A8D500", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15,
  },
  iconCircle: { width: 70, height: 70, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  mainCardText: { color: '#000', fontWeight: 'bold', fontSize: 22 },
  cardSubText: { color: 'rgba(0,0,0,0.6)', fontSize: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  smallCard: { 
    width: '48%', height: 120, backgroundColor: '#252525', borderRadius: 25, padding: 20,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333'
  },
  cardIcon: { fontSize: 30, marginBottom: 8 },
  cardTitle: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  buttonContainer: { position: 'absolute', bottom: 50, alignSelf: 'center', width: '80%' }
});
