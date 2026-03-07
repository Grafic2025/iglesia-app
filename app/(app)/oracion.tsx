import React from 'react';
import PrayerScreen from '../../components/screens/PrayerScreen';
import { useAppContent } from '../../context/AppContentContext';

export default function PrayerRoute() {
    const { navigateTo, cargarPedidos, listaPedidosOracion } = useAppContent();
    return (
        <PrayerScreen
            navigateTo={navigateTo}
            cargarPedidos={cargarPedidos}
            listaPedidosOracion={listaPedidosOracion}
        />
    );
}
