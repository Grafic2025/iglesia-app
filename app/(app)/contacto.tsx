import React from 'react';
import SupportScreen from '../../components/screens/SupportScreen';
import { useAppContent } from '../../context/AppContentContext';

export default function ContactoRoute() {
    const { navigateTo } = useAppContent();
    return <SupportScreen navigateTo={navigateTo} type="Contacto" />;
}
