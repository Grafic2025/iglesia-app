import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';

export type BiometricType = 'fingerprint' | 'facial' | 'none';

interface BiometricState {
    isAvailable: boolean;
    biometricType: BiometricType;
    hasSavedSession: boolean;
}

interface UseBiometricAuthReturn extends BiometricState {
    authenticate: () => Promise<boolean>;
}

/**
 * Hook que gestiona la autenticación biométrica (huella dactilar / reconocimiento facial).
 * Verifica la disponibilidad del hardware y si existe una sesión previa guardada.
 */
export function useBiometricAuth(): UseBiometricAuthReturn {
    const [state, setState] = useState<BiometricState>({
        isAvailable: false,
        biometricType: 'none',
        hasSavedSession: false,
    });

    useEffect(() => {
        checkBiometrics();
    }, []);

    const checkBiometrics = async () => {
        console.log('[BIO] Verificando compatibilidad de biometría...');
        try {
            // Verificar soporte de hardware
            const compatible = await LocalAuthentication.hasHardwareAsync();
            if (!compatible) {
                console.warn('[BIO] El dispositivo no tiene hardware biométrico.');
                setState(s => ({ ...s, isAvailable: false }));
                return;
            }

            // Verificar si hay biometría registrada en el dispositivo
            const enrolled = await LocalAuthentication.isEnrolledAsync();
            if (!enrolled) {
                console.warn('[BIO] El usuario no tiene biometría configurada en el sistema.');
                setState(s => ({ ...s, isAvailable: false }));
                return;
            }

            // Detectar tipo de biometría disponible
            const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
            let biometricType: BiometricType = 'none';

            if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
                biometricType = 'facial';
            } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
                biometricType = 'fingerprint';
            }

            // Verificar si hay una sesión anterior guardada de forma segura
            const [savedNombre, biometricId] = await Promise.all([
                AsyncStorage.getItem('nombre'),
                SecureStore.getItemAsync('biometricMemberId')
            ]);

            const hasSavedSession = !!savedNombre && !!biometricId;
            console.log(`[BIO] Disponible: ${biometricType}, Sesión guardada: ${hasSavedSession ? 'SÍ' : 'NO'}`);

            setState({
                isAvailable: biometricType !== 'none',
                biometricType,
                hasSavedSession,
            });
        } catch (e) {
            console.error('[BIO] ERROR al verificar biometría:', e);
        }
    };

    /**
     * Lanza el prompt de autenticación biométrica nativo del dispositivo.
     * Retorna true si el usuario fue autenticado exitosamente.
     */
    const authenticate = useCallback(async (): Promise<boolean> => {
        console.log('[BIO] Lanzando prompt de autenticación...');
        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Verificá tu identidad',
                cancelLabel: 'Cancelar',
                fallbackLabel: 'Usar contraseña',
                disableDeviceFallback: false,
            });
            console.log(`[BIO] Resultado del sistema: ${result.success ? 'EXITOSO' : 'FALLIDO'}`);
            return result.success;
        } catch (e) {
            console.error('[BIO] ERROR fatal durante el prompt:', e);
            return false;
        }
    }, []);

    return { ...state, authenticate };
}
