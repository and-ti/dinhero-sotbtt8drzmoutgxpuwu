import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

// Define a type for your item for better type safety
export interface Item {
  id: number;
  name: string;
}

// Define User interface
export interface User {
  id: number;
  name: string;
  phone: string | null;
  email: string;
  password_hash: string;
  family_id: number | null;
}

// Define Family interface
export interface Family {
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
    CREATE TABLE IF NOT EXISTS families (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE);
    CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, phone TEXT UNIQUE, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, family_id INTEGER, FOREIGN KEY (family_id) REFERENCES families(id));
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

// Add a user and return its new ID
export const addUser = async (db: SQLiteDatabase, name: string, phone: string | null, email: string, passwordHash: string, familyId: number | null): Promise<number> => {
  const result = await db.runAsync('INSERT INTO users (name, phone, email, password_hash, family_id) VALUES (?, ?, ?, ?, ?);', name, phone, email, passwordHash, familyId);
  return result.lastInsertRowId;
};

// Find a user by email
export const findUserByEmail = async (db: SQLiteDatabase, email: string): Promise<User | null> => {
  const user = await db.getFirstAsync<User>('SELECT * FROM users WHERE email = ?;', email);
  return user;
};

// Find a user by phone
export const findUserByPhone = async (db: SQLiteDatabase, phone: string): Promise<User | null> => {
  const user = await db.getFirstAsync<User>('SELECT * FROM users WHERE phone = ?;', phone);
  return user;
};

// Add a family and return its new ID
export const addFamily = async (db: SQLiteDatabase, name: string): Promise<number> => {
  const result = await db.runAsync('INSERT INTO families (name) VALUES (?);', name);
  return result.lastInsertRowId;
};

// Find a family by name
export const findFamilyByName = async (db: SQLiteDatabase, name: string): Promise<Family | null> => {
  const family = await db.getFirstAsync<Family>('SELECT * FROM families WHERE name = ?;', name);
  return family;
};