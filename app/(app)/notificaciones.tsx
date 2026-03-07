import React from 'react';
import NotificationInbox from '../../components/screens/NotificationInbox';
import { useAppContent } from '../../context/AppContentContext';

export default function NotificacionesRoute() {
    const { navigateTo } = useAppContent();
    return <NotificationInbox navigateTo={navigateTo} />;
}
