import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert } from 'react-native';
import { LoginView } from '../components/auth/LoginView';
import { useApp } from '../context/AppContext';
import { useBiometricAuth } from '../hooks/useBiometricAuth';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
    const { login, loginWithBiometrics } = useApp();
    const router = useRouter();
    const biometric = useBiometricAuth();

    const [localNombre, setLocalNombre] = useState('');
    const [localApellido, setLocalApellido] = useState('');

    const handleBiometricLogin = async () => {
        const success = await biometric.authenticate();
        if (success) {
            const loggedIn = await loginWithBiometrics();
            if (loggedIn) router.replace('/(app)');
        }
    };

    const handleLogin = async () => {
        if (!localNombre || !localApellido) return;
        try {
            let { data, error } = await supabase
                .from('miembros')
                .select('id')
                .ilike('nombre', localNombre.trim())
                .ilike('apellido', localApellido.trim())
                .maybeSingle();

            let finalMemberId = data?.id;
            if (!finalMemberId) {
                const { data: newMember, error: insertError } = await supabase
                    .from('miembros')
                    .insert([
                        {
                            nombre: localNombre.trim(),
                            apellido: localApellido.trim(),
                            created_at: new Date().toISOString(),
                        },
                    ])
                    .select('id')
                    .single();

                if (insertError) throw insertError;
                finalMemberId = newMember.id;
            }

            if (finalMemberId) {
                await login(finalMemberId, localNombre.trim(), localApellido.trim());

                // Solo enviar notificación de bienvenida la PRIMERA vez que el usuario ingresa
                const yaBienvenido = await AsyncStorage.getItem('welcomeShown');
                if (!yaBienvenido) {
                    try {
                        await Notifications.scheduleNotificationAsync({
                            content: {
                                title: '¡Bienvenido a Iglesia del Salvador! 🙌',
                                body: `Hola ${localNombre.trim()}, nos alegra que seas parte de nuestra comunidad. ¡Dios te bendiga!`,
                            },
                            trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3 },
                        });
                        await AsyncStorage.setItem('welcomeShown', 'true');
                    } catch {
                        // los permisos de notificación podrían no estar activos
                    }
                }

                // Redirigimos al área segura
                router.replace('/(app)');
            }
        } catch (e: any) {
            console.error('Login Error:', e);
            Alert.alert('Error', 'No se pudo iniciar sesión. Por favor intenta de nuevo.');
        }
    };

    return (
        <LoginView
            localNombre={localNombre}
            setLocalNombre={setLocalNombre}
            localApellido={localApellido}
            setLocalApellido={setLocalApellido}
            handleLogin={handleLogin}
            handleBiometricLogin={handleBiometricLogin}
            biometricAvailable={biometric.isAvailable}
            biometricType={biometric.biometricType}
            hasSavedSession={biometric.hasSavedSession}
        />
    );
}
