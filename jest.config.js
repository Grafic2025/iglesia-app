module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|expo-modules-core|react-navigation)/)'
  ],
  moduleNameMapper: {
    '^expo-notifications$': '<rootDir>/__mocks__/expo-notifications.js',
    '^expo-image-picker$': '<rootDir>/__mocks__/expo-image-picker.js',
    '^expo-camera$': '<rootDir>/__mocks__/expo-camera.js',
    '^expo-splash-screen$': '<rootDir>/__mocks__/expo-splash-screen.js',
    '^expo-secure-store$': '<rootDir>/__mocks__/expo-secure-store.js',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
