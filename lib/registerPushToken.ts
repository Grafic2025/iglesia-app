import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { supabase } from './supabase'

export async function registerForPushNotifications() {
  if (!Device.isDevice) {
    return
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    alert('❌ No diste permiso para notificaciones');
    return
  }

  try {
    // 1. Obtenemos el token usando el ID manual de tu app.json
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: "1e371a5d-b4ee-46ee-9c28-40f9d567fd1f"
    });
    
    // 2. EXTRAEMOS el string del token (esto faltaba en tu código)
    const token = tokenData.data; 

    // 3. Lo guardamos en la base de datos
    const { error } = await supabase.from('push_tokens').upsert(
      { token },
      { onConflict: 'token' }
    );

    if (error) {
      alert('❌ Error Supabase: ' + error.message);
    } else {
      // Este alert te confirmará que POR FIN funcionó
      alert('✅ Token registrado: ' + token);
    }
  } catch (e) {
    alert('❌ Error fatal: ' + e);
  }
}