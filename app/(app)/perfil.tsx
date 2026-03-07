import React from 'react';
import { Alert } from 'react-native';
import ProfileScreen from '../../components/screens/ProfileScreen';
import { useAppContent } from '../../context/AppContentContext';

export default function PerfilRoute() {
    const { navigateTo, pickImage } = useAppContent();

    return (
        <ProfileScreen
            navigateTo={navigateTo}
            pickImage={pickImage}
            handleModificarDatos={() =>
                Alert.alert('Próximamente', 'Podrás editar tus datos pronto.')
            }
        />
    );
}
