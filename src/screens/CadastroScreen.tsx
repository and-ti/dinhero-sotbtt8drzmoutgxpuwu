import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text, Title, HelperText } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import GlassCard from '../components/GlassCard';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

interface CadastroScreenProps {
  navigation: any;
}

// Função para extrair o sobrenome do nome completo
const extrairSobrenome = (nomeCompleto: string): string => {
  const partes = nomeCompleto.trim().split(' ');
  if (partes.length > 1) {
    return partes[partes.length - 1]; // Última parte do nome
  }
  return nomeCompleto; // Se só tiver uma palavra, usa ela mesma
};

export default function CadastroScreen({ navigation }: CadastroScreenProps) {
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const { cadastrar } = useAuth();
  
  const { theme } = useTheme();
  const styles = useStyles(theme);

  // Calcular nome da família baseado no nome completo
  const nomeFamilia = nomeCompleto.trim() ? `${extrairSobrenome(nomeCompleto)} Family` : '';

  const validarEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validarTelefone = (telefone: string) => {
    // Remove todos os caracteres não numéricos
    const numeros = telefone.replace(/\D/g, '');
    return numeros.length >= 10 && numeros.length <= 11;
  };

  const formatarTelefone = (texto: string) => {
    // Remove tudo que não é número
    const numeros = texto.replace(/\D/g, '');
    
    // Aplica máscara: (XX) XXXXX-XXXX
    if (numeros.length <= 2) {
      return numeros;
    } else if (numeros.length <= 7) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    } else {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`;
    }
  };

  const handleTelefoneChange = (texto: string) => {
    const formatado = formatarTelefone(texto);
    setTelefone(formatado);
  };

  const handleCadastro = async () => {
    if (!nomeCompleto.trim() || !email.trim() || !telefone.trim() || !senha.trim() || !confirmarSenha.trim()) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    if (!validarEmail(email.trim())) {
      Alert.alert('Erro', 'Por favor, insira um email válido');
      return;
    }

    if (!validarTelefone(telefone)) {
      Alert.alert('Erro', 'Por favor, insira um telefone válido');
      return;
    }

    if (senha.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (senha !== confirmarSenha) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    setLoading(true);
    try {
      const success = await cadastrar(nomeCompleto.trim(), email.trim(), telefone.trim(), senha);
      if (!success) {
        Alert.alert('Erro', 'Email já cadastrado');
      } else {
        Alert.alert('Sucesso', 'Conta criada com sucesso! Sua família foi criada automaticamente.', [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]);
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
    {/* <LinearGradient
      colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
      style={styles.gradientBackground}
      start={{ x: 0.1, y: 0.1 }}
      end={{ x: 1, y: 1 }}
    /> */}
      <GlassCard style={styles.card}>
        <Title style={styles.title}>Criar Conta</Title>
        <Text style={styles.subtitle}>Preencha os dados para se cadastrar</Text>
        <TextInput
          label="Nome Completo"
          value={nomeCompleto}
          onChangeText={setNomeCompleto}
          mode="outlined"
          style={styles.input}
          autoCapitalize="words"
        />
        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />
        <TextInput
          label="Telefone"
          value={telefone}
          onChangeText={handleTelefoneChange}
          mode="outlined"
          keyboardType="phone-pad"
          style={styles.input}
          placeholder="(11) 99999-9999"
        />
        <TextInput
          label="Senha"
          value={senha}
          onChangeText={setSenha}
          mode="outlined"
          secureTextEntry
          style={styles.input}
        />
        <TextInput
          label="Confirmar senha"
          value={confirmarSenha}
          onChangeText={setConfirmarSenha}
          mode="outlined"
          secureTextEntry
          style={styles.input}
        />
        {nomeCompleto.trim() && (
          <View style={styles.familiaPreview}>
            <Text style={styles.familiaLabel}>Família que será criada:</Text>
            <Text style={styles.familiaNome}>{nomeFamilia}</Text>
            <HelperText type="info">
              Baseado no seu sobrenome: "{extrairSobrenome(nomeCompleto)}"
            </HelperText>
          </View>
        )}
        <Button
          mode="contained"
          onPress={handleCadastro}
          loading={loading}
          disabled={loading}
          style={[styles.button, styles.buttonBase, { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]}
          labelStyle={[styles.buttonLabel, { color: theme.colors.onPrimary }]}
          contentStyle={styles.buttonContent}
        >
          Cadastrar
        </Button>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('Login')}
          style={[styles.button, styles.buttonBase, { backgroundColor: 'transparent', borderColor: theme.colors.primary }]}
          labelStyle={[styles.buttonLabel, { color: theme.colors.primary }]}
          contentStyle={styles.buttonContent}
        >
          Já tem uma conta? Faça login
        </Button>
      </GlassCard>
    </View>
  );
}


const useStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'transparent',
  },
  card: {
    elevation: 4,
    alignItems: 'stretch',
    padding: 24,
  },
  title: {
    textAlign: 'center',
    fontSize: 28,
    marginBottom: 8,
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  input: {
    marginBottom: 16,
  },
  familiaPreview: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  familiaLabel: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  familiaNome: {
    fontSize: 16,
    color: '#1976d2',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  button: {
    marginTop: 8,
  },
  buttonBase: {
    borderRadius: 8,
    borderWidth: 2,
    minHeight: 48,
    justifyContent: 'center',
    width: '100%',
  },
  buttonLabel: {
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  buttonContent: {
    height: 48,
    paddingHorizontal: 8,
  },
}); 