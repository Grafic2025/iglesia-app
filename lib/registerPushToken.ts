import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { supabase } from './supabase'

export async function registerForPushNotifications() {
  try {
    if (!Device.isDevice) {
      console.log('❌ No es un dispositivo físico')
      return
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync()

    let finalStatus = existingStatus

    if (existingStatus !== 'granted') {
      const { status } =
        await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== 'granted') {
      console.log('❌ Permiso de notificaciones denegado')
      return
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId

    if (!projectId) {
      console.log('❌ No se encontró projectId')
      return
    }

    const tokenData =
      await Notifications.getExpoPushTokenAsync({ projectId })

    const token = tokenData.data

    console.log('📲 TOKEN:', token)

    const { error } = await supabase
      .from('push_tokens')
      .upsert(
        { token },
        { onConflict: 'token' }
      )

    if (error) {
      console.log('❌ Error Supabase:', error)
    } else {
      console.log('✅ Token guardado en Supabase')
    }

  } catch (err) {
    console.log('❌ ERROR GENERAL:', err)
  }
}
