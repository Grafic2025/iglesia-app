import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { supabase } from './supabase';

export async function registerForPushNotifications() {
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: "1e371a5d-b4ee-46ee-9c28-40f9d567fd1f"
    });
    
    const token = tokenData.data; 

    // Guardamos silenciosamente en la tabla auxiliar por seguridad
    await supabase.from('push_tokens').upsert({ token }, { onConflict: 'token' });

    return token; // Retorna el token para que index.tsx lo use
  } catch (e) {
    console.error('Error al obtener token:', e);
    return null;
  }
}