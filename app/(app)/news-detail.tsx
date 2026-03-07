import React from 'react';
import NewsDetail from '../../components/screens/NewsDetail';
import { useAppContent } from '../../context/AppContentContext';

export default function NewsDetailRoute() {
    const { noticiaSeleccionada, navigateTo } = useAppContent();
    return (
        <NewsDetail
            news={noticiaSeleccionada}
            navigateTo={navigateTo}
        />
    );
}
