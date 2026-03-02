import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
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
    Montserrat_200ExtraLight: require('../node_modules/@expo-google-fonts/montserrat/200ExtraLight/Montserrat_200ExtraLight.ttf'),
    Montserrat_300Light: require('../node_modules/@expo-google-fonts/montserrat/300Light/Montserrat_300Light.ttf'),
    Montserrat_400Regular: require('../node_modules/@expo-google-fonts/montserrat/400Regular/Montserrat_400Regular.ttf'),
    Montserrat_700Bold: require('../node_modules/@expo-google-fonts/montserrat/700Bold/Montserrat_700Bold.ttf'),
    Montserrat_800ExtraBold: require('../node_modules/@expo-google-fonts/montserrat/800ExtraBold/Montserrat_800ExtraBold.ttf'),
    Montserrat_900Black: require('../node_modules/@expo-google-fonts/montserrat/900Black/Montserrat_900Black.ttf'),
    Inter_300Light: require('../node_modules/@expo-google-fonts/inter/300Light/Inter_300Light.ttf'),
    Inter_400Regular: require('../node_modules/@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf'),
    Inter_600SemiBold: require('../node_modules/@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf'),
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
