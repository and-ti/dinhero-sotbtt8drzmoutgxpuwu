import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserService, Usuario, Familia } from '../services/UserService';

interface AuthContextData {
  usuario: Usuario | null;
  familia: Familia | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<boolean>;
  cadastrar: (nome_completo: string, email: string, telefone: string, senha: string) => Promise<boolean>;
  atualizarNomeFamilia: (novoNome: string) => Promise<boolean>;
  atualizarUsuario: (dados: { nome_completo: string; email: string; telefone: string; senha?: string }) => Promise<boolean>;
  atualizarFotoPerfil: (fotoPerfil: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

// Função para extrair o sobrenome do nome completo
const extrairSobrenome = (nomeCompleto: string): string => {
  const partes = nomeCompleto.trim().split(' ');
  if (partes.length > 1) {
    return partes[partes.length - 1]; // Última parte do nome
  }
  return nomeCompleto; // Se só tiver uma palavra, usa ela mesma
};

// Chaves para AsyncStorage
const STORAGE_KEYS = {
  USUARIO: '@DinHero:usuario',
  FAMILIA: '@DinHero:familia',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [familia, setFamilia] = useState<Familia | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Carregar dados salvos ao inicializar
    carregarDadosSalvos();
  }, []);

  const carregarDadosSalvos = async () => {
    try {
      const [usuarioSalvo, familiaSalva] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USUARIO),
        AsyncStorage.getItem(STORAGE_KEYS.FAMILIA),
      ]);

      if (usuarioSalvo && familiaSalva) {
        const usuarioData = JSON.parse(usuarioSalvo);
        const familiaData = JSON.parse(familiaSalva);
        
        setUsuario(usuarioData);
        setFamilia(familiaData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados salvos:', error);
    } finally {
      setLoading(false);
    }
  };

  const salvarDados = async (usuarioData: Usuario | null, familiaData: Familia | null) => {
    try {
      if (usuarioData && familiaData) {
        await Promise.all([
          AsyncStorage.setItem(STORAGE_KEYS.USUARIO, JSON.stringify(usuarioData)),
          AsyncStorage.setItem(STORAGE_KEYS.FAMILIA, JSON.stringify(familiaData)),
        ]);
      } else {
        await Promise.all([
          AsyncStorage.removeItem(STORAGE_KEYS.USUARIO),
          AsyncStorage.removeItem(STORAGE_KEYS.FAMILIA),
        ]);
      }
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
    }
  };

  const login = async (email: string, senha: string): Promise<boolean> => {
    try {
      const usuarioData = await UserService.buscarPorEmailSenha(email, senha);
      
      if (usuarioData) {
        const familiaData = await UserService.buscarFamiliaPorUsuario(usuarioData.id);
        if (familiaData) {
          setUsuario(usuarioData);
          setFamilia(familiaData);
          await salvarDados(usuarioData, familiaData);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    }
  };

  const cadastrar = async (nome_completo: string, email: string, telefone: string, senha: string): Promise<boolean> => {
    try {
      const novoUsuario = await UserService.criarUsuario(nome_completo, email, telefone, senha);
      
      if (novoUsuario) {
        const novaFamilia = await UserService.criarFamilia(novoUsuario.id, nome_completo);
        
        if (novaFamilia) {
          setUsuario(novoUsuario);
          setFamilia(novaFamilia);
          await salvarDados(novoUsuario, novaFamilia);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Erro no cadastro:', error);
      return false;
    }
  };

  const atualizarNomeFamilia = async (novoNome: string): Promise<boolean> => {
    try {
      if (!usuario || !familia) return false;
      
      const success = await UserService.atualizarNomeFamilia(familia.id, novoNome);
      
      if (success) {
        const familiaAtualizada = { ...familia, nome: novoNome };
        setFamilia(familiaAtualizada);
        await salvarDados(usuario, familiaAtualizada);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao atualizar nome da família:', error);
      return false;
    }
  };

  const atualizarUsuario = async (dados: { nome_completo: string; email: string; telefone: string; senha?: string }): Promise<boolean> => {
    if (!usuario) return false;
    
    try {
      const success = await UserService.atualizarUsuario(usuario.id, dados);
      
      if (success) {
        const usuarioAtualizado = { 
          ...usuario, 
          nome_completo: dados.nome_completo, 
          email: dados.email, 
          telefone: dados.telefone 
        };
        setUsuario(usuarioAtualizado);
        await salvarDados(usuarioAtualizado, familia);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      return false;
    }
  };

  const atualizarFotoPerfil = async (fotoPerfil: string): Promise<boolean> => {
    if (!usuario) return false;
    
    try {
      const success = await UserService.atualizarFotoPerfil(usuario.id, fotoPerfil);
      
      if (success) {
        const usuarioAtualizado = { ...usuario, fotoPerfil };
        setUsuario(usuarioAtualizado);
        await salvarDados(usuarioAtualizado, familia);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao atualizar foto de perfil:', error);
      return false;
    }
  };

  const logout = async () => {
    setUsuario(null);
    setFamilia(null);
    await salvarDados(null, null);
  };

  return (
    <AuthContext.Provider value={{ 
      usuario, 
      familia, 
      loading, 
      login, 
      cadastrar, 
      atualizarNomeFamilia, 
      atualizarUsuario,
      atualizarFotoPerfil,
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}; 