import { Component, OnInit, isDevMode } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
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
  private sqlite: SQLiteConnection = new SQLiteConnection(CapacitorSQLite);
  private isWeb: boolean = false;
  private sqliteInitialized: boolean = false;

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
  }

  async ngOnInit() {
    this.isWeb = this.platform === 'web';

    // Initialize SQLite for web platform
    if (this.isWeb) {
      await this.initializeSQLiteWeb();
    }
  }

  /**
   * Initialize SQLite for web platform - required to avoid "jeep-sqlite element" error
   */
  private async initializeSQLiteWeb(): Promise<void> {
    try {
      // Check if SQLite element already exists
      let jeepSqliteEl = document.querySelector('jeep-sqlite');

      if (!jeepSqliteEl) {
        // Create the 'jeep-sqlite' element for web platform
        jeepSqliteEl = document.createElement('jeep-sqlite');
        document.body.appendChild(jeepSqliteEl);
      }

      // Wait for the custom element to be defined
      try {
        // Set a timeout to avoid waiting indefinitely
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout waiting for jeep-sqlite definition')), 3000),
        );

        await Promise.race([customElements.whenDefined('jeep-sqlite'), timeout]);

        // Initialize web store for SQLite
        await this.sqlite.initWebStore();

        this.sqliteInitialized = true;
        console.log('SQLite initialized for web platform');
      } catch (timeoutError) {
        console.warn('Could not initialize jeep-sqlite element in time:', timeoutError);
        this.createSQLiteFallbackAlert();
      }
    } catch (error) {
      console.error('Error initializing SQLite for web:', error);
      this.createSQLiteFallbackAlert();
    }
  }

  /**
   * Creates a developer-friendly alert for SQLite initialization issues
   */
  private createSQLiteFallbackAlert(): void {
    // In development mode, just log a warning instead of showing popup
    if (isDevMode()) {
      console.warn(
        'SQLite Web Initialization: SQLite funcionará en dispositivos reales pero necesita configuración adicional para web. La app usará localStorage como alternativa.',
      );
    }
  }
}
