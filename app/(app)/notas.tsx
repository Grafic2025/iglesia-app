import React from 'react';
import NotesScreen from '../../components/screens/NotesScreen';
import { useAppContent } from '../../context/AppContentContext';

export default function NotasRoute() {
    const { navigateTo } = useAppContent();
    return <NotesScreen navigateTo={navigateTo} />;
}
