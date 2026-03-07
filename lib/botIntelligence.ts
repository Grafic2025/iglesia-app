import { supabase } from '../lib/supabase';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_KEY;
// Usando la versión solicitada (2.5 flash es probable referencia a 2.0 actual)
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Compila toda la información estática y dinámica de la Iglesia para darle contexto al bot.
 */
export const getChurchContext = async (userData: any) => {
    let infoEstatica = {
        nombre: "Iglesia del Salvador",
        ubicacion: "Constituyentes 950, Morón, Buenos Aires, Argentina",
        horarios: {
            presencial: "Domingos a las 09:00, 11:00 y 19:00 hs",
            online: "Domingos a las 11:00 hs vía YouTube",
        },
        servicios: [
            { titulo: 'Agenda de Eventos', pantalla: 'Agenda', descripcion: 'Calendario de actividades y reuniones.' },
            { titulo: 'Biblia Online', pantalla: 'https://www.bible.com/es', descripcion: 'Leer la Biblia en varios idiomas.' },
            { titulo: 'Quiero Ayudar', pantalla: 'Quiero Ayudar', descripcion: 'Sumarse a proyectos sociales (Hospitales, Comedores).' },
            { titulo: 'Necesito Ayuda', pantalla: 'Necesito Ayuda', descripcion: 'Solicitar contención o ayuda material.' },
            { titulo: 'Bautismos', pantalla: 'Quiero Bautizarme', descripcion: 'Información y registros para bautizarse.' },
            { titulo: 'Capacitaciones', pantalla: 'Quiero Capacitarme', descripcion: 'Discipulado y cursos bíblicos.' },
            { titulo: 'Soy Nuevo', pantalla: 'Soy Nuevo', descripcion: 'Información básica para invitados.' },
            { titulo: 'Pedidos de Oración', pantalla: 'Necesito Oración', descripcion: 'Enviar motivos para que oremos por ti.' },
            { titulo: 'Grupos de Conexión (CGE)', pantalla: 'Sumarme a un Grupo', descripcion: 'Grupos pequeños por edades: Jóvenes, Adultos, Matrimonios.' },
            { titulo: 'Transmisión Online', pantalla: 'YouTube', descripcion: 'Vivos de los domingos 11hs.' },
        ]
    };

    let noticiasRecientes: string[] = [];
    try {
        // Obtenemos la configuración dinámica del bot desde la nube
        const { data: configData } = await supabase.from('configuracion').select('valor').eq('clave', 'bot_info').maybeSingle();
        if (configData && configData.valor) {
            infoEstatica = { ...infoEstatica, ...configData.valor };
        }

        const { data } = await supabase
            .from('noticias')
            .select('titulo, descripcion')
            .eq('activa', true)
            .order('created_at', { ascending: false })
            .limit(3);
        noticiasRecientes = (data || []).map(n => `- ${n.titulo}: ${n.descripcion}`);
    } catch (e) { }

    // Resumen de asistencias si están disponibles
    const totalAsistencias = userData.asistencias?.length || 0;
    const racha = userData.rachaUsuario || 0;
    const ultimasAsistencias = (userData.asistencias || []).slice(0, 5).map((a: any) => a.fecha).join(', ');

    return `Eres IDS (Inteligencia Del Salvador), el asistente virtual oficial de la Iglesia del Salvador. Tu objetivo es ayudar a los miembros y visitantes con información precisa, amable y espiritual.

INFORMACIÓN CLAVE DE LA IGLESIA:
- Ubicación: ${infoEstatica.ubicacion}
- Reuniones: ${infoEstatica.horarios.presencial} (Online: ${infoEstatica.horarios.online})

SERVICIOS DISPONIBLES (Sugiere botones para estos IDs de pantalla):
${infoEstatica.servicios.map(s => `- ${s.titulo}: ID "${s.pantalla}"`).join('\n')}

NOTICIAS ACTUALES:
${noticiasRecientes.join('\n')}

INFORMACIÓN PERSONAL DEL USUARIO:
- Nombre: ${userData.nombre} ${userData.apellido}
- Rol: ${userData.esAdmin ? 'Administrador' : userData.esServidor ? 'Servidor' : 'Miembro'}
- Mis Asistencias (últimos 30 días): ${totalAsistencias} veces.
- Mi Racha actual: ${racha} domingos seguidos.
- Últimas fechas presentes: ${ultimasAsistencias || 'Sin registros recientes'}.
- Mis próximos servicios (Días que sirvo): 
${(userData.servicios || []).map((s: any) => `  * ${s.fecha}: ${s.horario} (Rol: ${s.equipo_ids?.find((e: any) => e.miembro_id === userData.memberId)?.rol || 'Servidor'})`).join('\n') || '  * No tienes servicios programados próximamente.'}

INSTRUCCIÓN TÉCNICA CRÍTICA:
1. Responde de forma cálida, breve y cristiana.
2. Si el usuario pregunta por sus asistencias, responde usando los datos de "INFORMACIÓN PERSONAL" proporcionados arriba.
3. SI LA CONSULTA se relaciona con un servicio, ofrece el botón de acción correspondiente.
4. SIEMPRE responde en formato JSON puro.
Ejemplo: {"text": "Tu mensaje de voz cristiana", "action": {"label": "IR A [SECCIÓN]", "screen": "ID exacto"} }
IMPORTANTE: Si no hay un servicio relacionado, simplemente no incluyas el campo "action". No incluyas nada fuera del JSON.`;
};

/**
 * Lógica del Bot potenciada por Gemini con MEMORIA REAL y REPARACIÓN DE JSON.
 */
export const askIdsBot = async (question: string, context: string, history: any[] = []) => {
    if (!GEMINI_API_KEY) {
        return { text: "Mi cerebro digital necesita su API KEY para activarse. Por favor, verifica el archivo .env. 🙏" };
    }

    try {
        // Filtrar mensajes vacíos y mapear roles
        const chatHistory = history.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text || "" }]
        })).filter(h => h.parts[0].text);

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    { role: 'user', parts: [{ text: context }] },
                    { role: 'model', parts: [{ text: "Entendido. Soy IDS y estoy listo para acompañar a la congregación con sabiduría y amor. Conozco los datos de mi iglesia y del usuario." }] },
                    ...chatHistory,
                    { role: 'user', parts: [{ text: question }] }
                ],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 600,
                }
            })
        });

        const data = await response.json();

        if (data.error) {
            return { text: `Hubo un inconveniente celestial: ${data.error.message}. Por favor, vuelve a intentar en unos segundos. 🙏` };
        }

        const candidate = data.candidates?.[0];
        const rawText = candidate?.content?.parts?.[0]?.text;

        if (rawText) {
            try {
                // Limpieza agresiva de JSON (Gemini a veces pone ```json ... ```)
                const jsonMatch = rawText.match(/\{[\s\S]*\}/);
                const cleanJson = jsonMatch ? jsonMatch[0] : rawText;
                return JSON.parse(cleanJson);
            } catch (e) {
                // Si no es JSON, devolvemos el texto puro
                return { text: rawText.replace(/\{.*\}/g, '').trim() || rawText };
            }
        }

        if (candidate?.finishReason) {
            return { text: "Lo siento, mi programación espiritual tiene límites de seguridad para esta consulta. ¡Bendiciones! ✨" };
        }

    } catch (e: any) {
        return { text: "Mi red se ha distraído un momento... ¡Intentémoslo de nuevo! 🙏" };
    }

    return { text: "¡Hola! Estoy terminando de procesar tu consulta. Si no te respondo algo exacto, te espero el domingo en el stand de Informes. 🙌" };
};
