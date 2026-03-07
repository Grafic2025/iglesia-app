import React from 'react';
import MessagesScreen from '../../components/screens/MessagesScreen';
import { useAppContent } from '../../context/AppContentContext';

export default function MensajesRoute() {
    const { navigateTo } = useAppContent();
    return <MessagesScreen navigateTo={navigateTo} />;
}
