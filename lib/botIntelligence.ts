import { supabase } from '../lib/supabase';

/**
 * Compila toda la información estática y dinámica de la Iglesia para darle contexto al bot.
 */
export const getChurchContext = async (userData: any) => {
    // 1. Información Estática
    const infoEstatica = {
        nombre: "Iglesia del Salvador",
        ubicacion: "Constituyentes 950, Morón, Buenos Aires, Argentina",
        horarios: {
            presencial: "Domingos a las 9:00hs, 11:00hs y 20:00hs",
            online: "Domingos a las 11:00hs vía YouTube",
        },
        redes_sociales: {
            instagram: "https://instagram.com/iglesiadelsalvador",
            facebook: "https://facebook.com/iglesiadelsalvador",
            youtube: "https://youtube.com/@iglesiadelsalvador",
            whatsapp_canal: "https://whatsapp.com/channel/0029VaT0L9rEgGfRVvKIZ534"
        },
        servicios: [
            "Agenda de eventos",
            "Lectura de la Biblia",
            "Pedidos de oración",
            "Bautismos",
            "Capacitaciones",
            "Grupos de comunidad (CGE)",
            "Donaciones / Ofrendas",
            "Asistencia a necesitados"
        ]
    };

    // 2. Información Dinámica (de la base de datos)
    let noticiasRecientes: { titulo: string; descripcion: string }[] = [];
    try {
        const { data } = await supabase
            .from('noticias')
            .select('titulo, descripcion')
            .eq('activa', true)
            .order('created_at', { ascending: false })
            .limit(3);
        noticiasRecientes = data || [];
    } catch (e) {
        console.log("Error buscando noticias para el bot:", e);
    }

    // 3. Construcción del Prompt del Sistema
    return `
Eres IDS (Inteligencia Del Salvador), el asistente virtual oficial de la Iglesia del Salvador. 
Tu objetivo es ayudar a los miembros y visitantes con información precisa, amable y espiritual.

INFORMACIÓN DE LA IGLESIA:
- Dirección: ${infoEstatica.ubicacion}
- Reuniones: ${infoEstatica.horarios.presencial}
- Transmisiones: ${infoEstatica.horarios.online}
- Redes: Instagram ${infoEstatica.redes_sociales.instagram}, YouTube ${infoEstatica.redes_sociales.youtube}.

NOTICIAS ACTUALES:
${noticiasRecientes.map(n => `- ${n.titulo}: ${n.descripcion}`).join('\n')}

PERFIL DEL USUARIO QUE TE HABLA:
- Nombre: ${userData.nombre} ${userData.apellido}
- Rol: ${userData.esAdmin ? 'Administrador' : userData.esServidor ? 'Servidor' : 'Miembro'}

INSTRUCCIONES:
1. Responde siempre de forma servicial y cristiana.
2. Si te preguntan algo que no sabes, invita al usuario a acercarse el domingo o escribir a hola@iglesiadelsalvador.com.
3. Sé breve y directo, pero cálido.
4. Usa emojis de forma moderada (🙏, ✨, 🙌).
5. Manten el saludo inicial: "¡Hola! Soy IDS, la Inteligencia Del Salvador. ¿En qué puedo ayudarte hoy?".
`;
};

/**
 * Lógica del Bot 100% LOCAL y DINÁMICO.
 * No usa APIs externas, solo tu base de datos y la información de la app.
 * A prueba de errores y ultra-rápido.
 */
export const askIdsBot = async (question: string, context: string) => {
    console.log("IDS Core procesando localmente:", question);
    const q = question.toLowerCase();

    // --- NIVEL 1: RESPUESTAS DE INFORMACIÓN FIJA ---
    if (q.includes("hola") || q.includes("buen")) {
        return "¡Hola! Soy IDS, el asistente de la Iglesia del Salvador. 🙏 ¿En qué puedo ayudarte hoy?";
    }

    if (q.includes("horario") || q.includes("reunion") || q.includes("reunión") || q.includes("cuándo") || q.includes("hora")) {
        return "¡Te esperamos! 🙌 Nuestras reuniones presenciales son los Domingos a las 9:00, 11:00 y 20:00 hs. También transmitimos por YouTube a las 11:00 hs.";
    }

    if (q.includes("dirección") || q.includes("donde") || q.includes("dónde") || q.includes("ubicacion") || q.includes("queda")) {
        return "Estamos en Constituyentes 950, Morón. 📍 ¡Te esperamos!";
    }

    // --- NIVEL 2: LECTURA DINÁMICA DE NOTICIAS ---
    if (q.includes("noticia") || q.includes("pasa") || q.includes("novedad")) {
        const lineas = context.split('\n');
        const noticias = lineas.filter(l => l.startsWith('- ')).slice(0, 3);
        if (noticias.length > 0) {
            return `Lo último en la iglesia: \n\n${noticias.join('\n')}\n\nRevisá la sección de Noticias para más detalles. ✨`;
        }
    }

    // --- NIVEL 3: CEREBRO DINÁMICO (Tus propias respuestas en Supabase) ---
    try {
        // Busca en tu tabla de cerebro si hay una palabra clave que coincida
        const { data: conocimiento } = await supabase
            .from('ids_bot_cerebro')
            .select('respuesta')
            .textSearch('palabras_clave', q.split(' ').join(' | '))
            .limit(1)
            .maybeSingle();

        if (conocimiento?.respuesta) {
            return conocimiento.respuesta;
        }
    } catch (e) {
        console.log("Error consultando cerebro local:", e);
    }

    // --- NIVEL 4: REGISTRO DE LO QUE NO SABE ---
    try {
        await supabase
            .from('ids_bot_aprendizaje')
            .insert([{ pregunta: question, fecha: new Date().toISOString() }]);
    } catch (e) { }

    return "¡Qué buena pregunta! ✨ Todavía no tengo esa información exacta, pero ya la anoté para que los líderes me enseñen la respuesta. Por ahora, consultá en el stand de Informes el domingo. ¡Bendiciones!";
};
