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

// Define Budget interface
export interface Budget {
  id: number;
  name: string;
  amount: number;
  category: string;
  startDate: string;
  endDate: string;
  family_id: number;
}

// Define Category interface
export interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
  family_id: number | null; // Nullable for global categories
}

// Define Transaction interface
export interface Transaction {
  id: number;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  transaction_date: string; // ISO8601 date string
  category_id: number | null;
  budget_id: number | null;
  user_id: number;
  family_id: number;
  created_at: string; // ISO8601 datetime string
  updated_at: string; // ISO8601 datetime string
}

// Define Debt interface
export interface Debt {
  id: number;
  description: string;
  amount: number;
  due_date: string | null; // ISO8601 date string, optional
  creditor: string | null; // Optional
  status: 'unpaid' | 'paid';
  family_id: number;
  user_id: number; // User responsible or who added it
  created_at: string; // ISO8601 datetime string
  updated_at: string; // ISO8601 datetime string
}

// Define Goal interface
export interface Goal {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null; // ISO8601 date string, optional
  status: 'active' | 'completed' | 'cancelled';
  family_id: number;
  user_id: number; // User who created or is primarily responsible
  created_at: string; // ISO8601 datetime string
  updated_at: string; // ISO8601 datetime string
}


// Open the database connection
export const getDBConnection = (): SQLiteDatabase => {
  return openDatabaseSync('dinhero.db');
};

// Initialize the database with a schema
export const initDatabase = async (db: SQLiteDatabase): Promise<void> => {
  await db.execAsync('PRAGMA foreign_keys = ON;'); // Ensure foreign key constraints are enforced
  await db.execAsync('PRAGMA journal_mode = WAL;');

  // Core tables
  await db.execAsync('CREATE TABLE IF NOT EXISTS families (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE);');
  await db.execAsync('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, phone TEXT UNIQUE, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, family_id INTEGER, FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE SET NULL);'); // Allow user to exist without family initially or if family is deleted

  // Items table (generic, if still needed)
  await db.execAsync('CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL);');

  // Budgets table
  await db.execAsync('CREATE TABLE IF NOT EXISTS budgets (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, amount REAL NOT NULL, category TEXT NOT NULL, startDate TEXT NOT NULL, endDate TEXT NOT NULL, family_id INTEGER NOT NULL, FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE);'); // Cascade delete budgets if family is deleted

  // Categories table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      family_id INTEGER,
      FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
      UNIQUE(name, family_id, type)
    );
  `);

  // Transactions table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      transaction_date TEXT NOT NULL, -- Consider DATETIME type
      category_id INTEGER,
      budget_id INTEGER,
      user_id INTEGER NOT NULL,
      family_id INTEGER NOT NULL, -- Should always have a family context
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
      FOREIGN KEY (budget_id) REFERENCES budgets(id) ON DELETE SET NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, -- Cascade delete transactions if user is deleted
      FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE -- Cascade delete transactions if family is deleted
    );
  `);

  // Trigger for updated_at on transactions
  await db.execAsync(`
    CREATE TRIGGER IF NOT EXISTS update_transactions_updated_at
    AFTER UPDATE ON transactions
    FOR EACH ROW
    BEGIN
        UPDATE transactions SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;
  `);

  // Debts table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS debts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      due_date TEXT,
      creditor TEXT,
      status TEXT NOT NULL CHECK(status IN ('unpaid', 'paid')) DEFAULT 'unpaid',
      family_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Trigger for updated_at on debts
  await db.execAsync(`
    CREATE TRIGGER IF NOT EXISTS update_debts_updated_at
    AFTER UPDATE ON debts
    FOR EACH ROW
    BEGIN
        UPDATE debts SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;
  `);

  // Goals table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      target_amount REAL NOT NULL,
      current_amount REAL NOT NULL DEFAULT 0,
      target_date TEXT,
      status TEXT NOT NULL CHECK(status IN ('active', 'completed', 'cancelled')) DEFAULT 'active',
      family_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Trigger for updated_at on goals
  await db.execAsync(`
    CREATE TRIGGER IF NOT EXISTS update_goals_updated_at
    AFTER UPDATE ON goals
    FOR EACH ROW
    BEGIN
        UPDATE goals SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;
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

// Get a user by ID
export const getUserById = async (db: SQLiteDatabase, id: number): Promise<User | null> => {
  const user = await db.getFirstAsync<User>('SELECT * FROM users WHERE id = ?;', id);
  return user;
};

// Get a family by ID
export const getFamilyById = async (db: SQLiteDatabase, id: number): Promise<Family | null> => {
  const family = await db.getFirstAsync<Family>('SELECT * FROM families WHERE id = ?;', id);
  return family;
};

// Update a family's name
export const updateFamilyName = async (db: SQLiteDatabase, familyId: number, newName: string): Promise<number> => {
  const result = await db.runAsync('UPDATE families SET name = ? WHERE id = ?;', newName, familyId);
  return result.changes;
};

// Update a user's family ID
export const updateUserFamilyId = async (db: SQLiteDatabase, userId: number, familyId: number | null): Promise<number> => {
  const result = await db.runAsync('UPDATE users SET family_id = ? WHERE id = ?;', familyId, userId);
  return result.changes;
};

// Get all users by family ID
export const getUsersByFamilyId = async (db: SQLiteDatabase, familyId: number): Promise<User[]> => {
  const users = await db.getAllAsync<User>('SELECT * FROM users WHERE family_id = ?;', familyId);
  return users;
};

// Add a budget and return its new ID
export const addBudget = async (db: SQLiteDatabase, name: string, amount: number, category: string, startDate: string, endDate: string, family_id: number): Promise<number> => {
  const result = await db.runAsync('INSERT INTO budgets (name, amount, category, startDate, endDate, family_id) VALUES (?, ?, ?, ?, ?, ?);', name, amount, category, startDate, endDate, family_id);
  return result.lastInsertRowId;
};

// Retrieve all budgets for a given family ID
export const getBudgetsByFamilyId = async (db: SQLiteDatabase, family_id: number): Promise<Budget[]> => {
  const budgets = await db.getAllAsync<Budget>('SELECT * FROM budgets WHERE family_id = ? ORDER BY id DESC;', family_id);
  return budgets;
};

// Update an existing budget and return the number of affected rows
export const updateBudget = async (db: SQLiteDatabase, id: number, name: string, amount: number, category: string, startDate: string, endDate: string): Promise<number> => {
  const result = await db.runAsync('UPDATE budgets SET name = ?, amount = ?, category = ?, startDate = ?, endDate = ? WHERE id = ?;', name, amount, category, startDate, endDate, id);
  return result.changes;
};

// Delete a budget and return the number of affected rows
export const deleteBudget = async (db: SQLiteDatabase, id: number): Promise<number> => {
  const result = await db.runAsync('DELETE FROM budgets WHERE id = ?;', id);
  return result.changes;
};

// Category CRUD Functions
export const addCategory = async (db: SQLiteDatabase, name: string, type: 'income' | 'expense', family_id?: number | null): Promise<number> => {
  const result = await db.runAsync(
    'INSERT INTO categories (name, type, family_id) VALUES (?, ?, ?);',
    name,
    type,
    family_id === undefined ? null : family_id // Ensure undefined becomes NULL
  );
  return result.lastInsertRowId;
};

export const getCategoriesByTypeAndFamily = async (db: SQLiteDatabase, type: 'income' | 'expense', family_id?: number | null): Promise<Category[]> => {
  let query = 'SELECT * FROM categories WHERE type = ?';
  const params: any[] = [type];
  if (family_id !== undefined) {
    query += ' AND (family_id = ? OR family_id IS NULL)'; // Include global categories
    params.push(family_id);
  } else {
    query += ' AND family_id IS NULL'; // Only global categories
  }
  query += ' ORDER BY name;';
  return await db.getAllAsync<Category>(query, ...params);
};

export const getAllCategoriesByFamily = async (db: SQLiteDatabase, family_id?: number | null): Promise<Category[]> => {
  let query = 'SELECT * FROM categories';
  const params: any[] = [];
  if (family_id !== undefined) {
    query += ' WHERE family_id = ? OR family_id IS NULL'; // Include global categories
    params.push(family_id);
  } else {
    query += ' WHERE family_id IS NULL'; // Only global categories
  }
  query += ' ORDER BY type, name;';
  return await db.getAllAsync<Category>(query, ...params);
};

export const updateCategory = async (db: SQLiteDatabase, id: number, name: string, type: 'income' | 'expense', family_id?: number | null): Promise<number> => {
  const result = await db.runAsync(
    'UPDATE categories SET name = ?, type = ?, family_id = ? WHERE id = ?;',
    name,
    type,
    family_id === undefined ? null : family_id,
    id
  );
  return result.changes;
};

export const deleteCategory = async (db: SQLiteDatabase, id: number): Promise<number> => {
  const result = await db.runAsync('DELETE FROM categories WHERE id = ?;', id);
  return result.changes;
};

// Transaction CRUD Functions
export type AddTransactionData = Omit<Transaction, 'id' | 'created_at' | 'updated_at'>;

export const addTransaction = async (db: SQLiteDatabase, data: AddTransactionData): Promise<number> => {
  const result = await db.runAsync(
    'INSERT INTO transactions (description, amount, type, transaction_date, category_id, budget_id, user_id, family_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?);',
    data.description,
    data.amount,
    data.type,
    data.transaction_date,
    data.category_id,
    data.budget_id,
    data.user_id,
    data.family_id
  );
  return result.lastInsertRowId;
};

export const getTransactionsByFamilyId = async (db: SQLiteDatabase, family_id: number, limit: number = 20, offset: number = 0): Promise<Transaction[]> => {
  const transactions = await db.getAllAsync<Transaction>(
    'SELECT * FROM transactions WHERE family_id = ? ORDER BY transaction_date DESC, id DESC LIMIT ? OFFSET ?;',
    family_id,
    limit,
    offset
  );
  return transactions;
};

export const getTransactionById = async (db: SQLiteDatabase, id: number): Promise<Transaction | null> => {
  const transaction = await db.getFirstAsync<Transaction>('SELECT * FROM transactions WHERE id = ?;', id);
  return transaction;
};

export type UpdateTransactionData = Partial<Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'family_id'>>;

export const updateTransaction = async (db: SQLiteDatabase, id: number, data: UpdateTransactionData): Promise<number> => {
  // Construct the SET part of the query dynamically
  const fields = Object.keys(data) as (keyof UpdateTransactionData)[];
  const values = fields.map(field => data[field]);

  if (fields.length === 0) {
    return 0; // No fields to update
  }

  const setClause = fields.map(field => `${field} = ?`).join(', ');
  const query = `UPDATE transactions SET ${setClause} WHERE id = ?;`;

  const result = await db.runAsync(query, ...values, id);
  return result.changes;
};

export const deleteTransaction = async (db: SQLiteDatabase, id: number): Promise<number> => {
  const result = await db.runAsync('DELETE FROM transactions WHERE id = ?;', id);
  return result.changes;
};

// Debt CRUD Functions
export type AddDebtData = Omit<Debt, 'id' | 'created_at' | 'updated_at' | 'status'> & { status?: 'unpaid' | 'paid' };

export const addDebt = async (db: SQLiteDatabase, data: AddDebtData): Promise<number> => {
  const result = await db.runAsync(
    'INSERT INTO debts (description, amount, due_date, creditor, status, family_id, user_id) VALUES (?, ?, ?, ?, ?, ?, ?);',
    data.description,
    data.amount,
    data.due_date,
    data.creditor,
    data.status || 'unpaid', // Default to 'unpaid' if not provided
    data.family_id,
    data.user_id
  );
  return result.lastInsertRowId;
};

export const getDebtsByFamilyId = async (db: SQLiteDatabase, family_id: number, status?: 'unpaid' | 'paid'): Promise<Debt[]> => {
  let query = 'SELECT * FROM debts WHERE family_id = ?';
  const params: any[] = [family_id];
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  query += ' ORDER BY due_date ASC, created_at DESC;';
  const debts = await db.getAllAsync<Debt>(query, ...params);
  return debts;
};

export const getDebtById = async (db: SQLiteDatabase, id: number): Promise<Debt | null> => {
  const debt = await db.getFirstAsync<Debt>('SELECT * FROM debts WHERE id = ?;', id);
  return debt;
};

export type UpdateDebtData = Partial<Omit<Debt, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'family_id'>>;

export const updateDebt = async (db: SQLiteDatabase, id: number, data: UpdateDebtData): Promise<number> => {
  const fields = Object.keys(data) as (keyof UpdateDebtData)[];
  const values = fields.map(field => data[field]);

  if (fields.length === 0) {
    return 0;
  }

  const setClause = fields.map(field => `${field} = ?`).join(', ');
  const query = `UPDATE debts SET ${setClause} WHERE id = ?;`;

  const result = await db.runAsync(query, ...values, id);
  return result.changes;
};

export const updateDebtStatus = async (db: SQLiteDatabase, id: number, status: 'unpaid' | 'paid'): Promise<number> => {
  const result = await db.runAsync('UPDATE debts SET status = ? WHERE id = ?;', status, id);
  return result.changes;
};

export const deleteDebt = async (db: SQLiteDatabase, id: number): Promise<number> => {
  const result = await db.runAsync('DELETE FROM debts WHERE id = ?;', id);
  return result.changes;
};

// Goal CRUD Functions
export type AddGoalData = Omit<Goal, 'id' | 'current_amount' | 'status' | 'created_at' | 'updated_at'> & { current_amount?: number; status?: 'active' | 'completed' | 'cancelled' };

export const addGoal = async (db: SQLiteDatabase, data: AddGoalData): Promise<number> => {
  const result = await db.runAsync(
    'INSERT INTO goals (name, target_amount, current_amount, target_date, status, family_id, user_id) VALUES (?, ?, ?, ?, ?, ?, ?);',
    data.name,
    data.target_amount,
    data.current_amount || 0,
    data.target_date,
    data.status || 'active',
    data.family_id,
    data.user_id
  );
  return result.lastInsertRowId;
};

export const getGoalsByFamilyId = async (db: SQLiteDatabase, family_id: number, status?: 'active' | 'completed' | 'cancelled'): Promise<Goal[]> => {
  let query = 'SELECT * FROM goals WHERE family_id = ?';
  const params: any[] = [family_id];
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  query += ' ORDER BY target_date ASC, created_at DESC;';
  const goals = await db.getAllAsync<Goal>(query, ...params);
  return goals;
};

export const getGoalById = async (db: SQLiteDatabase, id: number): Promise<Goal | null> => {
  const goal = await db.getFirstAsync<Goal>('SELECT * FROM goals WHERE id = ?;', id);
  return goal;
};

export type UpdateGoalData = Partial<Omit<Goal, 'id' | 'current_amount' | 'status' | 'created_at' | 'updated_at' | 'user_id' | 'family_id'>>;

export const updateGoal = async (db: SQLiteDatabase, id: number, data: UpdateGoalData): Promise<number> => {
  const fields = Object.keys(data) as (keyof UpdateGoalData)[];
  const values = fields.map(field => data[field]);

  if (fields.length === 0) {
    return 0;
  }

  const setClause = fields.map(field => `${field} = ?`).join(', ');
  const query = `UPDATE goals SET ${setClause} WHERE id = ?;`;

  const result = await db.runAsync(query, ...values, id);
  return result.changes;
};

export const updateGoalCurrentAmount = async (db: SQLiteDatabase, id: number, current_amount: number): Promise<number> => {
  // Optionally, fetch the goal to check against target_amount and update status if completed
  const goal = await getGoalById(db, id);
  if (goal && current_amount >= goal.target_amount) {
    await updateGoalStatus(db, id, 'completed');
  } else if (goal && current_amount < goal.target_amount && goal.status === 'completed') {
    // If amount is reduced below target and it was completed, set back to active
    await updateGoalStatus(db, id, 'active');
  }
  const result = await db.runAsync('UPDATE goals SET current_amount = ? WHERE id = ?;', current_amount, id);
  return result.changes;
};

export const contributeToGoal = async (db: SQLiteDatabase, id: number, contribution_amount: number): Promise<number> => {
  const goal = await getGoalById(db, id);
  if (!goal) {
    throw new Error('Goal not found');
  }
  if (goal.status !== 'active') {
    throw new Error('Can only contribute to active goals.');
  }

  let newCurrentAmount = goal.current_amount + contribution_amount;
  let newStatus = goal.status;

  if (newCurrentAmount >= goal.target_amount) {
    newCurrentAmount = goal.target_amount; // Cap at target amount
    newStatus = 'completed';
  }

  const result = await db.runAsync(
    'UPDATE goals SET current_amount = ?, status = ? WHERE id = ?;',
    newCurrentAmount,
    newStatus,
    id
  );
  return result.changes;
};

export const updateGoalStatus = async (db: SQLiteDatabase, id: number, status: 'active' | 'completed' | 'cancelled'): Promise<number> => {
  // If marking as completed, ensure current_amount is at least target_amount
  if (status === 'completed') {
    const goal = await getGoalById(db, id);
    if (goal && goal.current_amount < goal.target_amount) {
        // Optionally, auto-set current_amount to target_amount, or throw error
        // For now, let's update current_amount to target_amount
        await db.runAsync('UPDATE goals SET current_amount = ?, status = ? WHERE id = ?;', goal.target_amount, status, id);
        return 1; // Assuming one row affected
    }
  }
  const result = await db.runAsync('UPDATE goals SET status = ? WHERE id = ?;', status, id);
  return result.changes;
};

export const deleteGoal = async (db: SQLiteDatabase, id: number): Promise<number> => {
  const result = await db.runAsync('DELETE FROM goals WHERE id = ?;', id);
  return result.changes;
};