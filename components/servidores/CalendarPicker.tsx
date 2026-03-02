import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const DAYS_OF_WEEK = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];
const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function parseLocalDate(str: string): Date {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
}

interface CalendarPickerProps {
    startDate: string;
    endDate: string;
    onChangeStart: (d: string) => void;
    onChangeEnd: (d: string) => void;
}

const CalendarPicker: React.FC<CalendarPickerProps> = ({ startDate, endDate, onChangeStart, onChangeEnd }) => {
    const today = new Date();
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());
    const [pickingEnd, setPickingEnd] = useState(false);

    const firstDay = new Date(viewYear, viewMonth, 1, 12, 0, 0).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
    };

    const selectFullMonth = () => {
        const start = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-01`;
        const lastDay = new Date(viewYear, viewMonth + 1, 0).getDate();
        const end = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        onChangeStart(start);
        onChangeEnd(end);
        setPickingEnd(false);
    };

    const handleDayPress = (day: number) => {
        const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (!pickingEnd) {
            onChangeStart(dateStr);
            onChangeEnd(dateStr);
            setPickingEnd(true);
        } else {
            const startStr = startDate;
            const start = parseLocalDate(startStr);
            const picked = parseLocalDate(dateStr);
            if (picked < start) {
                onChangeStart(dateStr);
                onChangeEnd(startStr);
            } else {
                onChangeEnd(dateStr);
            }
            setPickingEnd(false);
        }
    };

    const isInRange = (day: number): boolean => {
        if (!startDate || !endDate) return false;
        const dStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const d = parseLocalDate(dStr);
        return d > parseLocalDate(startDate) && d < parseLocalDate(endDate);
    };

    const isStart = (day: number) => {
        return startDate === `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    };
    const isEnd = (day: number) => {
        return endDate === `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    };

    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    return (
        <View style={styles.wrapper}>
            <View style={styles.navRow}>
                <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
                    <MaterialCommunityIcons name="chevron-left" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.monthLabel}>{MONTHS_ES[viewMonth]} {viewYear}</Text>
                <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
                    <MaterialCommunityIcons name="chevron-right" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.fullMonthBtn} onPress={selectFullMonth}>
                <MaterialCommunityIcons name="calendar-range" size={16} color="#000" />
                <Text style={styles.fullMonthTxt}>SELECCIONAR MES COMPLETO</Text>
            </TouchableOpacity>

            <View style={styles.daysOfWeekRow}>
                {DAYS_OF_WEEK.map(d => (
                    <Text key={d} style={styles.dayOfWeekLabel}>{d}</Text>
                ))}
            </View>

            <View style={styles.grid}>
                {cells.map((day, idx) => {
                    if (day === null) return <View key={`e-${idx}`} style={styles.cell} />;
                    const start = isStart(day);
                    const end = isEnd(day);
                    const inRange = isInRange(day);
                    const highlighted = start || end || inRange;
                    return (
                        <TouchableOpacity
                            key={`d-${day}`}
                            style={[
                                styles.cell,
                                inRange && styles.cellInRange,
                                (start || end) && styles.cellEndpoint,
                            ]}
                            onPress={() => handleDayPress(day)}
                        >
                            <Text style={[
                                styles.dayText,
                                highlighted && { color: '#000' },
                                (start || end) && { fontWeight: '900' },
                                !highlighted && { color: '#777' }
                            ]}>{day}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <View style={styles.summaryRow}>
                <View style={styles.summaryBox}>
                    <Text style={styles.summaryLabel}>DESDE</Text>
                    <Text style={styles.summaryDate}>{startDate || '——'}</Text>
                </View>
                <MaterialCommunityIcons name="arrow-right-thin" size={24} color="#333" />
                <View style={styles.summaryBox}>
                    <Text style={styles.summaryLabel}>HASTA</Text>
                    <Text style={styles.summaryDate}>{endDate || '——'}</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        backgroundColor: '#050505',
        borderRadius: 32,
        padding: 22,
        borderWidth: 1,
        borderColor: '#151515',
        marginTop: 10
    },
    navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    navBtn: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: '#151515'
    },
    monthLabel: { color: '#fff', fontFamily: 'Montserrat_900Black', fontSize: 17, letterSpacing: -0.5 },
    fullMonthBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        backgroundColor: '#c5ff00', borderRadius: 18,
        paddingVertical: 12, marginBottom: 20,
        shadowColor: '#c5ff00', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2, shadowRadius: 8
    },
    fullMonthTxt: { color: '#000', fontFamily: 'Montserrat_900Black', fontSize: 11, letterSpacing: 1 },
    daysOfWeekRow: { flexDirection: 'row', width: '100%', marginBottom: 15 },
    dayOfWeekLabel: { color: '#555', fontSize: 11, fontFamily: 'Montserrat_900Black', width: '14.28%', textAlign: 'center' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', width: '100%' },
    cell: { width: '14.28%', height: 45, justifyContent: 'center', alignItems: 'center', borderRadius: 12, marginVertical: 2 },
    cellInRange: { backgroundColor: 'rgba(197, 255, 0, 0.15)' },
    cellEndpoint: {
        backgroundColor: '#c5ff00',
        shadowColor: '#c5ff00', shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5, shadowRadius: 8
    },
    dayText: { color: '#fff', fontSize: 14, fontFamily: 'Montserrat_700Bold' },
    summaryRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 20, marginTop: 22, paddingTop: 22,
        borderTopWidth: 1, borderTopColor: '#0f0f0f'
    },
    summaryBox: { alignItems: 'center' },
    summaryLabel: {
        color: '#bbb',
        fontSize: 9.5,
        fontFamily: 'Montserrat_900Black',
        letterSpacing: 1.5,
        textShadowColor: 'rgba(197, 255, 0, 0.2)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 4
    },
    summaryDate: { color: '#fff', fontSize: 15, fontFamily: 'Montserrat_900Black', marginTop: 4 },
});

export default CalendarPicker;
