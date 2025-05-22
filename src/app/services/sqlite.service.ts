import { Injectable } from '@angular/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Favorite } from '../../models/favorite.model';

@Injectable({ providedIn: 'root' })
export class SqliteService {
  private sqlite: SQLiteConnection = new SQLiteConnection(CapacitorSQLite);
  private db: SQLiteDBConnection | null = null;
  private readonly DB_NAME = 'mealmates.db';

  async initializeDB(): Promise<void> {
    try {
      this.db = await this.sqlite.createConnection(this.DB_NAME, false, 'no-encryption', 1, false);

      await this.db.open();
      await this.createTables();
    } catch (error) {
      console.error('Error initializing SQLite:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    const createFavoritesTable = `
      CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipeId TEXT NOT NULL,
        userId TEXT NOT NULL,
        addedAt TEXT NOT NULL,
        UNIQUE(recipeId, userId)
      );
    `;

    await this.db!.execute(createFavoritesTable);
  }

  async addFavorite(recipeId: string, userId: string): Promise<void> {
    const query = `
      INSERT OR REPLACE INTO favorites (recipeId, userId, addedAt) 
      VALUES (?, ?, ?)
    `;
    await this.db!.run(query, [recipeId, userId, new Date().toISOString()]);
  }

  async removeFavorite(recipeId: string, userId: string): Promise<void> {
    const query = `DELETE FROM favorites WHERE recipeId = ? AND userId = ?`;
    await this.db!.run(query, [recipeId, userId]);
  }

  async getFavorites(userId: string): Promise<string[]> {
    const query = `SELECT recipeId FROM favorites WHERE userId = ?`;
    const result = await this.db!.query(query, [userId]);
    return result.values?.map((row) => row.recipeId) || [];
  }

  async isFavorite(recipeId: string, userId: string): Promise<boolean> {
    const query = `SELECT COUNT(*) as count FROM favorites WHERE recipeId = ? AND userId = ?`;
    const result = await this.db!.query(query, [recipeId, userId]);
    return result.values?.[0]?.count > 0;
  }
}
