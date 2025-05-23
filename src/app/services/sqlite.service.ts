import { Injectable, signal, isDevMode, computed } from '@angular/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { Favorite } from '../../models/favorite.model';

@Injectable({ providedIn: 'root' })
export class SqliteService {
  private sqlite: SQLiteConnection = new SQLiteConnection(CapacitorSQLite);
  private db: SQLiteDBConnection | null = null;
  private readonly DB_NAME = 'mealmates.db';
  private readonly DB_VERSION = 1;
  private platform: string = Capacitor.getPlatform();
  private initializationAttempted = false;

  // State signals
  private isInitializedSignal = signal(false);
  private isWebPlatformSignal = signal(this.platform === 'web');

  // Public readonly computed signals for state management
  readonly isInitialized = this.isInitializedSignal.asReadonly();
  readonly isWebPlatform = this.isWebPlatformSignal.asReadonly();
  readonly isAvailable = computed(() => this.isInitialized() || this.isWebPlatform());

  /**
   * Wait for SQLite web module to be available
   */
  private async waitForSQLiteWeb(timeout: number = 1000): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const checkForSQLite = () => {
        // Check if jeep-sqlite custom element is defined
        if (customElements.get('jeep-sqlite')) {
          resolve();
          return;
        }

        // Check timeout - be more forgiving and just resolve after timeout
        if (Date.now() - startTime > timeout) {
          // Instead of rejecting, just resolve and let the fallback handle it
          console.warn('SQLite web module timed out, proceeding with localStorage fallback');
          resolve();
          return;
        }

        // Check again in 50ms (faster polling)
        setTimeout(checkForSQLite, 50);
      };

      checkForSQLite();
    });
  }

  /**
   * Initialize SQLite database with better web platform support
   */
  async initializeDB(): Promise<void> {
    // Prevent multiple initialization attempts
    if (this.initializationAttempted) {
      return;
    }

    this.initializationAttempted = true;

    try {
      if (this.platform === 'web') {
        // Wait for SQLite web module to load
        await this.waitForSQLiteWeb();

        // Initialize the WebStore for web platform
        try {
          await this.sqlite.initWebStore();
          if (isDevMode()) {
            console.log('✅ SQLite WebStore initialized');
          }
        } catch (webStoreError: any) {
          // WebStore might already be initialized, check if it's just a duplicate call
          if (!webStoreError.message?.includes('already initialized')) {
            throw webStoreError;
          }
        }
      }

      // Check if CapacitorSQLite is available
      if (!CapacitorSQLite) {
        throw new Error('CapacitorSQLite not available');
      }

      this.db = await this.sqlite.createConnection(this.DB_NAME, false, 'no-encryption', this.DB_VERSION, false);

      if (!this.db) {
        throw new Error('Failed to create SQLite connection');
      }

      await this.db.open();
      await this.createTables();

      this.isInitializedSignal.set(true);

      if (isDevMode()) {
        console.log(`✅ SQLite initialized successfully on ${this.platform}`);
      }
    } catch (error: any) {
      this.isInitializedSignal.set(false);

      if (isDevMode()) {
        console.warn('⚠️ SQLite initialization failed, using localStorage fallback:', error.message);
      }

      // Don't throw error, just set as not available so localStorage fallback is used
    }
  }

  /**
   * Create database tables
   */
  private async createTables(): Promise<void> {
    if (!this.db) {
      console.warn('Cannot create tables, database not initialized');
      return;
    }

    const createFavoritesTable = `
      CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipeId TEXT NOT NULL,
        userId TEXT NOT NULL,
        addedAt TEXT NOT NULL,
        UNIQUE(recipeId, userId)
      );
    `;

    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(userId);
      CREATE INDEX IF NOT EXISTS idx_favorites_recipe ON favorites(recipeId);
    `;

    try {
      await this.db.execute(createFavoritesTable);
      await this.db.execute(createIndexes);
      console.log('SQLite tables created successfully');
    } catch (error) {
      console.error('Error creating tables:', error);
      throw error;
    }
  }

  /**
   * Add a recipe to favorites - with localStorage fallback for web
   */
  async addFavorite(recipeId: string, userId: string): Promise<void> {
    try {
      // If SQLite is available and initialized, use it
      if (this.isInitialized() && this.db) {
        const query = `
          INSERT OR REPLACE INTO favorites (recipeId, userId, addedAt) 
          VALUES (?, ?, ?)
        `;
        await this.db.run(query, [recipeId, userId, new Date().toISOString()]);
      }
      // Otherwise, always use localStorage as fallback
      else {
        this._saveFavoriteToLocalStorage(recipeId, userId);
      }

      console.log(`Recipe ${recipeId} added to favorites for user ${userId}`);
    } catch (error) {
      console.error('Error adding favorite:', error);
      // Use localStorage as fallback if SQLite fails
      this._saveFavoriteToLocalStorage(recipeId, userId);
    }
  }

  /**
   * Remove a recipe from favorites - with localStorage fallback for web
   */
  async removeFavorite(recipeId: string, userId: string): Promise<void> {
    try {
      // If SQLite is available and initialized, use it
      if (this.isInitialized() && this.db) {
        const query = `DELETE FROM favorites WHERE recipeId = ? AND userId = ?`;
        await this.db.run(query, [recipeId, userId]);
      }
      // Otherwise, always use localStorage as fallback
      else {
        this._removeFavoriteFromLocalStorage(recipeId, userId);
      }

      console.log(`Recipe ${recipeId} removed from favorites for user ${userId}`);
    } catch (error) {
      console.error('Error removing favorite:', error);
      // Use localStorage as fallback if SQLite fails
      this._removeFavoriteFromLocalStorage(recipeId, userId);
    }
  }

  /**
   * Get all favorite recipe IDs for a user - with localStorage fallback for web
   */
  async getFavorites(userId: string): Promise<string[]> {
    try {
      // If SQLite is available and initialized, use it
      if (this.isInitialized() && this.db) {
        const query = `SELECT recipeId FROM favorites WHERE userId = ? ORDER BY addedAt DESC`;
        const result = await this.db.query(query, [userId]);
        return result.values?.map((row) => row.recipeId) || [];
      }
      // Otherwise, always use localStorage as fallback
      return this._getFavoritesFromLocalStorage(userId);
    } catch (error) {
      console.error('Error getting favorites:', error);
      // Use localStorage as fallback if SQLite fails
      return this._getFavoritesFromLocalStorage(userId);
    }
  }

  /**
   * Check if a recipe is favorited by a user - with localStorage fallback for web
   */
  async isFavorite(recipeId: string, userId: string): Promise<boolean> {
    try {
      // If SQLite is available and initialized, use it
      if (this.isInitialized() && this.db) {
        const query = `SELECT COUNT(*) as count FROM favorites WHERE recipeId = ? AND userId = ?`;
        const result = await this.db.query(query, [recipeId, userId]);
        return result.values?.[0]?.count > 0;
      }
      // Otherwise, always use localStorage as fallback
      return this._isFavoriteInLocalStorage(recipeId, userId);
    } catch (error) {
      console.error('Error checking favorite status:', error);
      // Use localStorage as fallback if SQLite fails
      return this._isFavoriteInLocalStorage(recipeId, userId);
    }
  }

  /**
   * Toggle favorite status (add if not exists, remove if exists)
   */
  async toggleFavorite(recipeId: string, userId: string): Promise<boolean> {
    try {
      const isFav = await this.isFavorite(recipeId, userId);

      if (isFav) {
        await this.removeFavorite(recipeId, userId);
        return false;
      } else {
        await this.addFavorite(recipeId, userId);
        return true;
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      return false;
    }
  }

  /**
   * Close database connection
   */
  async closeConnection(): Promise<void> {
    try {
      if (this.db) {
        await this.db.close();
        this.db = null;
        this.isInitializedSignal.set(false);
        this.initializationAttempted = false;
        console.log('SQLite connection closed');
      }
    } catch (error) {
      console.error('Error closing SQLite connection:', error);
    }
  }

  // PRIVATE HELPER METHODS FOR LOCALSTORAGE FALLBACK

  /**
   * Save favorite to localStorage (web fallback)
   */
  private _saveFavoriteToLocalStorage(recipeId: string, userId: string): void {
    try {
      const key = this._getLocalStorageKey(userId);
      const favorites = this._getFavoritesFromLocalStorage(userId);

      if (!favorites.includes(recipeId)) {
        favorites.push(recipeId);
        localStorage.setItem(key, JSON.stringify(favorites));
      }
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  /**
   * Remove favorite from localStorage (web fallback)
   */
  private _removeFavoriteFromLocalStorage(recipeId: string, userId: string): void {
    try {
      const key = this._getLocalStorageKey(userId);
      const favorites = this._getFavoritesFromLocalStorage(userId);

      const updatedFavorites = favorites.filter((id) => id !== recipeId);
      localStorage.setItem(key, JSON.stringify(updatedFavorites));
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }

  /**
   * Get favorites from localStorage (web fallback)
   */
  private _getFavoritesFromLocalStorage(userId: string): string[] {
    try {
      const key = this._getLocalStorageKey(userId);
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [];
    }
  }

  /**
   * Check if recipe is favorite in localStorage (web fallback)
   */
  private _isFavoriteInLocalStorage(recipeId: string, userId: string): boolean {
    try {
      const favorites = this._getFavoritesFromLocalStorage(userId);
      return favorites.includes(recipeId);
    } catch (error) {
      console.error('Error checking favorite in localStorage:', error);
      return false;
    }
  }

  /**
   * Get localStorage key for favorites
   */
  private _getLocalStorageKey(userId: string): string {
    return `mealmates_favorites_${userId}`;
  }

  /**
   * Get detailed favorite information for a user
   */
  async getFavoriteDetails(userId: string): Promise<Favorite[]> {
    if (!this.db) {
      await this.initializeDB();
    }

    try {
      const query = `
        SELECT id, recipeId, userId, addedAt 
        FROM favorites 
        WHERE userId = ? 
        ORDER BY addedAt DESC
      `;

      const result = await this.db!.query(query, [userId]);

      return (
        result.values?.map((row) => ({
          id: row.id,
          recipeId: row.recipeId,
          userId: row.userId,
          addedAt: new Date(row.addedAt),
        })) || []
      );
    } catch (error) {
      console.error('Error getting favorite details:', error);
      return [];
    }
  }

  /**
   * Get count of favorites for a user
   */
  async getFavoriteCount(userId: string): Promise<number> {
    if (!this.db) {
      await this.initializeDB();
    }

    try {
      const query = `SELECT COUNT(*) as count FROM favorites WHERE userId = ?`;
      const result = await this.db!.query(query, [userId]);
      return result.values?.[0]?.count || 0;
    } catch (error) {
      console.error('Error getting favorite count:', error);
      return 0;
    }
  }

  /**
   * Clear all favorites for a user
   */
  async clearUserFavorites(userId: string): Promise<void> {
    if (!this.db) {
      await this.initializeDB();
    }

    try {
      const query = `DELETE FROM favorites WHERE userId = ?`;
      await this.db!.run(query, [userId]);
      console.log(`All favorites cleared for user ${userId}`);
    } catch (error) {
      console.error('Error clearing favorites:', error);
      throw error;
    }
  }

  /**
   * Get database stats
   */
  async getStats(): Promise<{ totalFavorites: number }> {
    if (!this.db) {
      await this.initializeDB();
    }

    try {
      const query = `SELECT COUNT(*) as count FROM favorites`;
      const result = await this.db!.query(query, []);
      return {
        totalFavorites: result.values?.[0]?.count || 0,
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return { totalFavorites: 0 };
    }
  }
}
