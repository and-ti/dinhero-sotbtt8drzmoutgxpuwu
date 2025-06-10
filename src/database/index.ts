import * as SQLite from 'expo-sqlite';

export const getDBConnection = () => {
  return SQLite.openDatabase('mydatabase.db');
};

export const initDatabase = (db: SQLite.SQLiteDatabase) => {
  return new Promise<void>((resolve, reject) => {
    db.transaction(
      tx => {
        tx.executeSql(
          'CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT);'
        );
      },
      error => reject(error),
      () => resolve()
    );
  });
};

export const addItem = (db: SQLite.SQLiteDatabase, name: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    db.transaction(
      tx => {
        tx.executeSql(
          'INSERT INTO items (name) values (?);',
          [name],
          (_, result) => resolve(result.insertId!),
          (_, error) => {
            reject(error);
            return false; // Rollback
          }
        );
      },
      error => reject(error) // Transaction error
    );
  });
};

export const getAllItems = (db: SQLite.SQLiteDatabase): Promise<{ id: number; name: string }[]> => {
  return new Promise((resolve, reject) => {
    db.transaction(
      tx => {
        tx.executeSql(
          'SELECT * FROM items;',
          [],
          (_, result) => resolve(result.rows._array),
          (_, error) => {
            reject(error);
            return false; // Rollback
          }
        );
      },
      error => reject(error) // Transaction error
    );
  });
};

export const updateItem = (db: SQLite.SQLiteDatabase, id: number, name: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    db.transaction(
      tx => {
        tx.executeSql(
          'UPDATE items SET name = ? WHERE id = ?;',
          [name, id],
          (_, result) => resolve(result.rowsAffected),
          (_, error) => {
            reject(error);
            return false; // Rollback
          }
        );
      },
      error => reject(error) // Transaction error
    );
  });
};

export const deleteItem = (db: SQLite.SQLiteDatabase, id: number): Promise<number> => {
  return new Promise((resolve, reject) => {
    db.transaction(
      tx => {
        tx.executeSql(
          'DELETE FROM items WHERE id = ?;',
          [id],
          (_, result) => resolve(result.rowsAffected),
          (_, error) => {
            reject(error);
            return false; // Rollback
          }
        );
      },
      error => reject(error) // Transaction error
    );
  });
};
