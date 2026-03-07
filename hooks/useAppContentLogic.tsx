import { useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions } from 'react-native';

import { useApp } from '../context/AppContext';
import { registerForPushNotifications } from '../lib/registerPushToken';
import { supabase } from '../lib/supabase';

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
    login,
    logout,
    deleteAccount,
    refreshData,
    isCurrentlyLive,
    liveVideoUrl,
    esServidor,
    asistenciasDetalle,
    unreadCount,
    addNotificationToInbox,
    setDeepLinkTarget,
  } = useApp();

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
  const router = useRouter();

  const toggleMenu = () => {
    const toValue = isMenuOpen ? -width * 0.8 : 0;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
    Animated.timing(slideAnim, { toValue, duration: 300, useNativeDriver: true }).start();
    setIsMenuOpen(!isMenuOpen);
  };

  const navigateTo = useCallback(
    (screen: string) => {
      if (isMenuOpen) {
        const toValue = -width * 0.8;
        Animated.timing(slideAnim, { toValue, duration: 300, useNativeDriver: true }).start();
        setIsMenuOpen(false);
      }

      switch (screen) {
        case 'Inicio': router.replace('/(app)'); break;
        case 'Mi Perfil': router.replace('/(app)/perfil'); break;
        case 'Agenda': router.replace('/(app)/agenda'); break;
        case 'Necesito Oración': router.replace('/(app)/oracion'); break;
        case 'Notificaciones': router.replace('/(app)/notificaciones'); break;
        case 'Mis Notas': router.replace('/(app)/notas'); break;
        case 'Mensajes': router.replace('/(app)/mensajes'); break;
        case 'SerieEsenciales': router.replace('/(app)/serie'); break;
        case 'Videos': router.replace('/(app)/videos'); break;
        case 'Servidores': router.replace('/(app)/servidores'); break;
        case 'Contacto': router.replace('/(app)/contacto'); break;
        case 'NewsDetail': router.replace('/(app)/news-detail'); break;
        default: router.replace('/(app)');
      }
    },
    [isMenuOpen, slideAnim, router]
  );

  const handleNotificationResponse = useCallback((data: any) => {
    console.log('[NOTIF-DEEP] Procesando data de notificación:', JSON.stringify(data));
    if (data?.type === 'service_reminder' || data?.type === 'chat') {
      if (data?.type === 'chat' && data?.planId) {
        console.log('[NOTIF-DEEP] Chat detectado, planId:', data.planId);
        setDeepLinkTarget({ action: 'openChat', planId: data.planId });
      }
      navigateTo('Servidores');
    } else if (data?.type === 'news') {
      if (data.news) {
        setNoticiaSeleccionada(data.news);
        navigateTo('NewsDetail');
      } else {
        navigateTo('Inicio');
      }
    } else if (data?.type === 'video') {
      navigateTo('Videos');
    } else if (data?.type === 'prayer') {
      navigateTo('Necesito Oración');
    } else {
      navigateTo('Notificaciones');
    }
  }, [navigateTo, setDeepLinkTarget, setNoticiaSeleccionada]);

  useEffect(() => {
    if (isLoggedIn && memberId) {
      // Registro inicial de token
      registerForPushNotifications(memberId);

      // Manejar notificaciones cuando la app está abierta
      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        const { title, body, data } = notification.request.content;
        addNotificationToInbox({ title, body, image: data?.image, data });
      });

      // Manejar clic en la notificación (app abierta o en background)
      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        const { data } = response.notification.request.content;
        handleNotificationResponse(data);
      });

      // Capturar la notificación que abrió la app cuando estaba CERRADA
      Notifications.getLastNotificationResponseAsync().then(response => {
        if (response) {
          const { data } = response.notification.request.content;
          console.log('[NOTIF-DEEP] App abierta desde notificación (cold start):', JSON.stringify(data));
          // Solo procesar si fue tocada en los últimos 5 segundos (evitar re-procesar viejas)
          const responseTime = response.notification.date;
          const now = Date.now();
          if (now - responseTime < 5000) {
            handleNotificationResponse(data);
          }
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
  }, [isLoggedIn, memberId, addNotificationToInbox, handleNotificationResponse]);


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
    if (data === 'ASISTENCIA_IGLESIA') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
      const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
      const now = new Date();
      const hora = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0');
      // Calculate the meeting time based on the hour and day
      let horarioReunion = 'General';

      const isSunday = now.getDay() === 0; // 0 = Sunday
      const hour = now.getHours();

      if (isSunday) {
        if (hour >= 8 && hour < 10) {
          horarioReunion = '09:00';
        } else if (hour >= 10 && hour <= 14) {
          horarioReunion = '11:00';
        } else if (hour >= 18 && hour <= 21) {
          horarioReunion = '19:00';
        }
      }

      const { error } = await supabase.from('asistencias').insert([
        { miembro_id: memberId, fecha: hoy, hora_entrada: hora, horario_reunion: horarioReunion },
      ]);

      if (error) {
        console.error('Error insertando asistencia:', error);
        // Mostrar mensaje de error real en lugar de un genérico "duplicado"
        Alert.alert('Error al registrar', error.message || 'No se pudo registrar la asistencia.');
      } else {
        setShowSuccessScan(true);
        setTimeout(() => setShowSuccessScan(false), 3000);
        // Show a local push notification confirming attendance
        Notifications.scheduleNotificationAsync({
          content: {
            title: 'Asistencia registrada',
            body: '¡Gracias por marcar presente!',
          },
          trigger: null,
        }).catch((e) => console.log('Error notificando:', e));
        refreshData();
      }
    } else {
      Alert.alert('QR Inválido', 'Este código no es de nuestra iglesia.');
    }
  };

  const handleLogout = async () => {
    console.log("[UI-LOGOUT] Botón presionado.");

    // Cerrar el menú si está abierto
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
    pickImage,
    cargarRanking,
    cargarPedidos,
    handleBarCodeScanned,
    navigateTo,
    // información que sigue viniendo del contexto para uso en componentes
    isCurrentlyLive,
    liveVideoUrl,
    unreadCount,
    nombre,
    apellido,
    fotoUrl,
    esServidor,
    asistenciasDetalle,
    refreshData,
    logout: handleLogout,
    deleteAccount: async () => {
      Alert.alert(
        '⚠️ Eliminar cuenta',
        '¿Estás seguro? Se borrarán todos tus datos, asistencias, notas y foto de perfil. Esta acción NO se puede deshacer.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Sí, eliminar todo',
            style: 'destructive',
            onPress: () => {
              Alert.alert(
                '🚨 Última confirmación',
                'Tu cuenta será eliminada permanentemente. ¿Continuar?',
                [
                  { text: 'No, volver', style: 'cancel' },
                  {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        if (isMenuOpen) {
                          setIsMenuOpen(false);
                          Animated.timing(slideAnim, { toValue: -width * 0.8, duration: 150, useNativeDriver: true }).start();
                        }
                        await deleteAccount();
                        Alert.alert('Cuenta eliminada', 'Todos tus datos fueron borrados. ¡Que Dios te bendiga! 🙏');
                      } catch (e) {
                        Alert.alert('Error', 'No se pudo eliminar la cuenta. Intentá de nuevo.');
                      }
                    },
                  },
                ]
              );
            },
          },
        ]
      );
    },
  };
}
