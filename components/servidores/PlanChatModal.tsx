import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as DocumentPicker from 'expo-document-picker';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Linking,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

interface Message {
    id: string;
    miembro_id: string;
    texto: string;
    archivo_url?: string | null;
    archivo_tipo?: 'image' | 'video' | 'document' | null;
    archivo_nombre?: string | null;
    created_at: string;
    miembros: {
        nombre: string;
        apellido: string;
        foto_url: string | null;
    };
}

interface PlanChatModalProps {
    visible: boolean;
    onClose: () => void;
    planId: string;
    memberId: string;
    planTitle: string;
    planDate: string;
    equipoIds: any[];
}

export const PlanChatModal: React.FC<PlanChatModalProps> = ({
    visible,
    onClose,
    planId,
    memberId,
    planTitle,
    planDate,
    equipoIds
}) => {
    const insets = useSafeAreaInsets();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (!visible || !planId) return;

        const fetchMessages = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('mensajes_plan')
                .select('*, miembros(nombre, apellido, foto_url)')
                .eq('cronograma_id', planId)
                .order('created_at', { ascending: true });

            if (error) console.error('Error fetching messages:', error);
            else setMessages(data || []);
            setLoading(false);
        };

        fetchMessages();

        const channel = supabase
            .channel(`plan-chat-${planId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'mensajes_plan',
                    filter: `cronograma_id=eq.${planId}`
                },
                async (payload) => {
                    const { data } = await supabase
                        .from('mensajes_plan')
                        .select('*, miembros(nombre, apellido, foto_url)')
                        .eq('id', payload.new.id)
                        .single();

                    if (data) {
                        setMessages((prev) => [...prev, data]);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [visible, planId]);

    const uploadFile = async (uri: string, fileName: string, type: string) => {
        try {
            // Log para debug
            console.log("[STORAGE] Intentando subir archivo:", fileName, "tipo:", type);

            // Fix URI para fetch/blob en React Native
            const fetchUri = Platform.OS === 'ios' ? uri.replace('file://', '') : uri;
            const response = await fetch(fetchUri);
            const blob = await response.blob();

            const fileExt = fileName.split('.').pop();
            const path = `${planId}/${Date.now()}.${fileExt}`;

            const { data, error } = await supabase.storage
                .from('chat-attachments')
                .upload(path, blob, {
                    contentType: type,
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('chat-attachments')
                .getPublicUrl(path);

            return publicUrl;
        } catch (e: any) {
            console.error('[STORAGE] Error de subida:', e);
            Alert.alert("Error de subida", e.message);
            return null;
        }
    };

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images', 'videos'],
                quality: 0.7,
            });

            if (!result.canceled) {
                const asset = result.assets[0];
                setSending(true);
                const url = await uploadFile(asset.uri, asset.fileName || 'file.jpg', asset.mimeType || 'image/jpeg');
                if (url) {
                    await sendMessageInternal("", url, asset.type === 'video' ? 'video' : 'image', asset.fileName || 'Multimedia');
                }
                setSending(false);
            }
        } catch (e) {
            console.error(e);
            setSending(false);
        }
    };

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
            });

            if (!result.canceled) {
                const asset = result.assets[0];
                setSending(true);
                const url = await uploadFile(asset.uri, asset.name, asset.mimeType || 'application/octet-stream');
                if (url) {
                    await sendMessageInternal("", url, 'document', asset.name);
                }
                setSending(false);
            }
        } catch (e) {
            console.error(e);
            setSending(false);
        }
    };

    const sendMessageInternal = async (text: string, fileUrl?: string, fileType?: string, fileName?: string) => {
        const { error } = await supabase.from('mensajes_plan').insert([
            {
                cronograma_id: planId,
                miembro_id: memberId,
                texto: text,
                archivo_url: fileUrl,
                archivo_tipo: fileType,
                archivo_nombre: fileName
            }
        ]);

        if (error) {
            Alert.alert("Error", "No se pudo enviar el mensaje a la base de datos.");
        }
    };

    const sendMessage = async () => {
        if (!inputText.trim() || sending) return;
        const textToSend = inputText.trim();
        setSending(true);
        await sendMessageInternal(textToSend);
        setInputText('');
        setSending(false);
    };

    const renderFileContent = (item: Message) => {
        if (!item.archivo_url) return null;

        if (item.archivo_tipo === 'image') {
            return (
                <TouchableOpacity onPress={() => Linking.openURL(item.archivo_url!)}>
                    <ExpoImage
                        source={{ uri: item.archivo_url }}
                        style={styles.attachedImage}
                        contentFit="cover"
                        transition={200}
                    />
                </TouchableOpacity>
            );
        }

        const iconName = item.archivo_tipo === 'video' ? 'play-circle' : 'file-document';
        const iconColor = item.miembro_id === memberId ? '#000' : '#c5ff00';

        return (
            <TouchableOpacity
                style={styles.fileAttachment}
                onPress={() => Linking.openURL(item.archivo_url!)}
            >
                <View style={[styles.fileIcon, { backgroundColor: `${iconColor}20` }]}>
                    <MaterialCommunityIcons name={iconName as any} size={24} color={iconColor} />
                </View>
                <Text style={[styles.fileName, { color: item.miembro_id === memberId ? '#000' : '#fff' }]} numberOfLines={1}>
                    {item.archivo_nombre || 'Archivo'}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderItem = ({ item }: { item: Message }) => {
        const isMe = item.miembro_id === memberId;
        const isSystem = item.miembro_id === '00000000-0000-0000-0000-000000000000';

        if (isSystem) {
            return (
                <View style={styles.systemMessage}>
                    <Text style={styles.systemMessageText}>{item.texto}</Text>
                </View>
            );
        }

        return (
            <View style={[styles.messageContainer, isMe ? styles.myMessage : styles.otherMessage]}>
                {!isMe && (
                    <Image
                        source={item.miembros?.foto_url ? { uri: item.miembros.foto_url } : { uri: 'https://via.placeholder.com/30' }}
                        style={styles.avatar}
                    />
                )}
                <View style={[styles.bubble, isMe ? styles.myBubble : styles.otherBubble]}>
                    <View style={styles.bubbleHeader}>
                        {!isMe && <Text style={styles.senderName}>{item.miembros?.nombre} {item.miembros?.apellido}</Text>}
                        {equipoIds.find(m => m.miembro_id === item.miembro_id)?.rol?.toLowerCase().includes('admin') && (
                            <MaterialCommunityIcons name="crown" size={12} color={isMe ? "#000" : "#c5ff00"} style={{ marginLeft: 4, marginBottom: 4 }} />
                        )}
                    </View>

                    {renderFileContent(item)}

                    {item.texto ? <Text style={[styles.messageText, isMe ? styles.myText : styles.otherText]}>{item.texto}</Text> : null}

                    <Text style={[styles.timeText, isMe ? { color: 'rgba(0,0,0,0.5)' } : { color: '#555' }]}>
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        );
    };

    if (!visible) return null;

    return (
        <View style={StyleSheet.absoluteFill}>
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={[styles.modalContent, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <MaterialCommunityIcons name="chevron-left" size={32} color="#c5ff00" />
                    </TouchableOpacity>
                    <View style={styles.headerInfo}>
                        <Text style={styles.headerTitle}>Chat de Equipo</Text>
                        <Text style={styles.headerSubtitle}>{planTitle} • {planDate}</Text>
                    </View>
                    <View style={styles.statusBadge}>
                        <View style={styles.pulseDot} />
                        <Text style={styles.statusText}>VIVO</Text>
                    </View>
                </View>

                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color="#c5ff00" />
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                        showsVerticalScrollIndicator={false}
                    />
                )}

                <View style={styles.inputSection}>
                    <BlurView intensity={40} tint="dark" style={styles.inputBlur}>
                        <TouchableOpacity onPress={pickImage} style={styles.attachButton}>
                            <MaterialCommunityIcons name="camera" size={22} color="#888" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={pickDocument} style={styles.attachButton}>
                            <MaterialCommunityIcons name="plus" size={24} color="#888" />
                        </TouchableOpacity>

                        <TextInput
                            style={[styles.input, { maxHeight: 100 }]}
                            placeholder="Escribe un mensaje..."
                            placeholderTextColor="#666"
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            onSubmitEditing={sendMessage}
                        />

                        <TouchableOpacity
                            onPress={sendMessage}
                            disabled={sending}
                            style={[styles.sendButton, !inputText.trim() && !sending && styles.sendButtonDisabled]}
                        >
                            {sending ? <ActivityIndicator size="small" color="#000" /> : <MaterialCommunityIcons name="send" size={20} color="#000" />}
                        </TouchableOpacity>
                    </BlurView>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    modalContent: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(0,0,0,0.8)' },
    closeButton: { padding: 5 },
    headerInfo: { flex: 1, marginLeft: 10 },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
    headerSubtitle: { color: '#c5ff00', fontSize: 11, fontWeight: '700', opacity: 0.8 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(197, 255, 0, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(197, 255, 0, 0.2)' },
    pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#c5ff00', marginRight: 6 },
    statusText: { color: '#c5ff00', fontSize: 10, fontWeight: '900' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 15, paddingBottom: 30 },
    messageContainer: { marginBottom: 12, flexDirection: 'row', alignItems: 'flex-end' },
    myMessage: { justifyContent: 'flex-end' },
    otherMessage: { justifyContent: 'flex-start' },
    avatar: { width: 30, height: 30, borderRadius: 10, marginRight: 8 },
    bubble: { maxWidth: width * 0.75, padding: 10, borderRadius: 18 },
    myBubble: { backgroundColor: '#c5ff00', borderBottomRightRadius: 4 },
    otherBubble: { backgroundColor: '#1a1a1a', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#222' },
    bubbleHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    senderName: { color: '#c5ff00', fontSize: 10, fontWeight: '900' },
    messageText: { fontSize: 15, lineHeight: 20 },
    myText: { color: '#000', fontWeight: '500' },
    otherText: { color: '#fff' },
    timeText: { fontSize: 9, alignSelf: 'flex-end', marginTop: 4, fontWeight: '700' },
    systemMessage: { alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, marginVertical: 10 },
    systemMessageText: { color: '#666', fontSize: 11, fontWeight: '600' },

    inputSection: { padding: 10, backgroundColor: 'transparent' },
    inputBlur: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(25,25,25,0.95)', borderRadius: 25, paddingLeft: 10, paddingRight: 5, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    attachButton: { width: 38, height: 38, justifyContent: 'center', alignItems: 'center' },
    input: { flex: 1, color: '#fff', fontSize: 15, paddingHorizontal: 10, paddingVertical: 8 },
    sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#c5ff00', justifyContent: 'center', alignItems: 'center' },
    sendButtonDisabled: { backgroundColor: '#333', opacity: 0.5 },

    attachedImage: { width: width * 0.6, height: width * 0.6, borderRadius: 12, marginBottom: 5 },
    fileAttachment: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 10, borderRadius: 12, marginBottom: 5, width: width * 0.6 },
    fileIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    fileName: { fontSize: 13, fontWeight: '600', flex: 1 },
});
