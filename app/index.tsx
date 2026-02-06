import { FontAwesome, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  ImageBackground,
  Linking,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { registerForPushNotifications } from '../lib/registerPushToken';
import { supabase } from '../lib/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const { width, height } = Dimensions.get('window');

const NOTICIAS = [
  {
    id: '1',
    title: 'Esenciales | El Señor',
    image: 'https://acvxjhecpgmauqqzmjik.supabase.co/storage/v1/object/public/imagenes-iglesia/Esenciales.png',
    url: 'https://www.youtube.com/watch?v=Wi1Tt4ewW0c'
  },
  {
    id: '2',
    title: 'Quiero Capacitarme',
    image: 'https://acvxjhecpgmauqqzmjik.supabase.co/storage/v1/object/public/imagenes-iglesia/Capacitarme.jpg',
    screen: 'Quiero Capacitarme'
  },
  {
    id: '3',
    title: 'Sumarme a un Grupo',
    image: 'https://acvxjhecpgmauqqzmjik.supabase.co/storage/v1/object/public/imagenes-iglesia/Grupos.jpg',
    screen: 'Sumarme a un Grupo'
  },
];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [currentScreen, setCurrentScreen] = useState('Inicio');
  const [scanning, setScanning] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const [celular, setCelular] = useState('');
  const [mensajeOracion, setMensajeOracion] = useState(''); // Estado específico para el pedido
  const [edad, setEdad] = useState('');
  const [perteneceGrupo, setPerteneceGrupo] = useState('');

  const [showOptionsCursos, setShowOptionsCursos] = useState(false);
  const [showOptionsGrupos, setShowOptionsGrupos] = useState(false);
  const [cursoSeleccionado, setCursoSeleccionado] = useState('Seleccionar un Curso');
  const [grupoSeleccionado, setGrupoSeleccionado] = useState('Seleccionar un Grupo');

  const [listaPedidosOracion, setListaPedidosOracion] = useState<any[]>([]);
  const [rachaUsuario, setRachaUsuario] = useState(0);
  const [asistenciasDetalle, setAsistenciasDetalle] = useState([]);
  const [rankingTop10, setRankingTop10] = useState([]);
  const [showRanking, setShowRanking] = useState(false);
  const [showHistorial, setShowHistorial] = useState(false);

  // Estados para Bautismo y Ayuda
  const [bautismoEdad, setBautismoEdad] = useState('');
  const [bautismoGrupo, setBautismoGrupo] = useState('');
  const [bautismoCelular, setBautismoCelular] = useState('');
  const [ayudaCelular, setAyudaCelular] = useState('');
  const [ayudaMensaje, setAyudaMensaje] = useState('');

  const opcionesCursos = ["Fundamentos cristianos", "Instituto Bíblico", "Escuela de Música", "Escuela de Adoración", "Escuela de Música Kids", "Escuela de Orientación", "Familiar", "Academia de Arte", "Oración y Consejeria", "Talleres de formación biblica", "Liderazgo"];
  const opcionesGrupos = ["Jóvenes", "Matrimonios", "Hombres", "Mujeres", "Adultos Mayores", "Pre-Adolescentes"];

  const flatListRef = useRef(null);
  const indexRef = useRef(0);
  const slideAnim = useRef(new Animated.Value(-width * 0.75)).current;

  useEffect(() => {
    const loadSession = async () => {
      try {
        const savedMemberId = await AsyncStorage.getItem('memberId');
        const savedNombre = await AsyncStorage.getItem('nombre');
        const savedApellido = await AsyncStorage.getItem('apellido');
        if (savedMemberId && savedNombre) {
          setMemberId(savedMemberId);
          setNombre(savedNombre);
          setApellido(savedApellido || '');
          setIsLoggedIn(true);
          registerForPushNotifications(savedMemberId);
        }
      } catch (e) { console.error("Error loading session:", e); }
      finally { setLoading(false); }
    };
    loadSession();
  }, []);

  useEffect(() => {
    if (isLoggedIn && currentScreen === 'Inicio') {
      const interval = setInterval(() => {
        indexRef.current = (indexRef.current + 1) % NOTICIAS.length;
        flatListRef.current?.scrollToIndex({ index: indexRef.current, animated: true });
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, currentScreen]);

  useEffect(() => {
    if (isLoggedIn && memberId) calcularRacha();
  }, [isLoggedIn, memberId]);

  // CARGAR PEDIDOS AL ENTRAR A LA PANTALLA
  useEffect(() => {
    if (currentScreen === 'Necesito Oración') cargarPedidos();
  }, [currentScreen]);

  const openLink = async (url: string, appUrl: string | null = null) => {
    try {
      if (appUrl) {
        // Intentamos abrir el esquema directamente.
        const supported = await Linking.canOpenURL(appUrl).catch(() => false);
        if (supported) {
          await Linking.openURL(appUrl);
          return;
        }
      }
      await Linking.openURL(url);
    } catch (error) {
      // Fallback final al navegador
      Linking.openURL(url).catch(() => {
        Alert.alert("Error", "No se pudo abrir el enlace.");
      });
    }
  };

  const handleOpenYoutube = async (url: string) => {
    await openLink(url);
  };

  const calcularRacha = async () => {
    const { data } = await supabase.from('asistencias').select('*').eq('miembro_id', memberId).order('fecha', { ascending: false });
    if (data) {
      setRachaUsuario(data.length > 10 ? 10 : data.length);
      setAsistenciasDetalle(data);
    }
  };

  const cargarRanking = async () => {
    const { data } = await supabase.from('miembros').select('id, nombre, apellido').limit(10);
    if (data) setRankingTop10(data.map(m => ({ ...m, racha: Math.floor(Math.random() * 10) + 1 })).sort((a, b) => b.racha - a.racha));
  };

  // FUNCIÓN PARA CARGAR PEDIDOS DESDE SUPABASE
  const cargarPedidos = async () => {
    try {
      const { data, error } = await supabase
        .from('pedidos_oracion')
        .select(`
        *,
        miembros (
          nombre,
          apellido,
          token_notificacion
        )
      `)
        .order('fecha', { ascending: false }) // Cambiado de 'created_at' a 'fecha'
        .limit(10); // Siempre las últimas 10

      if (error) throw error;
      setListaPedidosOracion(data || []);
    } catch (error: any) {
      console.error("Error en pedidos:", error.message);
      // Fallback: si falla la relación, cargamos solo los datos de la tabla
      const { data: simpleData } = await supabase
        .from('pedidos_oracion')
        .select('*')
        .order('fecha', { ascending: false })
        .limit(10);
      if (simpleData) setListaPedidosOracion(simpleData);
    }
  };

  // PUBLICAR PEDIDO
  const handlePublicarPedido = async () => {
    if (!mensajeOracion.trim()) return Alert.alert("Aviso", "Escribe tu pedido primero.");
    if (!memberId) return Alert.alert("Error", "No se pudo identificar tu sesión. Intenta reingresar.");

    const { error } = await supabase
      .from('pedidos_oracion')
      .insert([{ miembro_id: memberId, pedido: mensajeOracion.trim() }]);

    if (!error) {
      Alert.alert("🙏", "Tu pedido ha sido publicado en el muro.");
      setMensajeOracion('');
      await cargarPedidos(); // Recargar lista esperando el resultado
    } else {
      console.error("Error publicando pedido:", error);
      Alert.alert("Error", "No se pudo publicar tu pedido. Intenta de nuevo.");
    }
  };

  const handleMeUni = async (pedido: any) => {
    try {
      // 1. Notificar al dueño del pedido
      // Nota: el campo en el objeto cargado es 'miembros', pero el token puede llamarse diferente
      const targetToken = pedido.miembros?.token_notificacion || pedido.miembros?.expo_push_token;

      if (targetToken) {
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: targetToken,
            title: '¡Alguien está orando!',
            body: `¡${nombre} se unió en oración por tu pedido! 🙏`,
          }),
        });
      }

      // 2. Incrementar el contador en la base de datos
      const { error } = await supabase
        .from('pedidos_oracion')
        .update({ contador: (pedido.contador || 0) + 1 })
        .eq('id', pedido.id);

      if (!error) {
        Alert.alert("🙏", "Te uniste en oración.");
        await cargarPedidos();
      } else {
        console.error("Error al actualizar contador:", error.message);
      }
    } catch (e) {
      console.error("Error al unirse en oración:", e);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Aviso", "¿Estás seguro de que quieres cerrar tu sesión?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar Sesión",
        onPress: async () => {
          await AsyncStorage.multiRemove(['memberId', 'nombre', 'apellido']);
          setMemberId(null);
          setNombre('');
          setApellido('');
          setIsLoggedIn(false);
          if (isMenuOpen) toggleMenu();
        },
        style: "destructive"
      }
    ]);
  };

  const handleLogin = async () => {
    if (!nombre.trim() || !apellido.trim()) return Alert.alert("Error", "Completa tus datos");
    setLoading(true);
    try {
      const { data } = await supabase.from('miembros').upsert({ nombre: nombre.trim(), apellido: apellido.trim() }).select().single();
      if (data) {
        await AsyncStorage.setItem('memberId', data.id.toString());
        await AsyncStorage.setItem('nombre', data.nombre);
        await AsyncStorage.setItem('apellido', data.apellido);
        setMemberId(data.id);
        setIsLoggedIn(true);
      }
    } catch (e) { Alert.alert("Error", "Error de conexión"); }
    finally { setLoading(false); }
  };

  const handleSolicitudBautismo = async () => {
    if (!bautismoEdad.trim() || !bautismoCelular.trim()) return Alert.alert("Aviso", "Completa tus datos.");
    const { error } = await supabase.from('solicitudes_bautismo').insert([{
      miembro_id: memberId,
      edad: bautismoEdad,
      pertenece_grupo: bautismoGrupo,
      celular: bautismoCelular
    }]);
    if (!error) {
      Alert.alert("✅", "Solicitud de bautismo enviada.");
      setBautismoEdad(''); setBautismoGrupo(''); setBautismoCelular('');
      navigateTo('Inicio');
    }
  };

  const handleEnviarAyuda = async () => {
    if (!ayudaCelular.trim() || !ayudaMensaje.trim()) return Alert.alert("Aviso", "Completa tus datos.");
    const { error } = await supabase.from('consultas_ayuda').insert([{
      miembro_id: memberId,
      celular: ayudaCelular,
      mensaje: ayudaMensaje
    }]);
    if (!error) {
      Alert.alert("✅", "Mensaje enviado. Nos pondremos en contacto pronto.");
      setAyudaCelular(''); setAyudaMensaje('');
      navigateTo('Inicio');
    }
  };

  const handleBarCodeScanned = async ({ data }) => {
    if (isProcessing) return;
    if (data === 'ASISTENCIA_IGLESIA') {
      if (!memberId) {
        Alert.alert("Error", "No se detectó tu usuario. Por favor, reingresa a la app.");
        setScanning(false);
        return;
      }

      setIsProcessing(true);
      try {
        const ahora = new Date();
        const horaArg = ahora.toLocaleTimeString("es-AR", { hour: '2-digit', minute: '2-digit', hour12: false });
        const fecha = ahora.toLocaleDateString('en-CA');

        const { error } = await supabase.from('asistencias').insert([{
          miembro_id: memberId,
          fecha,
          hora_entrada: horaArg,
          horario_reunion: "General"
        }]);

        if (error) throw error;

        Alert.alert("¡Éxito!", "Asistencia registrada correctamente. 🙏");
        await calcularRacha();
      } catch (err: any) {
        console.error("Error registrando asistencia:", err);
        Alert.alert("Error de Registro", `No se pudo conectar: ${err.message || 'Error desconocido'}`);
      } finally {
        setIsProcessing(false);
        setScanning(false);
      }
    }
  };

  const navigateTo = (screen) => {
    setCurrentScreen(screen);
    if (isMenuOpen) toggleMenu();
  };

  const toggleMenu = () => {
    const toValue = isMenuOpen ? -width * 0.75 : 0;
    Animated.timing(slideAnim, { toValue, duration: 300, useNativeDriver: true }).start();
    setIsMenuOpen(!isMenuOpen);
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

      {/* DRAWER MENU */}
      <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.drawerHeader}>
          <Text style={styles.drawerUser}>{nombre} {apellido}</Text>
          <TouchableOpacity onPress={toggleMenu}><FontAwesome name="close" size={24} color="#c5ff00" /></TouchableOpacity>
        </View>
        <DrawerItem label="Inicio" icon="home" active={currentScreen === 'Inicio'} onPress={() => navigateTo('Inicio')} />
        <DrawerItem label="Nosotros" icon="info-circle" active={currentScreen === 'Nosotros'} onPress={() => navigateTo('Nosotros')} />
        <DrawerItem label="Agenda" icon="calendar" active={currentScreen === 'Agenda'} onPress={() => navigateTo('Agenda')} />
        <DrawerItem label="Contacto" icon="phone" active={currentScreen === 'Contacto'} onPress={() => navigateTo('Contacto')} />

        <TouchableOpacity style={[styles.editBtnGreen, { marginTop: 20 }]} onPress={() => { setIsLoggedIn(false); if (isMenuOpen) toggleMenu(); }}>
          <Text style={styles.editBtnText}>MODIFICAR MIS DATOS</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.editBtnGreen, { backgroundColor: '#ff4444', marginTop: 10 }]} onPress={handleLogout}>
          <Text style={[styles.editBtnText, { color: '#fff' }]}>CERRAR SESIÓN</Text>
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.topNav}>
        <TouchableOpacity onPress={toggleMenu}><FontAwesome name="navicon" size={25} color="white" /></TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.navTitle}>IGLESIA DEL SALVADOR</Text>
          <View style={styles.underlineTitleMain} />
        </View>
        <View style={styles.userCircle}><FontAwesome name="user" size={20} color="black" /></View>
      </View>

      {currentScreen === 'Inicio' ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          <FlatList
            ref={flatListRef} data={NOTICIAS} horizontal pagingEnabled keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.slide} onPress={() => item.url ? handleOpenYoutube(item.url) : navigateTo(item.screen)}>
                <ImageBackground source={{ uri: item.image }} style={styles.slideImage} imageStyle={{ borderRadius: 25 }}>
                  <View style={styles.slideOverlay}><Text style={styles.slideTitle}>{item.title}</Text></View>
                </ImageBackground>
              </TouchableOpacity>
            )}
          />

          <View style={styles.rachaCard}>
            <Text style={styles.rachaTitle}>🔥 TU RACHA DE ASISTENCIA</Text>
            <View style={styles.starsContainer}>
              {[...Array(10)].map((_, i) => (
                <Text key={i} style={{ fontSize: 24, marginHorizontal: 2 }}>{i < rachaUsuario ? '⭐' : '⚪'}</Text>
              ))}
            </View>
            <Text style={styles.rachaTextWhite}>Tu racha: {rachaUsuario} asistencias</Text>
            <View style={styles.rachaButtonsRow}>
              <TouchableOpacity style={styles.rachaSubBtn} onPress={() => { cargarRanking(); setShowRanking(true); }}>
                <FontAwesome name="trophy" size={14} color="#c5ff00" />
                <Text style={styles.rachaSubBtnTxt}> VER TOP 10</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rachaSubBtn} onPress={() => setShowHistorial(true)}>
                <FontAwesome name="list" size={14} color="#c5ff00" />
                <Text style={styles.rachaSubBtnTxt}> MI HISTORIAL</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.grid}>
            <View style={styles.row}>
              <ActionCard title="Agenda" icon="calendar" image="https://images.unsplash.com/photo-1506784365847-bbad939e9335?w=400" onPress={() => navigateTo('Agenda')} />
              <ActionCard title="Biblia" icon="book" image="https://acvxjhecpgmauqqzmjik.supabase.co/storage/v1/object/public/imagenes-iglesia/Biblia.jpg" onPress={() => Linking.openURL('https://www.bible.com/es')} />
            </View>
            <View style={styles.row}>
              <ActionCard title="Quiero Ayudar" icon="heart" image="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400" onPress={() => navigateTo('Quiero Ayudar')} />
              <ActionCard title="Necesito Ayuda" icon="hand-heart" isMCI image="https://acvxjhecpgmauqqzmjik.supabase.co/storage/v1/object/public/imagenes-iglesia/Ayuda.jpg" onPress={() => navigateTo('Necesito Ayuda')} />
            </View>
            <View style={styles.row}>
              <ActionCard title="Quiero Bautizarme" icon="tint" image="https://acvxjhecpgmauqqzmjik.supabase.co/storage/v1/object/public/imagenes-iglesia/Bautismos.jpg" onPress={() => navigateTo('Quiero Bautizarme')} />
              <ActionCard title="Quiero Capacitarme" icon="graduation-cap" image="https://acvxjhecpgmauqqzmjik.supabase.co/storage/v1/object/public/imagenes-iglesia/Capacitarme.jpg" onPress={() => navigateTo('Quiero Capacitarme')} />
            </View>
            <View style={styles.row}>
              <ActionCard title="Soy Nuevo" icon="account-plus" isMCI image="https://acvxjhecpgmauqqzmjik.supabase.co/storage/v1/object/public/imagenes-iglesia/Nuevo.jpg" onPress={() => navigateTo('Soy Nuevo')} />
              <ActionCard title="Necesito Oración" icon="hands-pray" isMCI image="https://acvxjhecpgmauqqzmjik.supabase.co/storage/v1/object/public/imagenes-iglesia/Oracion.jpg" onPress={() => navigateTo('Necesito Oración')} />
            </View>
            <View style={styles.row}>
              <ActionCard title="Sumarme a un Grupo" icon="users" image="https://acvxjhecpgmauqqzmjik.supabase.co/storage/v1/object/public/imagenes-iglesia/Grupos.jpg" onPress={() => navigateTo('Sumarme a un Grupo')} />
              <ActionCard title="Reunión en Vivo" icon="video-camera" image="https://acvxjhecpgmauqqzmjik.supabase.co/storage/v1/object/public/imagenes-iglesia/Vivo.jpg" onPress={() => handleOpenYoutube('https://youtube.com/@iglesiadelsalvador')} />
            </View>
          </View>

          <TouchableOpacity style={styles.assistButton} onPress={async () => {
            const { status } = await requestPermission();
            if (status === 'granted') setScanning(true);
          }}>
            <Text style={styles.assistButtonText}>📸 REGISTRAR ASISTENCIA</Text>
          </TouchableOpacity>

          <View style={styles.socialSection}>
            <TouchableOpacity style={styles.whatsappChannelBtn} onPress={() => Linking.openURL('https://whatsapp.com/channel/0029VaT0L9rEgGfRVvKIZ534')}>
              <FontAwesome name="whatsapp" size={24} color="white" />
              <Text style={styles.whatsappChannelTxt}> Súmate al Canal de WhatsApp</Text>
            </TouchableOpacity>

            <Text style={styles.socialTitle}>SEGUINOS EN NUESTRAS REDES</Text>
            <View style={styles.socialIconsRow}>
              <TouchableOpacity style={styles.socialIcon} onPress={() => Linking.openURL('https://instagram.com/iglesiadelsalvador')}><FontAwesome name="instagram" size={28} color="#E1306C" /></TouchableOpacity>
              <TouchableOpacity style={styles.socialIcon} onPress={() => Linking.openURL('https://www.tiktok.com/@iglesiadelsalvador')}><FontAwesome5 name="tiktok" size={24} color="#FFFFFF" /></TouchableOpacity>
              <TouchableOpacity style={styles.socialIcon} onPress={() => openLink('https://facebook.com/iglesiadelsalvador', 'fb://facewebmodal/f?href=https://facebook.com/iglesiadelsalvador')}>
                <FontAwesome name="facebook" size={28} color="#4267B2" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialIcon} onPress={() => Linking.openURL('https://youtube.com/@iglesiadelsalvador')}><FontAwesome name="youtube-play" size={28} color="#FF0000" /></TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      ) : (
        <ScrollView style={styles.pageContainer} contentContainerStyle={{ paddingBottom: 50 }}>
          <TouchableOpacity onPress={() => setCurrentScreen('Inicio')} style={styles.backBtn}>
            <FontAwesome name="arrow-left" color="#c5ff00" size={18} /><Text style={styles.backTxt}> Volver</Text>
          </TouchableOpacity>

          {/* NECESITO ORACIÓN - MURO DE ORACIÓN DINÁMICO */}
          {currentScreen === 'Necesito Oración' && (
            <View>
              <Text style={styles.modalTitle}>Pedido de Oración</Text>
              <View style={styles.loginBox}>
                <TextInput
                  style={[styles.input, { height: 80, borderRadius: 15 }]}
                  multiline
                  placeholder="Tu pedido..."
                  placeholderTextColor="#888"
                  value={mensajeOracion}
                  onChangeText={setMensajeOracion}
                />
                <TouchableOpacity style={[styles.loginButton, { backgroundColor: '#c5ff00', borderRadius: 15, padding: 18 }]} onPress={handlePublicarPedido}>
                  <Text style={[styles.loginButtonText, { color: '#000', fontSize: 16 }]}>PUBLICAR PEDIDO</Text>
                </TouchableOpacity>
              </View>

              <View style={{ marginTop: 30 }}>
                {listaPedidosOracion.length === 0 ? (
                  <Text style={{ color: '#555', textAlign: 'center', marginTop: 20 }}>No hay pedidos recientes.</Text>
                ) : (
                  listaPedidosOracion.map((p, i) => (
                    <View key={i} style={styles.prayerCard}>
                      <View style={{ width: '100%' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                          <Text style={styles.prayerUser}>{p.miembros?.nombre || 'Miembro'}</Text>
                          <FontAwesome name="quote-right" size={14} color="#333" />
                        </View>
                        <Text style={styles.prayerText}>"{p.pedido}"</Text>

                        <View style={styles.dividerOracion} />

                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                          <FontAwesome name="heart" size={16} color="#ff4444" />
                          <Text style={styles.prayerCounterText}>{p.contador || 0} personas se unieron en oración</Text>
                        </View>

                        <TouchableOpacity style={styles.unirmeBtn} onPress={() => handleMeUni(p)}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                            <MaterialCommunityIcons name="hands-pray" size={22} color="black" />
                            <Text style={styles.unirmeBtnTxt}> UNIRME EN ORACIÓN</Text>
                          </View>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </View>
          )}

          {/* QUIERO AYUDAR */}
          {currentScreen === 'Quiero Ayudar' && (
            <View>
              <Text style={styles.modalTitle}>SOMOS UNA IGLESIA{"\n"}GENEROSA Y AGRADECIDA</Text>
              <TouchableOpacity style={styles.mpButton} onPress={() => openLink('https://link.mercadopago.com.ar/iglesiadelsalvador', 'mpago://')}>
                <FontAwesome name="credit-card" size={20} color="c5ff00" /><View style={{ marginLeft: 15 }}><Text style={styles.mpButtonText}>CON MERCADOPAGO O TARJETA</Text><Text style={styles.mpButtonSub}>Online haciendo clic aquí</Text></View>
              </TouchableOpacity>
              <View style={styles.bankBox}>
                <Text style={styles.bankTitle}>POR CUENTA BANCARIA / DEPÓSITO</Text>
                <Text style={styles.bankText}>Cuenta Corriente $ 008-010075/3{"\n"}Cuenta Corriente U$S 008-060177/3{"\n"}CUIT: 30-53174084-6{"\n"}Sucursal 189 Banco BBVA</Text>
              </View>
              <View style={[styles.bankBox, { borderTopWidth: 1, borderTopColor: '#333' }]}>
                <Text style={styles.bankTitle}>POR TRANSFERENCIA</Text>
                <Text style={styles.bankLabel}>CBU PESOS ($):</Text><Text style={styles.bankValue}>0170008420000001007530</Text>
                <Text style={styles.bankLabel}>ALIAS:</Text><Text style={styles.bankValue}>IDS.BBVA.CCPESOS</Text>
                <Text style={[styles.bankText, { marginTop: 10 }]}>CUIT: 30-53174084-6 | Banco BBVA</Text>
              </View>
            </View>
          )}

          {currentScreen === 'Quiero Bautizarme' && (
            <View>
              <Text style={[styles.modalTitle, { color: '#c5ff00', fontSize: 24, marginBottom: 20 }]}>Bautismos</Text>
              <TextInput style={styles.inputForm} placeholder="¿Qué edad tienes?" placeholderTextColor="#888" value={bautismoEdad} onChangeText={setBautismoEdad} keyboardType="numeric" />
              <TextInput style={styles.inputForm} placeholder="¿Perteneces a un grupo? (Si/No)" placeholderTextColor="#888" value={bautismoGrupo} onChangeText={setBautismoGrupo} />
              <TextInput style={styles.inputForm} placeholder="Celular" placeholderTextColor="#888" value={bautismoCelular} onChangeText={setBautismoCelular} keyboardType="phone-pad" />
              <TouchableOpacity style={styles.loginButton} onPress={handleSolicitudBautismo}>
                <Text style={styles.loginButtonText}>SOLICITAR MI BAUTISMO</Text>
              </TouchableOpacity>
            </View>
          )}

          {currentScreen === 'Necesito Ayuda' && (
            <View>
              <Text style={[styles.modalTitle, { color: '#c5ff00', fontSize: 24, marginBottom: 20 }]}>Escribinos</Text>
              <TextInput style={styles.inputForm} placeholder="Tu número de Celular" placeholderTextColor="#888" value={ayudaCelular} onChangeText={setAyudaCelular} keyboardType="phone-pad" />
              <TextInput style={[styles.inputForm, { height: 100 }]} multiline placeholder="¿Cómo podemos ayudarte?" placeholderTextColor="#888" value={ayudaMensaje} onChangeText={setAyudaMensaje} />
              <TouchableOpacity style={styles.loginButton} onPress={handleEnviarAyuda}>
                <Text style={styles.loginButtonText}>ENVIAR</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* RESTO DE LAS PANTALLAS (AGENDA, CAPACITARME, ETC) IGUAL QUE ANTES... */}
          {currentScreen === 'Agenda' && (
            <View>
              <Text style={styles.modalTitle}>HORARIOS DE REUNIÓN</Text>
              <View style={styles.histRow}><Text style={styles.rankName}>DOMINGO - Reunión General</Text><Text style={styles.histHora}>10:00 hs</Text></View>
              <View style={styles.histRow}><Text style={styles.rankName}>DOMINGO - Reunión General</Text><Text style={styles.histHora}>19:00 hs</Text></View>
              <View style={styles.histRow}><Text style={styles.rankName}>SÁBADO - Jóvenes</Text><Text style={styles.histHora}>20:00 hs</Text></View>
            </View>
          )}

          {currentScreen === 'Quiero Capacitarme' && (
            <View>
              <Text style={styles.modalTitle}>CURSOS DISPONIBLES</Text>
              <TouchableOpacity style={styles.dropdownHeader} onPress={() => setShowOptionsCursos(!showOptionsCursos)}>
                <Text style={styles.dropdownHeaderText}>{cursoSeleccionado}</Text>
                <FontAwesome name={showOptionsCursos ? "chevron-up" : "chevron-down"} size={14} color="#c5ff00" />
              </TouchableOpacity>
              {showOptionsCursos && (
                <View style={styles.dropdownList}>
                  {opcionesCursos.map((curso, idx) => (
                    <TouchableOpacity key={idx} style={styles.dropdownItem} onPress={() => { setCursoSeleccionado(curso); setShowOptionsCursos(false); }}>
                      <Text style={[styles.rankName, cursoSeleccionado === curso && { color: '#c5ff00' }]}>{curso}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <TouchableOpacity style={[styles.loginButton, { marginTop: 20 }]}><Text style={styles.loginButtonText}>INSCRIBIRME AHORA</Text></TouchableOpacity>
            </View>
          )}

          {currentScreen === 'Sumarme a un Grupo' && (
            <View>
              <Text style={styles.modalTitle}>ELEGÍ TU GRUPO</Text>
              <TouchableOpacity style={styles.dropdownHeader} onPress={() => setShowOptionsGrupos(!showOptionsGrupos)}>
                <Text style={styles.dropdownHeaderText}>{grupoSeleccionado}</Text>
                <FontAwesome name={showOptionsGrupos ? "chevron-up" : "chevron-down"} size={14} color="#c5ff00" />
              </TouchableOpacity>
              {showOptionsGrupos && (
                <View style={styles.dropdownList}>
                  {opcionesGrupos.map((grupo, idx) => (
                    <TouchableOpacity key={idx} style={styles.dropdownItem} onPress={() => { setGrupoSeleccionado(grupo); setShowOptionsGrupos(false); }}>
                      <Text style={[styles.rankName, grupoSeleccionado === grupo && { color: '#c5ff00' }]}>{grupo}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <TouchableOpacity style={[styles.loginButton, { marginTop: 20 }]}><Text style={styles.loginButtonText}>QUIERO QUE ME CONTACTEN</Text></TouchableOpacity>
            </View>
          )}

        </ScrollView>
      )}

      {/* MODALES RANKING E HISTORIAL */}
      <Modal visible={showRanking} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>🏆 TOP 10 ASISTENCIAS</Text><TouchableOpacity onPress={() => setShowRanking(false)}><FontAwesome name="close" size={20} color="#c5ff00" /></TouchableOpacity></View>
            <ScrollView>{rankingTop10.map((item, idx) => (
              <View key={idx} style={[styles.rankRow, item.id === memberId && { borderColor: '#c5ff00', borderWidth: 1 }]}>
                <Text style={styles.rankPos}>{idx + 1}°</Text><Text style={styles.rankName}>{item.nombre} {item.apellido}</Text><Text style={styles.rankVal}>{item.racha} 🔥</Text>
              </View>
            ))}</ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showHistorial} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>📅 MI HISTORIAL</Text><TouchableOpacity onPress={() => setShowHistorial(false)}><FontAwesome name="close" size={20} color="#c5ff00" /></TouchableOpacity></View>
            <FlatList data={asistenciasDetalle} keyExtractor={(item, i) => i.toString()} renderItem={({ item }) => (
              <View style={styles.histRow}><Text style={styles.histFecha}>{item.fecha}</Text><Text style={styles.histHora}>{item.hora_entrada} hs</Text></View>
            )} />
          </View>
        </View>
      </Modal>

      {scanning && (
        <Modal animationType="slide">
          <View style={{ flex: 1, backgroundColor: 'black' }}>
            <CameraView style={StyleSheet.absoluteFill} onBarcodeScanned={handleBarCodeScanned} barcodeScannerSettings={{ barcodeTypes: ["qr"] }}>
              <TouchableOpacity style={styles.closeCam} onPress={() => setScanning(false)}><FontAwesome name="close" size={30} color="white" /></TouchableOpacity>

              <View style={{ position: 'absolute', bottom: 100, width: '100%', alignItems: 'center' }}>
                <TouchableOpacity style={styles.cerrarCamBtn} onPress={() => setScanning(false)}>
                  <Text style={styles.cerrarCamTxt}>CERRAR</Text>
                </TouchableOpacity>
              </View>
            </CameraView>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

// COMPONENTES AUXILIARES
function ActionCard({ title, icon, image, onPress, isMCI }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <ImageBackground source={{ uri: image }} style={styles.cardImg} imageStyle={{ borderRadius: 15 }}>
        <View style={styles.cardOverlay}>
          {isMCI ? <MaterialCommunityIcons name={icon} size={24} color="#c5ff00" /> : <FontAwesome name={icon} size={24} color="#c5ff00" />}
          <Text style={styles.cardTitle}>{title}</Text>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

function DrawerItem({ label, icon, active, onPress }) {
  return (
    <TouchableOpacity style={[styles.drawerItem, active && styles.drawerItemActive]} onPress={onPress}>
      <FontAwesome name={icon} size={18} color={active ? "black" : "white"} />
      <Text style={[styles.drawerLabel, { color: active ? "black" : "white" }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ESTILOS UNIFICADOS
const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#000' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  loginContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', padding: 20 },
  loginBox: { backgroundColor: '#111', padding: 20, borderRadius: 25, borderWidth: 1, borderColor: '#222' },
  loginWelcome: { color: '#fff', fontSize: 13, textAlign: 'center', letterSpacing: 1 },
  loginTitle: { color: '#c5ff00', fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  underlineTitle: { height: 2, backgroundColor: '#c5ff00', width: 40, alignSelf: 'center', marginBottom: 20 },
  underlineTitleMain: { height: 3, backgroundColor: '#c5ff00', width: '85%', marginTop: 4, borderRadius: 2 },
  input: { backgroundColor: '#222', color: '#fff', padding: 15, borderRadius: 10, marginBottom: 15 },
  loginButton: { backgroundColor: '#c5ff00', padding: 15, borderRadius: 10, alignItems: 'center' },
  loginButtonText: { fontWeight: 'bold', color: '#000' },
  topNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50 },
  navTitle: { color: '#fff', fontWeight: 'bold', fontSize: 18, },
  userCircle: { width: 35, height: 35, borderRadius: 20, backgroundColor: '#c5ff00', justifyContent: 'center', alignItems: 'center' },
  slide: { width: width, paddingHorizontal: 20 },
  slideImage: { width: '100%', height: 180, justifyContent: 'flex-end' },
  slideOverlay: { backgroundColor: 'rgba(0,0,0,0.6)', padding: 15, borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
  slideTitle: { color: '#fff', fontWeight: 'bold' },
  rachaCard: { backgroundColor: '#111', margin: 20, padding: 20, borderRadius: 20, alignItems: 'center' },
  rachaTitle: { color: '#c5ff00', fontWeight: 'bold', fontSize: 13, marginBottom: 10 },
  starsContainer: { flexDirection: 'row', marginBottom: 10 },
  rachaTextWhite: { color: '#fff', fontSize: 13, fontWeight: '500' },
  rachaButtonsRow: { flexDirection: 'row', marginTop: 15 },
  rachaSubBtn: { backgroundColor: '#222', padding: 10, borderRadius: 10, marginHorizontal: 5, flexDirection: 'row', alignItems: 'center' },
  rachaSubBtnTxt: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  grid: { padding: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  card: { width: '48%', height: 100 },
  cardImg: { width: '100%', height: '100%' },
  cardOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', borderRadius: 15 },
  cardTitle: { color: '#fff', fontSize: 11, fontWeight: 'bold', marginTop: 5 },
  assistButton: { backgroundColor: '#c5ff00', marginHorizontal: 20, marginTop: 10, marginBottom: 10, padding: 20, borderRadius: 20, alignItems: 'center' },
  assistButtonText: { fontWeight: 'bold' },
  socialSection: { alignItems: 'center', paddingVertical: 10, marginBottom: 0 },
  socialTitle: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold', letterSpacing: 2, marginBottom: 15 },
  socialIconsRow: { flexDirection: 'row', justifyContent: 'space-evenly', width: '80%' },
  socialIcon: { backgroundColor: '#222', padding: 12, borderRadius: 50 },
  drawer: { position: 'absolute', left: 0, top: 0, bottom: 0, width: width * 0.75, backgroundColor: '#111', zIndex: 100, padding: 20, paddingTop: 60 },
  drawerHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  drawerUser: { color: '#fff', fontWeight: 'bold', fontSize: 20, },
  drawerItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 10, marginBottom: 5 },
  drawerItemActive: { backgroundColor: '#c5ff00' },
  drawerLabel: { marginLeft: 15, fontWeight: 'bold' },
  editBtnGreen: { padding: 15, backgroundColor: '#c5ff00', borderRadius: 12, alignItems: 'center' },
  editBtnText: { color: '#000', fontWeight: 'bold' },
  pageContainer: { flex: 1, padding: 20 },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backTxt: { color: '#c5ff00', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#111', width: '90%', maxHeight: '80%', borderRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { color: '#c5ff00', fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  rankRow: { flexDirection: 'row', padding: 15, backgroundColor: '#222', borderRadius: 10, marginBottom: 10, alignItems: 'center' },
  rankPos: { color: '#c5ff00', fontWeight: 'bold', width: 40 },
  rankName: { color: '#fff', flex: 1 },
  rankVal: { color: '#fff', fontWeight: 'bold' },
  histRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: '#222', borderRadius: 10, marginBottom: 10 },
  histFecha: { color: '#fff' },
  histHora: { color: '#c5ff00', fontWeight: 'bold' },
  closeCam: { position: 'absolute', top: 50, right: 20, zIndex: 10 },

  // ESTILOS PEDIDOS DE ORACIÓN
  prayerCard: { backgroundColor: '#111', padding: 20, borderRadius: 25, marginBottom: 20, borderWidth: 1, borderColor: '#222' },
  prayerUser: { color: '#c5ff00', fontSize: 18, fontWeight: 'bold' },
  prayerText: { color: '#fff', fontSize: 18, fontStyle: 'italic', marginVertical: 10, lineHeight: 24 },
  dividerOracion: { height: 1, backgroundColor: '#333', marginVertical: 15 },
  prayerCounterText: { color: '#888', fontSize: 13, marginLeft: 10 },
  unirmeBtn: { backgroundColor: '#c5ff00', padding: 15, borderRadius: 15 },
  unirmeBtnTxt: { color: '#000', fontWeight: 'bold', fontSize: 14 },

  // ESTILOS DE AYUDA / MERCADO PAGO
  mpButton: { backgroundColor: '#c5ff00', padding: 15, borderRadius: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  mpButtonText: { color: '#000', fontWeight: 'bold', fontSize: 14 },
  mpButtonSub: { color: '#000', fontSize: 10 },
  bankBox: { backgroundColor: '#111', padding: 15, borderRadius: 15, marginBottom: 20 },
  bankTitle: { color: '#c5ff00', fontWeight: 'bold', fontSize: 12, marginBottom: 10 },
  bankText: { color: '#fff', fontSize: 13, marginBottom: 5, lineHeight: 20 },
  bankLabel: { color: '#888', fontSize: 10, marginTop: 5 },
  bankValue: { color: '#fff', fontSize: 14, fontWeight: 'bold' },

  dropdownHeader: { backgroundColor: '#222', padding: 15, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, borderWidth: 1, borderColor: '#333' },
  dropdownHeaderText: { color: '#fff', fontWeight: 'bold' },
  dropdownList: { backgroundColor: '#1a1a1a', borderRadius: 10, marginTop: 5, borderWidth: 1, borderColor: '#333', overflow: 'hidden' },
  dropdownItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#222' },

  // Nuevos estilos
  whatsappChannelBtn: { backgroundColor: '#005c4b', padding: 20, borderRadius: 25, width: '90%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  whatsappChannelTxt: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  inputForm: { backgroundColor: '#1a1a1a', color: '#fff', padding: 20, borderRadius: 15, marginBottom: 15, borderWidth: 1, borderColor: '#333', fontSize: 16 },
  cerrarCamBtn: { backgroundColor: '#ff4444', paddingVertical: 12, paddingHorizontal: 40, borderRadius: 10 },
  cerrarCamTxt: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});