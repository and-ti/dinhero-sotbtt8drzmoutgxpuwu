import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

// Define a type for your item for better type safety
export interface Item {
  id: number;
  name: string;
}

// Open the database connection
export const getDBConnection = (): SQLiteDatabase => {
  return openDatabaseSync('dinhero.db');
};

// Initialize the database with a schema
export const initDatabase = async (db: SQLiteDatabase): Promise<void> => {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL);
  `);
};

// Add an item and return its new ID
export const addItem = async (db: SQLiteDatabase, name: string): Promise<number> => {
  const result = await db.runAsync('INSERT INTO items (name) VALUES (?);', name);
  return result.lastInsertRowId;
};

// Retrieve all items
export const getAllItems = async (db: SQLiteDatabase): Promise<Item[]> => {
  const items = await db.getAllAsync<Item>('SELECT * FROM items ORDER BY id DESC;');
  return items;
};

// Update an existing item and return the number of affected rows
export const updateItem = async (db: SQLiteDatabase, id: number, name: string): Promise<number> => {
  const result = await db.runAsync('UPDATE items SET name = ? WHERE id = ?;', name, id);
  return result.changes;
};

// Delete an item and return the number of affected rows
export const deleteItem = async (db: SQLiteDatabase, id: number): Promise<number> => {
  const result = await db.runAsync('DELETE FROM items WHERE id = ?;', id);
  return result.changes;
};