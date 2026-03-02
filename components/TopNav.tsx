import { FontAwesome } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TopNavProps {
  toggleMenu: () => void;
  nombre: string;
  fotoUrl?: string;
  navigateTo: (screen: string) => void;
}

const TopNav: React.FC<TopNavProps> = ({
  toggleMenu,
  nombre,
  fotoUrl,
  navigateTo,
}) => (
  <View style={styles.topNav}>
    <TouchableOpacity onPress={toggleMenu} style={styles.navIconButton}>
      <FontAwesome name="bars" size={24} color="#c5ff00" />
    </TouchableOpacity>

    <View style={styles.navHeaderContainer}>
      <Text style={styles.navTitle}>IGLESIA DEL SALVADOR</Text>
      <View style={styles.navTitleDecoration} />
    </View>

    <TouchableOpacity onPress={() => navigateTo('Mi Perfil')} style={styles.userCircle}>
      {fotoUrl ? (
        <ExpoImage source={{ uri: fotoUrl }} style={styles.userCirclePhoto} />
      ) : (
        <FontAwesome name="user" size={16} color="black" />
      )}
    </TouchableOpacity>
  </View>
);

export default TopNav;

const styles = StyleSheet.create({
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#000',
  },
  navIconButton: {
    padding: 5,
  },
  navHeaderContainer: {
    alignItems: 'center',
  },
  navTitle: {
    fontFamily: 'Montserrat_900Black',
    color: '#fff',
    fontSize: 14,
    letterSpacing: 2,
  },
  navTitleDecoration: {
    width: 60,
    height: 3,
    backgroundColor: '#c5ff00',
    marginTop: 4,
    borderRadius: 2,
  },
  userCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#c5ff00',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
  },
  userCirclePhoto: {
    width: '100%',
    height: '100%',
  },
});