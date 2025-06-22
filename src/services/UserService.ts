import { getDb } from '../database';

export interface Usuario {
  id: number;
  nome_completo: string;
  email: string;
  telefone: string;
  foto_perfil?: string;
}

export interface Familia {
  id: number;
  nome: string;
}

export class UserService {
  // Função para extrair o sobrenome do nome completo
  private static extrairSobrenome(nomeCompleto: string): string {
    const partes = nomeCompleto.trim().split(' ');
    if (partes.length > 1) {
      return partes[partes.length - 1];
    }
    return nomeCompleto;
  }

  // Verificar se email já existe
  static async verificarEmailExistente(email: string, excludeId?: number): Promise<boolean> {
    try {
      const db = await getDb();
      let query = 'SELECT id FROM usuarios WHERE email = ?';
      let params: (string | number)[] = [email];

      if (excludeId) {
        query += ' AND id != ?';
        params.push(excludeId);
      }

      const result = await db.getFirstAsync<{ id: number }>(query, params);
      return !!result;
    } catch (error) {
      console.error('Erro ao verificar email:', error);
      throw error;
    }
  }

  // Buscar usuário por email e senha
  static async buscarPorEmailSenha(email: string, senha: string): Promise<Usuario | null> {
    try {
      const db = await getDb();
      const result = await db.getFirstAsync<Usuario>(
        'SELECT id, nome_completo, email, telefone, foto_perfil FROM usuarios WHERE email = ? AND senha = ?',
        [email, senha]
      );
      return result || null;
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      throw error;
    }
  }

  // Criar novo usuário
  static async criarUsuario(nome_completo: string, email: string, telefone: string, senha: string): Promise<Usuario | null> {
    try {
      const db = await getDb();
      
      // Verificar se email já existe
      const emailExiste = await this.verificarEmailExistente(email);
      if (emailExiste) {
        return null;
      }

      // Inserir novo usuário
      const result = await db.runAsync(
        'INSERT INTO usuarios (nome_completo, email, telefone, senha) VALUES (?, ?, ?, ?)',
        [nome_completo, email, telefone, senha]
      );

      if (result.lastInsertRowId) {
        const novoUsuario = await db.getFirstAsync<Usuario>(
          'SELECT id, nome_completo, email, telefone, foto_perfil FROM usuarios WHERE id = ?',
          [result.lastInsertRowId]
        );
        return novoUsuario || null;
      }
      return null;
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw error;
    }
  }

  // Atualizar dados do usuário
  static async atualizarUsuario(
    id: number, 
    dados: { nome_completo: string; email: string; telefone: string; senha?: string }
  ): Promise<boolean> {
    try {
      const db = await getDb();
      
      // Verificar se email já existe para outro usuário
      const emailExiste = await this.verificarEmailExistente(dados.email, id);
      if (emailExiste) {
        return false;
      }

      // Atualizar dados
      if (dados.senha) {
        await db.runAsync(
          'UPDATE usuarios SET nome_completo = ?, email = ?, telefone = ?, senha = ? WHERE id = ?',
          [dados.nome_completo, dados.email, dados.telefone, dados.senha, id]
        );
      } else {
        await db.runAsync(
          'UPDATE usuarios SET nome_completo = ?, email = ?, telefone = ? WHERE id = ?',
          [dados.nome_completo, dados.email, dados.telefone, id]
        );
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw error;
    }
  }

  // Buscar família por usuário
  static async buscarFamiliaPorUsuario(usuarioId: number): Promise<Familia | null> {
    try {
      const db = await getDb();
      const result = await db.getFirstAsync<Familia>(
        'SELECT id, nome FROM familias WHERE usuario_id = ?',
        [usuarioId]
      );
      return result || null;
    } catch (error) {
      console.error('Erro ao buscar família:', error);
      throw error;
    }
  }

  // Criar família para usuário
  static async criarFamilia(usuarioId: number, nomeCompleto: string): Promise<Familia | null> {
    try {
      const db = await getDb();
      const sobrenome = this.extrairSobrenome(nomeCompleto);
      const nomeFamilia = `${sobrenome} Family`;

      const result = await db.runAsync(
        'INSERT INTO familias (usuario_id, nome) VALUES (?, ?)',
        [usuarioId, nomeFamilia]
      );

      if (result.lastInsertRowId) {
        const novaFamilia = await db.getFirstAsync<Familia>(
          'SELECT id, nome FROM familias WHERE id = ?',
          [result.lastInsertRowId]
        );
        return novaFamilia || null;
      }
      return null;
    } catch (error) {
      console.error('Erro ao criar família:', error);
      throw error;
    }
  }

  // Atualizar nome da família
  static async atualizarNomeFamilia(familiaId: number, novoNome: string): Promise<boolean> {
    try {
      const db = await getDb();
      await db.runAsync(
        'UPDATE familias SET nome = ? WHERE id = ?',
        [novoNome, familiaId]
      );
      return true;
    } catch (error) {
      console.error('Erro ao atualizar nome da família:', error);
      throw error;
    }
  }

  // Atualizar foto de perfil
  static async atualizarFotoPerfil(usuarioId: number, fotoPerfil: string): Promise<boolean> {
    try {
      const db = await getDb();
      await db.runAsync(
        'UPDATE usuarios SET foto_perfil = ? WHERE id = ?',
        [fotoPerfil, usuarioId]
      );
      return true;
    } catch (error) {
      console.error('Erro ao atualizar foto de perfil:', error);
      throw error;
    }
  }

  // Buscar usuário por ID
  static async buscarPorId(id: number): Promise<Usuario | null> {
    try {
      const db = await getDb();
      const result = await db.getFirstAsync<Usuario>(
        'SELECT id, nome_completo, email, telefone, foto_perfil FROM usuarios WHERE id = ?',
        [id]
      );
      return result || null;
    } catch (error) {
      console.error('Erro ao buscar usuário por ID:', error);
      throw error;
    }
  }
} 