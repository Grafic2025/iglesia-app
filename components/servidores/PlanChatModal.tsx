import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
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
    ScrollView,
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
    planTime: string;
    equipoIds: any[];
}

export const PlanChatModal: React.FC<PlanChatModalProps> = ({
    visible,
    onClose,
    planId,
    memberId,
    planTitle,
    planDate,
    planTime,
    equipoIds
}) => {
    const insets = useSafeAreaInsets();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [participants, setParticipants] = useState<any[]>([]);
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    // Auto-scroll al fondo al cargar o recibir mensajes
    useEffect(() => {
        if (visible && messages.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 300);
        }
    }, [messages.length, visible]);

    useEffect(() => {
        console.log(`[PLAN-CHAT] Iniciando chat para planId: ${planId}, visible: ${visible}`);
        if (!visible || !planId) return;

        const fetchMessages = async () => {
            console.log(`[PLAN-CHAT] Cargando mensajes iniciales...`);
            setLoading(true);
            const { data, error } = await supabase
                .from('mensajes_plan')
                .select('*, miembros(nombre, apellido, foto_url)')
                .eq('cronograma_id', planId)
                .order('created_at', { ascending: true });

            if (error) console.error('[PLAN-CHAT] Error cargando mensajes:', error);
            else {
                console.log(`[PLAN-CHAT] ${data?.length || 0} mensajes cargados.`);
                setMessages(data || []);
            }
            setLoading(false);
        };

        const fetchParticipantsDetails = async () => {
            if (!equipoIds?.length) return;
            const ids = equipoIds.map(e => e.miembro_id).filter(Boolean);
            const { data } = await supabase
                .from('miembros')
                .select('id, nombre, apellido, foto_url')
                .in('id', ids);

            if (data) {
                const combined = equipoIds.map(e => {
                    const detail = data.find(m => m.id === e.miembro_id);
                    return { ...e, ...detail };
                });
                setParticipants(combined);
            }
        };

        fetchMessages();
        fetchParticipantsDetails();

        console.log(`[PLAN-CHAT] Suscribiéndose a cambios en tiempo real...`);
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
                    console.log(`[PLAN-CHAT] Nuevo mensaje recibido por Realtime:`, payload.new.id);
                    const { data } = await supabase
                        .from('mensajes_plan')
                        .select('*, miembros(nombre, apellido, foto_url)')
                        .eq('id', payload.new.id)
                        .single();

                    if (data) {
                        console.log(`[PLAN-CHAT] Datos del nuevo mensaje recuperados.`);
                        setMessages((prev) => {
                            // Evitar duplicados si ya se insertó localmente
                            if (prev.find(m => m.id === data.id)) return prev;
                            return [...prev, data];
                        });
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'mensajes_plan',
                    filter: `cronograma_id=eq.${planId}`
                },
                (payload) => {
                    console.log(`[PLAN-CHAT] Mensaje actualizado Realtime (Fijado?):`, payload.new.id);
                    setMessages(prev => prev.map(m => m.id === payload.new.id ? { ...m, ...payload.new } : m));
                }
            )
            .subscribe((status) => {
                console.log(`[PLAN-CHAT] Estado del canal Realtime: ${status}`);
            });

        return () => {
            console.log(`[PLAN-CHAT] Cerrando chat y limpiando canal.`);
            supabase.removeChannel(channel);
        };
    }, [visible, planId]);

    const uploadFile = async (uri: string, fileName: string, type: string) => {
        try {
            console.log("[STORAGE] Preparando subida binaria a chat-attachments...");

            // 1. Leer archivo como Base64
            const base64 = await FileSystem.readAsStringAsync(uri, {
                encoding: 'base64'
            });

            // 2. Convertir Base64 a ArrayBuffer
            const binaryString = atob(base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            const fileExt = fileName.split('.').pop() || 'jpg';
            const path = `${planId}/${Date.now()}.${fileExt}`; // Ruta directa por si hay políticas de carpeta

            // 3. Subir a Supabase (Bucket original solicitado)
            const { data, error } = await supabase.storage
                .from('chat-attachments')
                .upload(path, bytes.buffer, {
                    contentType: type,
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                console.error("[STORAGE] Error de Políticas (RLS):", error.message);
                throw error;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('chat-attachments')
                .getPublicUrl(path);

            return publicUrl;
        } catch (e: any) {
            console.error('[STORAGE] Error FATAL:', e);
            Alert.alert("Error de Permisos",
                "Supabase rechazó la subida. Asegúrate de que el bucket 'chat-attachments' tenga habilitada la política de 'INSERT' para usuarios públicos (anon) en el panel de Supabase.");
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
                    await sendMessageInternal(`📸 Foto enviada: ${url}`);
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
                    // Si es una imagen, usar el prefijo de foto para mejor detección
                    const isImg = asset.mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(asset.name);
                    await sendMessageInternal(`${isImg ? '� Foto enviada:' : '�📄 Archivo adjunto:'} ${url}`);
                }
                setSending(false);
            }
        } catch (e) {
            console.error(e);
            setSending(false);
        }
    };

    const sendMessageInternal = async (text: string) => {
        const { error } = await supabase.from('mensajes_plan').insert([
            {
                cronograma_id: planId,
                miembro_id: memberId,
                texto: text
            }
        ]);

        if (error) {
            console.error('[PLAN-CHAT] Error crítico al insertar:', error);
            Alert.alert("Error de Envío", `Detalle: ${error.message}`);
        }
    };

    const togglePinMessage = async (msgId: string, currentPinned: boolean) => {
        try {
            // Si vamos a FIJARlo, primero nos aseguramos de desfijar el resto en BD para este plan
            if (!currentPinned) {
                await supabase
                    .from('mensajes_plan')
                    .update({ fijado: false })
                    .eq('cronograma_id', planId);
            }

            const { error } = await supabase
                .from('mensajes_plan')
                .update({ fijado: !currentPinned })
                .eq('id', msgId);

            if (!error) {
                // Actualizar estado local: si fijamos uno, los demás pasan a falso
                setMessages(prev => prev.map(m => {
                    if (m.id === msgId) return { ...m, fijado: !currentPinned };
                    if (!currentPinned) return { ...m, fijado: false };
                    return m;
                }));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const pinnedMsg = messages.find(m => (m as any).fijado);

    // Texto limpio para el banner fijado
    const getPinnedDisplayText = (msg: any) => {
        if (!msg) return "";
        const text = msg.texto || "";
        if (text.includes('📸 Foto enviada: ')) return "Foto compartida";
        if (text.includes('📄 Archivo adjunto: ')) return "Archivo adjunto";
        // Limpiar absolutamente todo para que no haya filtración de píxeles
        return text.split('\n')[0].replace(/\r/g, "").substring(0, 45).trim();
    };

    const sendMessage = async () => {
        if (!inputText.trim() || sending) return;
        const textToSend = inputText.trim();
        console.log(`[PLAN-CHAT] Intentando enviar mensaje: "${textToSend.substring(0, 20)}..."`);
        console.log(`[PLAN-CHAT] Datos: planId=${planId}, memberId=${memberId}`);
        setSending(true);
        await sendMessageInternal(textToSend);
        setInputText('');
        setSending(false);
        console.log(`[PLAN-CHAT] Proceso de envío completado.`);
    };

    const renderFileContent = (item: Message) => {
        let url = item.archivo_url;
        let type = item.archivo_tipo;
        let name = item.archivo_nombre;

        // Si no hay datos en las columnas dedicadas, intentamos extraer del texto (compatibilidad)
        if (!url && item.texto) {
            const extraction = item.texto.match(/(https?:\/\/[^\s]+)/);
            if (extraction) {
                url = extraction[0];
                // Detectar tipo por extensión de archivo o por el emoji que mandamos
                const hasCameraEmoji = item.texto.includes('📸');
                const isImageExt = /\.(jpg|jpeg|png|gif|webp|heic|bmp)(\?.*)?$/i.test(url);
                const isVideoExt = /\.(mp4|mov|avi|wmv)(\?.*)?$/i.test(url);

                if (hasCameraEmoji || isImageExt) {
                    type = 'image';
                    name = 'Imagen';
                } else if (isVideoExt) {
                    type = 'video';
                    name = 'Video';
                } else {
                    type = 'document';
                    name = 'Documento';
                }
            }
        }

        if (!url) return null;

        if (type === 'image') {
            return (
                <TouchableOpacity onPress={() => Linking.openURL(url!)}>
                    <ExpoImage
                        source={{ uri: url }}
                        style={styles.attachedImage}
                        contentFit="cover"
                        transition={200}
                    />
                </TouchableOpacity>
            );
        }

        const isMe = item.miembro_id === memberId;
        const iconName = type === 'video' ? 'play-circle' : 'file-document';
        const iconColor = isMe ? '#000' : '#c5ff00';

        return (
            <TouchableOpacity
                style={styles.fileAttachment}
                onPress={() => Linking.openURL(url!)}
            >
                <View style={[styles.fileIcon, { backgroundColor: `${iconColor}20` }]}>
                    <MaterialCommunityIcons name={iconName as any} size={24} color={iconColor} />
                </View>
                <Text style={[styles.fileName, { color: isMe ? '#000' : '#fff' }]} numberOfLines={1}>
                    {name || 'Archivo'}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderItem = ({ item }: { item: Message }) => {
        const isMe = item.miembro_id === memberId;
        const isSystem = item.miembro_id === '00000000-0000-0000-0000-000000000000';
        const isPinned = (item as any).fijado;

        if (isSystem) {
            return (
                <View style={styles.systemMessage}>
                    <Text style={styles.systemMessageText}>{item.texto}</Text>
                </View>
            );
        }

        return (
            <TouchableOpacity
                activeOpacity={0.9}
                onLongPress={() => {
                    const actionTitle = isPinned ? "Desfijar mensaje" : "Fijar mensaje";
                    const actionBtn = isPinned ? "Desfijar" : "Fijar";

                    Alert.alert(
                        actionTitle,
                        isPinned ? "¿Quieres quitar este mensaje de la parte superior?" : "¿Quieres destacar este mensaje arriba de todo?",
                        [
                            { text: "Cancelar", style: "cancel" },
                            { text: actionBtn, onPress: () => togglePinMessage(item.id, !!isPinned) }
                        ]
                    );
                }}
                style={[styles.messageContainer, isMe ? styles.myMessage : styles.otherMessage]}
            >
                {!isMe && (
                    <Image
                        source={item.miembros?.foto_url ? { uri: item.miembros.foto_url } : { uri: 'https://via.placeholder.com/30' }}
                        style={styles.avatar}
                    />
                )}
                <View style={[styles.bubble, isMe ? styles.myBubble : styles.otherBubble]}>
                    <View style={styles.bubbleHeader}>
                        {!isMe && <Text style={styles.senderName}>{item.miembros?.nombre} {item.miembros?.apellido}</Text>}
                        {isPinned && <MaterialCommunityIcons name="pin" size={10} color={isMe ? "#000" : "#c5ff00"} style={{ marginLeft: 4 }} />}
                    </View>

                    {renderFileContent(item)}

                    {item.texto && !item.texto.includes('📸 Foto enviada: ') && !item.texto.includes('📄 Archivo adjunto: ') ? (
                        <Text style={[styles.messageText, isMe ? styles.myText : styles.otherText]}>{item.texto}</Text>
                    ) : null}

                    <View style={styles.bubbleFooter}>
                        <Text style={[styles.timeText, isMe ? { color: 'rgba(0,0,0,0.5)' } : { color: '#555' }]}>
                            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (!visible) return null;

    return (
        <View style={StyleSheet.absoluteFill}>
            <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />

            <Image
                source={require('../../assets/chat_bg.png')}
                style={[StyleSheet.absoluteFill, { opacity: 0.35 }]}
                resizeMode="repeat"
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={[styles.modalContent, { backgroundColor: 'transparent' }]}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                {/* Header y Banner flotantes con Glass Effect */}
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100, paddingTop: insets.top }}>
                    <View style={styles.headerContainer}>
                        <BlurView intensity={70} tint="dark" style={styles.headerBlur}>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <MaterialCommunityIcons name="chevron-left" size={32} color="#c5ff00" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.headerInfo}
                                onPress={() => setShowInfo(true)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.headerTitle} numberOfLines={1}>{planTitle}</Text>
                                <Text style={styles.headerSubtitle}>{planDate} - Tocá para info</Text>
                            </TouchableOpacity>

                            <View style={styles.statusBadge}>
                                <Text style={styles.statusText}>GRUPO</Text>
                            </View>
                        </BlurView>
                    </View>

                    {pinnedMsg && (
                        <View style={styles.pinnedContainer}>
                            <BlurView intensity={50} tint="dark" style={styles.pinnedBlur}>
                                <TouchableOpacity
                                    activeOpacity={0.9}
                                    onPress={() => {
                                        const idx = messages.findIndex(m => m.id === pinnedMsg.id);
                                        if (idx !== -1) {
                                            flatListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
                                        }
                                    }}
                                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                                >
                                    <MaterialCommunityIcons name="pin" size={16} color="#c5ff00" style={{ marginRight: 10 }} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.pinnedTitle} numberOfLines={1}>MENSAJE FIJADO POR {pinnedMsg.miembros?.nombre?.toUpperCase() || 'LÍDER'}</Text>
                                        <Text style={styles.pinnedText} numberOfLines={1}>
                                            {getPinnedDisplayText(pinnedMsg)}
                                        </Text>
                                    </View>
                                    <MaterialCommunityIcons name="chevron-down" size={20} color="#888" style={{ marginLeft: 5 }} />
                                </TouchableOpacity>
                            </BlurView>
                        </View>
                    )}
                </View>

                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color="#c5ff00" />
                    </View>
                ) : (
                    <>
                        <FlatList
                            ref={flatListRef}
                            data={messages}
                            renderItem={renderItem}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={[
                                styles.listContent,
                                { paddingTop: pinnedMsg ? 140 : 80, paddingBottom: 100 }
                            ]}
                            onScroll={(e) => {
                                const { y } = e.nativeEvent.contentOffset;
                                const { height } = e.nativeEvent.contentSize;
                                const { height: layoutHeight } = e.nativeEvent.layoutMeasurement;
                                // Mostrar el botón si falta más de 300px para el final
                                setShowScrollBtn(y < height - layoutHeight - 300);
                            }}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <MaterialCommunityIcons name="chat-processing-outline" size={60} color="#222" />
                                    <Text style={styles.emptyText}>Todavía no hay mensajes.</Text>
                                    <Text style={styles.emptySub}>¡Sé el primero en saludar al equipo! 🙏</Text>
                                </View>
                            }
                        />

                        {showScrollBtn && (
                            <TouchableOpacity
                                style={styles.scrollToBottomBtn}
                                onPress={() => flatListRef.current?.scrollToEnd({ animated: true })}
                                activeOpacity={0.8}
                            >
                                <MaterialCommunityIcons name="chevron-double-down" size={24} color="#000" />
                            </TouchableOpacity>
                        )}
                    </>
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

                {/* OVERLAY INFO GRUPO - DISEÑO PREMIUM */}
                {showInfo && (
                    <View style={styles.infoOverlay}>
                        <View style={[styles.infoHeaderPremium, { paddingTop: insets.top + 10 }]}>
                            <TouchableOpacity onPress={() => setShowInfo(false)} style={styles.infoBackBtn}>
                                <MaterialCommunityIcons name="arrow-left" size={28} color="#c5ff00" />
                            </TouchableOpacity>
                            <Text style={styles.infoModeTitle}>Información del Plan</Text>
                            <View style={{ width: 40 }} />
                        </View>

                        <ScrollView style={styles.infoScroll} showsVerticalScrollIndicator={false}>
                            {/* Cabecera Principal */}
                            <View style={styles.infoMainHeader}>
                                <View style={styles.infoIconCircle}>
                                    <MaterialCommunityIcons name="account-group" size={50} color="#c5ff00" />
                                </View>
                                <Text style={styles.infoMainTitle}>{planTitle}</Text>
                                <Text style={styles.infoMainSubtitle}>Grupo de Servidores • {participants.length} integrantes</Text>
                            </View>

                            {/* Tarjeta de Horario (MUY IMPORTANTE) */}
                            <View style={styles.timeHighlightCard}>
                                <View style={styles.timeCardIcon}>
                                    <MaterialCommunityIcons name="clock-check" size={26} color="#000" />
                                </View>
                                <View>
                                    <Text style={styles.timeCardLabel}>HORARIO DE SERVICIO</Text>
                                    <Text style={styles.timeCardValue}>{planTime || 'A definir'} HS</Text>
                                    <Text style={styles.timeCardDate}>{planDate}</Text>
                                </View>
                            </View>

                            {/* Sección Multimedia */}
                            <View style={styles.infoSection}>
                                <View style={styles.sectionHeaderRow}>
                                    <Text style={styles.infoSectionTitle}>ARCHIVOS Y MULTIMEDIA</Text>
                                    <TouchableOpacity>
                                        <Text style={styles.seeAllText}>Ver todo</Text>
                                    </TouchableOpacity>
                                </View>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaHorizontal}>
                                    {messages.filter(m => m.texto?.includes('📸') || m.texto?.includes('📄')).length > 0 ? (
                                        messages.filter(m => m.texto?.includes('📸') || m.texto?.includes('📄')).map((m, i) => (
                                            <View key={i} style={styles.mediaMiniature}>
                                                <MaterialCommunityIcons
                                                    name={m.texto?.includes('📸') ? "image" : "file-document"}
                                                    size={24}
                                                    color="rgba(255,255,255,0.3)"
                                                />
                                            </View>
                                        ))
                                    ) : (
                                        <Text style={styles.noMediaText}>No hay archivos compartidos aún.</Text>
                                    )}
                                </ScrollView>
                            </View>

                            {/* Lista de Integrantes */}
                            <View style={styles.infoSection}>
                                <Text style={styles.infoSectionTitle}>INTEGRANTES DEL EQUIPO</Text>
                                {participants.map((p, idx) => (
                                    <TouchableOpacity key={p.id || idx} style={styles.participantItem}>
                                        <Image
                                            source={p.foto_url ? { uri: p.foto_url } : { uri: 'https://via.placeholder.com/100' }}
                                            style={styles.participantAvatar}
                                        />
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.participantName}>{p.nombre} {p.apellido}</Text>
                                            <Text style={styles.participantRole}>
                                                {p.zona || 'Servidor'} • {p.estado === 'confirmado' ? 'Confirmado' : 'Pendiente'}
                                            </Text>
                                        </View>
                                        {p.estado === 'confirmado' ? (
                                            <MaterialCommunityIcons name="check-decagram" size={20} color="#c5ff00" />
                                        ) : (
                                            <MaterialCommunityIcons name="clock-outline" size={20} color="#666" />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={styles.infoSectionSpacer} />
                        </ScrollView>
                    </View>
                )}
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    modalContent: { flex: 1, backgroundColor: 'transparent' },
    headerContainer: { backgroundColor: 'transparent', zIndex: 100 },
    headerBlur: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)'
    },
    closeButton: { padding: 5 },
    headerInfo: { flex: 1, marginLeft: 10 },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
    headerSubtitle: { color: '#c5ff00', fontSize: 11, fontWeight: '700' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(197, 255, 0, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
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

    pinnedContainer: {
        backgroundColor: 'transparent',
        zIndex: 90
    },
    pinnedBlur: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.03)',
        overflow: 'hidden'
    },
    pinnedTitle: {
        color: '#c5ff00',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 0.2
    },
    pinnedText: {
        color: '#888',
        fontSize: 12,
        flex: 1,
        marginLeft: 0,
        marginTop: 2,
        includeFontPadding: false
    },

    infoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000', zIndex: 1000 },
    infoHeaderPremium: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
    infoBackBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    infoModeTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
    infoScroll: { flex: 1 },
    infoMainHeader: { alignItems: 'center', paddingVertical: 40, borderBottomWidth: 1, borderBottomColor: '#111' },
    infoIconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 2, borderColor: '#c5ff00' },
    infoMainTitle: { color: '#fff', fontSize: 24, fontWeight: '900', textAlign: 'center', paddingHorizontal: 30 },
    infoMainSubtitle: { color: '#666', fontSize: 14, marginTop: 5, fontWeight: '600' },
    timeHighlightCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#c5ff00', margin: 20, padding: 20, borderRadius: 25, shadowColor: '#c5ff00', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 12 },
    timeCardIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(0,0,0,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 20 },
    timeCardLabel: { color: 'rgba(0,0,0,0.5)', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    timeCardValue: { color: '#000', fontSize: 28, fontWeight: '900', lineHeight: 32 },
    timeCardDate: { color: 'rgba(0,0,0,0.7)', fontSize: 13, fontWeight: '700' },
    infoSection: { marginTop: 10, paddingHorizontal: 20, paddingVertical: 20 },
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    infoSectionTitle: { color: '#666', fontSize: 12, fontWeight: '900', letterSpacing: 1.5 },
    seeAllText: { color: '#c5ff00', fontSize: 12, fontWeight: '800' },
    mediaHorizontal: { flexDirection: 'row', marginTop: 5 },
    mediaMiniature: { width: 80, height: 80, borderRadius: 15, backgroundColor: '#111', marginRight: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#222' },
    noMediaText: { color: '#444', fontSize: 13, fontStyle: 'italic', marginVertical: 10 },
    participantItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#111' },
    participantAvatar: { width: 46, height: 46, borderRadius: 23, marginRight: 15, backgroundColor: '#1A1A1A' },
    participantName: { color: '#fff', fontSize: 15, fontWeight: '700' },
    participantRole: { color: '#666', fontSize: 12, marginTop: 2 },
    infoSectionSpacer: { height: 120 },
    bubbleFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 2 },
    emptyContainer: { flex: 1, height: 400, justifyContent: 'center', alignItems: 'center', opacity: 0.5 },
    emptyText: { color: '#fff', fontSize: 16, fontWeight: '900', marginTop: 10 },
    emptySub: { color: '#666', fontSize: 13, textAlign: 'center', marginTop: 5 },
    scrollToBottomBtn: {
        position: 'absolute',
        right: 20,
        bottom: 120,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#c5ff00',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#c5ff00',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 10
    }
});
