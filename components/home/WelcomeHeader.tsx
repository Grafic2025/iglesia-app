import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';

interface WelcomeHeaderProps {
  nombre: string;
  apellido?: string;
  fotoUrl: string | null;
  unreadCount: number;
  onNotificationsPress: () => void;
  onMenuPress?: () => void;
  onProfilePress?: () => void;
}

const WelcomeHeader: React.FC<WelcomeHeaderProps> = React.memo(({
  nombre,
  apellido,
  fotoUrl,
  unreadCount,
  onNotificationsPress,
  onMenuPress,
  onProfilePress,
}) => {
  const insets = useSafeAreaInsets();
  const { isOffline } = useApp();

  return (
    <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 16) }]}>
      {/* Glow Effect behind header */}
      <View style={{ position: 'absolute', top: -30, left: '25%', width: 200, height: 100, borderRadius: 50, backgroundColor: 'rgba(37, 99, 235, 0.08)', zIndex: -1 }} />

      {/* ============ TOP BAR: MENU | TITLE | PROFILE/PHOTO ============ */}
      <View style={styles.titleRow}>
        {/* Menu Button */}
        <TouchableOpacity
          onPress={onMenuPress}
          style={styles.iconBtn}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="menu" size={26} color="#c5ff00" />
        </TouchableOpacity>

        {/* Church Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.churchTitle}>IGLESIA DEL SALVADOR</Text>
          <View style={styles.titleUnderline} />
        </View>

        {/* Profile Photo Icon Button */}
        <TouchableOpacity
          onPress={onProfilePress}
          style={styles.profileBtn}
          activeOpacity={0.7}
        >
          {fotoUrl ? (
            <ExpoImage source={{ uri: fotoUrl }} style={styles.profilePhoto} />
          ) : (
            <MaterialCommunityIcons name="account-circle" size={30} color="#c5ff00" />
          )}
        </TouchableOpacity>
      </View>

      {/* ============ GREETING ROW: NAME & NOTIFICATIONS ============ */}
      <View style={styles.bottomRow}>
        <View style={styles.greetingContainer}>
          <Text style={styles.greetingText}>Hola,</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.userNameText}>{nombre} 👋</Text>
            {isOffline && (
              <View style={styles.offlineBadge}>
                <Text style={styles.offlineText}>OFFLINE</Text>
              </View>
            )}
          </View>
        </View>

        {/* Notification Button */}
        <TouchableOpacity
          onPress={onNotificationsPress}
          style={styles.notificationBtn}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="bell-outline" size={22} color="#000" />
          {unreadCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
});

export default WelcomeHeader;

// ======================================
// STYLES
// ======================================
const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
    paddingBottom: 0,
  },

  // Title Row: Menu | Title | Profile
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
    backgroundColor: 'rgba(0, 5, 20, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    height: 54,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },

  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },

  churchTitle: {
    fontFamily: 'Montserrat_900Black',
    color: '#fff',
    fontSize: 14,
    letterSpacing: 2,
    textAlign: 'center',
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  titleUnderline: {
    position: 'absolute',
    bottom: -1,
    height: 1.5,
    backgroundColor: '#c5ff00',
    width: '90%',
    borderRadius: 2,
    alignSelf: 'center',
    shadowColor: '#c5ff00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 3,
  },

  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  profileBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },

  profilePhoto: {
    width: '100%',
    height: '100%',
  },

  // Bottom Row: Greeting & Notifications
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },

  greetingContainer: {
    flex: 1,
  },

  greetingText: {
    fontFamily: 'Inter_400Regular',
    color: '#888',
    fontSize: 12,
    marginBottom: -2,
  },

  userNameText: {
    fontFamily: 'Montserrat_900Black',
    color: '#fff',
    fontSize: 22,
    letterSpacing: -0.5,
  },

  notificationBtn: {
    backgroundColor: '#c5ff00',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#c5ff00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },

  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ff3b30',
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#c5ff00',
  },

  notificationBadgeText: {
    color: '#fff',
    fontSize: 7,
    fontFamily: 'Montserrat_700Bold',
  },
  offlineBadge: {
    backgroundColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: '#444',
  },
  offlineText: {
    color: '#888',
    fontSize: 8,
    fontFamily: 'Montserrat_900Black',
    letterSpacing: 1,
  }
});

