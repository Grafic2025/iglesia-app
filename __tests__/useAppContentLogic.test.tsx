import React from 'react';

// mock AsyncStorage to avoid native module errors
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn(),
}));

// mock supabase client to avoid needing env vars
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      then: jest.fn(),
    })),
    storage: { from: jest.fn(() => ({ upload: jest.fn().mockResolvedValue({}), getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: '' } }) })) },
  },
}));

// mock native/expo modules that Jest can't parse
jest.mock('expo-notifications');
jest.mock('expo-image-picker');
jest.mock('expo-splash-screen');
jest.mock('expo-camera', () => ({
  CameraView: () => null,
  useCameraPermissions: () => [null, jest.fn()],
}));

// stub out individual screens to prevent heavy dependencies
jest.mock('../components/screens/AgendaScreen', () => () => null);
jest.mock('../components/screens/HomeScreen', () => () => null);
jest.mock('../components/screens/MessagesScreen', () => () => null);
jest.mock('../components/screens/NewsDetail', () => () => null);
jest.mock('../components/screens/NotesScreen', () => () => null);
jest.mock('../components/screens/NotificationInbox', () => () => null);
jest.mock('../components/screens/PrayerScreen', () => () => null);
jest.mock('../components/screens/ProfileScreen', () => () => null);
jest.mock('../components/screens/ServidoresScreen', () => () => null);
jest.mock('../components/screens/SupportScreen', () => () => null);
jest.mock('../components/screens/VideosScreen', () => () => null);

import { render } from '@testing-library/react-native';
import { AppContext, AppContextType } from '../context/AppContext';
import { useAppContentLogic } from '../hooks/useAppContentLogic';

// create a fake context value for testing
const mockContext: AppContextType = {
  isLoggedIn: false,
  memberId: null,
  nombre: '',
  apellido: '',
  fotoUrl: null,
  fechaNacimiento: null,
  zona: null,
  loading: false,
  noticiasSupabase: [],
  serieEsenciales: [],
  rachaUsuario: 0,
  asistenciasDetalle: [],
  currentScreen: 'Inicio',
  setCurrentScreen: jest.fn(),
  logout: jest.fn(),
  login: jest.fn().mockResolvedValue(undefined),
  refreshData: jest.fn().mockResolvedValue(undefined),
  isCurrentlyLive: false,
  liveVideoUrl: null,
  esServidor: false,
  esAdmin: false,
  notificationInbox: [],
  addNotificationToInbox: jest.fn(),
  unreadCount: 0,
  markNotificationRead: jest.fn(),
  markAllRead: jest.fn(),
};

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AppContext.Provider value={mockContext as any}>{children}</AppContext.Provider>
);

describe('useAppContentLogic', () => {
  it('provides initial state and functions', () => {
    let hookResult: any = null;
    const TestComponent = () => {
      hookResult = useAppContentLogic();
      return null;
    };

    render(<TestComponent />, { wrapper });

    expect(hookResult).not.toBeNull();
    expect(hookResult.localNombre).toBe('');
    expect(hookResult.localApellido).toBe('');
    expect(typeof hookResult.toggleMenu).toBe('function');
    expect(typeof hookResult.handleLogin).toBe('function');
    expect(hookResult.isMenuOpen).toBe(false);
    expect(hookResult.scanning).toBe(false);
  });
});
