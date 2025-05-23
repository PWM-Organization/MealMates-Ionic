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
      // Create the 'jeep-sqlite' element for web platform
      const jeepEl = document.createElement('jeep-sqlite');
      document.body.appendChild(jeepEl);
      await customElements.whenDefined('jeep-sqlite');

      // Initialize web stores for SQLite
      await this.sqlite.initWebStore();

      console.log('SQLite initialized for web platform');
    } catch (error) {
      console.error('Error initializing SQLite for web:', error);

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
            alertEl.innerHTML = `
              <div style="font-weight: bold; margin-bottom: 8px">SQLite Web Initialization Warning</div>
              <div>SQLite funcionará en dispositivos reales pero necesita configuración adicional para web.</div>
              <div style="margin-top: 8px">
                <small>Esta alerta solo aparece en desarrollo.</small>
              </div>
            `;
            document.body.appendChild(alertEl);
          }
        }
      }
    }
  }
}
