import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Linking,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface Action {
    label: string;
    screen: string;
}

interface Message {
    id: string;
    text: string;
    sender: 'bot' | 'user';
    timestamp: Date;
    action?: Action;
}

import { useApp } from '../../context/AppContext';
import { askIdsBot, getChurchContext } from '../../lib/botIntelligence';
import { supabase } from '../../lib/supabase';

interface IdsBotFabProps {
    navigateTo: (screen: string) => void;
}

export const IdsBotFab: React.FC<IdsBotFabProps> = ({ navigateTo }) => {
    const { nombre, apellido, esAdmin, esServidor, asistenciasDetalle, rachaUsuario, memberId } = useApp();
    const [modalVisible, setModalVisible] = useState(false);
    const [inputText, setInputText] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [botContext, setBotContext] = useState('');
    const [servingPlans, setServingPlans] = useState<any[]>([]);

    // Animación del botón flotante
    const fabScale = useRef(new Animated.Value(1)).current;
    const scrollRef = useRef<ScrollView>(null);

    useEffect(() => {
        // Cargar contexto y conversación guardada
        const init = async () => {
            // 1. Obtener planes donde el usuario sirve (Plan de Culto)
            let myPlans: any[] = [];
            try {
                const hoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });
                const { data: allPlans } = await supabase
                    .from('cronogramas')
                    .select('*')
                    .gte('fecha', hoy)
                    .order('fecha', { ascending: true });

                myPlans = allPlans?.filter((p: any) =>
                    p.equipo_ids?.some((m: any) => m.miembro_id === memberId)
                ) || [];
                setServingPlans(myPlans);
            } catch (e) {
                console.log("Error buscando planes para el bot:", e);
            }

            // 2. Armar contexto con asistencias y servicios
            const ctx = await getChurchContext({
                nombre,
                apellido,
                esAdmin,
                esServidor,
                memberId,
                asistencias: asistenciasDetalle,
                rachaUsuario: rachaUsuario,
                servicios: myPlans // Pasamos los días que sirve
            });
            setBotContext(ctx);

            // Recuperar mensajes de la sesión actual (si existen)
            const savedChat = await AsyncStorage.getItem('ids_bot_session_chat');
            if (savedChat) {
                setMessages(JSON.parse(savedChat));
            }
        };
        init();

        // Animación de aparición suave una sola vez
        Animated.spring(fabScale, {
            toValue: 1,
            friction: 4,
            tension: 40,
            useNativeDriver: true
        }).start();
    }, [nombre, apellido, esAdmin, esServidor]);

    const openChat = () => {
        setModalVisible(true);
        if (messages.length === 0) {
            setMessages([
                {
                    id: '1',
                    text: `¡Hola ${nombre}! Soy IDS, la Inteligencia Del Salvador. ¿En qué puedo ayudarte hoy?`,
                    sender: 'bot',
                    timestamp: new Date(),
                },
            ]);
        }
    };

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text: inputText.trim(),
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages(prev => {
            const next = [...prev, userMsg];
            AsyncStorage.setItem('ids_bot_session_chat', JSON.stringify(next));
            return next;
        });
        const currentInput = inputText.trim();
        setInputText('');
        setIsTyping(true);

        // Llamada a la IA real (Gemini) con memoria
        // Usamos el estado anterior (prev) + el nuevo mensaje para la memoria
        const res = await askIdsBot(currentInput, botContext, [...messages, userMsg]);

        const botMsg: Message = {
            id: (Date.now() + 1).toString(),
            text: res.text,
            sender: 'bot',
            timestamp: new Date(),
            action: res.action
        };

        setMessages(prev => {
            const next = [...prev, botMsg];
            AsyncStorage.setItem('ids_bot_session_chat', JSON.stringify(next));
            return next;
        });
        setIsTyping(false);
    };

    const handleAction = (action: Action) => {
        setModalVisible(false);
        if (action.screen.startsWith('http')) {
            Linking.openURL(action.screen);
        } else {
            navigateTo(action.screen);
        }
    };

    return (
        <>
            {/* BOTÓN FLOTANTE */}
            <View style={styles.fabContainer}>
                <TouchableOpacity activeOpacity={0.8} onPress={openChat}>
                    <Animated.View style={[styles.fab, { transform: [{ scale: fabScale }] }]}>
                        <MaterialCommunityIcons name="robot" size={30} color="#000" />
                    </Animated.View>
                </TouchableOpacity>
            </View>

            {/* MODAL DEL CHAT */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
                        style={styles.chatContainer}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                    >
                        <LinearGradient colors={['#050B25', '#020205']} style={StyleSheet.absoluteFill} />
                        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />

                        {/* HEADER PREMIUM */}
                        <View style={styles.header}>
                            <View style={styles.headerTitleRow}>
                                <View style={styles.botIconWrapper}>
                                    <MaterialCommunityIcons name="robot" size={20} color="#fff" />
                                </View>
                                <View>
                                    <Text style={styles.headerTitle}>IDS BOT</Text>
                                    <Text style={styles.headerSubtitle}>POTENCIADO POR GEMINI</Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                                <View style={styles.closeIconBox}>
                                    <MaterialCommunityIcons name="close" size={20} color="#fff" />
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* CUERPO DEL CHAT */}
                        <ScrollView
                            style={styles.messagesList}
                            contentContainerStyle={styles.messagesContent}
                            ref={scrollRef}
                            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
                        >
                            {messages.map((msg) => (
                                <View
                                    key={msg.id}
                                    style={[
                                        styles.messageBubbleWrapper,
                                        msg.sender === 'user' ? styles.userMsgWrapper : styles.botMsgWrapper
                                    ]}
                                >
                                    {msg.sender === 'bot' && (
                                        <View style={styles.msgAvatar}>
                                            <MaterialCommunityIcons name="robot" size={14} color="#fff" />
                                        </View>
                                    )}
                                    <View style={styles.msgColumn}>
                                        <View style={[
                                            styles.messageBubble,
                                            msg.sender === 'user' ? styles.userBubble : styles.botBubble
                                        ]}>
                                            <Text style={styles.messageText}>{msg.text}</Text>
                                        </View>

                                        {/* BOTÓN DE ACCIÓN SUGERIDA */}
                                        {msg.action && (
                                            <TouchableOpacity
                                                style={styles.actionBtn}
                                                onPress={() => handleAction(msg.action!)}
                                                activeOpacity={0.7}
                                            >
                                                <LinearGradient
                                                    colors={['#A8D500', '#c5ff00']}
                                                    style={styles.actionGradient}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 0 }}
                                                >
                                                    <Text style={styles.actionText}>{msg.action.label}</Text>
                                                    <MaterialCommunityIcons name="arrow-right" size={14} color="#000" />
                                                </LinearGradient>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            ))}
                            {isTyping && (
                                <View style={[styles.messageBubbleWrapper, styles.botMsgWrapper]}>
                                    <View style={styles.msgAvatar}>
                                        <MaterialCommunityIcons name="robot" size={14} color="#fff" />
                                    </View>
                                    <View style={[styles.messageBubble, styles.botBubble]}>
                                        <View style={styles.typingContainer}>
                                            <Text style={[styles.messageText, { opacity: 0.5 }]}>Pensando...</Text>
                                            <Sparkles size={14} />
                                        </View>
                                    </View>
                                </View>
                            )}
                        </ScrollView>

                        {/* INPUT FOOTER */}
                        <View style={styles.inputArea}>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Conversa con IDS..."
                                    placeholderTextColor="#666"
                                    value={inputText}
                                    onChangeText={setInputText}
                                    multiline
                                    blurOnSubmit={true}
                                    onSubmitEditing={handleSend}
                                />
                                <TouchableOpacity
                                    onPress={handleSend}
                                    disabled={!inputText.trim() || isTyping}
                                    style={[styles.sendBtn, (!inputText.trim() || isTyping) && styles.sendBtnDisabled]}
                                >
                                    <MaterialCommunityIcons
                                        name="send"
                                        size={22}
                                        color={inputText.trim() && !isTyping ? "#fff" : "#444"}
                                    />
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.poweredBy}>INTELIGENCIA ARTIFICIAL DINÁMICA DE LA IGLESIA</Text>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </>
    );
};

// Componente decorativo Sparkle
const Sparkles = ({ size = 16 }: { size?: number }) => (
    <View style={{ marginLeft: 6 }}>
        <MaterialCommunityIcons name="star-face" size={size} color="#c5ff00" />
    </View>
);

const styles = StyleSheet.create({
    fabContainer: {
        position: 'absolute',
        bottom: 85,
        right: 30,
        zIndex: 9999,
    },
    fab: {
        width: 62,
        height: 62,
        borderRadius: 31,
        backgroundColor: '#c5ff00',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#c5ff00',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 12,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'flex-end',
    },
    chatContainer: {
        height: height * 0.9,
        backgroundColor: '#020205',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    header: {
        backgroundColor: 'rgba(37, 99, 235, 0.95)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 25,
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)'
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    botIconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)'
    },
    headerTitle: {
        color: '#fff',
        fontFamily: 'Montserrat_900Black',
        fontSize: 18,
        letterSpacing: 1.5,
    },
    headerSubtitle: {
        color: '#A8D500',
        fontFamily: 'Montserrat_700Bold',
        fontSize: 10,
        letterSpacing: 1,
        marginTop: 2
    },
    closeButton: {
        padding: 5,
    },
    closeIconBox: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    messagesList: {
        flex: 1,
        padding: 20,
    },
    messagesContent: {
        paddingBottom: 40,
    },
    messageBubbleWrapper: {
        flexDirection: 'row',
        marginBottom: 20,
        maxWidth: '88%',
    },
    botMsgWrapper: {
        alignSelf: 'flex-start',
        alignItems: 'flex-start',
        gap: 10,
    },
    userMsgWrapper: {
        alignSelf: 'flex-end',
    },
    msgAvatar: {
        width: 28,
        height: 28,
        borderRadius: 10,
        backgroundColor: '#1E293B',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#334155',
        marginTop: 4
    },
    msgColumn: {
        flexDirection: 'column',
        gap: 10,
        flexShrink: 1
    },
    messageBubble: {
        paddingHorizontal: 18,
        paddingVertical: 14,
        borderRadius: 22,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    botBubble: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderBottomLeftRadius: 5,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    userBubble: {
        backgroundColor: '#2563EB',
        borderBottomRightRadius: 5,
    },
    messageText: {
        color: '#fff',
        fontFamily: 'Inter_400Regular',
        fontSize: 15,
        lineHeight: 22,
    },
    actionBtn: {
        alignSelf: 'flex-start',
        borderRadius: 15,
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#A8D500',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    actionGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 10
    },
    actionText: {
        color: '#000',
        fontFamily: 'Montserrat_900Black',
        fontSize: 11,
        letterSpacing: 1
    },
    typingContainer: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    inputArea: {
        padding: 24,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 22,
        paddingHorizontal: 20,
        paddingVertical: 10,
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)'
    },
    textInput: {
        flex: 1,
        color: '#fff',
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        maxHeight: 120,
        paddingVertical: 8,
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#2563EB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendBtnDisabled: {
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    poweredBy: {
        textAlign: 'center',
        color: '#64748B',
        fontFamily: 'Montserrat_700Bold',
        fontSize: 9,
        marginTop: 18,
        letterSpacing: 2,
    },
});
