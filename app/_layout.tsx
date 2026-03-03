import {
  Inter_300Light,
  Inter_400Regular,
  Inter_600SemiBold
} from '@expo-google-fonts/inter';
import {
  Montserrat_200ExtraLight,
  Montserrat_300Light,
  Montserrat_400Regular,
  Montserrat_700Bold,
  Montserrat_800ExtraBold,
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

// Configuración obligatoria para que las notificaciones se vean SIEMPRE, incluso con la app abierta
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
  const [fontsLoaded] = useFonts({
    Montserrat_200ExtraLight,
    Montserrat_300Light,
    Montserrat_400Regular,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
    Montserrat_900Black,
    Inter_300Light,
    Inter_400Regular,
    Inter_600SemiBold,
  });

  if (!fontsLoaded) {
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
