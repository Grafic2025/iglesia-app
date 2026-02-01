import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { supabase } from './supabase';

export async function registerForPushNotifications(memberId) {
  if (!Device.isDevice) {
    console.log('Debe ser un dispositivo físico para recibir notificaciones');
    return null;
  }

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

    // 1. Guardamos en la tabla auxiliar de tokens (opcional, como respaldo)
    await supabase.from('push_tokens').upsert({ token }, { onConflict: 'token' });

    // 2. VINCULAR CON EL MIEMBRO (Esto repara el NULL que tenés en Supabase)
    if (memberId) {
      const { error } = await supabase
        .from('miembros')
        .update({ token_notificacion: token })
        .eq('id', memberId);

      if (error) {
        console.error('Error al vincular el token con el miembro:', error.message);
      } else {
        console.log('Token vinculado exitosamente al miembro:', memberId);
      }
    }

    return token; 
  } catch (e) {
    console.error('Error al obtener token:', e);
    return null;
  }
}