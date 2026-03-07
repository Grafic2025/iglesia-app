import React from 'react';
import SerieEsencialesScreen from '../../components/screens/SerieEsencialesScreen';
import { useAppContent } from '../../context/AppContentContext';

export default function SerieRoute() {
    const { navigateTo } = useAppContent();
    return <SerieEsencialesScreen navigateTo={navigateTo} />;
}
