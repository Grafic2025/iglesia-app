import React from 'react';
import AgendaScreen from '../../components/screens/AgendaScreen';
import { useAppContent } from '../../context/AppContentContext';

export default function AgendaRoute() {
    const { navigateTo } = useAppContent();
    return <AgendaScreen navigateTo={navigateTo} />;
}
