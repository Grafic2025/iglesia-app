import React from 'react';
import ServidoresScreen from '../../components/screens/ServidoresScreen';
import { useAppContent } from '../../context/AppContentContext';

export default function ServidoresRoute() {
    const { navigateTo } = useAppContent();
    return <ServidoresScreen navigateTo={navigateTo} />;
}
