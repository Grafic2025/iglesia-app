import { Inter_400Regular } from '@expo-google-fonts/inter';
import {
  Montserrat_500Medium,
  Montserrat_700Bold,
  Montserrat_900Black,
  useFonts
} from '@expo-google-fonts/montserrat';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from '../context/AppContext';

// Mantenemos la splash screen visible mientras cargamos recursos (fuentes, sesión, etc)
SplashScreen.preventAutoHideAsync().catch(() => { });

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

  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    async function prepare() {
      try {
        if (fontsLoaded || fontError) {
          // Pequeño respiro de seguridad para que el motor nativo se estabilice
          await new Promise(resolve => setTimeout(resolve, 300));
          setIsReady(true);
          await SplashScreen.hideAsync().catch(() => { });
        }
      } catch (e) {
        console.warn("[LAYOUT] Error en preparación:", e);
        setIsReady(true);
      }
    }
    prepare();
  }, [fontsLoaded, fontError]);

  if (fontError) {
    console.error("[LAYOUT] Error cargando fuentes:", fontError);
  }

  // Mientras NO estemos listos, devolvemos null para que siga la Splash Screen nativa
  if (!isReady) {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <AppProvider>
            <RootLayoutNav />
          </AppProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </View>
  );
}

function RootLayoutNav() {
  const { isLoggedIn, loading } = useApp();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Wait for initial cache loading

    // If segments[0] is "(app)" it means we are in the secure area
    const inAuthGroup = segments[0] === '(app)';

    if (!isLoggedIn && inAuthGroup) {
      // Redirect to login if unauthenticated and trying to access secure area
      router.replace('/login');
    } else if (isLoggedIn && !inAuthGroup) {
      // Redirect to main App if authenticated and outside secure area
      router.replace('/(app)');
    }
  }, [isLoggedIn, loading, segments]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
