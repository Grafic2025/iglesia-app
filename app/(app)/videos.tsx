import React from 'react';
import VideosScreen from '../../components/screens/VideosScreen';
import { useAppContent } from '../../context/AppContentContext';

export default function VideosRoute() {
    const { navigateTo } = useAppContent();
    return <VideosScreen navigateTo={navigateTo} />;
}
