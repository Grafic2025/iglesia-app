import { Inter_400Regular } from '@expo-google-fonts/inter';
import {
  Montserrat_500Medium,
  Montserrat_700Bold,
  Montserrat_900Black,
  useFonts
} from '@expo-google-fonts/montserrat';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '../components/ErrorBoundary';
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

  React.useEffect(() => {
    async function onFetchUpdateAsync() {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          console.log('[UPDATES] Descargando nueva versión OTA...');
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (error) {
        console.warn(`[UPDATES] Error revisando actualización: ${error}`);
      }
    }

    // Solo verificar actualizaciones al aire (Over the Air) cuando estamos en producción
    if (!__DEV__) {
      onFetchUpdateAsync();
    }
  }, []);

  if (fontError) {
    console.error("[LAYOUT] Error cargando fuentes:", fontError);
  }

  // Mientras NO estemos listos, devolvemos null para que siga la Splash Screen nativa
  if (!isReady) {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider>
            <AppProvider>
              <RootLayoutNav />
            </AppProvider>
          </SafeAreaProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </View>
  );
}

function RootLayoutNav() {
  const { isLoggedIn, loading } = useApp();
  const segments = useSegments();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    // Wait for initial cache loading and for the Expo Router navigation tree to be fully mounted
    if (loading || !rootNavigationState?.key) return;

    const currentSegment = segments[0];

    if (!isLoggedIn && currentSegment !== 'login') {
      // Redirect to login if unauthenticated and not already on the login page
      router.replace('/login');
    } else if (isLoggedIn && currentSegment !== '(app)') {
      // Redirect to main App if authenticated and not already in the secure area
      router.replace('/(app)');
    }
  }, [isLoggedIn, loading, segments, rootNavigationState?.key]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
