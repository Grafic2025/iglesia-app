import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
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
        try {
            // Verificar soporte de hardware
            const compatible = await LocalAuthentication.hasHardwareAsync();
            if (!compatible) {
                setState(s => ({ ...s, isAvailable: false }));
                return;
            }

            // Verificar si hay biometría registrada en el dispositivo
            const enrolled = await LocalAuthentication.isEnrolledAsync();
            if (!enrolled) {
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

            // Verificar si hay una sesión anterior guardada
            const savedNombre = await AsyncStorage.getItem('nombre');
            const hasSavedSession = !!savedNombre;

            setState({
                isAvailable: biometricType !== 'none',
                biometricType,
                hasSavedSession,
            });
        } catch (e) {
            console.error('Error checking biometrics:', e);
        }
    };

    /**
     * Lanza el prompt de autenticación biométrica nativo del dispositivo.
     * Retorna true si el usuario fue autenticado exitosamente.
     */
    const authenticate = useCallback(async (): Promise<boolean> => {
        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Verificá tu identidad',
                cancelLabel: 'Cancelar',
                fallbackLabel: 'Usar contraseña',
                disableDeviceFallback: false,
            });
            return result.success;
        } catch (e) {
            console.error('Biometric auth error:', e);
            return false;
        }
    }, []);

    return { ...state, authenticate };
}
