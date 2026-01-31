import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  ImageBackground, FlatList, ScrollView, SafeAreaView, 
  Linking, Dimensions, Animated, Alert, ActivityIndicator 
} from 'react-native';
import { Stack } from 'expo-router';
import { FontAwesome, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Importaciones
import { supabase } from '../lib/supabase';
import { registerForPushNotifications } from '../lib/registerPushToken';

const { width, height } = Dimensions.get('window');

const NOTICIAS = [
  { id: '1', title: 'Noche de Heaven', image: 'https://acvxjhecpgmauqqzmjik.supabase.co/storage/v1/object/public/imagenes-iglesia/Adoracion.jpg?v=1' },
  { id: '2', title: 'Reunión General', image: 'https://acvxjhecpgmauqqzmjik.supabase.co/storage/v1/object/public/imagenes-iglesia/Reunion.jpg' },
  { id: '3', title: 'Quiero Capacitarme', image: 'https://acvxjhecpgmauqqzmjik.supabase.co/storage/v1/object/public/imagenes-iglesia/Capacitarme.jpg' },
  { id: '4', title: 'Sumarme a un Grupo', image: 'https://acvxjhecpgmauqqzmjik.supabase.co/storage/v1/object/public/imagenes-iglesia/Grupos.jpg' },
];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [memberId, setMemberId] = useState(null);
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [currentScreen, setCurrentScreen] = useState('Inicio'); 
  const [scanning, setScanning] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  
  const flatListRef = useRef(null);
  const indexRef = useRef(0);
  const slideAnim = useRef(new Animated.Value(-width * 0.75)).current;

  // Auto-deslizado de noticias
  useEffect(() => {
    if (isLoggedIn && currentScreen === 'Inicio') {
      const interval = setInterval(() => {
        indexRef.current = (indexRef.current + 1) % NOTICIAS.length;
        flatListRef.current?.scrollToIndex({
          index: indexRef.current,
          animated: true,
        });
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, currentScreen]);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const savedMemberId = await AsyncStorage.getItem('memberId');
        const savedNombre = await AsyncStorage.getItem('nombre');
        const savedApellido = await AsyncStorage.getItem('apellido');

        if (savedMemberId && savedNombre && savedApellido) {
          setMemberId(savedMemberId);
          setNombre(savedNombre);
          setApellido(savedApellido);
          setIsLoggedIn(true);
        }
      } catch (e) {
        console.error("Error cargando sesión", e);
      } finally {
        setLoading(false);
      }
    };
    loadSession();
  }, []);

  const openSocial = async (url, appUrl) => {
    try {
      const canOpen = await Linking.canOpenURL(appUrl);
      if (canOpen) {
        await Linking.openURL(appUrl);
      } else {
        await Linking.openURL(url);
      }
    } catch (error) {
      await Linking.openURL(url);
    }
  };

  const handleLogin = async () => {
    const nombreLimpio = nombre.trim();
    const apellidoLimpio = apellido.trim();
    if (!nombreLimpio || !apellidoLimpio) {
      Alert.alert("Error", "Por favor completa tu nombre y apellido");
      return;
    }
    setLoading(true);
    try {
      let finalId = memberId;
      if (memberId) {
        await supabase.from('miembros').update({ nombre: nombreLimpio, apellido: apellidoLimpio }).eq('id', memberId);
      } else {
        const { data: existentes } = await supabase.from('miembros').select('*').eq('nombre', nombreLimpio).eq('apellido', apellidoLimpio);
        if (existentes && existentes.length > 0) {
          finalId = existentes[0].id;
        } else {
          const { data: nuevo } = await supabase.from('miembros').insert([{ nombre: nombreLimpio, apellido: apellidoLimpio }]).select();
          if (nuevo) finalId = nuevo[0].id;
        }
      }
      if (finalId) {
        await AsyncStorage.setItem('memberId', finalId);
        await AsyncStorage.setItem('nombre', nombreLimpio);
        await AsyncStorage.setItem('apellido', apellidoLimpio);
        setMemberId(finalId);
        setIsLoggedIn(true);
      }
    } catch (e) {
      Alert.alert("Error", "No se pudo sincronizar.");
    } finally {
      setLoading(false);
    }
  };

  const handleBarCodeScanned = async ({ data }) => {
    if (isProcessing) return;
    setScanning(false);
    if (!memberId || data !== 'ASISTENCIA_IGLESIA') {
      Alert.alert("Error", "Código QR no válido.");
      return;
    }
    setIsProcessing(true);
    try {
      const ahoraLocal = new Date();
      const opciones = { timeZone: "America/Argentina/Buenos_Aires", hour: '2-digit', minute: '2-digit', hour12: false };
      const horaArgString = ahoraLocal.toLocaleTimeString("es-AR", opciones);
      const [hora] = horaArgString.split(':').map(Number);
      const fechaHoy = ahoraLocal.toLocaleDateString('en-CA', { timeZone: "America/Argentina/Buenos_Aires" });
      
      let bloque = "Extraoficial";
      if (hora >= 8 && hora < 10) bloque = "09:00";
      else if (hora >= 10 && hora <= 12) bloque = "11:00";
      else if (hora >= 19 && hora < 21) bloque = "20:00";

      const { data: existente } = await supabase.from('asistencias').select('id').eq('miembro_id', memberId).eq('fecha', fechaHoy).eq('horario_reunion', bloque);
      if (existente && existente.length > 0) {
        Alert.alert("Bienvenido", `Ya has registrado tu asistencia.`);
        setIsProcessing(false);
        return;
      }
      await supabase.from('asistencias').insert([{ miembro_id: memberId, fecha: fechaHoy, hora_entrada: horaArgString, horario_reunion: bloque }]);
      Alert.alert("¡Bienvenido!", `Asistencia registrada: ${bloque}`);
    } catch (e) {
      Alert.alert("Error", "No se pudo procesar.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditProfile = () => {
    Alert.alert("Modificar Datos", "¿Deseas corregir tu nombre y apellido?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sí, modificar", onPress: () => {
          setIsLoggedIn(false);
          if(isMenuOpen) toggleMenu();
      }}
    ]);
  };

  const toggleMenu = () => {
    const toValue = isMenuOpen ? -width * 0.75 : 0;
    Animated.timing(slideAnim, { toValue, duration: 300, useNativeDriver: true }).start();
    setIsMenuOpen(!isMenuOpen);
  };

  const navigateTo = (screen) => {
    setCurrentScreen(screen);
    if (isMenuOpen) toggleMenu();
  };

  if (loading) return <View style={styles.loader}><ActivityIndicator size="large" color="#c5ff00" /></View>;

  if (!isLoggedIn) {
    return (
      <View style={styles.loginContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loginBox}>
          <Text style={styles.loginWelcome}>BIENVENIDOS A NUESTRA COMUNIDAD</Text>
          <Text style={styles.loginTitle}>IGLESIA DEL SALVADOR</Text>
          <View style={styles.underlineTitle} />
          <TextInput style={styles.input} placeholder="Nombre" placeholderTextColor="#888" value={nombre} onChangeText={setNombre} />
          <TextInput style={styles.input} placeholder="Apellido" placeholderTextColor="#888" value={apellido} onChangeText={setApellido} />
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>INGRESAR</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.mainContainer}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.drawerHeader}>
          <Text style={styles.drawerUser}>{nombre} {apellido}</Text>
          <TouchableOpacity onPress={toggleMenu}><FontAwesome name="close" size={24} color="#c5ff00" /></TouchableOpacity>
        </View>
        <DrawerItem label="Inicio" icon="home" active={currentScreen === 'Inicio'} onPress={() => navigateTo('Inicio')} />
        <DrawerItem label="Nosotros" icon="info-circle" active={currentScreen === 'Nosotros'} onPress={() => navigateTo('Nosotros')} />
        <DrawerItem label="Agenda" icon="calendar" active={currentScreen === 'Agenda'} onPress={() => navigateTo('Agenda')} />
        <DrawerItem label="Contacto" icon="phone" active={currentScreen === 'Contacto'} onPress={() => navigateTo('Contacto')} />
        <TouchableOpacity style={styles.editBtn} onPress={handleEditProfile}>
          <Text style={{color: '#c5ff00', fontWeight: 'bold'}}>MODIFICAR MIS DATOS</Text>
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.topNav}>
        <TouchableOpacity onPress={toggleMenu}><FontAwesome name="navicon" size={24} color="white" /></TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.navTitle}>IGLESIA DEL SALVADOR</Text>
          <View style={styles.underlineTitleMain} />
        </View>
        <View style={styles.userCircle}><FontAwesome name="user" size={16} color="black" /></View>
      </View>

      {currentScreen === 'Inicio' ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.carruselSection}>
            <FlatList
              ref={flatListRef} data={NOTICIAS} horizontal pagingEnabled keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={styles.slide}>
                  <ImageBackground source={{ uri: item.image }} style={styles.slideImage} imageStyle={{ borderRadius: 25 }}>
                    <View style={styles.slideOverlay}><Text style={styles.slideTitle}>{item.title}</Text></View>
                  </ImageBackground>
                </View>
              )}
            />
          </View>

          <TouchableOpacity style={styles.whatsappButton} onPress={() => Linking.openURL('https://whatsapp.com/channel/0029VaT0L9rEgGfRVvKIZ534')}>
            <FontAwesome name="whatsapp" size={20} color="white" style={{marginRight: 10}} />
            <Text style={styles.whatsappText}>Súmate al Canal de WhatsApp</Text>
          </TouchableOpacity>

          <View style={styles.grid}>
            <View style={styles.row}>
              <ActionCard title="Agenda" icon="calendar" image="https://images.unsplash.com/photo-1506784365847-bbad939e9335?w=400" onPress={() => navigateTo('Agenda')} />
              <ActionCard title="Biblia" icon="book" image="https://acvxjhecpgmauqqzmjik.supabase.co/storage/v1/object/public/imagenes-iglesia/Biblia.jpg" onPress={() => Linking.openURL('https://www.bible.com/es')} />
            </View>
            <View style={styles.row}>
              <ActionCard title="Quiero Ayudar" icon="heart" image="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400" onPress={() => Linking.openURL('https://iglesiadelsalvador.com.ar/donar')} />
              <ActionCard title="Necesito Ayuda" icon="hand-heart" isMCI image="https://acvxjhecpgmauqqzmjik.supabase.co/storage/v1/object/public/imagenes-iglesia/Ayuda.jpg" />
            </View>
            <View style={styles.row}>
              <ActionCard title="Quiero Bautizarme" icon="tint" image="https://acvxjhecpgmauqqzmjik.supabase.co/storage/v1/object/public/imagenes-iglesia/Bautismos.jpg" />
              <ActionCard title="Quiero Capacitarme" icon="graduation-cap" image="https://acvxjhecpgmauqqzmjik.supabase.co/storage/v1/object/public/imagenes-iglesia/Capacitarme.jpg" />
            </View>
            <View style={styles.row}>
              <ActionCard title="Soy Nuevo" icon="account-plus" isMCI image="https://acvxjhecpgmauqqzmjik.supabase.co/storage/v1/object/public/imagenes-iglesia/Nuevo.jpg" />
              <ActionCard title="Necesito Oración" icon="hands-pray" isMCI image="https://acvxjhecpgmauqqzmjik.supabase.co/storage/v1/object/public/imagenes-iglesia/Oracion.jpg" />
            </View>
            <View style={styles.row}>
              <ActionCard title="Sumarme a un Grupo" icon="users" image="https://acvxjhecpgmauqqzmjik.supabase.co/storage/v1/object/public/imagenes-iglesia/Grupo.jpg" />
              <ActionCard title="Reunion En Vivo" icon="video-camera" image="https://acvxjhecpgmauqqzmjik.supabase.co/storage/v1/object/public/imagenes-iglesia/Vivo.jpg" />
            </View>
          </View>

          <TouchableOpacity style={styles.assistButton} onPress={async () => {
            if (!permission?.granted) await requestPermission();
            setScanning(true);
          }}>
            <Text style={styles.assistButtonText}>📸 REGISTRAR ASISTENCIA</Text>
          </TouchableOpacity>

          <View style={styles.socialSection}>
            <Text style={styles.socialTitle}>SEGUINOS EN NUESTRAS REDES</Text>
            <View style={styles.socialIconsRow}>
              <TouchableOpacity onPress={() => Linking.openURL('https://instagram.com/iglesiadelsalvador')}>
                <FontAwesome name="instagram" size={28} color="#E1306C" />
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => Linking.openURL('https://www.tiktok.com/@iglesiadelsalvador')}>
                <FontAwesome5 name="tiktok" size={24} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => openSocial('https://facebook.com/iglesiadelsalvador', 'fb://facewebmodal/f?href=https://facebook.com/iglesiadelsalvador')}>
                <FontAwesome name="facebook" size={28} color="#4267B2" />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => Linking.openURL('https://youtube.com/@iglesiadelsalvador')}>
                <FontAwesome name="youtube-play" size={28} color="#FF0000" />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.pageContainer}>
          <TouchableOpacity onPress={() => setCurrentScreen('Inicio')} style={{marginBottom: 20}}>
            <Text style={{color: '#FFFFFF'}}><FontAwesome name="arrow-left" /> Volver</Text>
          </TouchableOpacity>
          <Text style={[styles.sectionTitle, {color: '#FFFFFF'}]}>{currentScreen}</Text>
        </View>
      )}

      {scanning && (
        <View style={styles.cameraContainer}>
          <CameraView style={StyleSheet.absoluteFillObject} facing="back" onBarcodeScanned={handleBarCodeScanned} />
          <TouchableOpacity style={styles.cancelButton} onPress={() => setScanning(false)}><Text style={styles.cancelText}>CERRAR</Text></TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const DrawerItem = ({ label, icon, active, onPress }) => (
  <TouchableOpacity style={[styles.drawerItem, active && styles.drawerActiveItem]} onPress={onPress}>
    <FontAwesome name={icon} size={20} color={active ? '#c5ff00' : 'white'} />
    <Text style={[styles.drawerItemText, active && {color: '#c5ff00'}]}> {label}</Text>
  </TouchableOpacity>
);

const ActionCard = ({ title, icon, image, onPress, isMCI }) => (
  <TouchableOpacity style={styles.cardContainer} onPress={onPress}>
    <ImageBackground source={{ uri: image }} style={styles.cardImg} imageStyle={{ borderRadius: 15 }}>
      <View style={styles.cardOverlay}>
        {isMCI ? <MaterialCommunityIcons name={icon} size={26} color="#c5ff00" /> : <FontAwesome name={icon} size={24} color="#c5ff00" />}
        <Text style={styles.cardText}>{title}</Text>
      </View>
    </ImageBackground>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#000' },
  loader: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  loginContainer: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' },
  loginBox: { backgroundColor: '#1e1e1e', padding: 30, borderRadius: 30, width: '90%', alignItems: 'center' },
  loginWelcome: { fontSize: 11, marginBottom: 5, fontWeight: '700', color: '#fff', letterSpacing: 1.5 },
  loginTitle: { color: '#c5ff00', fontSize: 20, fontWeight: 'bold' },
  underlineTitle: { height: 3, backgroundColor: '#c5ff00', width: '65%', marginTop: 4, borderRadius: 2 },
  underlineTitleMain: { height: 3, backgroundColor: '#c5ff00', width: '90%', marginTop: 4, borderRadius: 2 },
  input: { backgroundColor: '#2a2a2a', width: '100%', padding: 15, borderRadius: 12, color: 'white', marginTop: 15 },
  loginButton: { backgroundColor: '#c5ff00', width: '100%', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  loginButtonText: { fontWeight: 'bold', color: '#000' },
  topNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15 },
  navTitle: { color: 'white', fontSize: 17, fontWeight: 'bold' },
  userCircle: { backgroundColor: '#c5ff00', width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  drawer: { position: 'absolute', top: 0, left: 0, width: width * 0.75, height: height, backgroundColor: '#1e1e1e', zIndex: 1000, padding: 25, paddingTop: 60 },
  drawerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  drawerUser: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  drawerItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingLeft: 10 },
  drawerActiveItem: { borderLeftWidth: 4, borderLeftColor: '#c5ff00' },
  drawerItemText: { color: 'white', fontSize: 18, marginLeft: 15 },
  editBtn: { marginTop: 40, padding: 15, backgroundColor: '#333', borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#c5ff00' },
  carruselSection: { height: 230 },
  slide: { width: width, padding: 15 },
  slideImage: { width: '100%', height: 200, justifyContent: 'flex-end', overflow: 'hidden' },
  slideOverlay: { backgroundColor: 'rgba(0,0,0,0.6)', padding: 15 },
  slideTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: 'bold' },
  whatsappButton: { flexDirection: 'row', backgroundColor: '#005a42', marginHorizontal: 15, marginBottom: 15, padding: 15, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  whatsappText: { color: 'white', fontWeight: 'bold' },
  grid: { paddingHorizontal: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  cardContainer: { width: width * 0.45, height: 110 },
  cardImg: { flex: 1 },
  // Capa gris muy tenue (0.35) para máxima iluminación
  cardOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.35)' },
  cardText: { 
    color: 'white', 
    fontWeight: '900', 
    fontSize: 13, 
    textAlign: 'center', 
    marginTop: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.8)', 
    textShadowOffset: {width: 1, height: 1}, 
    textShadowRadius: 5 
  },
  assistButton: { backgroundColor: '#c5ff00', margin: 20, padding: 20, borderRadius: 25, alignItems: 'center' },
  assistButtonText: { color: '#000', fontWeight: 'bold', fontSize: 18 },
  socialSection: { alignItems: 'center', paddingVertical: 10, marginBottom: 20 },
  socialTitle: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold', letterSpacing: 2, marginBottom: 10 },
  socialIconsRow: { flexDirection: 'row', justifyContent: 'space-around', width: '60%' },
  pageContainer: { flex: 1, padding: 20, backgroundColor: '#000' },
  sectionTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold' },
  cameraContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'black', zIndex: 2000 },
  cancelButton: { position: 'absolute', bottom: 50, backgroundColor: '#ff4444', padding: 15, borderRadius: 12, alignSelf: 'center' },
  cancelText: { color: 'white', fontWeight: 'bold' }
});