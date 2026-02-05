import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// 1. FUNCIÓN PARA REGISTRAR EL TOKEN (LA QUE YA TENÍAS)
export async function registerForPushNotifications(memberId) {
  console.log('Intentando registrar notificaciones...');

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Permiso de notificaciones rechazado');
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: "1e371a5d-b4ee-46ee-9c28-40f9d567fd1f"
    });
    
    const token = tokenData.data; 

    // Guardamos en la tabla auxiliar
    await supabase.from('push_tokens').upsert({ token }, { onConflict: 'token' });

    // Vincular con el miembro
    if (memberId) {
      const { error } = await supabase
        .from('miembros')
        .update({ token_notificacion: token })
        .eq('id', memberId);

      if (error) {
        console.error('Error al vincular el token:', error.message);
      } else {
        console.log('Token vinculado exitosamente al miembro:', memberId);
      }
    }

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#c5ff00',
      });
    }

    return token; 
  } catch (e) {
    console.error('Error al obtener token:', e);
    return null;
  }
}

// 2. FUNCIÓN PARA ENVIAR NOTIFICACIONES DINÁMICAS
export async function sendPushNotification(expoPushToken, title, body, mediaUrl = null) {
  let finalImage = mediaUrl;

  // 1. Lógica para detectar link de YouTube y extraer la miniatura
  if (mediaUrl && (mediaUrl.includes('youtube.com') || mediaUrl.includes('youtu.be'))) {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = mediaUrl.match(regExp);
    const videoId = (match && match[7].length === 11) ? match[7] : null;
    
    if (videoId) {
      // Usamos la miniatura de máxima resolución de YouTube
      finalImage = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
  }

  // 2. Construcción del mensaje
  const message: any = {
    to: expoPushToken,
    sound: 'default',
    title: title,
    body: body,
    mutableContent: true,
    data: { title, body },
  };

  // 3. Si hay imagen (sea de YouTube o link directo), la adjuntamos
  if (finalImage && finalImage.trim() !== "") {
    message.data.image = finalImage;
    message.android = {
      notification: {
        image: finalImage,
        priority: 'high'
      }
    };
    message.attachments = [{ url: finalImage }];
  }

  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
    console.log("Notificación enviada. Imagen utilizada:", finalImage);
  } catch (error) {
    console.error("Error al enviar notificación:", error);
  }
}