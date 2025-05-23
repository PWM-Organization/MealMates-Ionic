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
  createOutline,
  closeOutline,
  trashOutline,
  logOutOutline,
  calendarOutline,
  reorderTwoOutline,
  helpCircleOutline,
  alertCircleOutline,
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
      createOutline,
      closeOutline,
      trashOutline,
      logOutOutline,
      calendarOutline,
      reorderTwoOutline,
      helpCircleOutline,
      alertCircleOutline,
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
    // In development mode, show friendly error instead of crashing
    if (isDevMode()) {
      // Create a fallback to avoid crashes during development
      const appEl = document.querySelector('app-root');
      if (appEl) {
        if (!document.querySelector('#sqlite-fallback-alert')) {
          const alertEl = document.createElement('div');
          alertEl.id = 'sqlite-fallback-alert';
          alertEl.style.padding = '12px';
          alertEl.style.margin = '10px';
          alertEl.style.backgroundColor = '#ffeeba';
          alertEl.style.color = '#856404';
          alertEl.style.borderRadius = '4px';
          alertEl.style.border = '1px solid #ffeeba';
          alertEl.style.position = 'fixed';
          alertEl.style.bottom = '10px';
          alertEl.style.right = '10px';
          alertEl.style.zIndex = '9999';
          alertEl.style.maxWidth = '400px';
          alertEl.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
          alertEl.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px">
              <span style="font-weight: bold;">SQLite Web Initialization Warning</span>
              <button style="background: none; border: none; font-size: 16px; cursor: pointer; color: #856404;" 
                      onclick="document.getElementById('sqlite-fallback-alert').remove()">×</button>
            </div>
            <div>SQLite funcionará en dispositivos reales pero necesita configuración adicional para web.</div>
            <div style="margin-top: 8px">
              <small>Esta alerta solo aparece en desarrollo. La app usará localStorage como alternativa.</small>
            </div>
          `;
          document.body.appendChild(alertEl);
        }
      }
    }
  }
}
