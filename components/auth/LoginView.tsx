import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useRef } from 'react';
import {
    Alert,
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
 * LoginView con diseño premium y soporte de autenticación biométrica.
 * El ícono biométrico (huella/face) siempre se muestra si el dispositivo lo soporta.
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

    // Mostrar el ícono siempre que el dispositivo tenga biometría disponible
    const showBiometricIcon = biometricAvailable && biometricType !== 'none' && !!handleBiometricLogin;
    // Funcional solo si hay sesión guardada
    const biometricActive = showBiometricIcon && !!hasSavedSession;

    // Animaciones
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!showBiometricIcon) return;

        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: biometricActive ? 1.1 : 1.04, duration: 1000, useNativeDriver: false }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: false }),
            ])
        );
        const glow = Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, { toValue: 1, duration: 1400, useNativeDriver: false }),
                Animated.timing(glowAnim, { toValue: 0, duration: 1400, useNativeDriver: false }),
            ])
        );
        pulse.start();
        glow.start();
        return () => { pulse.stop(); glow.stop(); };
    }, [showBiometricIcon, biometricActive]);

    const borderColor = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: biometricActive
            ? ['rgba(197,255,0,0.2)', 'rgba(197,255,0,0.8)']
            : ['rgba(80,80,80,0.2)', 'rgba(80,80,80,0.5)'],
    });

    const iconName = biometricType === 'facial' ? 'face-recognition' : 'fingerprint';
    const biometricLabel = biometricType === 'facial' ? 'Face ID' : 'Huella dactilar';

    const handleBiometricPress = () => {
        if (!biometricActive) {
            Alert.alert(
                '🔐 Biometría',
                'Ingresá una vez con tu nombre y apellido para habilitar el acceso rápido con ' + biometricLabel + '.',
                [{ text: 'Entendido', style: 'default' }]
            );
            return;
        }
        handleBiometricLogin?.();
    };

    return (
        <View style={styles.background}>
            <LinearGradient colors={['#010A2A', '#020205']} style={StyleSheet.absoluteFill} />

            {/* Mesh gradient effect - Top Left Blue */}
            <View style={{ position: 'absolute', top: -100, left: -50, width: 400, height: 400, borderRadius: 200, backgroundColor: 'rgba(37, 99, 235, 0.12)' }} />

            {/* Mesh gradient effect - Middle Right Purple */}
            <View style={{ position: 'absolute', top: '25%', right: -100, width: 350, height: 350, borderRadius: 175, backgroundColor: 'rgba(147, 51, 234, 0.08)' }} />

            {/* Mesh gradient effect - Bottom Left Cyan */}
            <View style={{ position: 'absolute', bottom: -50, left: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(6, 182, 212, 0.08)' }} />

            {/* Mesh gradient effect - Bottom Right LimeHighlight */}
            <View style={{ position: 'absolute', bottom: -100, right: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(197, 255, 0, 0.04)' }} />

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

                        {/* ===== BIOMETRIC SECTION (siempre visible si soportado) ===== */}
                        {showBiometricIcon && (
                            <View style={styles.biometricSection}>
                                <View style={styles.separator}>
                                    <View style={styles.separatorLine} />
                                    <Text style={styles.separatorText}>o usá tu {biometricLabel}</Text>
                                    <View style={styles.separatorLine} />
                                </View>

                                <TouchableOpacity
                                    style={styles.biometricButtonWrapper}
                                    onPress={handleBiometricPress}
                                    activeOpacity={0.75}
                                >
                                    <Animated.View
                                        style={[
                                            styles.biometricButton,
                                            {
                                                borderColor,
                                                transform: [{ scale: pulseAnim }],
                                                opacity: biometricActive ? 1 : 0.45,
                                            },
                                        ]}
                                    >
                                        <MaterialCommunityIcons
                                            name={iconName as any}
                                            size={40}
                                            color={biometricActive ? '#c5ff00' : '#666'}
                                        />
                                    </Animated.View>
                                    <Text style={[styles.biometricLabel, !biometricActive && styles.biometricLabelInactive]}>
                                        {biometricActive ? `Entrar con ${biometricLabel}` : `${biometricLabel} (ingresá primero)`}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* ===== PRIVACY POLICY LINK ===== */}
                        <TouchableOpacity
                            style={styles.privacyLink}
                            onPress={() => WebBrowser.openBrowserAsync('https://iglesia-admin.vercel.app/privacy')}
                        >
                            <Text style={styles.privacyText}>Política de Privacidad</Text>
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
        backgroundColor: 'rgba(18, 18, 18, 0.65)',
        borderRadius: 30,
        paddingVertical: 35,
        paddingHorizontal: 25,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
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

    inputGroup: { gap: 14, marginBottom: 22 },
    inputWrapper: {
        backgroundColor: '#1d1d1d',
        borderRadius: 15,
        height: 50,
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

    // Biometric — ahora en la parte de abajo
    biometricSection: {
        alignItems: 'center',
        marginTop: 24,
    },
    separator: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        gap: 8,
        marginBottom: 20,
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
    biometricButtonWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    biometricButton: {
        width: 78,
        height: 78,
        borderRadius: 39,
        backgroundColor: '#1a1a1a',
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    biometricLabel: {
        color: '#c5ff00',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    biometricLabelInactive: {
        color: '#444',
    },
    privacyLink: {
        marginTop: 20,
        alignSelf: 'center',
        padding: 5,
    },
    privacyText: {
        color: '#666',
        fontSize: 11,
        textDecorationLine: 'underline',
        fontWeight: '600',
    },
});
