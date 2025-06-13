import { addBudget, getBudgetsByFamilyId, updateBudget, deleteBudget } from './index'; // Adjust path as necessary
import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => ({
    execAsync: jest.fn(() => Promise.resolve()),
    runAsync: jest.fn((sql, params) => {
      if (sql.startsWith('INSERT INTO budgets')) {
        return Promise.resolve({ lastInsertRowId: 1, changes: 1 });
      }
      if (sql.startsWith('UPDATE budgets')) {
        return Promise.resolve({ changes: 1 });
      }
      if (sql.startsWith('DELETE FROM budgets')) {
        return Promise.resolve({ changes: 1 });
      }
      return Promise.resolve({ changes: 0 });
    }),
    getAllAsync: jest.fn(() => Promise.resolve([
      { id: 1, name: 'Test Budget', amount: 100, category: 'Food', startDate: '2024-01-01', endDate: '2024-01-31', family_id: 1 },
      { id: 2, name: 'Another Budget', amount: 200, category: 'Transport', startDate: '2024-02-01', endDate: '2024-02-28', family_id: 1 },
    ])),
    getFirstAsync: jest.fn(), // Add if specific single item fetches are tested, not directly used by these CRUDs though
  })),
}));

describe('Budget CRUD Operations', () => {
  let db: SQLiteDatabase;

  beforeEach(() => {
    // Reset mocks before each test if necessary, though openDatabaseSync is called once per db instance effectively
    // For simplicity, we assume getDBConnection will use the mocked openDatabaseSync
    db = openDatabaseSync('test.db'); // The name doesn't matter due to mocking
    // Clear mock function calls if needed, e.g., (db.runAsync as jest.Mock).mockClear();
  });

  test('addBudget should insert a new budget and return its ID', async () => {
    const name = 'Groceries';
    const amount = 150.75;
    const category = 'Food';
    const startDate = '2024-07-01';
    const endDate = '2024-07-31';
    const family_id = 1;

    const newBudgetId = await addBudget(db, name, amount, category, startDate, endDate, family_id);
    expect(newBudgetId).toBe(1); // Mocked to return 1
    expect(db.runAsync).toHaveBeenCalledWith(
      'INSERT INTO budgets (name, amount, category, startDate, endDate, family_id) VALUES (?, ?, ?, ?, ?, ?);',
      name, amount, category, startDate, endDate, family_id
    );
  });

  test('getBudgetsByFamilyId should retrieve all budgets for a given family ID', async () => {
    const family_id = 1;
    const budgets = await getBudgetsByFamilyId(db, family_id);
    expect(budgets).toHaveLength(2); // Mocked to return 2 budgets
    expect(budgets[0].name).toBe('Test Budget');
    expect(db.getAllAsync).toHaveBeenCalledWith(
      'SELECT * FROM budgets WHERE family_id = ? ORDER BY id DESC;',
      family_id
    );
  });

  test('updateBudget should update an existing budget and return the number of affected rows', async () => {
    const id = 1;
    const name = 'Updated Groceries';
    const amount = 170.00;
    const category = 'Food Updated';
    const startDate = '2024-07-01';
    const endDate = '2024-07-31';

    const affectedRows = await updateBudget(db, id, name, amount, category, startDate, endDate);
    expect(affectedRows).toBe(1); // Mocked to return 1
    expect(db.runAsync).toHaveBeenCalledWith(
      'UPDATE budgets SET name = ?, amount = ?, category = ?, startDate = ?, endDate = ? WHERE id = ?;',
      name, amount, category, startDate, endDate, id
    );
  });

  test('deleteBudget should delete a budget and return the number of affected rows', async () => {
    const id = 1;
    const affectedRows = await deleteBudget(db, id);
    expect(affectedRows).toBe(1); // Mocked to return 1
    expect(db.runAsync).toHaveBeenCalledWith(
      'DELETE FROM budgets WHERE id = ?;',
      id
    );
  });
});
