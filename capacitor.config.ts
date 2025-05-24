import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mealmates.app',
  appName: 'MealMates',
  webDir: 'www',
  server: {
    androidScheme: 'https',
  },
  // 🛡️ Android Crash Prevention Configuration
  android: {
    webContentsDebuggingEnabled: true,
    allowMixedContent: true,
    zoomEnabled: false,
    backgroundColor: '#ffffff',
    overrideUserAgent: 'MealMates-Android',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ff6b35',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    // 📷 Camera Configuration
    Camera: {
      androidRequestPermissions: true,
      quality: 80,
      allowEditing: true,
      source: 'prompt',
      resultType: 'dataUrl',
    },
    // ⌨️ Keyboard Configuration for Memory Stability
    Keyboard: {
      resize: 'native',
      style: 'dark',
      resizeOnFullScreen: true,
    },
    // 🗄️ SQLite Configuration with fallback handling
    CapacitorSQLite: {
      iosDatabaseLocation: 'Library/CapacitorDatabase',
      iosIsEncryption: false,
      iosKeychainPrefix: 'MealMates',
      iosBiometric: {
        biometricAuth: false,
        biometricTitle: 'Biometric login for capacitor sqlite',
      },
      androidIsEncryption: false,
      androidBiometric: {
        biometricAuth: false,
        biometricTitle: 'Biometric login for capacitor sqlite',
        biometricSubTitle: 'Log into the secure area with your biometric credential',
        biometricDescription: 'Use your biometric to access your secure storage',
      },
      // Android emulator optimizations
      electronWindowsLocation: 'C:\\ProgramData\\CapacitorSQLite',
      electronMacLocation: '/Users/Shared/CapacitorSQLite',
      electronLinuxLocation: 'Databases',
    },
  },
};

export default config;
