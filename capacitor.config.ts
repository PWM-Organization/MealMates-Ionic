import { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'com.mealmates.app',
  appName: 'MealMates',
  webDir: 'www',
  server: {
    androidScheme: 'https',
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
    CapacitorSQLite: {
      iosDatabaseLocation: 'Library/CapacitorDatabase',
      iosIsEncryption: false,
      iosKeychainPrefix: 'mealmates',
      iosBiometric: {
        biometricAuth: false,
        biometricTitle: 'Biometric login for capacitor sqlite',
      },
      androidIsEncryption: false,
      androidBiometric: {
        biometricAuth: false,
        biometricTitle: 'Biometric login for capacitor sqlite',
        biometricSubTitle: 'Log in using your biometric',
      },
    },
  },
};

export default config;
