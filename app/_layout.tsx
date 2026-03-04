import { Inter_400Regular } from '@expo-google-fonts/inter';
import {
  Montserrat_500Medium,
  Montserrat_700Bold,
  Montserrat_900Black,
  useFonts
} from '@expo-google-fonts/montserrat';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from '../context/AppContext';

// Configuración obligatoria para que las notificaciones se vean SIEMPRE
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const queryClient = new QueryClient();

export default function Layout() {
  const [fontsLoaded, fontError] = useFonts({
    Montserrat_500Medium,
    Montserrat_700Bold,
    Montserrat_900Black,
    Inter_400Regular,
  });

  if (fontError) {
    console.error("[LAYOUT] Error cargando fuentes:", fontError);
  }

  // Mientras cargan las fuentes (que ahora son pocas y pesan poco)
  // mostramos un fondo negro para no molestar la vista.
  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: '#000' }} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AppProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </AppProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
