import { Component, OnInit, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { AuthService } from './services/auth.service';
import { SqliteService } from './services/sqlite.service';
import { MemoryManagerService } from './services/memory-manager.service';
import {
  personOutline,
  personAddOutline,
  lockClosedOutline,
  lockOpenOutline,
  mailOutline,
  eyeOutline,
  eyeOffOutline,
  chevronForwardOutline,
  chevronForward,
  arrowForwardOutline,
  arrowBackOutline,
  searchOutline,
  search,
  homeOutline,
  heartOutline,
  heart,
  restaurantOutline,
  timeOutline,
  speedometerOutline,
  cafeOutline,
  pizzaOutline,
  iceCreamOutline,
  peopleOutline,
  imageOutline,
  cameraOutline,
  addOutline,
  checkmarkOutline,
  checkmarkCircle,
  checkmarkCircleOutline,
  createOutline,
  closeOutline,
  trashOutline,
  logOutOutline,
  calendarOutline,
  reorderTwoOutline,
  helpCircleOutline,
  alertCircleOutline,
  informationCircleOutline,
  cloudUploadOutline,
  gridOutline,
  locationOutline,
  callOutline,
  chatbubbleOutline,
  notificationsOutline,
  shieldOutline,
  logInOutline,
  bookmarkOutline,
  flameOutline,
  skullOutline,
  appsOutline,
  addCircleOutline,
  waterOutline,
  imagesOutline,
  chevronBackOutline,
  basketOutline,
  listOutline,
  fitnessOutline,
  refreshOutline,
  documentTextOutline,
  phonePortraitOutline,
  shareOutline,
  person,
  heartDislike,
  heartDislikeOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  private platform: string = Capacitor.getPlatform();
  private authService = inject(AuthService);
  private sqlite = inject(SqliteService);
  private memoryManager = inject(MemoryManagerService);
  private sqliteInitialized = false;

  constructor() {
    // Agregar iconos que se usarán en la aplicación
    addIcons({
      personOutline,
      personAddOutline,
      lockClosedOutline,
      lockOpenOutline,
      mailOutline,
      eyeOutline,
      eyeOffOutline,
      chevronForwardOutline,
      chevronForward,
      arrowForwardOutline,
      arrowBackOutline,
      searchOutline,
      search,
      homeOutline,
      heartOutline,
      heart,
      restaurantOutline,
      timeOutline,
      speedometerOutline,
      cafeOutline,
      pizzaOutline,
      iceCreamOutline,
      peopleOutline,
      imageOutline,
      cameraOutline,
      addOutline,
      checkmarkOutline,
      checkmarkCircle,
      checkmarkCircleOutline,
      createOutline,
      closeOutline,
      trashOutline,
      logOutOutline,
      calendarOutline,
      reorderTwoOutline,
      helpCircleOutline,
      alertCircleOutline,
      informationCircleOutline,
      cloudUploadOutline,
      gridOutline,
      locationOutline,
      callOutline,
      chatbubbleOutline,
      notificationsOutline,
      shieldOutline,
      logInOutline,
      bookmarkOutline,
      flameOutline,
      skullOutline,
      appsOutline,
      addCircleOutline,
      waterOutline,
      imagesOutline,
      chevronBackOutline,
      basketOutline,
      listOutline,
      fitnessOutline,
      refreshOutline,
      documentTextOutline,
      phonePortraitOutline,
      shareOutline,
      person,
      heartDislike,
      heartDislikeOutline,
    });

    this.initializeApp();
  }

  async ngOnInit() {
    // 🛡️ Start memory monitoring for Android
    if (this.platform === 'android') {
      this.memoryManager.startMemoryMonitoring();
      console.log('🧠 Memory monitoring started for Android');
    }

    // Initialize SQLite only on supported platforms
    if (this.platform === 'web' || this.platform === 'ios' || this.platform === 'android') {
      try {
        await this.sqlite.initializeDB();
        console.log(`✅ SQLite initialized on ${this.platform}`);
      } catch (error) {
        console.warn('⚠️ SQLite initialization failed, continuing with localStorage fallback');
      }
    }
  }

  private async initializeApp() {
    try {
      // Configure status bar for native platforms
      if (this.platform !== 'web') {
        await StatusBar.setStyle({ style: Style.Default });
        await StatusBar.setBackgroundColor({ color: '#3880ff' });
      }

      // Hide splash screen after a delay
      if (this.platform !== 'web') {
        setTimeout(async () => {
          await SplashScreen.hide();
        }, 2000);
      }

      console.log(`✅ App initialized on ${this.platform}`);
    } catch (error) {
      console.error('Error during app initialization:', error);
    }
  }
}
