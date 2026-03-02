# 📋 Plan de Implementación — Iglesia App & Admin

> **Fecha**: 24 de febrero 2026  
> **Alcance**: ~65 mejoras organizadas en 6 fases de implementación  
> **Proyectos**: `iglesia-app` (Expo/React Native) + `iglesia-admin` (Next.js)

---

## 🔴 FASE 1: Bugs Críticos y Quick Wins (Prioridad Máxima)

Cambios de bajo riesgo y alto impacto que se pueden hacer rápidamente.

### 1.1 ✅ Typo "Fideliad" → "Fidelidad"
- **Archivo**: `iglesia-admin/components/views/DashboardView.tsx` (línea 105)
- **Cambio**: `Fideliad` → `Fidelidad`
- **Estado**: ✅ COMPLETADO

### 1.2 ✅ Gráfico "Últimos 7 días" con datos incorrectos
- **Archivo**: `iglesia-admin/components/views/DashboardView.tsx` + `page.tsx`
- **Problema**: `asistencias.slice(0, 7)` tomaba las asistencias del día, no de los últimos 7 días
- **Solución**: Nuevo fetch `fetchAsistencias7dias()` que consulta cada día individualmente + nueva prop `asistencias7dias`
- **Estado**: ✅ COMPLETADO

### 1.3 ✅ Header tab sin formatear
- **Archivo**: `iglesia-admin/app/page.tsx`
- **Solución**: Mapa `TAB_LABELS` de `tab_id → título legible`
- **Estado**: ✅ COMPLETADO

### 1.4 ✅ Límite de pedidos de oración hardcoded
- **Archivo**: `iglesia-app/app/index.tsx` (línea 107)
- **Cambio**: `.limit(10)` → `.limit(50)`
- **Estado**: ✅ COMPLETADO

### 1.5 ✅ fetchLogs limitado a 10
- **Archivo**: `iglesia-admin/app/page.tsx` (fetchLogs)
- **Solución**: Aumentado a 200 records + paginación/filtros/búsqueda en NotificacionesView
- **Estado**: ✅ COMPLETADO

### 1.6 🙏 Contador de oraciones - update optimista
- **Archivo**: `iglesia-app/components/screens/PrayerScreen.tsx`
- **Estado**: Ya parece tener lógica de update optimista en `handleMeUni`. Verificar que funcione correctamente.
- **Esfuerzo**: 15 min (verificación)

---

## 🟠 FASE 2: Seguridad y Autenticación (Prioridad Alta)

### 2.1 🔐 SecureStore para datos sensibles  
- **Archivo**: `iglesia-app/context/AppContext.tsx`
- **Cambio**: Reemplazar `AsyncStorage.getItem/setItem('memberId')` por `expo-secure-store`
- **Dependencia**: `npx expo install expo-secure-store`
- **Esfuerzo**: 45 min

### 2.2 ✅ Token de expiración configurable (30 días)
- **Archivo**: `iglesia-app/context/AppContext.tsx`
- **Cambio**: Se guarda `loginTimestamp` en AsyncStorage al hacer login
- **Estado**: ✅ COMPLETADO (timestamp guardado, verificación de expiración pendiente)

### 2.3 ✅ Límite de intentos de login en admin
- **Archivo**: `iglesia-admin/app/page.tsx` (handleLogin)
- **Cambio**: 5 intentos fallidos → bloqueo de 30 segundos con countdown visual
- **Estado**: ✅ COMPLETADO

### 2.4 ✅ Verificación HTTPS en admin
- **Archivo**: `iglesia-admin/app/page.tsx`
- **Cambio**: Redirect automático a HTTPS en producción (excluye localhost)
- **Estado**: ✅ COMPLETADO

### 2.5 🔐 Multi-usuario admin (Supabase Auth)
- **Complejidad**: ALTA — requiere nueva tabla `admin_users`, migración de la lógica actual de password global
- **Esfuerzo**: 3-4 horas
- **Nota**: Puede posponerse a Fase 6 si no es urgente

---

## 🟡 FASE 3: Mejoras de UX en la App (Prioridad Media-Alta)

### 3.1 ✅ Auto-scroll del carrusel de noticias
- **Archivo**: `iglesia-app/components/screens/HomeScreen.tsx`
- **Cambio**: `useEffect` con `setInterval(4500)` que avanza el `FlatList` con `scrollToIndex`. Ya implementado.
- **Estado**: ✅ COMPLETADO (existía previamente)

### 3.2 🖼️ Skeleton/loader en imágenes del carrusel
- **Archivo**: `iglesia-app/components/screens/HomeScreen.tsx`
- **Cambio**: Usar `ExpoImage` con `placeholder` (blurHash o color) y `contentFit="cover"`, agregar `ActivityIndicator` como placeholder animado
- **Esfuerzo**: 20 min

### 3.3 ✅ Toast de "¡Datos actualizados!" post-refresh
- **Archivo**: `iglesia-app/components/screens/HomeScreen.tsx`
- **Estado**: Ya existe `showRefreshToast()` con animación. Verificar que funcione correctamente.
- **Esfuerzo**: 5 min (verificación)

### 3.4 🔔 Badges numéricos en grilla de acciones
- **Archivo**: `iglesia-app/components/screens/HomeScreen.tsx`
- **Cambio**: El componente `ActionCard` ya acepta `badge`. Agregar conteo de pedidos sin leer y noticias nuevas desde AppContext.
- **Esfuerzo**: 30 min

### 3.5 👁️ Marcar videos vistos
- **Archivo**: `iglesia-app/components/screens/HomeScreen.tsx`
- **Cambio**: Guardar en AsyncStorage un set de `watchedVideoIds`. Al abrir un video, agregar su ID. Mostrar ícono de ✓ o borde verde en videos vistos.
- **Esfuerzo**: 30 min

### 3.6 💬 WhatsApp card mejorada
- **Archivo**: `iglesia-app/components/screens/HomeScreen.tsx`
- **Cambio**: Reemplazar botón simple por una card con descripción del canal y miembros aprox.
- **Esfuerzo**: 20 min

### 3.7 🏆 Progreso de premios completo
- **Archivo**: `iglesia-app/components/screens/ProfileScreen.tsx`
- **Cambio**: Mostrar los 4 niveles (5, 10, 20, 30) en una línea de progreso horizontal con iconos y estados logrado/pendiente
- **Esfuerzo**: 45 min

### 3.8 ✅ Estadísticas de perfil enriquecidas
- **Archivo**: `iglesia-app/components/screens/ProfileScreen.tsx`
- **Cambio**: Agregado "Promedio mensual" calculado desde meses reales y 4 tarjetas de stats con layout wrap
- **Estado**: ✅ COMPLETADO

### 3.9 📅 Historial paginado con filtro por mes/año
- **Archivo**: `iglesia-app/components/screens/ProfileScreen.tsx` + modal en `index.tsx`
- **Cambio**: Reemplazar el modal de historial de 30 días por un componente con selector de mes/año y paginación
- **Esfuerzo**: 1 hora

### 3.10 📤 Compartir progreso
- **Archivo**: `iglesia-app/components/screens/ProfileScreen.tsx`
- **Cambio**: Usar `react-native-view-shot` + `expo-sharing` para capturar tarjeta de estadísticas y compartir
- **Dependencia**: `npx expo install react-native-view-shot expo-sharing`
- **Esfuerzo**: 1 hora

### 3.11 ✅ Badge de no leídas en el drawer (Inbox)
- **Archivo**: `iglesia-app/app/index.tsx` (DrawerItem de "Inbox")
- **Cambio**: Badge rojo con counter de notificaciones no leídas. Se agregó `unreadCount` al AppContext.
- **Estado**: ✅ COMPLETADO

### 3.12 ✅ Notificación local de bienvenida
- **Archivo**: `iglesia-app/app/index.tsx` (handleLogin)
- **Cambio**: Después del login, programa notificación local con Notifications.scheduleNotificationAsync
- **Estado**: ✅ COMPLETADO

### 3.13 ✅ Drawer con sección de "Contacto"
- **Archivo**: `iglesia-app/app/index.tsx`
- **Cambio**: Agregado `DrawerItem` "Contacto" con ícono teléfono + ruta a SupportScreen
- **Estado**: ✅ COMPLETADO

### 3.14 ✅ Animación de transición entre pantallas
- **Archivo**: `iglesia-app/app/index.tsx`
- **Cambio**: Fade-in/out animation con `Animated.View` opacity al cambiar de screen
- **Estado**: ✅ COMPLETADO



---

## 🟢 FASE 4: Mejoras del Panel Admin (Prioridad Media)

### 4.1 ✅ KPIs comparativos con flechas de tendencia
- **Archivo**: `iglesia-admin/components/StatCard.tsx` + `DashboardView.tsx`
- **Cambio**: Prop `trend` en StatCard con TrendingUp/TrendingDown icons. "Total Hoy" muestra comparación vs ayer.
- **Estado**: ✅ COMPLETADO

### 4.2 ✅ Selector de rango para gráfico de crecimiento (3M/6M/12M)
- **Archivo**: `iglesia-admin/components/views/DashboardView.tsx`
- **Cambio**: Botones 3M/6M/12M con estado, filtran `crecimientoAnual.slice(-months)`
- **Estado**: ✅ COMPLETADO

### 4.3 ✅ Widget "Último servicio" en dashboard
- **Archivo**: `iglesia-admin/components/views/DashboardView.tsx`
- **Cambio**: Card con CalendarDays icon mostrando último día con asistencia y cantidad de personas
- **Estado**: ✅ COMPLETADO

### 4.4 ✅ Widget "Próximo servicio" en dashboard
- **Archivo**: `iglesia-admin/components/views/DashboardView.tsx`
- **Cambio**: Card con Clock icon mostrando próximo domingo formateado
- **Estado**: ✅ COMPLETADO

### 4.5 ✅ Paginación en tabla de miembros/asistencia
- **Archivo**: `iglesia-admin/components/views/MiembrosView.tsx`
- **Cambio**: Paginación de 25/página con controles Anterior/Siguiente y contador
- **Estado**: ✅ COMPLETADO

### 4.6 🔍 Búsqueda global de miembros
- **Archivo**: `iglesia-admin/components/views/MiembrosView.tsx` + `GenteView.tsx`
- **Cambio**: Filtrar `allMiembros` por búsqueda (ya existente)
- **Estado**: ✅ YA EXISTÍA

### 4.7 ✅ Perfil expandible de miembro (modal)
- **Archivo**: `iglesia-admin/components/views/MiembrosView.tsx`
- **Cambio**: Click en fila abre modal con avatar, racha, hora de entrada, reunión, fecha de registro, estado servidor
- **Estado**: ✅ COMPLETADO

### 4.8 ✅ Archivar miembro (deactivación)
- **Archivo**: `iglesia-admin/components/views/GenteView.tsx`
- **Cambio**: Botón Archivar (activo=false), toggle Activos/Archivados, Restaurar. Stats rápidas.
- **Estado**: ✅ COMPLETADO

### 4.9 📊 Exportación Excel mejorada (múltiples hojas)
- **Archivo**: `iglesia-admin/app/page.tsx` (exportarCSV)
- **Dependencia**: Usar `xlsx` o `exceljs`
- **Cambio**: Generar workbook con hojas: Resumen, Asistencias, Rachas, Servidores
- **Esfuerzo**: 1.5 horas

### 4.10 ✅ Filtro "Nuevos del mes/semana/hoy"
- **Archivo**: `iglesia-admin/components/views/GenteView.tsx`
- **Cambio**: Botones Todos/Hoy/7 días/30 días que filtran por `created_at`. Stats rápidas (Activos, Servidores, Nuevos Hoy, Nuevos Semana).
- **Estado**: ✅ COMPLETADO

### 4.11 ⏰ Horarios de segmentación dinámicos
- **Archivo**: `iglesia-admin/app/page.tsx` + `NotificacionesView.tsx`
- **Cambio**: Usar `horariosDisponibles` (ya existe el fetch) en vez de 09:00/11:00/20:00 hardcoded
- **Esfuerzo**: 20 min

### 4.12 ⚛️ Eliminar document.getElementById en notificaciones
- **Archivo**: `iglesia-admin/app/page.tsx` o `NotificacionesView.tsx`
- **Cambio**: Convertir a estado controlado con `useState`
- **Esfuerzo**: 20 min

### 4.13 📱 Preview de notificación tipo teléfono
- **Archivo**: `iglesia-admin/components/views/NotificacionesView.tsx`
- **Cambio**: Componente `PhonePreview` que muestre título y body en un mockup de notificación
- **Esfuerzo**: 45 min

### 4.14 ✅ Filtros en auditoría
- **Archivo**: `iglesia-admin/components/views/AuditoriaView.tsx`
- **Cambio**: Búsqueda por texto, filtro por tipo de acción, paginación (25 por página), badge de resultados
- **Estado**: ✅ COMPLETADO

### 4.15 📰 Preview de noticias en CMS
- **Archivo**: `iglesia-admin/components/views/CMSView.tsx`
- **Cambio**: Mini preview de la tarjeta como aparecerá en el carrusel de la app
- **Esfuerzo**: 30 min

### 4.16 🏷️ Categorías para noticias
- **Archivo**: `iglesia-admin/components/views/CMSView.tsx`
- **Cambio**: Sistema de categorías (Eventos, Anuncios, Videos, Avisos) con selector y colores
- **Dependencia**: Agregar columna `categoria` en tabla `noticias` de Supabase
- **Esfuerzo**: 45 min

### 4.17 📅 Vencimiento automático de noticias
- **Archivo**: `iglesia-admin/components/views/CMSView.tsx`
- **Cambio**: Campo "Vence el" (date picker) en el modal de noticia
- **Dependencia**: Columna `vence_el` en tabla `noticias`
- **Esfuerzo**: 30 min

### 4.18 🔔 Botón "Notificar al equipo" en servicios
- **Archivo**: `iglesia-admin/components/views/EquiposView.tsx`
- **Cambio**: Botón que envíe push a todos los servidores asignados al servicio seleccionado
- **Esfuerzo**: 45 min

### 4.19 📋 Plantillas de equipo reutilizables
- **Archivo**: `iglesia-admin/components/views/EquiposView.tsx`
- **Cambio**: Guardar/cargar configuraciones de equipo
- **Dependencia**: Tabla `plantillas_equipo` en Supabase
- **Esfuerzo**: 1.5 horas

### 4.20 📅 Vista de disponibilidad de servidores
- **Archivo**: `iglesia-admin/components/views/EquiposView.tsx`
- **Cambio**: Vista tipo calendario mostrando bloqueos activos de cada servidor
- **Esfuerzo**: 1.5 horas

### 4.21 📊 Estadísticas por servidor
- **Archivo**: `iglesia-admin/components/views/EquiposView.tsx`
- **Cambio**: Counter "participó X veces en últimos 3 meses" junto a cada servidor
- **Esfuerzo**: 30 min

---

## 🔵 FASE 5: Mejoras de UX Avanzadas (Prioridad Media-Baja)

### 5.1 📅 Sincronización Agenda app ↔ admin
- **Archivos**: `iglesia-app/components/screens/AgendaScreen.tsx` + `iglesia-admin/components/views/AgendaConfigView.tsx`
- **Cambio**: Reemplazar datos estáticos con fetch a tabla `configuracion` de Supabase
- **Esfuerzo**: 1 hora

### 5.2 🔔 Filtros en inbox de notificaciones
- **Archivo**: `iglesia-app/components/screens/NotificationInbox.tsx`
- **Cambio**: Filtros por tipo + "Marcar todas como leídas"
- **Esfuerzo**: 45 min

### 5.3 🎸 Estructura del servicio en pantalla servidores
- **Archivo**: `iglesia-app/components/screens/ServidoresScreen.tsx`
- **Cambio**: Mostrar orden del culto (apertura, alabanza, predicación, cierre) desde el plan
- **Esfuerzo**: 30 min

### 5.4 ⚠️ Badge de bloqueos próximos a vencer
- **Archivo**: `iglesia-app/components/screens/ServidoresScreen.tsx`
- **Cambio**: Calcular diferencia de días y mostrar badge naranja si < 3 días
- **Esfuerzo**: 20 min

### 5.5 👥 Vista de equipo expandible (confirmados/pendientes)
- **Archivo**: `iglesia-app/components/screens/ServidoresScreen.tsx`
- **Cambio**: Lista desplegable con estado de cada miembro del equipo
- **Esfuerzo**: 45 min

### 5.6 📊 Historial de servicios pasados
- **Archivo**: `iglesia-app/components/screens/ServidoresScreen.tsx`
- **Cambio**: Sección "Mis servicios pasados" con conteo y lista
- **Esfuerzo**: 30 min

### 5.7 🎨 Animaciones de transición entre pantallas
- **Archivo**: `iglesia-app/app/index.tsx` (renderScreen)
- **Cambio**: Usar `Animated.View` con fade-in al cambiar pantalla
- **Esfuerzo**: 30 min

### 5.8 🔤 Tipografía custom (Inter/Outfit)
- **Archivos**: Todos los componentes de la app
- **Dependencia**: `npx expo install expo-font @expo-google-fonts/inter`
- **Cambio**: Cargar font en `_layout.tsx`, aplicar en todos los `Text`
- **Esfuerzo**: 1 hora

### 5.9 ♿ Accesibilidad
- **Archivos**: Componentes principales de la app
- **Cambio**: Agregar `accessibilityLabel`, respetar `fontScale` del sistema
- **Esfuerzo**: 1 hora

### 5.10 📰 Drag & drop de noticias en CMS
- **Archivo**: `iglesia-admin/components/views/CMSView.tsx`
- **Dependencia**: `@hello-pangea/dnd` o `react-beautiful-dnd`
- **Cambio**: Implementar reordenamiento con drag & drop, guardar `orden` en Supabase
- **Esfuerzo**: 1.5 horas

### 5.11 📱 Sidebar responsive/colapsable en admin
- **Archivo**: `iglesia-admin/components/Sidebar.tsx` + `page.tsx`
- **Cambio**: Botón hamburger, media queries, sidebar overlay en mobile
- **Esfuerzo**: 1 hora

### 5.12 🌙 Toggle modo oscuro/claro en admin
- **Archivo**: `iglesia-admin/app/layout.tsx` + todos los componentes
- **Cambio**: Theme context con CSS variables
- **Esfuerzo**: 2 horas

### 5.13 ⚙️ Página de Configuración General del admin
- **Archivo**: Nuevo `ConfiguracionView.tsx`
- **Cambio**: Formulario con nombre iglesia, logo, colores, horarios, redes sociales
- **Dependencia**: Tabla `configuracion_general` en Supabase
- **Esfuerzo**: 2 horas

---

## 🟣 FASE 6: Arquitectura y Rendimiento (Prioridad Baja / Largo Plazo)

### 6.1 🧩 Interfaces TypeScript propias
- **Archivos**: Crear `types/index.ts` en ambos proyectos
- **Cambio**: Definir `Miembro`, `Asistencia`, `Noticia`, `PedidoOracion`, etc.
- **Esfuerzo**: 1.5 horas

### 6.2 🪝 Custom hooks para el admin
- **Archivo**: `iglesia-admin/hooks/` (nuevo directorio)
- **Cambio**: Extraer `useAsistencias`, `useMiembros`, `useNoticias`, etc. del gigante `page.tsx`
- **Esfuerzo**: 3 horas

### 6.3 ⚡ Caché local con React Query
- **Archivos**: Ambos proyectos
- **Dependencia**: `@tanstack/react-query`
- **Cambio**: Envolver fetches con `useQuery` y configurar `staleTime`/`cacheTime`
- **Esfuerzo**: 3 horas

### 6.4 🖼️ Migrar imágenes de Unsplash a Supabase Storage
- **Archivos**: `HomeScreen.tsx`, otros con URLs de Unsplash
- **Cambio**: Subir imágenes al bucket, actualizar URLs
- **Esfuerzo**: 1 hora

### 6.5 🏆 Ranking cache (tabla `ranking_cache`)
- **Cambio**: RPC/Cron en Supabase que calcule ranking periódicamente. App lee de la tabla en vez de calcular.
- **Esfuerzo**: 1.5 horas

### 6.6 🔧 Modo mantenimiento
- **Cambio**: Toggle en admin que escriba en `configuracion`. App verifica al abrir.
- **Esfuerzo**: 1 hora

### 6.7 📱 Versionado forzado de la app
- **Cambio**: Campo `version_minima` en Supabase. La app compara con su versión local.
- **Esfuerzo**: 45 min

### 6.8 📋 Auditoría de cambios de datos de miembros
- **Cambio**: Trigger en Supabase o interceptor en la app que registre cambios
- **Esfuerzo**: 1 hora

### 6.9 🔔 Notificación ligada a evento de agenda
- **Cambio**: Programar notificación relativa a un evento (ej: "1h antes del culto")
- **Esfuerzo**: 1.5 horas

### 6.10 🔐 Multi-usuario admin con Supabase Auth
- **Cambio**: Tabla `admin_users`, roles/permisos, login individual
- **Esfuerzo**: 4 horas

---

## 📊 Resumen de Estimaciones

| Fase | Items | Esfuerzo Est. | Prioridad |
|------|-------|---------------|-----------|
| 1 - Bugs & Quick Wins | 6 | ~1.5 horas | 🔴 Máxima |
| 2 - Seguridad | 5 | ~5 horas | 🟠 Alta |
| 3 - UX App | 13 | ~6.5 horas | 🟡 Media-Alta |
| 4 - Admin Panel | 21 | ~13 horas | 🟢 Media |
| 5 - UX Avanzadas | 13 | ~13 horas | 🔵 Media-Baja |
| 6 - Arquitectura | 10 | ~17 horas | 🟣 Baja |
| **Total** | **68** | **~56 horas** | — |

---

## 🚀 Orden de Implementación Recomendado

1. **Empezar con Fase 1** (bugs y quick wins) — impacto inmediato sin riesgo
2. **Fase 2** (seguridad) — proteger datos antes de implementar features
3. **Fase 3** (UX app) — las mejoras que los usuarios finales verán más
4. **Fase 4** (admin) — mejoras para los administradores
5. **Fases 5 y 6** iterativamente según necesidad

**¿Por dónde quieres empezar?** Puedo comenzar inmediatamente con la Fase 1 (todos los quick wins) y luego continuar con la que elijas.
