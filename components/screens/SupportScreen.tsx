import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Alert, Animated, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';

const SupportScreen = ({ navigateTo, type }: { navigateTo: any, type: string }) => {
    const insets = useSafeAreaInsets();
    const { memberId } = useApp();
    const [field1, setField1] = useState('');
    const [field2, setField2] = useState('');
    const [field3, setField3] = useState('');
    const [belongsToGroup, setBelongsToGroup] = useState<boolean | null>(null);
    const [selectedItem, setSelectedItem] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [fadeAnim] = useState(new Animated.Value(0));

    React.useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, [fadeAnim]);

    const titles: any = {
        'Quiero Ayudar': 'GENEROSIDAD',
        'Necesito Ayuda': 'ESTAMOS CON VOS',
        'Quiero Bautizarme': 'MI BAUTISMO',
        'Quiero Capacitarme': 'DISCIPULADO',
        'Sumarme a un Grupo': 'COMUNIDAD',
        'Soy Nuevo': 'BIENVENIDO'
    };

    const handleAction = async () => {
        if (type === 'Quiero Bautizarme') {
            if (!field1 || belongsToGroup === null || (belongsToGroup && !field2) || !field3) {
                Alert.alert("Campos incompletos", "Por favor completa todos los datos.");
                return;
            }
        } else if (type === 'Necesito Ayuda') {
            if (!field1 || !field2) {
                Alert.alert("Campos incompletos", "Por favor completa todos los datos.");
                return;
            }
        }

        try {
            if (type === 'Quiero Bautizarme') {
                const groupInfo = belongsToGroup ? `Sí, ${field2}` : 'No';
                await supabase.from('solicitudes_bautismo').insert([{ miembro_id: memberId, edad: field1, pertenece_grupo: groupInfo, celular: field3 }]);
            } else if (type === 'Necesito Ayuda') {
                await supabase.from('consultas_ayuda').insert([{ miembro_id: memberId, celular: field1, mensaje: field2 }]);
            }
            Alert.alert("Enviado", "Recibimos tu solicitud. Te contactaremos pronto.");
            navigateTo('Inicio');
        } catch (e) { console.error(e); Alert.alert("Error", "Ocurrió un problema, intenta más tarde."); }
    };

    return (
        <View style={styles.mainWrapper}>
            <LinearGradient colors={['#050B25', '#020205']} style={StyleSheet.absoluteFill} />

            {/* Mesh gradient effects */}
            <View style={{ position: 'absolute', top: -50, right: -50, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(37, 99, 235, 0.08)' }} />
            <View style={{ position: 'absolute', bottom: 100, left: -100, width: 400, height: 400, borderRadius: 200, backgroundColor: 'rgba(147, 51, 234, 0.06)' }} />

            <View style={[styles.headerRow, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => navigateTo('Inicio')} style={styles.backButton}>
                    <MaterialCommunityIcons name="chevron-left" size={28} color="#c5ff00" />
                    <Text style={styles.backText}>VOLVER</Text>
                </TouchableOpacity>
                <View style={{ marginLeft: 15 }}>
                    <Text style={styles.headerSub}>GESTIÓN DE</Text>
                    <Text style={styles.headerTitle}>{titles[type] || type}</Text>
                </View>
            </View>

            <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
                <Animated.View style={{ opacity: fadeAnim }}>
                    {type === 'Quiero Ayudar' && (
                        <View>
                            <BlurView intensity={10} tint="dark" style={styles.infoCard}>
                                <MaterialCommunityIcons name="heart-flash" size={40} color="#c5ff00" />
                                <Text style={styles.infoText}>SOMOS UNA IGLESIA <Text style={{ color: '#c5ff00', fontWeight: '900' }}>GENEROSA</Text> Y AGRADECIDA. TU APORTE NOS PERMITE SEGUIR CRECIENDO.</Text>
                            </BlurView>

                            <TouchableOpacity activeOpacity={0.9} style={styles.mpActionCard} onPress={() => Linking.openURL('https://link.mercadopago.com.ar/iglesiadelsalvador')}>
                                <LinearGradient colors={['#009ee3', '#007eb5']} style={styles.mpGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                                    <View style={styles.mpIconCircle}>
                                        <MaterialCommunityIcons name="credit-card-outline" size={24} color="#009ee3" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.mpTitleText}>MERCADOPAGO O TARJETA</Text>
                                        <Text style={styles.mpSubText}>Donación online segura</Text>
                                    </View>
                                    <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
                                </LinearGradient>
                            </TouchableOpacity>

                            <View style={styles.bankSection}>
                                <Text style={styles.sectionLabel}>TRANSFERENCIA BANCARIA</Text>
                                <BlurView intensity={5} tint="light" style={styles.bankCard}>
                                    <View style={styles.bankRow}>
                                        <Text style={styles.bankKey}>CBU PESOS ($)</Text>
                                        <Text style={styles.bankValue}>0170008420000001007530</Text>
                                    </View>
                                    <View style={styles.bankRow}>
                                        <Text style={styles.bankKey}>ALIAS</Text>
                                        <Text style={styles.bankValue}>IDS.BBVA.CCPESOS</Text>
                                    </View>
                                    <View style={styles.bankFooter}>
                                        <Text style={styles.bankFooterText}>CUIT: 30-53174084-6 | Banco BBVA</Text>
                                    </View>
                                </BlurView>
                            </View>
                        </View>
                    )}

                    {type === 'Quiero Bautizarme' && (
                        <View style={styles.formContainer}>
                            <BlurView intensity={15} tint="dark" style={styles.formCard}>
                                <Text style={styles.inputLabel}>¿QUÉ EDAD TENÉS?</Text>
                                <TextInput style={styles.input} value={field1} onChangeText={setField1} keyboardType="numeric" placeholder="Ej: 25" placeholderTextColor="#888" selectionColor="#c5ff00" />

                                <Text style={styles.inputLabel}>¿PERTENECÉS A UN GRUPO?</Text>
                                <View style={styles.radioGroup}>
                                    <TouchableOpacity style={[styles.radioBtn, belongsToGroup === true && styles.radioBtnActive]} onPress={() => setBelongsToGroup(true)}>
                                        <Text style={[styles.radioText, belongsToGroup === true && styles.radioTextActive]}>Sí</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.radioBtn, belongsToGroup === false && styles.radioBtnActive]} onPress={() => { setBelongsToGroup(false); setField2(''); }}>
                                        <Text style={[styles.radioText, belongsToGroup === false && styles.radioTextActive]}>No</Text>
                                    </TouchableOpacity>
                                </View>

                                {belongsToGroup && (
                                    <>
                                        <Text style={styles.inputLabel}>¿CUÁL?</Text>
                                        <TextInput style={styles.input} value={field2} onChangeText={setField2} placeholder="Nombre del grupo o líder" placeholderTextColor="#888" selectionColor="#c5ff00" />
                                    </>
                                )}

                                <Text style={styles.inputLabel}>WHATSAPP DE CONTACTO</Text>
                                <TextInput style={styles.input} value={field3} onChangeText={setField3} keyboardType="phone-pad" placeholder="Ej: 1122334455" placeholderTextColor="#888" selectionColor="#c5ff00" />

                                <TouchableOpacity style={styles.mainSubmitBtn} onPress={handleAction}>
                                    <Text style={styles.mainSubmitText}>ENVIAR SOLICITUD</Text>
                                </TouchableOpacity>
                            </BlurView>
                        </View>
                    )}

                    {type === 'Necesito Ayuda' && (
                        <View style={styles.formContainer}>
                            <BlurView intensity={15} tint="dark" style={styles.formCard}>
                                <Text style={styles.inputLabel}>TU WHATSAPP</Text>
                                <TextInput style={styles.input} value={field1} onChangeText={setField1} keyboardType="phone-pad" placeholder="Número de contacto" placeholderTextColor="#888" selectionColor="#c5ff00" />

                                <Text style={styles.inputLabel}>¿CÓMO PODEMOS AYUDARTE?</Text>
                                <TextInput style={[styles.input, { height: 120, textAlignVertical: 'top', paddingTop: 15 }]} multiline value={field2} onChangeText={setField2} placeholder="Cuéntanos tu situación..." placeholderTextColor="#888" selectionColor="#c5ff00" />

                                <TouchableOpacity style={styles.mainSubmitBtn} onPress={handleAction}>
                                    <Text style={styles.mainSubmitText}>SOLICITAR APOYO</Text>
                                </TouchableOpacity>
                            </BlurView>
                        </View>
                    )}

                    {type === 'Quiero Capacitarme' && (
                        <View style={styles.listContainer}>
                            <Text style={[styles.listSectionTitle, { color: '#c5ff00' }]}>CURSOS DISPONIBLES</Text>

                            <TouchableOpacity
                                style={styles.dropdownHeader}
                                onPress={() => setIsOpen(!isOpen)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.dropdownHeaderText}>
                                    {selectedItem || 'Seleccionar un Curso'}
                                </Text>
                                <MaterialCommunityIcons
                                    name={isOpen ? "chevron-up" : "chevron-down"}
                                    size={24}
                                    color="#c5ff00"
                                />
                            </TouchableOpacity>

                            {isOpen && (
                                <View style={styles.dropdownList}>
                                    {["Fundamentos cristianos", "Instituto Bíblico", "Escuela de Música", "Escuela de Adoración", "Escuela de Música Kids", "Escuela de Orientación", "Familiar", "Academia de Arte", "Oración y Consejeria", "Talleres de formación biblica", "Liderazgo"].map((curso, index, array) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={[styles.dropdownItem, index === array.length - 1 && { borderBottomWidth: 0 }]}
                                            onPress={() => {
                                                setSelectedItem(curso);
                                                setIsOpen(false);
                                            }}
                                        >
                                            <Text style={styles.dropdownItemText}>{curso}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            <TouchableOpacity
                                style={[styles.mainSubmitBtn, !selectedItem && { opacity: 0.5, backgroundColor: '#333' }]}
                                disabled={!selectedItem}
                                onPress={() => Linking.openURL(`https://wa.me/5491136151777?text=Hola, quiero sumarme al curso: ${selectedItem}`)}
                            >
                                <Text style={[styles.mainSubmitText, !selectedItem && { color: '#888' }]}>SUMARME AL CURSO</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {type === 'Sumarme a un Grupo' && (
                        <View style={styles.listContainer}>
                            <Text style={[styles.listSectionTitle, { color: '#c5ff00' }]}>NUESTROS GRUPOS</Text>

                            <TouchableOpacity
                                style={styles.dropdownHeader}
                                onPress={() => setIsOpen(!isOpen)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.dropdownHeaderText}>
                                    {selectedItem || 'Seleccionar un Grupo'}
                                </Text>
                                <MaterialCommunityIcons
                                    name={isOpen ? "chevron-up" : "chevron-down"}
                                    size={24}
                                    color="#c5ff00"
                                />
                            </TouchableOpacity>

                            {isOpen && (
                                <View style={styles.dropdownList}>
                                    {["Jóvenes", "Matrimonios", "Hombres", "Mujeres", "Adultos Mayores", "Pre-Adolescentes"].map((grupo, index, array) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={[styles.dropdownItem, index === array.length - 1 && { borderBottomWidth: 0 }]}
                                            onPress={() => {
                                                setSelectedItem(grupo);
                                                setIsOpen(false);
                                            }}
                                        >
                                            <Text style={styles.dropdownItemText}>{grupo}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            <TouchableOpacity
                                style={[styles.mainSubmitBtn, !selectedItem && { opacity: 0.5, backgroundColor: '#333' }]}
                                disabled={!selectedItem}
                                onPress={() => Linking.openURL(`https://wa.me/5491136151777?text=Hola, quiero sumarme al grupo de: ${selectedItem}`)}
                            >
                                <Text style={[styles.mainSubmitText, !selectedItem && { color: '#888' }]}>SUMARME AL GRUPO</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {type === 'Soy Nuevo' && (
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconCircle}>
                                <MaterialCommunityIcons name="clock-outline" size={50} color="#111" />
                            </View>
                            <Text style={styles.emptyTitle}>Muy pronto</Text>
                            <Text style={styles.emptySub}>Estamos preparando las inscripciones digitales. Mientras tanto, podés consultarnos por WhatsApp.</Text>
                            <TouchableOpacity style={styles.whatsappBtn} onPress={() => Linking.openURL('https://wa.me/5491136151777')}>
                                <MaterialCommunityIcons name="whatsapp" size={20} color="#000" />
                                <Text style={styles.whatsappText}>CONTACTAR POR WHATSAPP</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </Animated.View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    mainWrapper: { flex: 1, backgroundColor: '#020205' },
    container: { flex: 1 },
    headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, marginBottom: 20 },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)'
    },
    backText: { color: '#c5ff00', fontSize: 10, fontFamily: 'Montserrat_900Black', letterSpacing: 1.5, marginLeft: 8 },
    headerSub: { color: '#c5ff00', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
    headerTitle: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -1 },

    infoCard: {
        paddingHorizontal: 25,
        paddingVertical: 35,
        borderRadius: 36,
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
        marginBottom: 30,
        alignItems: 'center'
    },
    infoText: { color: '#bbb', fontSize: 15, lineHeight: 24, textAlign: 'center', marginTop: 15 },

    mpActionCard: { borderRadius: 28, overflow: 'hidden', marginBottom: 30 },
    mpGradient: { padding: 25, flexDirection: 'row', alignItems: 'center' },
    mpIconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    mpTitleText: { color: '#fff', fontSize: 14, fontWeight: '900' },
    mpSubText: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '700' },

    bankSection: { marginTop: 10 },
    sectionLabel: { color: '#aaa', fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginLeft: 5, marginBottom: 15 },
    bankCard: {
        padding: 30,
        borderRadius: 36,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)'
    },
    bankRow: { marginBottom: 20 },
    bankKey: { color: '#aaa', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    bankValue: { color: '#fff', fontSize: 16, fontWeight: '800', marginTop: 4 },
    bankFooter: { marginTop: 10, paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
    bankFooterText: { color: '#aaa', fontSize: 11, fontWeight: '900', textAlign: 'center' },

    formContainer: { marginTop: 10 },
    formCard: {
        padding: 30,
        borderRadius: 36,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)'
    },
    inputLabel: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 10, marginLeft: 5 },
    input: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, height: 55, paddingHorizontal: 20, color: '#fff', fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', marginBottom: 25 },
    radioGroup: { flexDirection: 'row', gap: 10, marginBottom: 25 },
    radioBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, height: 55, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
    radioBtnActive: { backgroundColor: '#c5ff00', borderColor: '#c5ff00' },
    radioText: { color: '#bbb', fontSize: 14, fontWeight: '700' },
    radioTextActive: { color: '#000', fontWeight: '900' },
    mainSubmitBtn: { backgroundColor: '#c5ff00', height: 65, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginTop: 10, shadowColor: '#c5ff00', shadowOpacity: 0.2, shadowRadius: 15, elevation: 10 },
    mainSubmitText: { color: '#000', fontSize: 14, fontWeight: '900', letterSpacing: 1 },

    emptyContainer: { alignItems: 'center', marginTop: 50, padding: 30 },
    emptyIconCircle: { width: 100, height: 100, borderRadius: 50, borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    emptyTitle: { color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 30 },
    emptySub: { color: '#aaa', fontSize: 14, textAlign: 'center', marginTop: 12, lineHeight: 22 },
    whatsappBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#c5ff00', paddingHorizontal: 25, paddingVertical: 18, borderRadius: 20, gap: 10, marginTop: 30 },
    whatsappText: { color: '#000', fontSize: 12, fontWeight: '900' },

    listContainer: { marginTop: 10 },
    listSectionTitle: { color: '#fff', fontSize: 14, fontWeight: '900', marginBottom: 15, marginLeft: 5, letterSpacing: 1 },
    dropdownHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#151515', padding: 18, borderRadius: 12, marginBottom: 5, borderWidth: 1, borderColor: '#2a2a2a' },
    dropdownHeaderText: { color: '#fff', fontSize: 14, fontWeight: '800' },
    dropdownList: { backgroundColor: '#151515', borderRadius: 12, marginTop: 5, paddingVertical: 10, marginBottom: 20, borderWidth: 1, borderColor: '#2a2a2a' },
    dropdownItem: { paddingVertical: 18, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#2a2a2a' },
    dropdownItemText: { color: '#fff', fontSize: 13, fontWeight: '700' }
});

export default SupportScreen;
