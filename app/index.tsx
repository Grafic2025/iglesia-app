import { FontAwesome, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import MensajesScreen from './mensajes';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const { width } = Dimensions.get('window');

const NOTICIAS_DEFAULT = [
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
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);

  const [currentScreen, setCurrentScreen] = useState('Inicio');
  const [scanning, setScanning] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [, requestPermission] = useCameraPermissions();

  const [noticiasSupabase, setNoticiasSupabase] = useState<any[]>([]);
  const [mensajeOracion, setMensajeOracion] = useState('');
  const [bautismoEdad, setBautismoEdad] = useState('');
  const [bautismoGrupo, setBautismoGrupo] = useState('');
  const [bautismoCelular, setBautismoCelular] = useState('');
  const [ayudaCelular, setAyudaCelular] = useState('');
  const [ayudaMensaje, setAyudaMensaje] = useState('');

  const [listaPedidosOracion, setListaPedidosOracion] = useState<any[]>([]);
  const [rachaUsuario, setRachaUsuario] = useState(0);
  const [asistenciasDetalle, setAsistenciasDetalle] = useState<any[]>([]);
  const [rankingTop10, setRankingTop10] = useState<any[]>([]);
  const [showRanking, setShowRanking] = useState(false);
  const [showHistorial, setShowHistorial] = useState(false);

  const [showOptionsCursos, setShowOptionsCursos] = useState(false);
  const [showOptionsGrupos, setShowOptionsGrupos] = useState(false);
  const [cursoSeleccionado, setCursoSeleccionado] = useState('Seleccionar un Curso');
  const [grupoSeleccionado, setGrupoSeleccionado] = useState('Seleccionar un Grupo');

  const flatListRef = useRef<FlatList>(null);
  const indexRef = useRef(0);
  const slideAnim = useRef(new Animated.Value(-width * 0.75)).current;

  const opcionesCursos = ["Fundamentos cristianos", "Instituto Bíblico", "Escuela de Música", "Escuela de Adoración", "Escuela de Música Kids", "Escuela de Orientación", "Familiar", "Academia de Arte", "Oración y Consejeria", "Talleres de formación biblica", "Liderazgo"];
  const opcionesGrupos = ["Jóvenes", "Matrimonios", "Hombres", "Mujeres", "Adultos Mayores", "Pre-Adolescentes"];

  const cargarDatosMiembro = useCallback(async () => {
    try {
      const { data } = await supabase.from('miembros').select('*').eq('id', memberId).single();
      if (data) {
        setNombre(data.nombre);
        setApellido(data.apellido);
        setFotoUrl(data.foto_url);
      }
    } catch {
      console.error("Error cargando miembro");
    }
  }, [memberId]);

  const cargarNoticias = useCallback(async () => {
    try {
      const { data } = await supabase.from('noticias').select('*').eq('activa', true).order('created_at', { ascending: false });
      if (data && data.length > 0) setNoticiasSupabase(data);
      else setNoticiasSupabase(NOTICIAS_DEFAULT);
    } catch {
      setNoticiasSupabase(NOTICIAS_DEFAULT);
    }
  }, []);

  const cargarPedidos = useCallback(async () => {
    try {
      const { data } = await supabase.from('pedidos_oracion')
        .select('*, miembros(nombre, token_notificacion)')
        .order('fecha', { ascending: false }).limit(10);
      if (data) setListaPedidosOracion(data);
    } catch {
      console.error("Error cargando pedidos");
    }
  }, []);

  const calcularRacha = useCallback(async () => {
    try {
      const { data } = await supabase.from('asistencias').select('*').eq('miembro_id', memberId).order('fecha', { ascending: false });
      if (data) {
        setRachaUsuario(data.length > 10 ? 10 : data.length);
        setAsistenciasDetalle(data);
      }
    } catch (_e) {
      console.error("Error calculando racha:", _e);
    }
  }, [memberId]);

  const cargarRanking = useCallback(async () => {
    try {
      const hace30Dias = new Date();
      hace30Dias.setDate(hace30Dias.getDate() - 30);
      const fechaLimite = hace30Dias.toISOString().split('T')[0];

      const { data: asistencias } = await supabase.from('asistencias').select('miembro_id').gte('fecha', fechaLimite);
      const { data: miembros } = await supabase.from('miembros').select('id, nombre, apellido');

      if (miembros && asistencias) {
        const listaRanking = miembros.map(m => {
          const racha = asistencias.filter(a => a.miembro_id === m.id).length;
          return { ...m, racha };
        })
          .filter(m => m.racha > 0)
          .sort((a, b) => b.racha - a.racha)
          .slice(0, 10);
        setRankingTop10(listaRanking);
      }
    } catch {
      console.error("Error cargando ranking");
    }
  }, []);

  const loadSession = useCallback(async () => {
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
    } catch {
      console.error("Error loading session");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (isLoggedIn && memberId) {
      cargarDatosMiembro();
      cargarNoticias();
      calcularRacha();
    }
  }, [isLoggedIn, memberId, cargarDatosMiembro, cargarNoticias, calcularRacha]);

  useEffect(() => {
    if (currentScreen === 'Necesito Oración') cargarPedidos();
  }, [currentScreen, cargarPedidos]);

  useEffect(() => {
    if (isLoggedIn && currentScreen === 'Inicio') {
      const dataLen = noticiasSupabase.length > 0 ? noticiasSupabase.length : NOTICIAS_DEFAULT.length;
      if (dataLen > 0) {
        const interval = setInterval(() => {
          if (dataLen > 0 && flatListRef.current) {
            indexRef.current = (indexRef.current + 1) % dataLen;
            try {
              flatListRef.current.scrollToIndex({ index: indexRef.current, animated: true });
            } catch (err) {
              console.log("Error en scroll:", err);
            }
          }
        }, 3500);
        return () => clearInterval(interval);
      }
    }
  }, [isLoggedIn, currentScreen, noticiasSupabase]);

  const handleLogin = async () => {
    if (!nombre.trim() || !apellido.trim()) return Alert.alert("Error", "Completa tus datos");
    setLoading(true);
    try {
      const { data } = await supabase.from('miembros').upsert({ nombre: nombre.trim(), apellido: apellido.trim() }).select().single();
      if (data) {
        await AsyncStorage.setItem('memberId', data.id.toString());
        await AsyncStorage.setItem('nombre', data.nombre);
        await AsyncStorage.setItem('apellido', data.apellido || '');
        setMemberId(data.id);
        setIsLoggedIn(true);
        registerForPushNotifications(data.id);
      }
    } catch {
      Alert.alert("Error", "Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleInstagram = async () => {
    // Usar URL web universal suele funcionar mejor para abrir el perfil específico en la app
    const webUrl = 'https://www.instagram.com/iglesiadelsalvador/';
    try {
      await Linking.openURL(webUrl);
    } catch {
      Alert.alert("Error", "No se pudo abrir Instagram");
    }
  };

  const handleFacebook = async () => {
    // Usar URL web universal
    const webUrl = 'https://www.facebook.com/iglesiadelsalvador';
    try {
      await Linking.openURL(webUrl);
    } catch {
      Alert.alert("Error", "No se pudo abrir Facebook");
    }
  };

  const handleMercadoPago = async () => {
    const url = 'https://link.mercadopago.com.ar/iglesiadelsalvador';
    try {
      // Tentamos abrir el link. Si la app está instalada, el sistema debería ofrecer abrirla.
      await Linking.openURL(url);
    } catch {
      // Fallback simple por si falla Linking.openURL
      Linking.openURL(url);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Aviso", "¿Cerrar sesión?", [
      { text: "No" },
      {
        text: "Sí", onPress: async () => {
          await AsyncStorage.multiRemove(['memberId', 'nombre', 'apellido']);
          setIsLoggedIn(false);
          setMemberId(null);
          setNombre('');
          setApellido('');
        }
      }
    ]);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled && result.assets[0].uri) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      setLoading(true);
      const fileName = `${memberId}_${Date.now()}.jpg`;
      const response = await fetch(uri);
      const blob = await response.blob();
      const { error } = await supabase.storage.from('imagenes-iglesia').upload(`perfiles/${fileName}`, blob, { contentType: 'image/jpeg' });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('imagenes-iglesia').getPublicUrl(`perfiles/${fileName}`);
      await supabase.from('miembros').update({ foto_url: publicUrl }).eq('id', memberId);
      setFotoUrl(publicUrl);
      Alert.alert("Éxito", "Foto de perfil actualizada.");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePublicarPedido = async () => {
    if (!mensajeOracion.trim()) return Alert.alert("Aviso", "Escribe tu pedido primero.");
    const { error } = await supabase.from('pedidos_oracion').insert([{ miembro_id: memberId, pedido: mensajeOracion.trim() }]);
    if (!error) {
      Alert.alert("🙏", "Pedido publicado.");
      setMensajeOracion('');
      cargarPedidos();
    }
  };

  const handleMeUni = async (pedido: any) => {
    const { error } = await supabase.from('pedidos_oracion').update({ contador_oraciones: (pedido.contador_oraciones || 0) + 1 }).eq('id', pedido.id);
    if (!error) {
      Alert.alert("🙏", "Te uniste en oración.");
      cargarPedidos();
      const targetToken = pedido.miembros?.token_notificacion;
      if (targetToken) {
        fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: targetToken,
            title: '¡Alguien está orando!',
            body: `¡${nombre} se unió en oración por tu pedido! 🙏`,
          }),
        });
      }
    }
  };

  const handleSolicitudBautismo = async () => {
    if (!bautismoEdad.trim() || !bautismoCelular.trim()) return Alert.alert("Aviso", "Completa tus datos.");
    const { error } = await supabase.from('solicitudes_bautismo').insert([{ miembro_id: memberId, edad: bautismoEdad, celular: bautismoCelular, pertenece_grupo: bautismoGrupo }]);
    if (!error) {
      Alert.alert("✅", "Solicitud enviada.");
      setBautismoEdad(''); setBautismoCelular(''); setBautismoGrupo('');
      navigateTo('Inicio');
    }
  };

  const handleEnviarAyuda = async () => {
    if (!ayudaCelular.trim() || !ayudaMensaje.trim()) return Alert.alert("Aviso", "Completa tus datos.");
    const { error } = await supabase.from('consultas_ayuda').insert([{ miembro_id: memberId, celular: ayudaCelular, mensaje: ayudaMensaje }]);
    if (!error) {
      Alert.alert("✅", "Mensaje enviado.");
      setAyudaCelular(''); setAyudaMensaje('');
      navigateTo('Inicio');
    }
  };

  const getHorarioReunion = () => {
    const ahora = new Date();
    const ops: Intl.DateTimeFormatOptions = { timeZone: 'America/Argentina/Buenos_Aires', hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'long' };
    const formatter = new Intl.DateTimeFormat('es-AR', ops);
    const partes = formatter.formatToParts(ahora);
    let dia = '', hr = 0, min = 0;
    partes.forEach(p => {
      if (p.type === 'weekday') dia = p.value.toLowerCase();
      if (p.type === 'hour') hr = parseInt(p.value);
      if (p.type === 'minute') min = parseInt(p.value);
    });
    if (dia === 'domingo') {
      if ((hr === 8 && min >= 30) || (hr === 9) || (hr === 10 && min <= 30)) return "09:00";
      if ((hr === 10 && min > 30) || (hr === 11) || (hr === 12)) return "11:00";
      if (hr >= 18 && hr <= 21) return "20:00";
    } else if (dia === 'sábado' || dia === 'sabado') {
      if (hr >= 18 && hr <= 21) return "20:00";
    }
    return "Extraoficial";
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (isProcessing) return;
    if (data === 'ASISTENCIA_IGLESIA') {
      setIsProcessing(true);
      try {
        const ahora = new Date();
        const horaArg = ahora.toLocaleTimeString("es-AR", { hour: '2-digit', minute: '2-digit', hour12: false });
        const fecha = ahora.toLocaleDateString('en-CA');
        const horario = getHorarioReunion();
        // Check if ALREADY SCANNED TODAY (regardless of schedule)
        const { data: existeHoy } = await supabase.from('asistencias')
          .select('id')
          .eq('miembro_id', memberId)
          .eq('fecha', fecha)
          .maybeSingle();

        if (existeHoy) {
          Alert.alert("Aviso", "Tu asistencia ya ha sido registrada.");
        } else {
          await supabase.from('asistencias').insert([{ miembro_id: memberId, fecha, hora_entrada: horaArg, horario_reunion: horario }]);
          Alert.alert("¡Éxito!", "Asistencia registrada.");
          calcularRacha();
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsProcessing(false);
        setScanning(false);
      }
    }
  };

  const navigateTo = (screen: string) => {
    setCurrentScreen(screen);
    if (isMenuOpen) toggleMenu();
  };

  const toggleMenu = () => {
    const toValue = isMenuOpen ? -width * 0.75 : 0;
    Animated.timing(slideAnim, { toValue, duration: 300, useNativeDriver: true }).start();
    setIsMenuOpen(!isMenuOpen);
  };

  const ActionCard = ({ title, icon, image, onPress, isMCI = false }: any) => (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <ImageBackground source={{ uri: image }} style={styles.cardImage} imageStyle={{ borderRadius: 15 }}>
        <View style={styles.cardOverlay}>
          {isMCI ? <MaterialCommunityIcons name={icon} size={24} color="#c5ff00" /> : <FontAwesome name={icon} size={24} color="#c5ff00" />}
          <Text style={styles.cardTitle}>{title}</Text>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );

  const DrawerItem = ({ label, icon, active, onPress }: any) => (
    <TouchableOpacity style={[styles.drawerItem, active && styles.drawerItemActive]} onPress={onPress}>
      <FontAwesome name={icon} size={18} color={active ? "black" : "white"} />
      <Text style={[styles.drawerLabel, { color: active ? "black" : "white" }]}>{label}</Text>
    </TouchableOpacity>
  );

  if (loading) return <View style={styles.loader}><ActivityIndicator size="large" color="#c5ff00" /></View>;

  if (!isLoggedIn) {
    return (
      <View style={styles.loginContainer}>
        <Stack.Screen options={{ headerShown: false }} />

        <View style={styles.loginCard}>
          <Text style={styles.loginUpperTitle}>
            BIENVENIDOS A NUESTRA COMUNIDAD
          </Text>

          <Text style={styles.loginMainTitle}>
            IGLESIA DEL SALVADOR
          </Text>

          <View style={styles.loginDivider} />

          <TextInput
            style={styles.loginInput}
            placeholder="Nombre"
            placeholderTextColor="#666"
            value={nombre}
            onChangeText={setNombre}
          />

          <TextInput
            style={styles.loginInput}
            placeholder="Apellido"
            placeholderTextColor="#666"
            value={apellido}
            onChangeText={setApellido}
          />

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
          <TouchableOpacity onPress={pickImage}>
            {fotoUrl ? <ExpoImage source={{ uri: fotoUrl }} style={styles.drawerPhoto} /> : <View style={[styles.drawerPhoto, { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }]}><FontAwesome name="camera" size={18} color="#fff" /></View>}
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 15 }}>
            <Text style={styles.drawerUser}>{nombre} {apellido}</Text>
            <TouchableOpacity onPress={pickImage}><Text style={{ color: '#c5ff00', fontSize: 12 }}>Cambiar foto</Text></TouchableOpacity>
          </View>
          <TouchableOpacity onPress={toggleMenu}><FontAwesome name="close" size={20} color="#c5ff00" /></TouchableOpacity>
        </View>
        <DrawerItem label="Inicio" icon="home" active={currentScreen === 'Inicio'} onPress={() => navigateTo('Inicio')} />
        <DrawerItem label="Mensajes" icon="play-circle" active={currentScreen === 'Mensajes'} onPress={() => navigateTo('Mensajes')} />
        <DrawerItem label="Nosotros" icon="info-circle" active={currentScreen === 'Nosotros'} onPress={() => navigateTo('Nosotros')} />
        <DrawerItem label="Agenda" icon="calendar" active={currentScreen === 'Agenda'} onPress={() => navigateTo('Agenda')} />
        <DrawerItem label="Contacto" icon="phone" active={currentScreen === 'Contacto'} onPress={() => navigateTo('Contacto')} />
        <TouchableOpacity style={[styles.loginButton, { marginTop: 20 }]} onPress={() => { setIsLoggedIn(false); toggleMenu(); }}><Text style={styles.loginButtonText}>MODIFICAR DATOS</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.loginButton, { backgroundColor: '#ff4444', marginTop: 10 }]} onPress={handleLogout}><Text style={[styles.loginButtonText, { color: '#fff' }]}>CERRAR SESIÓN</Text></TouchableOpacity>
      </Animated.View>

      <View style={styles.topNav}>
        <TouchableOpacity onPress={toggleMenu}><FontAwesome name="navicon" size={22} color="white" /></TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.navTitle}>IGLESIA DEL SALVADOR</Text>
          <View style={{ width: '85%', height: 2, backgroundColor: '#c5ff00', marginTop: 5 }} />
        </View>
        <TouchableOpacity style={styles.userCircle} onPress={toggleMenu}>
          {fotoUrl ? <ExpoImage source={{ uri: fotoUrl }} style={{ width: '100%', height: '100%', borderRadius: 17.5 }} /> : <FontAwesome name="user" size={18} color="black" />}
        </TouchableOpacity>
      </View>

      {currentScreen === 'Inicio' ? (
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          <FlatList
            ref={flatListRef}
            data={noticiasSupabase.length > 0 ? noticiasSupabase : NOTICIAS_DEFAULT}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.slide} onPress={() => (item.url || item.video_url) ? Linking.openURL(item.url || item.video_url) : navigateTo(item.screen)}>
                <ImageBackground source={{ uri: item.image || item.imagen_url }} style={styles.slideImage} imageStyle={{ borderRadius: 25 }}>
                  <View style={styles.slideOverlay}><Text style={styles.slideTitle}>{item.title || item.titulo}</Text></View>
                </ImageBackground>
              </TouchableOpacity>
            )}
          />

          <View style={styles.rachaCard}>
            <Text style={styles.rachaTitle}>🔥 TU RACHA DE ASISTENCIA</Text>
            <View style={styles.starsContainer}>
              {[...Array(10)].map((_, i) => <Text key={i} style={{ fontSize: 18, marginHorizontal: 2 }}>{i < rachaUsuario ? '⭐' : '⚪'}</Text>)}
            </View>
            <Text style={styles.rachaTextWhite}>Tu racha: {rachaUsuario} asistencias</Text>
            <View style={{ flexDirection: 'row', marginTop: 15 }}>
              <TouchableOpacity style={styles.rachaSubBtn} onPress={() => { cargarRanking(); setShowRanking(true); }}><FontAwesome name="trophy" size={14} color="#c5ff00" /><Text style={styles.rachaSubBtnTxt}> VER TOP 10</Text></TouchableOpacity>
              <TouchableOpacity style={styles.rachaSubBtn} onPress={() => setShowHistorial(true)}><FontAwesome name="list" size={14} color="#c5ff00" /><Text style={styles.rachaSubBtnTxt}> MI HISTORIAL</Text></TouchableOpacity>
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
              <ActionCard title="Reunión en Vivo" icon="video-camera" image="https://acvxjhecpgmauqqzmjik.supabase.co/storage/v1/object/public/imagenes-iglesia/Vivo.jpg" onPress={() => Linking.openURL('https://youtube.com/@iglesiadelsalvador')} />
            </View>
          </View>
          <TouchableOpacity style={styles.assistButton} onPress={async () => { const { status } = await requestPermission(); if (status === 'granted') setScanning(true); else Alert.alert("Error", "Permiso de cámara denegado"); }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <FontAwesome name="camera" size={18} color="black" />
              <Text style={styles.assistButtonText}> REGISTRAR ASISTENCIA</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.whatsappChannelBtn} onPress={() => Linking.openURL('https://whatsapp.com/channel/0029VaT0L9rEgGfRVvKIZ534')}>
            <FontAwesome name="whatsapp" size={20} color="white" />
            <Text style={styles.whatsappChannelTxt}> Súmate al Canal de WhatsApp</Text>
          </TouchableOpacity>

          <View style={styles.socialSection}>

            <Text style={styles.socialTitle}>SEGUINOS EN NUESTRAS REDES</Text>
            <View style={styles.socialIconsRow}>
              <TouchableOpacity style={styles.socialIcon} onPress={handleInstagram}><FontAwesome name="instagram" size={24} color="#E1306C" /></TouchableOpacity>
              <TouchableOpacity style={styles.socialIcon} onPress={() => Linking.openURL('https://www.tiktok.com/@iglesiadelsalvador')}><FontAwesome5 name="tiktok" size={20} color="#FFFFFF" /></TouchableOpacity>
              <TouchableOpacity style={styles.socialIcon} onPress={handleFacebook}>
                <FontAwesome name="facebook" size={24} color="#4267B2" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialIcon} onPress={() => Linking.openURL('https://youtube.com/@iglesiadelsalvador')}><FontAwesome name="youtube-play" size={24} color="#FF0000" /></TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      ) : (
        <ScrollView style={styles.pageScroll} contentContainerStyle={{ paddingBottom: 50 }}>
          <TouchableOpacity onPress={() => navigateTo('Inicio')} style={styles.backBtn}><FontAwesome name="arrow-left" size={18} color="#c5ff00" /><Text style={styles.backTxt}> Volver</Text></TouchableOpacity>

          {currentScreen === 'Mensajes' && <MensajesScreen />}

          {currentScreen === 'Necesito Oración' && (
            <View>
              <Text style={styles.pageTitle}>Pedido de Oración</Text>
              <View style={styles.loginBox}>
                <TextInput
                  style={[styles.input, { height: 80, borderRadius: 15, backgroundColor: '#222', borderColor: '#444', borderWidth: 1, fontSize: 16 }]}
                  multiline
                  placeholder="Escribe aquí tu pedido..."
                  placeholderTextColor="#888"
                  value={mensajeOracion}
                  onChangeText={setMensajeOracion}
                />
                <TouchableOpacity style={styles.actionBtnFull} onPress={handlePublicarPedido}>
                  <Text style={styles.actionBtnText}>PUBLICAR PEDIDO</Text>
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
                        <Text style={styles.prayerText}>&quot;{p.pedido}&quot;</Text>
                        <View style={styles.dividerOracion} />
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                          <FontAwesome name="heart" size={16} color="#ff4444" />
                          <Text style={styles.prayerCounterText}>{p.contador_oraciones || 0} personas se unieron en oración</Text>
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

          {currentScreen === 'Quiero Ayudar' && (
            <View>
              <Text style={[styles.pageTitle, { fontSize: 18, lineHeight: 24 }]}>SOMOS UNA IGLESIA{"\n"}GENEROSA Y AGRADECIDA</Text>
              <TouchableOpacity style={styles.mpButton} onPress={handleMercadoPago}>
                <FontAwesome name="credit-card" size={20} color="#000" />
                <View style={{ marginLeft: 15 }}>
                  <Text style={styles.mpButtonText}>CON MERCADOPAGO O TARJETA</Text>
                  <Text style={styles.mpButtonSub}>Online haciendo clic aquí</Text>
                </View>
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

          {currentScreen === 'Agenda' && (
            <View>
              <Text style={styles.pageTitle}>HORARIOS DE REUNIÓN</Text>
              <View style={styles.agendaCard}><Text style={styles.agendaInfo}>DOMINGO - Reunión General</Text><Text style={styles.agendaTime}>10:00 hs</Text></View>
              <View style={styles.agendaCard}><Text style={styles.agendaInfo}>DOMINGO - Reunión General</Text><Text style={styles.agendaTime}>19:00 hs</Text></View>
              <View style={styles.agendaCard}><Text style={styles.agendaInfo}>SÁBADO - Jóvenes</Text><Text style={styles.agendaTime}>20:00 hs</Text></View>
            </View>
          )}

          {currentScreen === 'Quiero Bautizarme' && (
            <View>
              <Text style={styles.pageTitle}>Bautismos</Text>
              <TextInput style={styles.inputForm} placeholder="¿Qué edad tienes?" placeholderTextColor="#888" value={bautismoEdad} onChangeText={setBautismoEdad} keyboardType="numeric" />
              <TextInput style={styles.inputForm} placeholder="¿Perteneces a un grupo? (Si/No)" placeholderTextColor="#888" value={bautismoGrupo} onChangeText={setBautismoGrupo} />
              <TextInput style={styles.inputForm} placeholder="Celular" placeholderTextColor="#888" value={bautismoCelular} onChangeText={setBautismoCelular} keyboardType="phone-pad" />
              <TouchableOpacity style={styles.actionBtnFull} onPress={handleSolicitudBautismo}>
                <Text style={styles.actionBtnText}>SOLICITAR MI BAUTISMO</Text>
              </TouchableOpacity>
            </View>
          )}

          {currentScreen === 'Necesito Ayuda' && (
            <View>
              <Text style={styles.pageTitle}>Escribinos</Text>
              <TextInput style={styles.inputForm} placeholder="Tu número de Celular" placeholderTextColor="#888" value={ayudaCelular} onChangeText={setAyudaCelular} keyboardType="phone-pad" />
              <TextInput style={[styles.inputForm, { height: 100 }]} multiline placeholder="¿Cómo podemos ayudarte?" placeholderTextColor="#888" value={ayudaMensaje} onChangeText={setAyudaMensaje} />
              <TouchableOpacity style={styles.actionBtnFull} onPress={handleEnviarAyuda}>
                <Text style={styles.actionBtnText}>ENVIAR</Text>
              </TouchableOpacity>
            </View>
          )}

          {currentScreen === 'Quiero Capacitarme' && (
            <View>
              <Text style={styles.pageTitle}>CURSOS DISPONIBLES</Text>
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
              <TouchableOpacity style={[styles.actionBtnFull, { marginTop: 20 }]}><Text style={styles.actionBtnText}>INSCRIBIRME AHORA</Text></TouchableOpacity>
            </View>
          )}

          {currentScreen === 'Sumarme a un Grupo' && (
            <View>
              <Text style={styles.pageTitle}>ELEGÍ TU GRUPO</Text>
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
              <TouchableOpacity style={[styles.actionBtnFull, { marginTop: 20 }]}><Text style={styles.actionBtnText}>QUIERO QUE ME CONTACTEN</Text></TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      <Modal visible={showRanking} animationType="fade" transparent>
        <View style={styles.modalOverlay}><View style={styles.modalContent}>
          <View style={styles.modalHeader}><Text style={styles.modalTitle}>🏆 TOP 10 ASISTENCIAS</Text><TouchableOpacity onPress={() => setShowRanking(false)}><FontAwesome name="close" size={20} color="#c5ff00" /></TouchableOpacity></View>
          <ScrollView>{rankingTop10.map((p, i) => <View key={i} style={styles.rankRow}><Text style={styles.rankPos}>{i + 1}°</Text><Text style={styles.rankName}>{p.nombre} {p.apellido}</Text><Text style={styles.rankVal}>{p.racha} 🔥</Text></View>)}</ScrollView>
        </View></View>
      </Modal>

      <Modal visible={showHistorial} animationType="fade" transparent>
        <View style={styles.modalOverlay}><View style={styles.modalContent}>
          <View style={styles.modalHeader}><Text style={styles.modalTitle}>📅 MI HISTORIAL</Text><TouchableOpacity onPress={() => setShowHistorial(false)}><FontAwesome name="close" size={20} color="#c5ff00" /></TouchableOpacity></View>
          <FlatList data={asistenciasDetalle} renderItem={({ item }) => <View style={styles.histRow}><Text style={styles.histFecha}>{item.fecha}</Text><Text style={styles.histHora}>{item.hora_entrada} hs</Text></View>} />
        </View></View>
      </Modal>

      {scanning && (
        <Modal animationType="slide"><View style={{ flex: 1, backgroundColor: 'black' }}>
          <CameraView style={StyleSheet.absoluteFill} onBarcodeScanned={handleBarCodeScanned} barcodeScannerSettings={{ barcodeTypes: ["qr"] }}>
            <TouchableOpacity style={styles.closeCam} onPress={() => setScanning(false)}><FontAwesome name="close" size={30} color="white" /></TouchableOpacity>

            <View style={styles.camFooter}>
              <TouchableOpacity style={styles.closeCamBtn} onPress={() => setScanning(false)}>
                <FontAwesome name="close" size={20} color="white" />
                <Text style={styles.closeCamBtnText}>CERRAR</Text>
              </TouchableOpacity>
            </View>
          </CameraView>
        </View></Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#000' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  topNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, paddingTop: 45 },
  navTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  userCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#c5ff00', justifyContent: 'center', alignItems: 'center' },
  loginContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', padding: 8 },
  loginUpperTitle: { color: '#fff', fontSize: 11, textAlign: 'center', marginBottom: 2, letterSpacing: 1, fontWeight: '600' },
  loginMainTitle: { color: '#c5ff00', fontSize: 18, fontWeight: '900', textAlign: 'center', textTransform: 'uppercase', lineHeight: 22 },
  loginDivider: { width: 35, height: 3, backgroundColor: '#c5ff00', alignSelf: 'center', marginVertical: 10, borderRadius: 2 },
  input: { backgroundColor: '#1C1C1C', color: '#fff', padding: 14, borderRadius: 15, marginBottom: 15, fontSize: 14 },
  loginButton: { backgroundColor: '#c5ff00', padding: 12, borderRadius: 15, alignItems: 'center', marginTop: 15 },
  loginButtonText: { fontWeight: '900', color: '#000', fontSize: 14, letterSpacing: 1 },
  drawer: { position: 'absolute', left: 0, top: 0, bottom: 0, width: width * 0.75, backgroundColor: '#111', zIndex: 100, padding: 20, paddingTop: 50 },
  drawerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  drawerUser: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  drawerPhoto: { width: 45, height: 45, borderRadius: 22.5 },
  drawerItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, marginBottom: 5 },
  drawerItemActive: { backgroundColor: '#c5ff00' },
  drawerLabel: { marginLeft: 15, fontWeight: 'bold', fontSize: 14 },
  slide: { width: width, paddingHorizontal: 20 },
  slideImage: { width: '100%', height: 170, justifyContent: 'flex-end' },
  slideOverlay: { backgroundColor: 'rgba(0,0,0,0.6)', padding: 12, borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
  slideTitle: { color: '#fff', fontWeight: 'bold', fontSize: 16, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
  rachaCard: { backgroundColor: '#111', margin: 15, padding: 15, borderRadius: 20, alignItems: 'center' },
  rachaTitle: { color: '#c5ff00', fontWeight: 'bold', fontSize: 12, marginBottom: 8 },
  starsContainer: { flexDirection: 'row' },
  rachaTextWhite: { color: '#fff', fontSize: 12, fontWeight: '500' },
  rachaSubBtn: { backgroundColor: '#222', padding: 8, borderRadius: 10, marginHorizontal: 5, flexDirection: 'row', alignItems: 'center' },
  rachaSubBtnTxt: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  grid: { padding: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  card: { width: '48%', height: 95 },
  cardImage: { width: '100%', height: '100%' },
  cardOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', borderRadius: 15 },
  cardTitle: { color: '#fff', fontSize: 13, fontWeight: 'bold', marginTop: 8, textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.9)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 4 },
  assistButton: { backgroundColor: '#c5ff00', padding: 15, borderRadius: 20, marginHorizontal: 20, alignItems: 'center', marginBottom: 15 },
  assistButtonText: { fontWeight: 'bold', fontSize: 14 },
  pageScroll: { flex: 1, padding: 15 },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  backTxt: { color: '#c5ff00', fontWeight: 'bold', fontSize: 14 },
  pageTitle: { color: '#c5ff00', fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  loginBox: { backgroundColor: '#151515', paddingHorizontal: 20, paddingVertical: 25, borderRadius: 25, borderWidth: 1, borderColor: '#333', width: '100%', alignSelf: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4.65, elevation: 8 },
  prayerCard: { backgroundColor: '#111', padding: 15, borderRadius: 20, marginBottom: 15, borderWidth: 1, borderColor: '#222' },
  prayerUser: { color: '#c5ff00', fontSize: 16, fontWeight: 'bold' },
  prayerText: { color: '#fff', fontSize: 15, fontStyle: 'italic', marginVertical: 8, lineHeight: 22 },
  dividerOracion: { height: 1, backgroundColor: '#333', marginVertical: 12 },
  prayerCounterText: { color: '#888', fontSize: 12, marginLeft: 8 },
  unirmeBtn: { backgroundColor: '#c5ff00', padding: 12, borderRadius: 15 },
  unirmeBtnTxt: { color: '#000', fontWeight: 'bold', fontSize: 13 },
  actionBtnFull: { backgroundColor: '#c5ff00', padding: 15, borderRadius: 15, alignItems: 'center' },
  actionBtnText: { color: '#000', fontWeight: 'bold', fontSize: 14 },
  mpButton: { backgroundColor: '#c5ff00', padding: 15, borderRadius: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  mpButtonText: { color: '#000', fontWeight: 'bold', fontSize: 13 },
  mpButtonSub: { color: '#000', fontSize: 10 },
  bankBox: { backgroundColor: '#111', padding: 15, borderRadius: 15, marginBottom: 20 },
  bankTitle: { color: '#c5ff00', fontWeight: 'bold', fontSize: 11, marginBottom: 8 },
  bankText: { color: '#fff', fontSize: 15, marginBottom: 5, lineHeight: 22 },
  bankLabel: { color: '#ccc', fontSize: 13, marginTop: 8 },
  bankValue: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  inputForm: { backgroundColor: '#111', color: '#fff', padding: 15, borderRadius: 15, marginBottom: 15, borderWidth: 1, borderColor: '#333', fontSize: 14 },
  agendaCard: { backgroundColor: '#111', padding: 15, borderRadius: 15, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  agendaInfo: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  agendaTime: { color: '#c5ff00', fontWeight: 'bold', fontSize: 14 },
  dropdownHeader: { backgroundColor: '#111', padding: 15, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, borderWidth: 1, borderColor: '#333' },
  dropdownHeaderText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  dropdownList: { backgroundColor: '#1a1a1a', borderRadius: 10, marginTop: 5, borderWidth: 1, borderColor: '#333', overflow: 'hidden' },
  dropdownItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#222' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#111', width: '90%', maxHeight: '80%', borderRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { color: '#c5ff00', fontSize: 16, fontWeight: 'bold' },
  rankRow: { flexDirection: 'row', padding: 12, backgroundColor: '#222', borderRadius: 10, marginBottom: 8, alignItems: 'center' },
  rankPos: { color: '#c5ff00', width: 30, fontWeight: 'bold', fontSize: 14 },
  rankName: { color: '#fff', flex: 1, fontSize: 14 },
  rankVal: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  histRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, backgroundColor: '#222', borderRadius: 10, marginBottom: 8 },
  histFecha: { color: '#fff', fontSize: 14 },
  histHora: { color: '#c5ff00', fontWeight: 'bold', fontSize: 14 },
  whatsappChannelBtn: { backgroundColor: '#005c4b', padding: 15, borderRadius: 20, marginHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  whatsappChannelTxt: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  socialSection: { alignItems: 'center', paddingVertical: 20 },
  socialTitle: { color: '#fff', fontSize: 11, fontWeight: 'bold', letterSpacing: 2, marginBottom: 15 },
  socialIconsRow: { flexDirection: 'row', justifyContent: 'space-evenly', width: '80%' },
  socialIcon: { backgroundColor: '#222', padding: 12, borderRadius: 50 },
  closeCam: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  camFooter: { position: 'absolute', bottom: 80, left: 0, right: 0, alignItems: 'center' },
  closeCamBtn: { backgroundColor: '#ff4444', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30, flexDirection: 'row', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  closeCamBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16, marginLeft: 10 },
  loginCard: {
    backgroundColor: '#121212',
    paddingHorizontal: 10,
    paddingVertical: 25,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    width: '100%',
    alignSelf: 'center',
  },

  loginInput: {
    backgroundColor: '#252525',
    color: '#fff',
    padding: 12,
    borderRadius: 15,
    marginBottom: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#333',
  },
});