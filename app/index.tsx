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
  SafeAreaView,
  ScrollView,
  StyleSheet, Text,
  TextInput, TouchableOpacity,
  View
} from 'react-native';

// Importaciones
import { registerForPushNotifications, sendPushNotification } from '../lib/registerPushToken';
import { supabase } from '../lib/supabase';

// Configurar comportamiento para notificaciones en primer plano
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
    url: 'https://www.youtube.com/watch?v=Wi1Tt4ewW0c&list=PL9eGAPSt61HBiFmTF93TXu2J0qJntrl3u'
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
  const [memberId, setMemberId] = useState(null);
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [currentScreen, setCurrentScreen] = useState('Inicio');
  const [scanning, setScanning] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [showOptions, setShowOptions] = useState(false);
  const [showOptionsGrupos, setShowOptionsGrupos] = useState(false);
  const [celular, setCelular] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [edad, setEdad] = useState('');
  const [perteneceGrupo, setPerteneceGrupo] = useState('');
  const [cursoSeleccionado, setCursoSeleccionado] = useState('Fundamentos cristianos');
  const [grupoSeleccionado, setGrupoSeleccionado] = useState('Seleccionar un Grupo');
  const [listaPedidosOracion, setListaPedidosOracion] = useState([]);
  const [rachaUsuario, setRachaUsuario] = useState(0);
  const [asistenciasDetalle, setAsistenciasDetalle] = useState([]);
  const [rankingTop10, setRankingTop10] = useState([]);
  const [showRanking, setShowRanking] = useState(false);
  const [posicionUsuario, setPosicionUsuario] = useState(null);
  const [showHistorial, setShowHistorial] = useState(false);

  const opcionesCursos = ["Fundamentos cristianos", "Instituto Bíblico", "Escuela de Música", "Escuela de Adoración", "Escuela de Música Kids", "Escuela de Orientación", "Familiar", "Academia de Arte", "Oración y Consejeria", "Talleres de formación biblica", "Liderazgo"];
  const opcionesGrupos = ["Jóvenes", "Matrimonios", "Hombres", "Mujeres", "Adultos Mayores", "Pre-Adolescentes"];

  const flatListRef = useRef(null);
  const indexRef = useRef(0);
  const slideAnim = useRef(new Animated.Value(-width * 0.75)).current;

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
    if (currentScreen === 'Necesito Oración') cargarPedidos();
  }, [currentScreen]);

  useEffect(() => {
    if (isLoggedIn && memberId) {
      calcularRacha();
    }
  }, [isLoggedIn, memberId]);

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
          registerForPushNotifications(savedMemberId);
        }
      } catch (e) {
        console.error("Error cargando sesión", e);
      } finally {
        setLoading(false);
      }
    };
    loadSession();
  }, []);

  const handleOpenYoutube = async (url) => {
    if (!url) return;

    // 1. Extraemos el ID del video del link de YouTube
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = (match && match[7].length === 11) ? match[7] : null;

    if (videoId) {
      // 2. Creamos el link específico para abrir la APP de YouTube
      const appUrl = `vnd.youtube://${videoId}`;

      try {
        // 3. Intentamos abrir la app directamente
        const supported = await Linking.canOpenURL(appUrl);
        if (supported) {
          await Linking.openURL(appUrl);
        } else {
          // Si no tiene la app instalada, abrimos el link normal en el navegador
          await Linking.openURL(url);
        }
      } catch (error) {
        // Si hay cualquier error, usamos el navegador como respaldo
        await Linking.openURL(url);
      }
    } else {
      // Si no es un link de video (es un canal o lista), abrimos normal
      await Linking.openURL(url);
    }
  };

  const handlePressNoticia = (item) => {
    if (item.url) {
      handleOpenYoutube(item.url);
    } else if (item.screen) {
      navigateTo(item.screen);
    }
  };

  const enviarYBorrar = async (tabla, datos, mensajeExito) => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.from(tabla).insert([datos]).select();
      if (error) throw error;
      if (data) await supabase.from(tabla).delete().eq('id', data[0].id);
      Alert.alert("Enviado", mensajeExito, [{ text: "OK", onPress: () => setCurrentScreen('Inicio') }]);
      setCelular(''); setMensaje(''); setEdad(''); setPerteneceGrupo('');
    } catch (e) {
      Alert.alert("Error", "No se pudo enviar la solicitud.");
    } finally {
      setIsProcessing(false);
    }
  };

  const cargarPedidos = async () => {
    const { data } = await supabase
      .from('pedidos_oracion')
      .select('*')
      .order('id', { ascending: false });
    if (data) setListaPedidosOracion(data);
  };

  const calcularRacha = async () => {
    try {
      const hace30Dias = new Date();
      hace30Dias.setDate(hace30Dias.getDate() - 30);
      const fechaLimite = hace30Dias.toISOString().split('T')[0];

      const { data } = await supabase
        .from('asistencias')
        .select('id, fecha, horario_reunion')
        .eq('miembro_id', memberId)
        .gte('fecha', fechaLimite)
        .order('fecha', { ascending: false });

      const racha = data?.length || 0;
      setRachaUsuario(racha);
      setAsistenciasDetalle(data || []);

      // Detectar si alcanzó nuevo nivel y notificar
      const niveles = [5, 10, 20, 30];
      const premios = {
        5: { emoji: '⭐', nombre: 'Sticker IDS' },
        10: { emoji: '☕', nombre: 'Café Gratis' },
        20: { emoji: '📚', nombre: 'Libro Cristiano' },
        30: { emoji: '🎟️', nombre: 'Entrada a Retiro' }
      };

      // Verificar si acaba de alcanzar un nivel (esto se podría mejorar guardando el último nivel notificado)
      niveles.forEach(nivel => {
        if (racha === nivel) {
          const premio = premios[nivel];
          Alert.alert(
            "🎉 ¡Felicitaciones!",
            `Alcanzaste ${nivel} asistencias.\n\n${premio.emoji} ¡Ganaste: ${premio.nombre}!\n\nReclamalo en la iglesia.",
            [{ text: "¡Genial!" }]
          );
        }
      });
    } catch (e) {
      console.error("Error calculando racha:", e);
    }
  };

  const cargarRanking = async () => {
    try {
      const hace30Dias = new Date();
      hace30Dias.setDate(hace30Dias.getDate() - 30);
      const fechaLimite = hace30Dias.toISOString().split('T')[0];

      // Obtener todos los miembros
      const { data: miembros } = await supabase
        .from('miembros')
        .select('id, nombre, apellido');

      if (!miembros) return;

      // Calcular racha de cada miembro
      const miembrosConRacha = await Promise.all(
        miembros.map(async (m) => {
          const { data: asistencias } = await supabase
            .from('asistencias')
            .select('id')
            .eq('miembro_id', m.id)
            .gte('fecha', fechaLimite);
          
          return {
            ...m,
            racha: asistencias?.length || 0
          };
        })
      );

      // Ordenar por racha descendente
      const ranking = miembrosConRacha
        .sort((a, b) => b.racha - a.racha)
        .filter(m => m.racha > 0); // Solo mostrar los que tienen al menos 1 asistencia

      // Top 10
      setRankingTop10(ranking.slice(0, 10));

      // Encontrar posición del usuario actual
      const posicion = ranking.findIndex(m => m.id === memberId) + 1;
      setPosicionUsuario(posicion > 0 ? posicion : null);

    } catch (e) {
      console.error("Error cargando ranking:", e);
    }
  };


  const avisarQueOro = async (pedido) => {
    try {
      const { error: updateError } = await supabase
        .from('pedidos_oracion')
        .update({ contador_oraciones: (pedido.contador_oraciones || 0) + 1 })
        .eq('id', pedido.id);

      if (updateError) throw updateError;

      const { data: tokenData, error: tokenError } = await supabase
        .from('miembros')
        .select('token_notificacion')
        .eq('id', pedido.miembro_id)
        .single();

      if (tokenData?.token_notificacion) {
        await sendPushNotification(
          tokenData.token_notificacion,
          "¡Están orando por vos! 🙏",
          `${ nombre } se unió en oración por tu pedido.`
        );
      }

      await cargarPedidos();
      Alert.alert("Amén", "Te has unido a esta oración.");

    } catch (e) {
      console.error("Error al orar:", e);
      Alert.alert("Error", "No se pudo registrar tu oración.");
    }
  };

  const openSocial = async (url, appUrl) => {
    try {
      // Intentamos abrir la APP primero (Android 11+ devuelve false en canOpenURL si no se configura queries)
      await Linking.openURL(appUrl);
    } catch (error) {
      // Si falla (no tiene la app), abrimos el navegador
      await Linking.openURL(url);
    }
  };

  const handleLogin = async () => {
    const nombreLimpio = nombre.trim();
    const apellidoLimpio = apellido.trim();
    if (!nombreLimpio || !apellidoLimpio) {
      Alert.alert("Error", "Completa tus datos");
      return;
    }
    setLoading(true);
    try {
      let finalId = memberId;
      if (memberId) {
        await supabase.from('miembros').update({ nombre: nombreLimpio, apellido: apellidoLimpio }).eq('id', memberId);
      } else {
        const { data: existentes } = await supabase.from('miembros').select('*').eq('nombre', nombreLimpio).eq('apellido', apellidoLimpio);
        if (existentes && existentes.length > 0) finalId = existentes[0].id;
        else {
          const { data: nuevo } = await supabase.from('miembros').insert([{ nombre: nombreLimpio, apellido: apellidoLimpio }]).select();
          if (nuevo) finalId = nuevo[0].id;
        }
      }
      if (finalId) {
        await AsyncStorage.setItem('memberId', finalId.toString());
        await AsyncStorage.setItem('nombre', nombreLimpio);
        await AsyncStorage.setItem('apellido', apellidoLimpio);
        setMemberId(finalId);
        setIsLoggedIn(true);
        registerForPushNotifications(finalId);
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
      Alert.alert("Error", "QR no válido.");
      return;
    }
    setIsProcessing(true);
    try {
      const ahora = new Date();
      const opciones = { timeZone: "America/Argentina/Buenos_Aires", hour: '2-digit', minute: '2-digit', hour12: false };
      const horaArg = ahora.toLocaleTimeString("es-AR", opciones);
      const [h] = horaArg.split(':').map(Number);
      const fecha = ahora.toLocaleDateString('en-CA', { timeZone: "America/Argentina/Buenos_Aires" });

      let bloque = "Extraoficial";
      if (h >= 8 && h < 10) bloque = "09:00";
      else if (h >= 10 && h <= 12) bloque = "11:00";
      else if (h >= 19 && h < 21) bloque = "20:00";

      const { data: ex } = await supabase.from('asistencias').select('id').eq('miembro_id', memberId).eq('fecha', fecha).eq('horario_reunion', bloque);
      if (ex && ex.length > 0) {
        Alert.alert("Aviso", "Asistencia ya registrada.");
        return;
      }
      await supabase.from('asistencias').insert([{ miembro_id: memberId, fecha, hora_entrada: horaArg, horario_reunion: bloque }]);
      Alert.alert("Éxito", `Bienvenido a la reunión de las ${ bloque }`);
    } catch (e) {
      Alert.alert("Error", "Error al procesar.");
    } finally {
      setIsProcessing(false);
    }
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
        <TouchableOpacity style={styles.editBtn} onPress={() => { setIsLoggedIn(false); if (isMenuOpen) toggleMenu(); }}>
          <Text style={{ color: '#c5ff00', fontWeight: 'bold' }}>MODIFICAR MIS DATOS</Text>
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
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          <View style={styles.carruselSection}>
            <FlatList
              ref={flatListRef} data={NOTICIAS} horizontal pagingEnabled keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={styles.slide}>
                  <TouchableOpacity activeOpacity={0.9} onPress={() => handlePressNoticia(item)}>
                    <ImageBackground source={{ uri: item.image }} style={styles.slideImage} imageStyle={{ borderRadius: 25 }}>
                      <View style={styles.slideOverlay}><Text style={styles.slideTitle}>{item.title}</Text></View>
                    </ImageBackground>
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>

          {/* TARJETA DE RACHA */}
          <View style={styles.rachaCard}>
            <Text style={styles.rachaTitle}>🔥 TU RACHA DE ASISTENCIA</Text>
            
            {/* Barra de Progreso con Estrellas */}
            <View style={styles.starsContainer}>
              {[...Array(10)].map((_, i) => (
                <Text key={i} style={{ fontSize: 24, marginHorizontal: 2 }}>
                  {i < rachaUsuario ? '⭐' : '⚪'}
                </Text>
              ))}
            </View>
            
            <Text style={styles.rachaText}>
              {rachaUsuario} de 10 asistencias
            </Text>
            
            {rachaUsuario < 10 && (
              <Text style={styles.motivacion}>
                ¡Te faltan {10 - rachaUsuario} para tu próximo premio!
              </Text>
            )}
            
            {rachaUsuario >= 5 && (
              <View style={styles.premioBox}>
                <Text style={styles.premioText}>
                  {rachaUsuario >= 30 ? '🎟️ Premio: Entrada a Retiro' :
                   rachaUsuario >= 20 ? '📚 Premio: Libro Cristiano' :
                   rachaUsuario >= 10 ? '☕ Premio: Café Gratis' :
                   '⭐ Premio: Sticker IDS'}
                </Text>
              </View>
            )}
            
            {/* Botón Ver Ranking */}
            <TouchableOpacity 
              style={styles.rankingButton} 
              onPress={async () => {
                await cargarRanking();
                setShowRanking(true);
              }}
            >
              <FontAwesome name="trophy" size={16} color="#000" />
              <Text style={styles.rankingButtonText}>VER RANKING TOP 10</Text>
            </TouchableOpacity>
            
            {/* Botón Ver Historial */}
            <TouchableOpacity 
              style={styles.historialButton} 
              onPress={() => setShowHistorial(true)}
            >
              <FontAwesome name="calendar" size={16} color="#000" />
              <Text style={styles.historialButtonText}>VER MI HISTORIAL</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.whatsappButton} onPress={() => Linking.openURL('https://whatsapp.com/channel/0029VaT0L9rEgGfRVvKIZ534')}>
            <FontAwesome name="whatsapp" size={20} color="white" style={{ marginRight: 10 }} />
            <Text style={styles.whatsappText}>Súmate al Canal de WhatsApp</Text>
          </TouchableOpacity>

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
              <ActionCard title="Sumarme a un Grupo" icon="users" image="https://acvxjhecpgmauqqzmjik.supabase.co/storage/v1/object/public/imagenes-iglesia/Grupo.jpg" onPress={() => navigateTo('Sumarme a un Grupo')} />
              <ActionCard title="Reunion En Vivo" icon="video-camera" image="https://acvxjhecpgmauqqzmjik.supabase.co/storage/v1/object/public/imagenes-iglesia/Vivo.jpg" onPress={() => Linking.openURL('https://youtube.com/@iglesiadelsalvador/live')} />
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
              <TouchableOpacity onPress={() => Linking.openURL('https://instagram.com/iglesiadelsalvador')}><FontAwesome name="instagram" size={28} color="#E1306C" /></TouchableOpacity>
              <TouchableOpacity onPress={() => Linking.openURL('https://www.tiktok.com/@iglesiadelsalvador')}><FontAwesome5 name="tiktok" size={24} color="#FFFFFF" /></TouchableOpacity>
              <TouchableOpacity onPress={() => openSocial('https://facebook.com/iglesiadelsalvador', 'fb://page/100064344075195')}><FontAwesome name="facebook" size={28} color="#4267B2" /></TouchableOpacity>
              <TouchableOpacity onPress={() => openSocial('https://youtube.com/@iglesiadelsalvador', 'vnd.youtube://www.youtube.com/@iglesiadelsalvador')}><FontAwesome name="youtube-play" size={28} color="#FF0000" /></TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      ) : (
        <ScrollView style={styles.pageContainer}>
          <TouchableOpacity onPress={() => setCurrentScreen('Inicio')} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <FontAwesome name="arrow-left" color="#c5ff00" size={18} /><Text style={styles.backTxt}> Volver</Text>
          </TouchableOpacity>

          {currentScreen === 'Quiero Ayudar' && (
            <View>
              <Text style={styles.sectionTitle}>Donaciones</Text>
              <TouchableOpacity style={styles.mpBtn} onPress={() => Linking.openURL('https://link.mercadopago.com.ar/iglesiadelsalvador')}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>MERCADO PAGO ONLINE</Text>
              </TouchableOpacity>
              <View style={styles.bankBox}>
                <Text style={{ color: '#c5ff00', fontWeight: 'bold' }}>CBU PESOS: 0170008420000001007530</Text>
                <Text style={{ color: '#fff', fontSize: 12, marginTop: 5 }}>ALIAS: IDS.BBVA.CCPESOS | CUIT: 30-53174084-6</Text>
              </View>
            </View>
          )}

          {currentScreen === 'Necesito Ayuda' && (
            <View>
              <Text style={styles.sectionTitle}>Escribinos</Text>
              <TextInput style={styles.inputForm} placeholder="Tu número de Celular" placeholderTextColor="#888" onChangeText={setCelular} keyboardType="phone-pad" />
              <TextInput style={[styles.inputForm, { height: 100 }]} placeholder="¿Cómo podemos ayudarte?" placeholderTextColor="#888" multiline onChangeText={setMensaje} />
              <TouchableOpacity style={styles.submitBtn} onPress={() => enviarYBorrar('consultas_ayuda', { nombre, celular, mensaje }, "Recibimos tu mensaje.")}>
                <Text style={styles.submitBtnTxt}>ENVIAR</Text>
              </TouchableOpacity>
            </View>
          )}

          {currentScreen === 'Quiero Bautizarme' && (
            <View>
              <Text style={styles.sectionTitle}>Bautismos</Text>
              <TextInput style={styles.inputForm} placeholder="¿Qué edad tienes?" placeholderTextColor="#888" onChangeText={setEdad} keyboardType="numeric" />
              <TextInput style={styles.inputForm} placeholder="¿Perteneces a un grupo? (Si/No)" placeholderTextColor="#888" onChangeText={setPerteneceGrupo} />
              <TextInput style={styles.inputForm} placeholder="Celular" placeholderTextColor="#888" onChangeText={setCelular} keyboardType="phone-pad" />
              <TouchableOpacity style={styles.submitBtn} onPress={() => enviarYBorrar('solicitudes_bautismo', { nombre_completo: `${ nombre } ${ apellido }`, edad, pertenece_grupo: perteneceGrupo, celular }, "Solicitud enviada.")}>
                <Text style={styles.submitBtnTxt}>SOLICITAR MI BAUTISMO</Text>
              </TouchableOpacity>
            </View>
          )}

          {currentScreen === 'Quiero Capacitarme' && (
            <View>
              <Text style={styles.sectionTitle}>Cursos IDS</Text>
              <Text style={{ color: '#888', marginBottom: 10, fontSize: 13 }}>Seleccioná un curso:</Text>
              <TouchableOpacity style={styles.dropdownSelector} onPress={() => setShowOptions(!showOptions)}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>{cursoSeleccionado}</Text>
                <FontAwesome name={showOptions ? "chevron-up" : "chevron-down"} size={14} color="#c5ff00" />
              </TouchableOpacity>
              {showOptions && (
                <View style={styles.dropdownContainer}>
                  {opcionesCursos.map((c) => (
                    <TouchableOpacity key={c} style={styles.dropdownItem} onPress={() => { setCursoSeleccionado(c); setShowOptions(false); }}>
                      <Text style={{ color: cursoSeleccionado === c ? '#c5ff00' : '#fff', fontWeight: cursoSeleccionado === c ? 'bold' : 'normal' }}>{c}</Text>
                      {cursoSeleccionado === c && <FontAwesome name="check" size={12} color="#c5ff00" />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <View style={{ marginTop: 20 }}>
                <TextInput style={styles.inputForm} placeholder="Celular para info" placeholderTextColor="#888" value={celular} onChangeText={setCelular} keyboardType="phone-pad" />
                <TouchableOpacity style={styles.submitBtn} onPress={() => enviarYBorrar('solicitudes_capacitacion', { nombre_completo: `${ nombre } ${ apellido }`, curso_interes: cursoSeleccionado, celular }, "Te enviaremos la info.")}>
                  <Text style={styles.submitBtnTxt}>INSCRIBIRME</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {currentScreen === 'Sumarme a un Grupo' && (
            <View>
              <Text style={styles.sectionTitle}>Grupos de Conexión</Text>
              <Text style={{ color: '#888', marginBottom: 10, fontSize: 13 }}>Elegí un grupo para sumarte:</Text>
              <TouchableOpacity style={styles.dropdownSelector} onPress={() => setShowOptionsGrupos(!showOptionsGrupos)}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>{grupoSeleccionado}</Text>
                <FontAwesome name={showOptionsGrupos ? "chevron-up" : "chevron-down"} size={14} color="#c5ff00" />
              </TouchableOpacity>
              {showOptionsGrupos && (
                <View style={styles.dropdownContainer}>
                  {opcionesGrupos.map((g) => (
                    <TouchableOpacity key={g} style={styles.dropdownItem} onPress={() => { setGrupoSeleccionado(g); setShowOptionsGrupos(false); }}>
                      <Text style={{ color: grupoSeleccionado === g ? '#c5ff00' : '#fff', fontWeight: grupoSeleccionado === g ? 'bold' : 'normal' }}>{g}</Text>
                      {grupoSeleccionado === g && <FontAwesome name="check" size={12} color="#c5ff00" />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <View style={{ marginTop: 20 }}>
                <TextInput style={styles.inputForm} placeholder="Tu Celular" placeholderTextColor="#888" value={celular} onChangeText={setCelular} keyboardType="phone-pad" />
                <TouchableOpacity style={styles.submitBtn} onPress={() => {
                  if (grupoSeleccionado === 'Seleccionar un Grupo') { Alert.alert("Aviso", "Por favor elegí un grupo."); return; }
                  enviarYBorrar('solicitudes_grupos', { nombre_completo: `${ nombre } ${ apellido }`, grupo_interes: grupoSeleccionado, celular }, "¡Genial! El líder del grupo se contactará con vos.");
                }}>
                  <Text style={styles.submitBtnTxt}>QUIERO SUMARME</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {currentScreen === 'Soy Nuevo' && (
            <View>
              <Text style={styles.sectionTitle}>¡Bienvenido!</Text>
              <TextInput style={styles.inputForm} placeholder="Celular" placeholderTextColor="#888" onChangeText={setCelular} keyboardType="phone-pad" />
              <TextInput style={[styles.inputForm, { height: 100 }]} placeholder="¿Cómo llegaste a la iglesia?" placeholderTextColor="#888" multiline onChangeText={setMensaje} />
              <TouchableOpacity style={styles.submitBtn} onPress={() => enviarYBorrar('nuevos_miembros', { nombre, celular, mensaje }, "¡Gracias por contactarnos!")}>
                <Text style={styles.submitBtnTxt}>ENVIAR MIS DATOS</Text>
              </TouchableOpacity>
            </View>
          )}

          {currentScreen === 'Necesito Oración' && (
            <View>
              <Text style={styles.sectionTitle}>Pedido de Oración</Text>
              <TextInput style={styles.inputForm} placeholder="Tu pedido..." placeholderTextColor="#888" value={mensaje} onChangeText={setMensaje} multiline />
              <TouchableOpacity style={styles.submitBtn} onPress={async () => {
                if (!mensaje.trim()) { Alert.alert("Aviso", "Por favor, escribe un pedido."); return; }
                try {
                  const { error } = await supabase.from('pedidos_oracion').insert([{ nombre_solicitante: nombre, pedido: mensaje, miembro_id: memberId }]);
                  if (error) { Alert.alert("Error de Envío", error.message); }
                  else { setMensaje(''); Alert.alert("¡Enviado!", "Tu pedido ha sido publicado."); await cargarPedidos(); }
                } catch (e) { Alert.alert("Error", "Ocurrió un problema de conexión."); }
              }}>
                <Text style={styles.submitBtnTxt}>PUBLICAR PEDIDO</Text>
              </TouchableOpacity>
              <View style={{ marginTop: 20 }}>
                {listaPedidosOracion.map(p => (
                  <View key={p.id} style={styles.pedidoBox}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: '#c5ff00', fontWeight: 'bold', fontSize: 16 }}>{p.nombre_solicitante}</Text>
                      <FontAwesome name="quote-right" size={12} color="#333" />
                    </View>
                    <Text style={{ color: '#fff', marginTop: 8, fontSize: 15, fontStyle: 'italic', lineHeight: 22 }}>"{p.pedido}"</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 15, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#222' }}>
                      <FontAwesome name="heart" size={14} color="#ff4444" /><Text style={{ color: '#aaa', fontSize: 13, marginLeft: 8 }}>{p.contador_oraciones || 0} personas se unieron en oración</Text>
                    </View>
                    <TouchableOpacity style={[styles.oroBtn, { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }]} onPress={() => avisarQueOro(p)}>
                      <MaterialCommunityIcons name="hands-pray" size={18} color="black" /><Text style={{ fontWeight: 'bold', fontSize: 13, color: '#000' }}>UNIRME EN ORACIÓN</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          {(currentScreen === 'Agenda' || currentScreen === 'Nosotros' || currentScreen === 'Contacto') && (
            <View>
              <Text style={styles.sectionTitle}>{currentScreen}</Text>
              <View style={styles.bankBox}><Text style={{ color: '#fff' }}>Sección {currentScreen} en desarrollo.</Text></View>
            </View>
          )}
        </ScrollView>
      )}

      {scanning && (
        <View style={styles.cameraContainer}>
          <CameraView style={StyleSheet.absoluteFillObject} facing="back" onBarcodeScanned={handleBarCodeScanned} />
          <TouchableOpacity style={styles.cancelButton} onPress={() => setScanning(false)}><Text style={styles.cancelText}>CERRAR</Text></TouchableOpacity>
        </View>
      )}

      {/* MODAL DE RANKING */}
      {showRanking && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🏆 RANKING TOP 10</Text>
              <TouchableOpacity onPress={() => setShowRanking(false)}>
                <FontAwesome name="close" size={24} color="#c5ff00" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={{ maxHeight: 400 }}>
              {rankingTop10.map((miembro, index) => {
                const esMiPosicion = miembro.id === memberId;
                const medalla = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${ index + 1}.`;
                
                return (
                  <View 
                    key={miembro.id} 
                    style={[
                      styles.rankingItem,
                      esMiPosicion && styles.rankingItemDestacado
                    ]}
                  >
                    <Text style={styles.rankingMedalla}>{medalla}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[
                        styles.rankingNombre,
                        esMiPosicion && { color: '#c5ff00', fontWeight: 'bold' }
                      ]}>
                        {miembro.nombre} {miembro.apellido}
                        {esMiPosicion && ' (Tú)'}
                      </Text>
                    </View>
                    <View style={styles.rankingRachaBox}>
                      <Text style={styles.rankingRachaNumero}>{miembro.racha}</Text>
                      <Text style={styles.rankingRachaLabel}>🔥</Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
            
            {posicionUsuario && posicionUsuario > 10 && (
              <View style={styles.tuPosicionBox}>
                <Text style={styles.tuPosicionText}>
                  Tu posición: #{posicionUsuario} con {rachaUsuario} asistencias
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* MODAL DE HISTORIAL */}
      {showHistorial && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📅 MI HISTORIAL</Text>
              <TouchableOpacity onPress={() => setShowHistorial(false)}>
                <FontAwesome name="close" size={24} color="#c5ff00" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={{ maxHeight: 400 }}>
              {asistenciasDetalle.slice(0, 10).map((asist: any) => {
                const fecha = new Date(asist.fecha);
                const dia = fecha.getDate();
                const mes = fecha.getMonth() + 1;
                
                return (
                  <View key={asist.id} style={styles.historialItem}>
                    <View style={styles.historialFecha}>
                      <Text style={styles.historialDia}>{dia}</Text>
                      <Text style={styles.historialMes}>/{mes}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historialHorario}>{asist.horario_reunion}</Text>
                      <Text style={styles.historialFechaCompleta}>{asist.fecha}</Text>
                    </View>
                    <View style={styles.historialBadge}>
                      <Text>✅</Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const DrawerItem = ({ label, icon, active, onPress }) => (
  <TouchableOpacity style={[styles.drawerItem, active && styles.drawerActiveItem]} onPress={onPress}>
    <FontAwesome name={icon} size={20} color={active ? '#c5ff00' : 'white'} />
    <Text style={[styles.drawerItemText, active && { color: '#c5ff00' }]}> {label}</Text>
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
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  cardContainer: { width: (width - 45) / 2, height: 110, borderRadius: 15, overflow: 'hidden' },
  cardImg: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  cardOverlay: { backgroundColor: 'rgba(0,0,0,0.5)', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  cardText: { color: 'white', fontWeight: 'bold', marginTop: 8, fontSize: 12 },
  assistButton: { backgroundColor: '#c5ff00', margin: 15, padding: 20, borderRadius: 20, alignItems: 'center' },
  assistButtonText: { color: 'black', fontWeight: 'bold', fontSize: 16 },
  socialSection: { alignItems: 'center', marginTop: 20 },
  socialTitle: { color: '#888', fontSize: 11, fontWeight: 'bold', marginBottom: 15 },
  socialIconsRow: { flexDirection: 'row', gap: 30, alignItems: 'center' },
  pageContainer: { flex: 1, padding: 20 },
  backTxt: { color: '#c5ff00', fontWeight: 'bold' },
  sectionTitle: { color: '#c5ff00', fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  inputForm: { backgroundColor: '#1e1e1e', borderRadius: 12, padding: 15, color: 'white', marginBottom: 15, borderWidth: 1, borderColor: '#333' },
  submitBtn: { backgroundColor: '#c5ff00', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  submitBtnTxt: { color: 'black', fontWeight: 'bold' },
  mpBtn: { backgroundColor: '#009ee3', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 15 },
  bankBox: { backgroundColor: '#1e1e1e', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#333' },
  dropdownSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e1e1e', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#333' },
  dropdownContainer: { backgroundColor: '#1e1e1e', borderRadius: 12, marginTop: 5, padding: 5, borderWidth: 1, borderColor: '#333' },
  dropdownItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#222' },
  pedidoBox: { backgroundColor: '#161616', padding: 20, borderRadius: 20, marginBottom: 15, borderWidth: 1, borderColor: '#222' },
  oroBtn: { backgroundColor: '#c5ff00', padding: 12, borderRadius: 12, marginTop: 15, alignItems: 'center' },
  cameraContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2000, backgroundColor: 'black' },
  cancelButton: { position: 'absolute', bottom: 50, alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.3)', padding: 15, borderRadius: 30 },
  cancelText: { color: 'white', fontWeight: 'bold' },
  // Estilos de Gamificación
  rachaCard: { backgroundColor: '#1e1e1e', margin: 15, padding: 20, borderRadius: 20, borderWidth: 2, borderColor: '#c5ff00' },
  rachaTitle: { color: '#c5ff00', fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  starsContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 15, flexWrap: 'wrap' },
  rachaText: { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 5 },
  motivacion: { color: '#888', fontSize: 13, textAlign: 'center', fontStyle: 'italic' },
  premioBox: { backgroundColor: '#c5ff00', padding: 12, borderRadius: 12, marginTop: 15 },
  premioText: { color: '#000', fontWeight: 'bold', textAlign: 'center', fontSize: 14 },
  rankingButton: { flexDirection: 'row', backgroundColor: '#FFB400', padding: 12, borderRadius: 12, marginTop: 15, justifyContent: 'center', alignItems: 'center', gap: 8 },
  rankingButtonText: { color: '#000', fontWeight: 'bold', fontSize: 13 },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', zIndex: 3000 },
  modalContent: { backgroundColor: '#1e1e1e', width: '90%', maxHeight: '80%', borderRadius: 20, padding: 20, borderWidth: 2, borderColor: '#c5ff00' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#c5ff00', fontSize: 20, fontWeight: 'bold' },
  rankingItem: { flexDirection: 'row', alignItems: 'center', padding: 15, marginBottom: 10, backgroundColor: '#252525', borderRadius: 12 },
  rankingItemDestacado: { backgroundColor: '#2a2a00', borderWidth: 2, borderColor: '#c5ff00' },
  rankingMedalla: { fontSize: 24, marginRight: 15, width: 40 },
  rankingNombre: { color: '#fff', fontSize: 16 },
  rankingRachaBox: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  rankingRachaNumero: { color: '#c5ff00', fontSize: 18, fontWeight: 'bold' },
  rankingRachaLabel: { fontSize: 16 },
  tuPosicionBox: { marginTop: 15, padding: 12, backgroundColor: '#333', borderRadius: 12 },
  tuPosicionText: { color: '#c5ff00', textAlign: 'center', fontWeight: 'bold' },
  historialButton: { flexDirection: 'row', backgroundColor: '#A8D500', padding: 12, borderRadius: 12, marginTop: 10, justifyContent: 'center', alignItems: 'center', gap: 8 },
  historialButtonText: { color: '#000', fontWeight: 'bold', fontSize: 13 },
  historialItem: { flexDirection: 'row', alignItems: 'center', padding: 15, marginBottom: 10, backgroundColor: '#252525', borderRadius: 12 },
  historialFecha: { marginRight: 15, alignItems: 'center', width: 50 },
  historialDia: { color: '#c5ff00', fontSize: 24, fontWeight: 'bold' },
  historialMes: { color: '#888', fontSize: 14 },
  historialHorario: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  historialFechaCompleta: { color: '#888', fontSize: 12, marginTop: 2 },
  historialBadge: { marginLeft: 'auto' },
});