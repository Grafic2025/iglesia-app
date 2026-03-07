import React from 'react';
import HomeScreen from '../../components/screens/HomeScreen';
import { useAppContent } from '../../context/AppContentContext';

const MemoizedHomeScreen = React.memo(HomeScreen);

export default function HomeRoute() {
    const {
        navigateTo,
        setVideoSeleccionado,
        setModalVideoVisible,
        setScanning,
        requestPermission,
        cargarRanking,
        setShowRanking,
        setShowHistorial,
        setNoticiaSeleccionada,
        toggleMenu
    } = useAppContent();

    return (
        <MemoizedHomeScreen
            navigateTo={navigateTo}
            setVideoSeleccionado={setVideoSeleccionado}
            setModalVideoVisible={setModalVideoVisible}
            setScanning={setScanning}
            requestPermission={requestPermission}
            cargarRanking={cargarRanking}
            setShowRanking={setShowRanking}
            setShowHistorial={setShowHistorial}
            setNoticiaSeleccionada={setNoticiaSeleccionada}
            toggleMenu={toggleMenu}
        />
    );
}
