import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    KeyboardAvoidingView,
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

interface Message {
    id: string;
    text: string;
    sender: 'bot' | 'user';
    timestamp: Date;
}

import { useApp } from '../../context/AppContext';
import { askIdsBot, getChurchContext } from '../../lib/botIntelligence';

export const IdsBotFab: React.FC = () => {
    const { nombre, apellido, esAdmin, esServidor } = useApp();
    const [modalVisible, setModalVisible] = useState(false);
    const [inputText, setInputText] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [botContext, setBotContext] = useState('');

    // Animación del botón flotante
    const fabScale = useRef(new Animated.Value(1)).current;
    const scrollRef = useRef<ScrollView>(null);

    useEffect(() => {
        // Cargar contexto de la iglesia al iniciar
        const initContext = async () => {
            const ctx = await getChurchContext({ nombre, apellido, esAdmin, esServidor });
            setBotContext(ctx);
        };
        initContext();

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

        setMessages(prev => [...prev, userMsg]);
        const currentInput = inputText.trim();
        setInputText('');
        setIsTyping(true);

        // Llamada a la IA real
        const aiResponse = await askIdsBot(currentInput, botContext);

        const botMsg: Message = {
            id: (Date.now() + 1).toString(),
            text: aiResponse,
            sender: 'bot',
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, botMsg]);
        setIsTyping(false);
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
                        {/* HEADER AZUL PREMIUM */}
                        <View style={styles.header}>
                            <View style={styles.headerTitleRow}>
                                <View style={styles.botIconWrapper}>
                                    <MaterialCommunityIcons name="robot" size={20} color="#fff" />
                                </View>
                                <View>
                                    <Text style={styles.headerTitle}>IDS BOT</Text>
                                    <Text style={styles.headerSubtitle}>INTELIGENCIA DEL SALVADOR</Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                                <MaterialCommunityIcons name="close" size={24} color="#fff" />
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
                                    <View style={[
                                        styles.messageBubble,
                                        msg.sender === 'user' ? styles.userBubble : styles.botBubble
                                    ]}>
                                        <Text style={styles.messageText}>{msg.text}</Text>
                                    </View>
                                </View>
                            ))}
                            {isTyping && (
                                <View style={[styles.messageBubbleWrapper, styles.botMsgWrapper]}>
                                    <View style={styles.msgAvatar}>
                                        <MaterialCommunityIcons name="robot" size={14} color="#fff" />
                                    </View>
                                    <View style={[styles.messageBubble, styles.botBubble]}>
                                        <Text style={[styles.messageText, { opacity: 0.5 }]}>Escribiendo...</Text>
                                    </View>
                                </View>
                            )}
                        </ScrollView>

                        {/* INPUT FOOTER */}
                        <View style={styles.inputArea}>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Pregúntame algo..."
                                    placeholderTextColor="#666"
                                    value={inputText}
                                    onChangeText={setInputText}
                                    multiline
                                />
                                <TouchableOpacity onPress={handleSend} disabled={!inputText.trim()}>
                                    <MaterialCommunityIcons
                                        name="send"
                                        size={24}
                                        color={inputText.trim() ? "#2563EB" : "#333"}
                                    />
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.poweredBy}>POTENCIADO POR IGLESIA DEL SALVADOR</Text>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    fabContainer: {
        position: 'absolute',
        bottom: 85,
        right: 30,
        zIndex: 9999,
    },
    fab: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#c5ff00',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#c5ff00',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    chatContainer: {
        height: height * 0.85,
        backgroundColor: '#020205',
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)'
    },
    header: {
        backgroundColor: '#2563EB',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 18,
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    botIconWrapper: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: '#fff',
        fontFamily: 'Montserrat_900Black',
        fontSize: 16,
        letterSpacing: 1,
    },
    headerSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontFamily: 'Montserrat_700Bold',
        fontSize: 9,
        letterSpacing: 0.5,
    },
    closeButton: {
        padding: 4,
    },
    messagesList: {
        flex: 1,
        padding: 20,
    },
    messagesContent: {
        paddingBottom: 20,
    },
    messageBubbleWrapper: {
        flexDirection: 'row',
        marginBottom: 16,
        maxWidth: '85%',
    },
    botMsgWrapper: {
        alignSelf: 'flex-start',
        alignItems: 'flex-end',
        gap: 8,
    },
    userMsgWrapper: {
        alignSelf: 'flex-end',
    },
    msgAvatar: {
        width: 24,
        height: 24,
        borderRadius: 8,
        backgroundColor: '#1e293b',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#334155',
    },
    messageBubble: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 18,
    },
    botBubble: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    userBubble: {
        backgroundColor: '#2563EB',
        borderBottomRightRadius: 4,
    },
    messageText: {
        color: '#fff',
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        lineHeight: 20,
    },
    inputArea: {
        padding: 20,
        backgroundColor: 'transparent',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)'
    },
    textInput: {
        flex: 1,
        color: '#fff',
        fontFamily: 'Inter_400Regular',
        fontSize: 15,
        maxHeight: 100,
        paddingVertical: 8,
    },
    poweredBy: {
        textAlign: 'center',
        color: '#666',
        fontFamily: 'Montserrat_700Bold',
        fontSize: 9,
        marginTop: 15,
        letterSpacing: 1,
    },
});
