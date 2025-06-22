import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb() {
  if (!db) {
    db = await SQLite.openDatabaseAsync('dinhero.db');
  }
  return db;
}

export async function initDatabase() {
  const db = await getDb();
  // Ativar foreign keys e modo WAL
  await db.execAsync('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
  // Criar tabelas
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome_completo TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      telefone TEXT,
      senha TEXT NOT NULL,
      data_criacao TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS familias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      nome TEXT NOT NULL,
      data_criacao TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );
    CREATE TABLE IF NOT EXISTS membros (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      familia_id INTEGER NOT NULL,
      nome TEXT NOT NULL,
      email TEXT,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
      FOREIGN KEY (familia_id) REFERENCES familias(id)
    );
    CREATE TABLE IF NOT EXISTS categorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      nome TEXT NOT NULL,
      tipo TEXT NOT NULL,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );
    CREATE TABLE IF NOT EXISTS despesas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      membro_id INTEGER,
      categoria_id INTEGER,
      valor REAL NOT NULL,
      descricao TEXT,
      observacoes TEXT,
      data TEXT NOT NULL,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
      FOREIGN KEY (membro_id) REFERENCES membros(id),
      FOREIGN KEY (categoria_id) REFERENCES categorias(id)
    );
    CREATE TABLE IF NOT EXISTS receitas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      membro_id INTEGER,
      categoria_id INTEGER,
      valor REAL NOT NULL,
      descricao TEXT,
      observacoes TEXT,
      data TEXT NOT NULL,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
      FOREIGN KEY (membro_id) REFERENCES membros(id),
      FOREIGN KEY (categoria_id) REFERENCES categorias(id)
    );
    CREATE TABLE IF NOT EXISTS dividas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      membro_id INTEGER,
      descricao TEXT,
      valor_total REAL NOT NULL,
      status TEXT NOT NULL,
      data TEXT NOT NULL,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
      FOREIGN KEY (membro_id) REFERENCES membros(id)
    );
    CREATE TABLE IF NOT EXISTS pagamentos_divida (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      divida_id INTEGER,
      valor_pago REAL NOT NULL,
      data TEXT NOT NULL,
      FOREIGN KEY (divida_id) REFERENCES dividas(id)
    );
    CREATE TABLE IF NOT EXISTS metas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      membro_id INTEGER,
      categoria_id INTEGER,
      tipo TEXT NOT NULL,
      valor REAL NOT NULL,
      periodo TEXT,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
      FOREIGN KEY (membro_id) REFERENCES membros(id),
      FOREIGN KEY (categoria_id) REFERENCES categorias(id)
    );
    CREATE TABLE IF NOT EXISTS orcamentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      membro_id INTEGER,
      categoria_id INTEGER,
      valor REAL NOT NULL,
      periodo TEXT NOT NULL,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
      FOREIGN KEY (membro_id) REFERENCES membros(id),
      FOREIGN KEY (categoria_id) REFERENCES categorias(id)
    );
  `);

  // Adicionar coluna observacoes se não existir (para compatibilidade com versões antigas)
  try {
    await db.execAsync('ALTER TABLE despesas ADD COLUMN observacoes TEXT;');
  } catch (error) {
    // Coluna já existe, ignorar erro
  }
  
  try {
    await db.execAsync('ALTER TABLE receitas ADD COLUMN observacoes TEXT;');
  } catch (error) {
    // Coluna já existe, ignorar erro
  }
} 