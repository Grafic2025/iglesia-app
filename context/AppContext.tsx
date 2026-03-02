import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface AppContextType {
    isLoggedIn: boolean;
    memberId: string | null;
    nombre: string;
    apellido: string;
    fotoUrl: string | null;
    fechaNacimiento: string | null;
    zona: string | null;
    loading: boolean;
    noticiasSupabase: any[];
    serieEsenciales: any[];
    rachaUsuario: number;
    asistenciasDetalle: any[];
    currentScreen: string;
    setCurrentScreen: (s: string) => void;
    logout: () => void;
    login: (id: string, name: string, surname: string) => Promise<void>;
    loginWithBiometrics: () => Promise<boolean>;
    refreshData: () => Promise<void>;
    isCurrentlyLive: boolean;
    liveVideoUrl: string | null;
    esServidor: boolean;
    esAdmin: boolean;
    notificationInbox: any[];
    addNotificationToInbox: (notif: any) => void;
    unreadCount: number;
    markNotificationRead: (id: string) => void;
    markAllRead: () => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * AppProvider es el componente proveedor del contexto global de la aplicación.
 * Gestiona el estado de autenticación, perfil del usuario, notificaciones,
 * y la sincronización de datos con Supabase y YouTube.
 */
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [memberId, setMemberId] = useState<string | null>(null);
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [fotoUrl, setFotoUrl] = useState<string | null>(null);
    const [fechaNacimiento, setFechaNacimiento] = useState<string | null>(null);
    const [zona, setZona] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [noticiasSupabase, setNoticiasSupabase] = useState<any[]>([]);
    const [serieEsenciales, setSerieEsenciales] = useState<any[]>([]);
    const [rachaUsuario, setRachaUsuario] = useState(0);
    const [asistenciasDetalle, setAsistenciasDetalle] = useState<any[]>([]);
    const [currentScreen, setCurrentScreen] = useState('Inicio');
    const [isCurrentlyLive, setIsCurrentlyLive] = useState(false);
    const [liveVideoUrl, setLiveVideoUrl] = useState<string | null>(null);
    const [esServidor, setEsServidor] = useState(false);
    const [esAdmin, setEsAdmin] = useState(false);
    const [notificationInbox, setNotificationInbox] = useState<any[]>([]);

    /**
     * Carga la sesión del usuario desde el almacenamiento persistente (SecureStore y AsyncStorage).
     * Recupera el ID del miembro, nombre y apellido para rehidratar el estado de inicio de sesión.
     */
    const loadSession = useCallback(async () => {
        try {
            const mid = await SecureStore.getItemAsync('memberId');
            const savedNombre = await AsyncStorage.getItem('nombre');
            const savedApellido = await AsyncStorage.getItem('apellido');

            if (savedNombre) setNombre(savedNombre);
            if (savedApellido) setApellido(savedApellido);

            if (mid && savedNombre) {
                setMemberId(mid);
                setIsLoggedIn(true);
            }
        } catch (e) {
            console.error("Error loading session:", e);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Registra el inicio de sesión del usuario guardando sus datos en el almacenamiento local.
     * 
     * @param id ID único del miembro.
     * @param name Nombre del miembro.
     * @param surname Apellido del miembro.
     */
    const login = async (id: string, name: string, surname: string) => {
        await SecureStore.setItemAsync('memberId', id);
        await AsyncStorage.setItem('nombre', name);
        await AsyncStorage.setItem('apellido', surname);
        await AsyncStorage.setItem('loginTimestamp', new Date().toISOString());
        setMemberId(id);
        setNombre(name);
        setApellido(surname);
        setIsLoggedIn(true);
    };

    /**
     * Restaura la sesión del usuario a partir del almacenamiento local, sin necesidad
     * de ingresar nombre y apellido manualmente. Útil tras autenticación biométrica exitosa.
     * Retorna true si la sesión fue restaurada correctamente.
     */
    const loginWithBiometrics = async (): Promise<boolean> => {
        try {
            const mid = await SecureStore.getItemAsync('memberId');
            const savedNombre = await AsyncStorage.getItem('nombre');
            const savedApellido = await AsyncStorage.getItem('apellido');
            if (mid && savedNombre) {
                setMemberId(mid);
                setNombre(savedNombre);
                if (savedApellido) setApellido(savedApellido);
                setIsLoggedIn(true);
                return true;
            }
            return false;
        } catch (e) {
            console.error('Error in loginWithBiometrics:', e);
            return false;
        }
    };

    /**
     * Cierra la sesión del usuario eliminando todos los datos del almacenamiento local
     * y reseteando los estados globales.
     */
    const logout = async () => {
        console.log("[LOGOUT] Iniciando proceso de cierre de sesión...");
        try {
            console.log("[LOGOUT] Eliminando memberId de SecureStore...");
            await SecureStore.deleteItemAsync('memberId');

            console.log("[LOGOUT] Eliminando loginTimestamp de AsyncStorage...");
            await AsyncStorage.removeItem('loginTimestamp');

            // Opcional: Si quieres borrar el nombre/apellido totalmente descomenta esto:
            // await AsyncStorage.removeItem('nombre');
            // await AsyncStorage.removeItem('apellido');

            console.log("[LOGOUT] Reseteando estados globales...");
            setMemberId(null);
            setIsLoggedIn(false);
            setEsAdmin(false);
            setEsServidor(false);
            setFotoUrl(null);
            setCurrentScreen('Inicio'); // Reset screen on logout
            console.log("[LOGOUT] Proceso completado exitosamente.");
        } catch (e) {
            console.error("[LOGOUT] ERROR CRÍTICO durante el cierre:", e);
        }
    };

    /**
     * Agrega una nueva notificación al buzón interno de la aplicación.
     * Guarda la lista actualizada en AsyncStorage.
     * 
     * @param notif Objeto con los datos de la notificación.
     */
    const addNotificationToInbox = useCallback((notif: any) => {
        const newNotif = { ...notif, id: Date.now().toString(), date: new Date().toISOString(), read: false };
        setNotificationInbox(prev => {
            const updated = [newNotif, ...prev];
            AsyncStorage.setItem('notificationInbox', JSON.stringify(updated));
            return updated;
        });
    }, []);

    /**
     * Marca una notificación específica como leída.
     * 
     * @param id ID de la notificación a marcar.
     */
    const markNotificationRead = (id: string) => {
        setNotificationInbox(prev => {
            const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
            AsyncStorage.setItem('notificationInbox', JSON.stringify(updated));
            return updated;
        });
    };

    /**
     * Marca todas las notificaciones del buzón como leídas.
     */
    const markAllRead = () => {
        setNotificationInbox(prev => {
            const updated = prev.map(n => ({ ...n, read: true }));
            AsyncStorage.setItem('notificationInbox', JSON.stringify(updated));
            return updated;
        });
    };

    const unreadCount = notificationInbox.filter(n => !n.read).length;

    // TTL ref para evitar re-fetches de YouTube (10 minutos)
    const youtubeCacheTs = React.useRef<number>(0);

    /**
     * Obtiene en PARALELO: videos generales, serie Esenciales y estado de live
     * desde el feed RSS de YouTube. Usa un TTL de 10 min para evitar llamadas repetidas.
     */
    const fetchYoutubeData = useCallback(async (force = false) => {
        const now = Date.now();
        const TEN_MIN = 10 * 60 * 1000;
        if (!force && now - youtubeCacheTs.current < TEN_MIN) return;

        const channelId = 'UCa9xuv0bgR6dTD_9GTbFXQg';
        const playlistId = 'PL9eGAPSt61HBxiNwoXIG0xpaWzf0aNTuC';

        try {
            // 2 fetches en paralelo (el channel se reutiliza para live check)
            const [channelRes, playlistRes] = await Promise.all([
                fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`),
                fetch(`https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`),
            ]);
            const [channelXml, playlistXml] = await Promise.all([
                channelRes.text(),
                playlistRes.text(),
            ]);

            // --- Videos generales (cache) ---
            const generalItems = channelXml.match(/<entry>([\s\S]*?)<\/entry>/g);
            if (generalItems) {
                const parsed = generalItems.map(item => {
                    const id = item.match(/yt:videoId>(.*)<\/yt/)?.[1];
                    const title = item.match(/title>(.*)<\/title/)?.[1];
                    return { id, title, thumb: `https://i.ytimg.com/vi/${id}/mqdefault.jpg` };
                }).filter(v => v.id);
                AsyncStorage.setItem('cache_videos', JSON.stringify(parsed));
            }

            // --- Esenciales: canal + playlist, deduplicados ---
            const parseEntries = (xml: string) =>
                (xml.match(/<entry>([\s\S]*?)<\/entry>/g) || []).map(item => {
                    const id = item.match(/yt:videoId>(.*)<\/yt/)?.[1];
                    const titulo = item.match(/title>(.*)<\/title/)?.[1];
                    return { id, titulo, imagen_url: `https://i.ytimg.com/vi/${id}/mqdefault.jpg` };
                });

            const allEntries = [...parseEntries(channelXml), ...parseEntries(playlistXml)];
            const seen = new Set<string>();
            const unique = allEntries.filter(v => {
                if (!v.id || seen.has(v.id)) return false;
                seen.add(v.id);
                return v.titulo?.toUpperCase().includes('ESENCIALES');
            });
            setSerieEsenciales(unique);

            // --- Live check (reutiliza el channelXml ya descargado) ---
            if (channelXml.includes('yt:status>live')) {
                setIsCurrentlyLive(true);
                setLiveVideoUrl('https://youtube.com/@iglesiadelsalvador/live');
            } else {
                setIsCurrentlyLive(false);
            }

            youtubeCacheTs.current = now;
        } catch (e) { console.log('YouTube fetch error:', e); }
    }, []);

    /** Solo refresca Supabase en paralelo — usado por los realtime listeners */
    const refreshSupabaseOnly = useCallback(async () => {
        if (!memberId) return;
        try {
            const hace30Dias = new Date();
            hace30Dias.setDate(hace30Dias.getDate() - 30);

            const [newsRes, memberRes, asistRes] = await Promise.all([
                supabase.from('noticias').select('*').eq('activa', true).order('created_at', { ascending: false }),
                supabase.from('miembros').select('*').eq('id', memberId).single(),
                supabase.from('asistencias').select('*').eq('miembro_id', memberId)
                    .gte('fecha', hace30Dias.toISOString().split('T')[0])
                    .order('fecha', { ascending: false }),
            ]);

            if (newsRes.data) {
                setNoticiasSupabase(newsRes.data);
                AsyncStorage.setItem('cache_noticias', JSON.stringify(newsRes.data));
            }
            if (memberRes.data) {
                const m = memberRes.data;
                setNombre(m.nombre); setApellido(m.apellido); setFotoUrl(m.foto_url);
                setFechaNacimiento(m.fecha_nacimiento); setZona(m.zona);
                setEsServidor(m.es_servidor || false); setEsAdmin(m.es_admin || false);
            }
            if (asistRes.data) {
                setRachaUsuario(asistRes.data.length);
                setAsistenciasDetalle(asistRes.data);
            }
        } catch (e) { console.error('Error refreshing Supabase:', e); }
    }, [memberId]);

    /** Refresca TODO: Supabase (paralelo) + YouTube (con TTL) */
    const refreshData = useCallback(async () => {
        await refreshSupabaseOnly();
        fetchYoutubeData();
    }, [refreshSupabaseOnly, fetchYoutubeData]);

    useEffect(() => {
        const loadCache = async () => {
            try {
                const cachedNews = await AsyncStorage.getItem('cache_noticias');
                if (cachedNews) {
                    const parsedNews = JSON.parse(cachedNews);
                    if (Array.isArray(parsedNews)) setNoticiasSupabase(parsedNews);
                }
                const cachedInbox = await AsyncStorage.getItem('notificationInbox');
                if (cachedInbox) {
                    const parsedInbox = JSON.parse(cachedInbox);
                    if (Array.isArray(parsedInbox)) setNotificationInbox(parsedInbox);
                }
            } catch (e) { console.log(e); }
        };
        loadCache();
        loadSession();

        // Real-time subscriptions — solo Supabase, no YouTube
        let newsSub: any = null;
        if (supabase) {
            newsSub = supabase.channel('news-realtime')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'noticias' }, () => refreshSupabaseOnly())
                .subscribe();
        }

        let cronoSub: any = null;
        if (supabase) {
            cronoSub = supabase.channel('cronos-realtime')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'cronogramas' }, () => refreshSupabaseOnly())
                .subscribe();
        }

        return () => {
            if (newsSub) supabase.removeChannel(newsSub);
            if (cronoSub) supabase.removeChannel(cronoSub);
        };
    }, [loadSession, refreshSupabaseOnly]);

    // Solo refrescar si ya estamos logueados y NO estamos en estado inicial de carga
    useEffect(() => {
        if (isLoggedIn && memberId && !loading) {
            refreshData();
        }
    }, [isLoggedIn, memberId, loading, refreshData]);

    return (
        <AppContext.Provider value={{
            isLoggedIn, memberId, nombre, apellido, fotoUrl, fechaNacimiento, zona, loading,
            noticiasSupabase, serieEsenciales, rachaUsuario, asistenciasDetalle,
            currentScreen, setCurrentScreen, logout, login, loginWithBiometrics, refreshData,
            isCurrentlyLive, liveVideoUrl, esServidor, esAdmin, notificationInbox, addNotificationToInbox,
            unreadCount, markNotificationRead, markAllRead
        }}>
            {children}
        </AppContext.Provider>
    );
};

/**
 * Custom hook para acceder fácilmente al contexto de la aplicación desde cualquier componente.
 * 
 * @returns El objeto de contexto AppContextType.
 * @throws Error si se usa fuera de un AppProvider.
 */
export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useApp must be used within AppProvider');
    return context;
};
