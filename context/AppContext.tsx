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
    deleteAccount: () => Promise<void>;
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
    homeActions: any[];
    isOffline: boolean;
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
    const [homeActions, setHomeActions] = useState<any[]>([]);
    const [isOffline, setIsOffline] = useState(false);

    /**
     * Carga la sesión del usuario y la caché de forma ultra-rápida usando Promise.all.
     */
    const loadSession = useCallback(async () => {
        console.log('[SESSION] Cargando sesión desde almacenamiento local...');
        try {
            // Buscamos todo en paralelo para ganar velocidad de arranque
            const [
                mid, savedNombre, savedApellido, savedFoto, savedNac, savedZona,
                savedEsServidor, savedEsAdmin, savedRacha,
                cachedNews, cachedInbox, cachedActions, cachedEsenciales, cachedAsistencias
            ] = await Promise.all([
                SecureStore.getItemAsync('memberId'),
                AsyncStorage.getItem('nombre'),
                AsyncStorage.getItem('apellido'),
                AsyncStorage.getItem('foto_url'),
                AsyncStorage.getItem('fecha_nacimiento'),
                AsyncStorage.getItem('zona'),
                AsyncStorage.getItem('es_servidor'),
                AsyncStorage.getItem('es_admin'),
                AsyncStorage.getItem('racha_usuario'),
                AsyncStorage.getItem('cache_noticias'),
                AsyncStorage.getItem('notificationInbox'),
                AsyncStorage.getItem('cache_home_actions'),
                AsyncStorage.getItem('cache_esenciales'),
                AsyncStorage.getItem('cache_asistencias_detalle')
            ]);

            console.log(`[SESSION] Datos recuperados -> ID: ${mid || 'Ninguno'}, Nombre: ${savedNombre || 'Ninguno'}`);

            // Restaurar sesión y perfil
            if (savedNombre) setNombre(savedNombre);
            if (savedApellido) setApellido(savedApellido);
            if (savedFoto) setFotoUrl(savedFoto);
            if (savedNac) setFechaNacimiento(savedNac);
            if (savedZona) setZona(savedZona);
            if (savedEsServidor) setEsServidor(savedEsServidor === 'true');
            if (savedEsAdmin) setEsAdmin(savedEsAdmin === 'true');
            if (savedRacha) setRachaUsuario(parseInt(savedRacha) || 0);

            if (mid && savedNombre) {
                setMemberId(mid);
                setIsLoggedIn(true);
                console.log('[SESSION] Sesión restaurada y activa.');
            }

            // Restaurar caché de noticias, inbox y acciones
            if (cachedNews) {
                const parsed = JSON.parse(cachedNews);
                if (Array.isArray(parsed)) setNoticiasSupabase(parsed);
            }
            if (cachedInbox) {
                const parsed = JSON.parse(cachedInbox);
                if (Array.isArray(parsed)) setNotificationInbox(parsed);
            }
            if (cachedActions) {
                const parsed = JSON.parse(cachedActions);
                if (Array.isArray(parsed)) setHomeActions(parsed);
            }
            if (cachedEsenciales) {
                const parsed = JSON.parse(cachedEsenciales);
                if (Array.isArray(parsed)) setSerieEsenciales(parsed);
            }
            if (cachedAsistencias) {
                const parsed = JSON.parse(cachedAsistencias);
                if (Array.isArray(parsed)) setAsistenciasDetalle(parsed);
            }

        } catch (e) {
            console.error("[SESSION] ERROR crítico al cargar sesión:", e);
        } finally {
            // Liberamos el círculo amarillo lo antes posible
            setLoading(false);
            console.log('[SESSION] Carga inicial completa.');
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
        console.log(`[AUTH] Iniciando login para ${name} ${surname} (ID: ${id})`);
        try {
            await SecureStore.setItemAsync('memberId', id);
            await SecureStore.setItemAsync('biometricMemberId', id);
            await AsyncStorage.setItem('nombre', name);
            await AsyncStorage.setItem('apellido', surname);
            await AsyncStorage.setItem('loginTimestamp', new Date().toISOString());
            setMemberId(id);
            setNombre(name);
            setApellido(surname);
            setIsLoggedIn(true);
            console.log('[AUTH] Sesión guardada en almacenamiento seguro.');
        } catch (e) {
            console.error('[AUTH] ERROR al guardar sesión:', e);
        }
    };

    /**
     * Restaura la sesión del usuario a partir del almacenamiento local, sin necesidad
     * de ingresar nombre y apellido manualmente. Útil tras autenticación biométrica exitosa.
     * Retorna true si la sesión fue restaurada correctamente.
     */
    const loginWithBiometrics = async (): Promise<boolean> => {
        console.log('[AUTH-BIO] Intentando login biométrico secundario...');
        try {
            // Usamos biometricMemberId si no hay una sesión activa, lo que permite re-entrar tras un logout
            const mid = await SecureStore.getItemAsync('biometricMemberId') || await SecureStore.getItemAsync('memberId');
            const savedNombre = await AsyncStorage.getItem('nombre');
            const savedApellido = await AsyncStorage.getItem('apellido');

            console.log(`[AUTH-BIO] Datos encontrados -> ID: ${mid ? 'SÍ' : 'NO'}, Nombre: ${savedNombre ? 'SÍ' : 'NO'}`);

            if (mid && savedNombre) {
                setMemberId(mid);
                setNombre(savedNombre);
                if (savedApellido) setApellido(savedApellido);
                setIsLoggedIn(true);
                console.log('[AUTH-BIO] Sesión restaurada exitosamente.');
                return true;
            }
            console.warn('[AUTH-BIO] No se encontraron credenciales suficientes para restaurar sesión.');
            return false;
        } catch (e) {
            console.error('[AUTH-BIO] ERROR crítico en loginWithBiometrics:', e);
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
     * Elimina completamente la cuenta del usuario:
     * - Borra datos relacionados en Supabase (asistencias, pedidos, notificaciones, equipos)
     * - Elimina la foto de perfil del storage
     * - Borra el registro del miembro
     * - Limpia todo AsyncStorage y SecureStore
     * - Resetea todos los estados de la app
     */
    const deleteAccount = async () => {
        if (!memberId) return;
        console.log('[DELETE-ACCOUNT] Iniciando eliminación completa...');
        try {
            // 1. Borrar datos relacionados en Supabase
            await Promise.allSettled([
                supabase.from('asistencias').delete().eq('miembro_id', memberId),
                supabase.from('pedidos_oracion').delete().eq('miembro_id', memberId),
                supabase.from('miembros_equipos').delete().eq('miembro_id', memberId),
                supabase.from('bloqueos_servidores').delete().eq('miembro_id', memberId),
                supabase.from('premios_entregados').delete().eq('miembro_id', memberId),
            ]);
            console.log('[DELETE-ACCOUNT] Datos relacionados eliminados.');

            // 2. Borrar foto de perfil del storage
            try {
                await supabase.storage.from('perfiles').remove([`profile_${memberId}.jpg`]);
            } catch { /* puede no existir */ }

            // 3. Borrar el registro del miembro
            const { error: deleteError } = await supabase.from('miembros').delete().eq('id', memberId);
            if (deleteError) console.error('[DELETE-ACCOUNT] Error borrando miembro:', deleteError);
            else console.log('[DELETE-ACCOUNT] Registro de miembro eliminado.');

            // 4. Limpiar TODO el almacenamiento local
            await SecureStore.deleteItemAsync('memberId');
            await SecureStore.deleteItemAsync('biometricMemberId');
            await AsyncStorage.clear();
            console.log('[DELETE-ACCOUNT] Almacenamiento local limpiado.');

            // 5. Resetear todos los estados
            setMemberId(null);
            setIsLoggedIn(false);
            setNombre('');
            setApellido('');
            setFotoUrl(null);
            setFechaNacimiento(null);
            setZona(null);
            setEsAdmin(false);
            setEsServidor(false);
            setRachaUsuario(0);
            setAsistenciasDetalle([]);
            setNotificationInbox([]);
            setCurrentScreen('Inicio');
            console.log('[DELETE-ACCOUNT] Cuenta eliminada exitosamente.');
        } catch (e) {
            console.error('[DELETE-ACCOUNT] ERROR:', e);
            throw e;
        }
    };

    /**
     * Agrega una nueva notificación al buzón interno de la aplicación.
     * Guarda la lista actualizada en AsyncStorage.
     * 
     * @param notif Objeto con los datos de la notificación.
     */
    const addNotificationToInbox = useCallback((notif: any) => {
        setNotificationInbox(prev => {
            // Deduplicación: ignorar si ya existe una notificación con mismo título+cuerpo en los últimos 10 minutos
            const TEN_MINUTES = 10 * 60 * 1000;
            const now = Date.now();
            const isDuplicate = prev.some(n =>
                n.title === notif.title &&
                n.body === notif.body &&
                (now - new Date(n.date).getTime()) < TEN_MINUTES
            );
            if (isDuplicate) return prev; // No agregar si es duplicada reciente

            const newNotif = { ...notif, id: now.toString(), date: new Date().toISOString(), read: false };
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
        if (!force && now - youtubeCacheTs.current < TEN_MIN) {
            console.log('[YOUTUBE] Usando caché (TTL < 10min).');
            return;
        }

        console.log('[YOUTUBE] Obteniendo feed RSS de videos...');
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
                console.log(`[YOUTUBE] ${parsed.length} videos generales cacheados.`);
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
            AsyncStorage.setItem('cache_esenciales', JSON.stringify(unique));
            console.log(`[YOUTUBE] ${unique.length} videos Esenciales encontrados.`);

            // --- Live check (reutiliza el channelXml ya descargado) ---
            if (channelXml.includes('yt:status>live')) {
                setIsCurrentlyLive(true);
                setLiveVideoUrl('https://youtube.com/@iglesiadelsalvador/live');
                console.log('[YOUTUBE] ¡ESTAMOS EN VIVO! URL de live detectada.');
            } else {
                setIsCurrentlyLive(false);
                console.log('[YOUTUBE] No hay transmisión en vivo en curso.');
            }

            youtubeCacheTs.current = now;
        } catch (e) { console.error('[YOUTUBE] Error en fetch:', e); }
    }, []);

    /** Solo refresca Supabase en paralelo — usado por los realtime listeners */
    const refreshSupabaseOnly = useCallback(async () => {
        if (!memberId) {
            console.log('[SUPABASE] No hay ID de miembro, saltando fetch.');
            return;
        }
        console.log('[SUPABASE] Iniciando sincronización de datos...');
        try {
            const hace30Dias = new Date();
            hace30Dias.setDate(hace30Dias.getDate() - 30);

            const [newsRes, memberRes, asistRes, actionsRes] = await Promise.all([
                supabase.from('noticias').select('*').eq('activa', true).order('orden', { ascending: true }),
                supabase.from('miembros').select('*').eq('id', memberId).single(),
                supabase.from('asistencias').select('*').eq('miembro_id', memberId)
                    .gte('fecha', hace30Dias.toISOString().split('T')[0])
                    .order('fecha', { ascending: false }),
                supabase.from('configuracion').select('*').eq('clave', 'home_actions').maybeSingle(),
            ]);

            setIsOffline(false);

            if (newsRes.data) {
                setNoticiasSupabase(newsRes.data);
                AsyncStorage.setItem('cache_noticias', JSON.stringify(newsRes.data));
                console.log(`[SUPABASE] ${newsRes.data.length} noticias actualizadas.`);
            }
            if (memberRes.data) {
                const m = memberRes.data;
                setNombre(m.nombre); setApellido(m.apellido); setFotoUrl(m.foto_url);
                setFechaNacimiento(m.fecha_nacimiento); setZona(m.zona);
                setEsServidor(m.es_servidor || false); setEsAdmin(m.es_admin || false);

                // Cachear datos de perfil
                AsyncStorage.multiSet([
                    ['nombre', m.nombre || ''],
                    ['apellido', m.apellido || ''],
                    ['foto_url', m.foto_url || ''],
                    ['fecha_nacimiento', m.fecha_nacimiento || ''],
                    ['zona', m.zona || ''],
                    ['es_servidor', String(m.es_servidor || false)],
                    ['es_admin', String(m.es_admin || false)],
                ]);
                console.log('[SUPABASE] Perfil de usuario (Supabase) actualizado.');
            }
            if (asistRes.data) {
                setRachaUsuario(asistRes.data.length);
                setAsistenciasDetalle(asistRes.data);
                AsyncStorage.setItem('racha_usuario', String(asistRes.data.length));
                AsyncStorage.setItem('cache_asistencias_detalle', JSON.stringify(asistRes.data));
                console.log(`[SUPABASE] Racha del usuario: ${asistRes.data.length} asistencias.`);
            }
            if (actionsRes?.data?.valor) {
                setHomeActions(actionsRes.data.valor);
                AsyncStorage.setItem('cache_home_actions', JSON.stringify(actionsRes.data.valor));
                console.log('[SUPABASE] Acciones del Home actualizadas.');
            }
            console.log('[SUPABASE] Sincronización finalizada exitosamente.');
        } catch (e) {
            console.error('[SUPABASE] ERROR crítico al sincronizar con Supabase:', e);
            setIsOffline(true);
        }
    }, [memberId]);

    /** Refresca TODO: Supabase (paralelo) + YouTube (con TTL) */
    const refreshData = useCallback(async () => {
        await refreshSupabaseOnly();
        fetchYoutubeData();
    }, [refreshSupabaseOnly, fetchYoutubeData]);

    useEffect(() => {
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
            currentScreen, setCurrentScreen, logout, deleteAccount, login, loginWithBiometrics, refreshData,
            isCurrentlyLive, liveVideoUrl, esServidor, esAdmin, notificationInbox, addNotificationToInbox,
            unreadCount, markNotificationRead, markAllRead,
            homeActions,
            isOffline
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
