import { getDb } from '../database';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Transacao {
  id: number;
  tipo: 'despesa' | 'receita';
  descricao: string;
  valor: number;
  categoria: string;
  categoria_id: number;
  data: string;
  observacoes?: string;
}

export interface Categoria {
  id: number;
  nome: string;
  tipo: 'despesa' | 'receita';
}

export interface NovaTransacao {
  tipo: 'despesa' | 'receita';
  descricao: string;
  valor: number;
  categoria_id: number;
  data: string;
  observacoes?: string;
}

export interface NovaCategoria {
    nome: string;
    tipo: 'despesa' | 'receita';
}

export class TransactionService {
  // Buscar todas as transações de um usuário
  static async buscarTodas(usuarioId: number): Promise<Transacao[]> {
    try {
      const db = await getDb();
      
      const query = `
        SELECT 
          d.id,
          'despesa' as tipo,
          d.descricao,
          d.valor,
          c.nome as categoria,
          d.categoria_id,
          d.data,
          d.observacoes
        FROM despesas d
        LEFT JOIN categorias c ON d.categoria_id = c.id
        WHERE d.usuario_id = ?
        UNION ALL
        SELECT 
          r.id,
          'receita' as tipo,
          r.descricao,
          r.valor,
          c.nome as categoria,
          r.categoria_id,
          r.data,
          r.observacoes
        FROM receitas r
        LEFT JOIN categorias c ON r.categoria_id = c.id
        WHERE r.usuario_id = ?
        ORDER BY data DESC
      `;

      const result = await db.getAllAsync<Transacao>(query, [usuarioId, usuarioId]);
      return result || [];
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
      throw error;
    }
  }

  // Buscar categorias de um usuário
  static async buscarCategorias(usuarioId: number): Promise<Categoria[]> {
    try {
      // ---- DADOS MOCKADOS COM ASYNCSTORAGE ----
      const storageKey = `@categorias_usuario_${usuarioId}`;
      console.log(`Buscando categorias para o usuário ${usuarioId}...`);
      
      const localCategories = await AsyncStorage.getItem(storageKey);
      
      if (!localCategories) {
          const defaultCategories: Categoria[] = [
              { id: 1, nome: 'Moradia', tipo: 'despesa' },
              { id: 2, nome: 'Alimentação', tipo: 'despesa' },
              { id: 3, nome: 'Transporte', tipo: 'despesa' },
              { id: 4, nome: 'Lazer', tipo: 'despesa' },
              { id: 5, nome: 'Saúde', tipo: 'despesa' },
              { id: 6, nome: 'Salário', tipo: 'receita' },
              { id: 7, nome: 'Vendas', tipo: 'receita' },
              { id: 8, nome: 'Investimentos', tipo: 'receita' },
          ];
          await AsyncStorage.setItem(storageKey, JSON.stringify(defaultCategories));
          return defaultCategories;
      }
      return JSON.parse(localCategories);
      // ---- FIM DOS DADOS MOCKADOS ----

    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      return [];
    }
  }

  // Criar nova transação
  static async criarTransacao(usuarioId: number, transacao: NovaTransacao): Promise<boolean> {
    try {
      const db = await getDb();
      
      if (transacao.tipo === 'despesa') {
        await db.runAsync(
          'INSERT INTO despesas (usuario_id, descricao, valor, categoria_id, data, observacoes) VALUES (?, ?, ?, ?, ?, ?)',
          [usuarioId, transacao.descricao, transacao.valor, transacao.categoria_id, transacao.data, transacao.observacoes || null]
        );
      } else {
        await db.runAsync(
          'INSERT INTO receitas (usuario_id, descricao, valor, categoria_id, data, observacoes) VALUES (?, ?, ?, ?, ?, ?)',
          [usuarioId, transacao.descricao, transacao.valor, transacao.categoria_id, transacao.data, transacao.observacoes || null]
        );
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      throw error;
    }
  }

  // Atualizar transação
  static async atualizarTransacao(
    usuarioId: number,
    id: number, 
    tipo: 'despesa' | 'receita', 
    transacao: NovaTransacao
  ): Promise<boolean> {
    try {
      const db = await getDb();
      
      if (tipo === 'despesa') {
        await db.runAsync(
          'UPDATE despesas SET descricao = ?, valor = ?, categoria_id = ?, data = ?, observacoes = ? WHERE id = ? AND usuario_id = ?',
          [transacao.descricao, transacao.valor, transacao.categoria_id, transacao.data, transacao.observacoes || null, id, usuarioId]
        );
      } else {
        await db.runAsync(
          'UPDATE receitas SET descricao = ?, valor = ?, categoria_id = ?, data = ?, observacoes = ? WHERE id = ? AND usuario_id = ?',
          [transacao.descricao, transacao.valor, transacao.categoria_id, transacao.data, transacao.observacoes || null, id, usuarioId]
        );
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
      throw error;
    }
  }

  // Excluir transação
  static async excluirTransacao(usuarioId: number, id: number, tipo: 'despesa' | 'receita'): Promise<boolean> {
    try {
      const db = await getDb();
      
      if (tipo === 'despesa') {
        await db.runAsync('DELETE FROM despesas WHERE id = ? AND usuario_id = ?', [id, usuarioId]);
      } else {
        await db.runAsync('DELETE FROM receitas WHERE id = ? AND usuario_id = ?', [id, usuarioId]);
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      throw error;
    }
  }

  // Buscar transação por ID
  static async buscarPorId(usuarioId: number, id: number, tipo: 'despesa' | 'receita'): Promise<Transacao | null> {
    try {
      const db = await getDb();
      
      if (tipo === 'despesa') {
        const result = await db.getFirstAsync<Transacao>(
          `SELECT 
            d.id,
            'despesa' as tipo,
            d.descricao,
            d.valor,
            c.nome as categoria,
            d.categoria_id,
            d.data,
            d.observacoes
          FROM despesas d
          LEFT JOIN categorias c ON d.categoria_id = c.id
          WHERE d.id = ? AND d.usuario_id = ?`,
          [id, usuarioId]
        );
        return result || null;
      } else {
        const result = await db.getFirstAsync<Transacao>(
          `SELECT 
            r.id,
            'receita' as tipo,
            r.descricao,
            r.valor,
            c.nome as categoria,
            r.categoria_id,
            r.data,
            r.observacoes
          FROM receitas r
          LEFT JOIN categorias c ON r.categoria_id = c.id
          WHERE r.id = ? AND r.usuario_id = ?`,
          [id, usuarioId]
        );
        return result || null;
      }
    } catch (error) {
      console.error('Erro ao buscar transação:', error);
      throw error;
    }
  }

  // Calcular resumo financeiro de um usuário
  static async calcularResumo(usuarioId: number): Promise<{
    totalReceitas: number;
    totalDespesas: number;
    saldo: number;
  }> {
    try {
      const db = await getDb();
      
      const [receitasResult, despesasResult] = await Promise.all([
        db.getFirstAsync<{ total: number }>('SELECT SUM(valor) as total FROM receitas WHERE usuario_id = ?', [usuarioId]),
        db.getFirstAsync<{ total: number }>('SELECT SUM(valor) as total FROM despesas WHERE usuario_id = ?', [usuarioId]),
      ]);

      const totalReceitas = receitasResult?.total || 0;
      const totalDespesas = despesasResult?.total || 0;
      const saldo = totalReceitas - totalDespesas;

      return {
        totalReceitas,
        totalDespesas,
        saldo,
      };
    } catch (error) {
      console.error('Erro ao calcular resumo:', error);
      throw error;
    }
  }

  static async criarCategoria(usuarioId: number, novaCategoria: NovaCategoria): Promise<Categoria> {
      try {
        // ---- DADOS MOCKADOS COM ASYNCSTORAGE ----
        const storageKey = `@categorias_usuario_${usuarioId}`;
        console.log(`Criando categoria para o usuário ${usuarioId}:`, novaCategoria);
        
        const localCategoriesStr = await AsyncStorage.getItem(storageKey);
        const localCategories: Categoria[] = localCategoriesStr ? JSON.parse(localCategoriesStr) : [];
        
        const categoriaCriada: Categoria = {
            id: new Date().getTime(), // ID único baseado no timestamp
            ...novaCategoria
        };

        const novasCategorias = [...localCategories, categoriaCriada];
        await AsyncStorage.setItem(storageKey, JSON.stringify(novasCategorias));
        
        return categoriaCriada;
        // ---- FIM DOS DADOS MOCKADOS ----
      } catch (error) {
          console.error('Erro ao criar categoria:', error);
          throw error;
      }
  }
} 