import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface LoginViewProps {
    localNombre: string;
    setLocalNombre: (t: string) => void;
    localApellido: string;
    setLocalApellido: (t: string) => void;
    handleLogin: () => void;
    handleBiometricLogin?: () => Promise<void>;
    biometricAvailable?: boolean;
    biometricType?: 'fingerprint' | 'facial' | 'none';
    hasSavedSession?: boolean;
}

/**
 * LoginView con diseño premium, Glassmorphism y soporte de autenticación biométrica.
 */
export const LoginView: React.FC<LoginViewProps> = ({
    localNombre,
    setLocalNombre,
    localApellido,
    setLocalApellido,
    handleLogin,
    handleBiometricLogin,
    biometricAvailable,
    biometricType,
    hasSavedSession,
}) => {
    const insets = useSafeAreaInsets();
    const isButtonDisabled = !localNombre.trim() || !localApellido.trim();

    const showBiometric = biometricAvailable && hasSavedSession && !!handleBiometricLogin;

    // Animación del ícono biométrico
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!showBiometric) return;
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.12, duration: 900, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
            ])
        );
        const glow = Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, { toValue: 1, duration: 1200, useNativeDriver: false }),
                Animated.timing(glowAnim, { toValue: 0, duration: 1200, useNativeDriver: false }),
            ])
        );
        pulse.start();
        glow.start();
        return () => { pulse.stop(); glow.stop(); };
    }, [showBiometric]);

    const borderColor = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(197,255,0,0.15)', 'rgba(197,255,0,0.7)'],
    });

    const iconName = biometricType === 'facial' ? 'face-recognition' : 'fingerprint';
    const biometricLabel = biometricType === 'facial' ? 'Entrar con Face ID' : 'Entrar con huella';

    return (
        <View style={styles.background}>
            <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <View style={styles.loginCard}>
                        {/* ===== HEADER ===== */}
                        <View style={styles.header}>
                            <Text style={styles.welcomeText}>BIENVENIDOS A NUESTRA COMUNIDAD</Text>
                            <Text style={styles.brandTitle}>IGLESIA DEL SALVADOR</Text>
                            <View style={styles.divider} />
                        </View>

                        {/* ===== BIOMETRIC BUTTON (si hay sesión previa) ===== */}
                        {showBiometric && (
                            <View style={styles.biometricSection}>
                                <TouchableOpacity
                                    style={styles.biometricButtonWrapper}
                                    onPress={handleBiometricLogin}
                                    activeOpacity={0.8}
                                >
                                    <Animated.View
                                        style={[
                                            styles.biometricButton,
                                            { borderColor, transform: [{ scale: pulseAnim }] },
                                        ]}
                                    >
                                        <MaterialCommunityIcons
                                            name={iconName as any}
                                            size={44}
                                            color="#c5ff00"
                                        />
                                    </Animated.View>
                                </TouchableOpacity>
                                <Text style={styles.biometricLabel}>{biometricLabel}</Text>

                                <View style={styles.separator}>
                                    <View style={styles.separatorLine} />
                                    <Text style={styles.separatorText}>o ingresá manualmente</Text>
                                    <View style={styles.separatorLine} />
                                </View>
                            </View>
                        )}

                        {/* ===== INPUTS ===== */}
                        <View style={styles.inputGroup}>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.loginInput}
                                    placeholder="Nombre"
                                    placeholderTextColor="#777"
                                    value={localNombre}
                                    onChangeText={setLocalNombre}
                                    autoCapitalize="words"
                                />
                            </View>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.loginInput}
                                    placeholder="Apellido"
                                    placeholderTextColor="#777"
                                    value={localApellido}
                                    onChangeText={setLocalApellido}
                                    autoCapitalize="words"
                                />
                            </View>
                        </View>

                        {/* ===== LOGIN BUTTON ===== */}
                        <TouchableOpacity
                            style={[styles.loginButton, isButtonDisabled && styles.loginButtonDisabled]}
                            onPress={handleLogin}
                            disabled={isButtonDisabled}
                        >
                            <Text style={styles.loginButtonText}>INGRESAR</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    background: { flex: 1, backgroundColor: '#000' },
    container: { flex: 1 },
    keyboardView: { flex: 1, justifyContent: 'center', paddingHorizontal: 40 },

    loginCard: {
        backgroundColor: '#121212',
        borderRadius: 30,
        paddingVertical: 35,
        paddingHorizontal: 25,
        borderWidth: 1,
        borderColor: '#1a1a1a',
    },

    header: { alignItems: 'center', marginBottom: 25 },
    welcomeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1,
        marginBottom: 8,
    },
    brandTitle: {
        color: '#c5ff00',
        fontSize: 18,
        fontWeight: '900',
        textAlign: 'center',
    },
    divider: {
        width: 30,
        height: 4,
        backgroundColor: '#c5ff00',
        borderRadius: 2,
        marginTop: 10,
    },

    // Biometric
    biometricSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    biometricButtonWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    biometricButton: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: '#1a1a1a',
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    biometricLabel: {
        color: '#c5ff00',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.5,
        marginBottom: 20,
    },
    separator: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        gap: 8,
    },
    separatorLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#2a2a2a',
    },
    separatorText: {
        color: '#555',
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 0.5,
    },

    inputGroup: { gap: 20, marginBottom: 30, marginTop: 20 },
    inputWrapper: {
        backgroundColor: '#1d1d1d',
        borderRadius: 15,
        height: 48,
        paddingHorizontal: 18,
        justifyContent: 'center',
    },
    loginInput: { color: '#fff', fontSize: 14, fontWeight: '600' },

    loginButton: {
        backgroundColor: '#c5ff00',
        height: 55,
        borderRadius: 27,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loginButtonDisabled: { opacity: 0.4 },
    loginButtonText: { color: '#000', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
});
