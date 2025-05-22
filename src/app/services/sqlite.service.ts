import { Injectable, signal } from '@angular/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Favorite } from '../../models/favorite.model';

@Injectable({ providedIn: 'root' })
export class SqliteService {
  private sqlite: SQLiteConnection = new SQLiteConnection(CapacitorSQLite);
  private db: SQLiteDBConnection | null = null;
  private readonly DB_NAME = 'mealmates.db';
  private readonly DB_VERSION = 1;

  private isInitializedSignal = signal(false);
  readonly isInitialized = this.isInitializedSignal.asReadonly();

  /**
   * Initialize SQLite database
   */
  async initializeDB(): Promise<void> {
    try {
      // Check if already initialized
      if (this.db && this.isInitialized()) {
        return;
      }

      // Create connection
      this.db = await this.sqlite.createConnection(this.DB_NAME, false, 'no-encryption', this.DB_VERSION, false);

      // Open database
      await this.db.open();

      // Create tables
      await this.createTables();

      this.isInitializedSignal.set(true);
      console.log('SQLite database initialized successfully');
    } catch (error) {
      console.error('Error initializing SQLite:', error);
      this.isInitializedSignal.set(false);
      throw error;
    }
  }

  /**
   * Create database tables
   */
  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

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
   * Add a recipe to favorites
   */
  async addFavorite(recipeId: string, userId: string): Promise<void> {
    if (!this.db) {
      await this.initializeDB();
    }

    try {
      const query = `
        INSERT OR REPLACE INTO favorites (recipeId, userId, addedAt) 
        VALUES (?, ?, ?)
      `;

      await this.db!.run(query, [recipeId, userId, new Date().toISOString()]);
      console.log(`Recipe ${recipeId} added to favorites for user ${userId}`);
    } catch (error) {
      console.error('Error adding favorite:', error);
      throw error;
    }
  }

  /**
   * Remove a recipe from favorites
   */
  async removeFavorite(recipeId: string, userId: string): Promise<void> {
    if (!this.db) {
      await this.initializeDB();
    }

    try {
      const query = `DELETE FROM favorites WHERE recipeId = ? AND userId = ?`;
      await this.db!.run(query, [recipeId, userId]);
      console.log(`Recipe ${recipeId} removed from favorites for user ${userId}`);
    } catch (error) {
      console.error('Error removing favorite:', error);
      throw error;
    }
  }

  /**
   * Get all favorite recipe IDs for a user
   */
  async getFavorites(userId: string): Promise<string[]> {
    if (!this.db) {
      await this.initializeDB();
    }

    try {
      const query = `SELECT recipeId FROM favorites WHERE userId = ? ORDER BY addedAt DESC`;
      const result = await this.db!.query(query, [userId]);
      return result.values?.map((row) => row.recipeId) || [];
    } catch (error) {
      console.error('Error getting favorites:', error);
      return [];
    }
  }

  /**
   * Check if a recipe is favorited by a user
   */
  async isFavorite(recipeId: string, userId: string): Promise<boolean> {
    if (!this.db) {
      await this.initializeDB();
    }

    try {
      const query = `SELECT COUNT(*) as count FROM favorites WHERE recipeId = ? AND userId = ?`;
      const result = await this.db!.query(query, [recipeId, userId]);
      return result.values?.[0]?.count > 0;
    } catch (error) {
      console.error('Error checking favorite status:', error);
      return false;
    }
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
      throw error;
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
        console.log('SQLite connection closed');
      }
    } catch (error) {
      console.error('Error closing SQLite connection:', error);
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
