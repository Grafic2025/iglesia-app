import { useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions } from 'react-native';

import { useApp } from '../context/AppContext';
import { registerForPushNotifications } from '../lib/registerPushToken';
import { supabase } from '../lib/supabase';

// screens used in renderScreen
import AgendaScreen from '../components/screens/AgendaScreen';
import HomeScreen from '../components/screens/HomeScreen';
import MessagesScreen from '../components/screens/MessagesScreen';
import NewsDetail from '../components/screens/NewsDetail';
import NotesScreen from '../components/screens/NotesScreen';
import NotificationInbox from '../components/screens/NotificationInbox';
import PrayerScreen from '../components/screens/PrayerScreen';
import ProfileScreen from '../components/screens/ProfileScreen';
import ServidoresScreen from '../components/screens/ServidoresScreen';
import SupportScreen from '../components/screens/SupportScreen';
import VideosScreen from '../components/screens/VideosScreen';

const { width } = Dimensions.get('window');

/**
 * Centraliza los estados locales y la lógica de negocio que antes vivía
 * en `app/index.tsx`. Esto facilita la lectura del componente principal
 * y permite probar los comportamientos aislados.
 */
export function useAppContentLogic() {
  const {
    isLoggedIn,
    loading,
    memberId,
    nombre,
    apellido,
    fotoUrl,
    currentScreen,
    setCurrentScreen,
    login,
    logout,
    refreshData,
    isCurrentlyLive,
    liveVideoUrl,
    esServidor,
    asistenciasDetalle,
    unreadCount,
    addNotificationToInbox,
  } = useApp();

  const [localNombre, setLocalNombre] = useState('');
  const [localApellido, setLocalApellido] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [modalVideoVisible, setModalVideoVisible] = useState(false);
  const [videoSeleccionado, setVideoSeleccionado] = useState<any>(null);
  const [noticiaSeleccionada, setNoticiaSeleccionada] = useState<any>(null);
  const [showRanking, setShowRanking] = useState(false);
  const [showHistorial, setShowHistorial] = useState(false);
  const [rankingTop10, setRankingTop10] = useState<any[]>([]);
  const [listaPedidosOracion, setListaPedidosOracion] = useState<any[]>([]);

  const slideAnim = useRef(new Animated.Value(-width * 0.8)).current;
  const screenFadeAnim = useRef(new Animated.Value(1)).current;
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);
  const [, requestPermission] = useCameraPermissions();

  const toggleMenu = () => {
    const toValue = isMenuOpen ? -width * 0.8 : 0;
    Animated.timing(slideAnim, { toValue, duration: 300, useNativeDriver: true }).start();
    setIsMenuOpen(!isMenuOpen);
  };

  const navigateTo = useCallback(
    (screen: string) => {
      Animated.timing(screenFadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
        setCurrentScreen(screen);
        if (isMenuOpen) {
          const toValue = -width * 0.8;
          Animated.timing(slideAnim, { toValue, duration: 300, useNativeDriver: true }).start();
          setIsMenuOpen(false);
        }
        Animated.timing(screenFadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      });
    },
    [screenFadeAnim, isMenuOpen, slideAnim, setCurrentScreen]
  );

  useEffect(() => {
    if (isLoggedIn && memberId) {
      // Registro inicial de token
      registerForPushNotifications(memberId);

      // Manejar notificaciones cuando la app está abierta
      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        const { title, body } = notification.request.content;
        addNotificationToInbox({ title, body });
      });

      // Manejar clic en la notificación
      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        const { data } = response.notification.request.content;

        // Si es una notificación de servicio, llevar directamente a la pantalla de Servidores
        if (data?.type === 'service_reminder') {
          navigateTo('Servidores');
        } else {
          navigateTo('Notificaciones');
        }
      });

      return () => {
        if (notificationListener.current) {
          notificationListener.current.remove();
          notificationListener.current = null;
        }
        if (responseListener.current) {
          responseListener.current.remove();
          responseListener.current = null;
        }
      };
    }
  }, [isLoggedIn, memberId, addNotificationToInbox, navigateTo]);

  useEffect(() => {
    if (!isLoggedIn && !loading) {
      if (nombre && !localNombre) setLocalNombre(nombre);
      if (apellido && !localApellido) setLocalApellido(apellido);
    }
  }, [isLoggedIn, loading, nombre, apellido]);

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync().catch(() => { });
    }
  }, [loading]);

  const handleLogin = async () => {
    if (!localNombre || !localApellido) return;
    try {
      let { data, error } = await supabase
        .from('miembros')
        .select('id')
        .ilike('nombre', localNombre.trim())
        .ilike('apellido', localApellido.trim())
        .maybeSingle();

      let finalMemberId = data?.id;
      if (!finalMemberId) {
        const { data: newMember, error: insertError } = await supabase
          .from('miembros')
          .insert([
            {
              nombre: localNombre.trim(),
              apellido: localApellido.trim(),
              created_at: new Date().toISOString(),
            },
          ])
          .select('id')
          .single();

        if (insertError) throw insertError;
        finalMemberId = newMember.id;
      }

      if (finalMemberId) {
        await login(finalMemberId, localNombre.trim(), localApellido.trim());
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: '¡Bienvenido a Iglesia del Salvador! 🙌',
              body: `Hola ${localNombre.trim()}, nos alegra que seas parte de nuestra comunidad. ¡Dios te bendiga!`,
            },
            trigger: { seconds: 3, type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL },
          });
        } catch {
          // los permisos de notificación podrían no estar activos
        }
      }
    } catch (e: any) {
      console.error('Login Error:', e);
      Alert.alert('Error', 'No se pudo iniciar sesión. Por favor intenta de nuevo.');
    }
  };

  const pickImage = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!r.canceled && r.assets[0].base64) {
      try {
        const base64 = r.assets[0].base64;
        const fileName = `profile_${memberId}.jpg`;
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const arrayBuffer = bytes.buffer;

        const { error: uploadError } = await supabase.storage
          .from('perfiles')
          .upload(fileName, arrayBuffer, {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('perfiles').getPublicUrl(fileName);
        const finalUrl = `${publicUrl}?t=${Date.now()}`;
        const { error: updateError } = await supabase
          .from('miembros')
          .update({ foto_url: finalUrl })
          .eq('id', memberId);

        if (updateError) throw updateError;

        await refreshData();
        Alert.alert('¡Éxito!', 'Tu foto de perfil se ha actualizado correctamente. 🙌');
      } catch (err: any) {
        console.error('Error al subir foto:', err);
        Alert.alert('Error de Subida', `No se pudo procesar la imagen: ${err.message || 'Error de base64'}`);
      }
    }
  };

  const cargarRanking = async () => {
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);
    const { data: asist } = await supabase
      .from('asistencias')
      .select('miembro_id')
      .gte('fecha', hace30Dias.toISOString().split('T')[0]);
    const { data: mbs } = await supabase
      .from('miembros')
      .select('id, nombre, apellido');
    if (mbs && asist) {
      setRankingTop10(
        mbs
          .map((m) => ({
            ...m,
            racha: asist.filter((a) => a.miembro_id === m.id).length,
          }))
          .sort((a, b) => b.racha - a.racha)
          .slice(0, 10)
      );
    }
  };

  const cargarPedidos = async () => {
    const { data } = await supabase
      .from('pedidos_oracion')
      .select('*, miembros(nombre, token_notificacion)')
      .order('fecha', { ascending: false })
      .limit(50);
    if (data) setListaPedidosOracion(data);
  };

  const [showSuccessScan, setShowSuccessScan] = useState(false);

  const handleBarCodeScanned = async ({ data }: any) => {
    setScanning(false);
    if (data === 'PRESENTE_IDS') {
      const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
      const hora = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

      const { error } = await supabase.from('asistencias').insert([
        { miembro_id: memberId, fecha: hoy, hora_entrada: hora, horario_reunion: 'General' },
      ]);

      if (error) {
        Alert.alert('Error', 'Ya registraste tu asistencia hoy.');
      } else {
        setShowSuccessScan(true);
        setTimeout(() => setShowSuccessScan(false), 3000);
        refreshData();
      }
    } else {
      Alert.alert('QR Inválido', 'Este código no es de nuestra iglesia.');
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'Inicio':
        return (
          <HomeScreen
            navigateTo={navigateTo}
            setVideoSeleccionado={setVideoSeleccionado}
            setModalVideoVisible={setModalVideoVisible}
            setScanning={setScanning}
            requestPermission={requestPermission}
            cargarRanking={cargarRanking}
            setShowRanking={setShowRanking}
            setShowHistorial={setShowHistorial}
            setNoticiaSeleccionada={setNoticiaSeleccionada}
            toggleMenu={toggleMenu}
          />
        );
      case 'Mi Perfil':
        return (
          <ProfileScreen
            navigateTo={navigateTo}
            pickImage={pickImage}
            handleModificarDatos={() =>
              Alert.alert('Próximamente', 'Podrás editar tus datos pronto.')
            }
          />
        );
      case 'Agenda':
        return <AgendaScreen navigateTo={navigateTo} />;
      case 'Necesito Oración':
        return (
          <PrayerScreen
            navigateTo={navigateTo}
            cargarPedidos={cargarPedidos}
            listaPedidosOracion={listaPedidosOracion}
          />
        );
      case 'Notificaciones':
        return <NotificationInbox navigateTo={navigateTo} />;
      case 'Mis Notas':
        return <NotesScreen navigateTo={navigateTo} />;
      case 'Mensajes':
        return <MessagesScreen navigateTo={navigateTo} />;
      case 'Videos':
        return <VideosScreen navigateTo={navigateTo} />;
      case 'NewsDetail':
        return (
          <NewsDetail
            news={noticiaSeleccionada}
            navigateTo={navigateTo}
          />
        );
      case 'Servidores':
        return <ServidoresScreen navigateTo={navigateTo} />;
      case 'Contacto':
        return (
          <SupportScreen navigateTo={navigateTo} type="Contacto" />
        );
      default:
        return <SupportScreen navigateTo={navigateTo} type={currentScreen} />;
    }
  };

  const handleLogout = async () => {
    console.log("[UI-LOGOUT] Botón presionado.");

    // 1. Resetear el estado de la pantalla antes de empezar el cierre
    console.log("[UI-LOGOUT] Reseteando pantalla a Inicio...");
    setCurrentScreen('Inicio');

    // 2. Cerrar el menú si está abierto
    if (isMenuOpen) {
      console.log("[UI-LOGOUT] Cerrando menú lateral...");
      setIsMenuOpen(false);
      // No esperamos a la animación para no retrasar el proceso
      const toValue = -width * 0.8;
      Animated.timing(slideAnim, { toValue, duration: 150, useNativeDriver: true }).start();
    }

    // 3. Pequeña pausa para dejar que el hilo de la UI respire
    console.log("[UI-LOGOUT] Esperando 100ms para estabilizar UI...");
    setTimeout(async () => {
      try {
        console.log("[UI-LOGOUT] Llamando a logout() del contexto...");
        await logout();
      } catch (e) {
        console.error("[UI-LOGOUT] ERROR en la transición:", e);
      }
    }, 100);
  };

  return {
    // estados locales
    localNombre,
    setLocalNombre,
    localApellido,
    setLocalApellido,
    isMenuOpen,
    toggleMenu,
    scanning,
    setScanning,
    modalVideoVisible,
    setModalVideoVisible,
    videoSeleccionado,
    setVideoSeleccionado,
    noticiaSeleccionada,
    setNoticiaSeleccionada,
    showRanking,
    setShowRanking,
    showHistorial,
    setShowHistorial,
    rankingTop10,
    listaPedidosOracion,
    setListaPedidosOracion,
    showSuccessScan,
    // animaciones y permisos
    slideAnim,
    screenFadeAnim,
    requestPermission,
    // funciones de negocio
    handleLogin,
    pickImage,
    cargarRanking,
    cargarPedidos,
    handleBarCodeScanned,
    navigateTo,
    renderScreen,
    // información que sigue viniendo del contexto para uso en componentes
    isCurrentlyLive,
    liveVideoUrl,
    currentScreen,
    unreadCount,
    nombre,
    apellido,
    fotoUrl,
    esServidor,
    asistenciasDetalle,
    refreshData,
    logout: handleLogout,
  };
}
